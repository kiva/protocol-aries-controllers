import { Injectable, HttpService } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { RequestContext } from 'protocol-common/http-context/request.context';
import { Constants } from 'protocol-common/constants';
import { KycDto } from './dtos/kyc.dto';
import { KycResponseDto } from './dtos/kyc.response.dto';
import { KycSmsDto } from './dtos/kyc.sms.dto';
import { VerifierService } from 'aries-controller/verifier/verifier.service';

/**
 * Contain logic specific to KYC in Sierra Leone such as:
 *   Hard-coding KYC profile path (TODO can make env var)
 *   Reporting KYC statistics to firebase
 *   Fuzzy search (TODO could make this generic if needed)
 *   Fingerprint quality score handling (TODO that logic could be moved to guardian-bio-auth repo)
 */
@Injectable()
export class KycService {

    private readonly http: ProtocolHttpService;

    /**
     * Wraps the injected HttpService in a ProtocolHttpService
     */
    constructor(
        httpService: HttpService,
        private readonly verifierService: VerifierService,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * TODO handle the quality score logic
     * TODO right now this is just KYC for fingerprint
     * TODO @Trace wasn't working, figure out why
     */
    public async kyc(body: any, authHeader: string, sessionId: string): Promise<KycResponseDto> {
        try {
            body = await this.formatFingerprintData(body);
            const result = await this.verifierService.escrowVerify(body, 'sl.kyc.proof.request.json');
            this.trackKycInfo('FINGERPRINT', body, authHeader, sessionId, true, 'FINGERPRINT_MATCH');
            return result;
        } catch (e) {
            this.trackKycInfo('FINGERPRINT', body, authHeader, sessionId, false, e.code,);
            throw e;
        }
    }

    /**
     * Formats data for the key-guardian service
     * Also handles search params if they are present and throws any validation errors
     */
    private async formatFingerprintData(body: KycDto) {
        if (body.filters && body.search || (!body.filters && !body.search)) {
            throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Must define filters or search but not both');
        }

        if (body.search) {
            // TODO move this to a remote implementation folder
            const searchRequest: AxiosRequestConfig = {
                method: 'GET',
                url: process.env.NCRA_CONTROLLER_URL + '/v2/search',
                data: body.search,
            };
            const searchResult = await this.http.requestWithRetry(searchRequest);
            const voterIds = searchResult.data;
            // Identity service expects a comma separated string
            const voterIdList = voterIds.join(',');
            body.filters = {
                externalIds: {
                    sl_voter_id: voterIdList
                }
            };
        }

        // Support either fingerprint images or templates
        const params = {
            position: body.position,
            image: body.image,
            template: body.template
        };
        if (body.image != null && body.image.length > 0) {
            delete params.template;
        } else {
            delete params.image;
        }

        return {
            pluginType: 'FINGERPRINT',
            filters: body.filters,
            params,
            device: body.device,
        };
    }

    /**
     * Top level kyc function for SMS OTP
     */
    public async kycSms(body: any, authHeader: string, sessionId: string): Promise<KycResponseDto> {
        body = this.formatSmsData(body);
        try {
            const result = await this.verifierService.escrowVerify(body, 'sl.kyc.proof.request.json');
            if (result.status === 'sent') {
                this.trackKycInfo('SMS_OTP', body, authHeader, sessionId, true, 'SMS_SENT');
            } else {
                this.trackKycInfo('SMS_OTP', body, authHeader, sessionId, true, 'OTP_VERIFIED');
            }
            return result;
        } catch (e) {
            this.trackKycInfo('SMS_OTP', body, authHeader, sessionId, false, e.code);
            throw e;
        }
    }

    private formatSmsData(body: KycSmsDto) {
        return {
            pluginType: 'SMS_OTP',
            filters: {
                externalIds: body.filters.externalIds
            },
            params: {
                phoneNumber: body.phoneNumber,
                otp: body.otp,
            },
            device: body.device,
        };
    }

    /**
     * Sends kyc info to our firebase db in a non-blocking http call
     * Note this is very much in flux, currently we get some data from the device details sent by the client, some from the Auth0 token,
     * and some, like the kyc result or error code, from the backend. All of these will probably evolve over time, and some are duplicated
     * in multiple places.
     */
    private async trackKycInfo(type: string, body: any, authHeader: string, sessionId: string, success: boolean, code: string): Promise<void> {
        try {
            if (!authHeader) {
                Logger.warn('Unable to track KYC data because auth header is missing');
                return;
            }
            const metaData = this.extractMetadata(authHeader);

            // This was copied from https://github.com/kiva/Protocol-EKYC-SDK/blob/master/src/ui/utils/IdentitySDK.js#L77
            const trackData: any = {
                type,
                result: success ? 'success' : 'failure',
                code,
                fspId: body.device.OperatorInstitution,
                sessionId,
                id: RequestContext.requestId(),
                location: body.device.OperatorLocation,
                sensorSerialNumber: body.device.FingerprintSensorSerialNumber,
                tellerId: body.device.TellerComputerUsername,
                position: body.position,
                device: body.device,
                env: process.env.NODE_ENV,
                metaData,
            };

            const trackRequest: AxiosRequestConfig = {
                method: 'POST',
                url: process.env.TRACK_KYC_URL,
                data: trackData,
                headers: RequestContext.withTraceHeaders({
                    Authorization: authHeader,
                }),
            };
            Logger.log('kyc_track_data', trackData);
            if (process.env.NODE_ENV === Constants.LOCAL) {
                Logger.log('Not sending KycInfo because local');
            } else {
                const response = await this.http.requestWithRetry(trackRequest);
                Logger.log('Sent KycInfo', { status: response.status, data: response.data });
            }
        } catch (e) {
            // If there's an error sending the kyc info, let's log it so we know but still return to client
            Logger.error('Error sending kyc info to firebase', e);
        }
    }

    /**
     * Decodes jwt to get metadata and the sanitizes the metadata keys to be acceptable by firebase
     */
    private extractMetadata(authHeader: string): any {
        // Extract data from the jwt token to send along. This has already passed through the gateway so has been verified
        const token = authHeader.slice(7, authHeader.length);
        const metaData = jwt.decode(token);

        // Sanitize metadata keys
        const keys = Object.keys(metaData);
        for (const key of keys) {
            if (key.includes('https://ekyc.sl.kiva.org/')) {
                const newKey = key.replace('https://ekyc.sl.kiva.org/', '');
                metaData[newKey] = metaData[key];
                delete metaData[key];
            }
        }
        return metaData;
    }

    /**
     * All kyc attributes
     */
    public getAllKycAttributes(): Array<string> {
        return [
            'nationalId',
            'nationalIssueDate',
            'voterId',
            'voterIssueDate',
            'firstName',
            'middleName',
            'lastName',
            'gender',
            'birthDate',
            'birthPlace',
            'residentialAddress',
            'permanentAddress',
            'phoneNumber',
            'motherFirstName',
            'motherLastName',
            'fatherFirstName',
            'fatherLastName',
            'occupation',
            'maritalStatus',
            'photo~attach',
            'signature~attach',
        ];
    }
}
