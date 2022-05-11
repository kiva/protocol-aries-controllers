import { AxiosRequestConfig } from 'axios';
import { Injectable, Inject, HttpService, Body } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { AgentGovernance, ControllerCallback } from 'aries-controller/controller/agent.governance';
import { Topics } from 'aries-controller/controller/handler/topics';
import { AgentService } from 'aries-controller/agent/agent.service';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { RegisterTdcDto } from './dtos/register.tdc.dto';
import { RegisterTdcResponseDto } from './dtos/register.tdc.response.dto';
import { RegisterOneTimeKeyDto } from './dtos/register.one.time.key.dto';
import { TransactionReportRequestDto } from './dtos/transaction.report.request.dto';
import { CreateTransactionDto } from './dtos/create.transaction.dto';
import { DataService } from '../persistence/data.service';
import { TdcGrants } from '../persistence/tdc.grants';
import { Transaction } from '../persistence/transaction';
import { RequestedReport } from '../persistence/requested.report';
import { TdcGrant } from 'aries-controller/agent/messaging/tdc.grant';

@Injectable()
export class TransactionService {
    private readonly http: ProtocolHttpService;

    constructor(@Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance,
                private readonly agentService: AgentService,
                private readonly dbAccessor: DataService,
                httpService: HttpService,
    ) {
        this.http = new ProtocolHttpService(httpService);
        agentGovernance.registerHandler('FSP-TX-BASIC', Topics.BASIC_MESSAGES, this.basicMessageHandler);
    }

    /**
     * receives basicmessage notifications and will respond in kind to fsp basic messages received from the TDC.
     *
     * the basismessage structure is defined by the aries RFC
     * https://github.com/hyperledger/aries-rfcs/tree/master/features/0095-basic-message
     *
     * expectation is body.content contains json which can be serialized into objects.  The expectation is the
     * object contains both messageTypeId and state fields.  messageTypeId field will determine the rest of json
     * structure.  Please refer to kiva design documentation
     *
     * @param agentUrl
     * @param agentId
     * @param adminApiKey
     * @param route
     * @param topic
     * @param body
     * @param token
     */
    public basicMessageHandler: ControllerCallback =
        async (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string):
            Promise<boolean> => {
            let result: boolean = false;
            Logger.debug(`Fsp TransactionService received basic message`, body);
            const data = JSON.parse(body.content);
            switch (data.messageTypeId) {
                case `grant`:
                    if (data.state === `completed`) {
                        Logger.info(`received completed grant information.`, data);
                        const record: TdcGrants = new TdcGrants();
                        record.fsp_id = data.tdcFspId;
                        record.tdc_id = data.tdcTroId;  // TODO: fsp doesn't need this, can be removed
                        record.one_time_key = data.id;
                        await this.dbAccessor.saveTdcGrantRecord(record);
                        result = true;
                    }
                    break;
                case `credit_transaction`:
                    if (data.state === `completed`) {
                        Logger.info(`transaction accepted by TRO ${data.id}`);
                        const record: Transaction = new Transaction();
                        record.transaction_id = data.id;
                        record.fsp_id = data.transaction.fspId;
                        record.transaction_date = data.transaction.eventDate;
                        record.hash = data.transaction.fspHash;
                        await this.dbAccessor.saveTransaction(record);
                        result = true;
                    }
                    break;
                case `transaction_request`:
                    if (data.state === `completed`) {
                        Logger.debug(`received a completed transaction report`, data);
                        const record: RequestedReport = new RequestedReport();
                        record.report_id = data.id;
                        record.fsp_id = data.tdcFspId;          // this isnt needed
                        record.content = data.transactions;
                        record.request_date = new Date();
                        record.included_items = data.includedItems;
                        record.excluded_items = data.excludedItems;
                        await this.dbAccessor.saveRequestedReport(record);
                        result = true;
                    }
                    break;
            }

            return result;
        }

    /**
     * @param body: RegisterTdcDto
     */
    public async registerWithTDC(body: RegisterTdcDto): Promise<RegisterTdcResponseDto> {
        // 1 generate a connection invite from fsp agent
        const connection = await this.agentService.openConnection();
        const url = `${body.tdcEndpoint}/v2/fsp/register`;
        Logger.info(`FSP created this connection ${connection.connection_id} invitation`, connection);

        // 2 using body.tdcEndpoint, call: /fsp/register passing in a connection invite
        const data = {
            alias: connection.invitation.label,
            identityProfileId: `citizen.identity`,
            invitation: connection.invitation
        };
        Logger.info(`connecting to TDC ${url} with data`, data);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        };
        const result = await this.http.requestWithRetry(request);
        Logger.info(`FSP registering with TDC ${request.url}, results data`, result.data);
        // TODO do we need to save this information some where
        // TODO will we need to return this information to the caller:  thinking no
        return { connectionData: result.data.connectionData};
    }

    /**
     * @param body: RegisterOneTimeKeyDto
     */
    public async registerOnetimeKey(body: RegisterOneTimeKeyDto): Promise<any> {
        // 2 using body.tdcEndpoint, call: /fsp/register passing in a connection invite
        // todo: replace tdcEndpoint with lookup since we have connection id
        Logger.info(`FSP sending onetimekey data`, body);
        const url = `${body.tdcEndpoint}/v2/fsp/register/onetimekey`;
        const data = {
            connectionId: body.connectionId,
            oneTimeKey: body.oneTimeKey
        };
        Logger.debug(`connecting to TDC ${url} with data`, data);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        };
        const result = await this.http.requestWithRetry(request);
        Logger.info(`FSP onetimekey with TDC ${request.url}, results data`, result.data);
        /*
          return onetimekey (aka key), tdcFspId, tdcTroId and state.
          note: tdcTroId needs to be removed
          state:
            accepted, fspId is value
            error: the fspId should not be considered valid, may be null
        */

        return result.data;
    }

    /**
     * helped method that allows the fsp interface query for fsp_id for a given onetimekey value
     * @param key - onetimekey value previously registered with the TDC using registerOnetimeKey
     *
     * This record will only exist when both the FSP and TRO have successfully registered the same
     * onetimekey.  This is used by aries-guardianship-agency since it doesn't store the grant record.
     * TODO: do we want to store tdcFSPId and tdcTROId and keep this record around?
     */
    public async getOneTimeKeyIds(key: string): Promise<any> {
        /*
          return onetimekey (aka key), tdcFspId, tdcTroId and state.
          note: tdcTroId needs to be removed
          state:
            accepted, fspId is value
            error: the fspId should not be considered valid, may be null
        */

        try {
            const record: TdcGrants = await this.dbAccessor.getTDCGrantRecord(key);
            if (record)
                return { key, state: 'accepted', tdcFspId: record.fsp_id, tdcTroId: record.tdc_id};
            else
                return { key, state: 'error', tdcFspId: undefined, tdcTroId: undefined};
        } catch (e) {
            Logger.warn(`getOneTimeKeyIds errored`, e);
        }

        return { key, state: 'error', tdcFspId: undefined, tdcTroId: undefined};
    }

    /**
     * Helper method that allows the fsp interface to query status of a transaction
     *
     * @param key transactionId
     *
     */
    public async getTransactionStatus(key: string): Promise<any> {
        try {
            const record: Transaction = await this.dbAccessor.getTransaction(key);
            if (record)
                return {
                    state: 'accepted',
                    id: record.id,
                    transactionId: record.transaction_id,
                    transactionDate: record.transaction_date,
                    tdcFspId: record.fsp_id,
                    hash: record.hash
                };
        } catch (e) {
            Logger.warn(`failed to find transaction`, e);
        }

        return {
            state: 'unknown',
            id: undefined,
            transactionId: undefined,
            transactionDate: undefined,
            tdcFspId: undefined,
            hash: undefined
        };
    }

    /**
     * helper method that allows fsp interface to query status of a report request
     * @param key
     */
    public async getReportStatus(key: string): Promise<any> {
        try {
            const record: RequestedReport = await this.dbAccessor.getReport(key);
            if (record)
                return {
                    id: record.id,
                    tdcFspId: record.fsp_id,
                    reportId: key,
                    requestDate: record.request_date,
                    content: record.content,
                    includedItems: record.included_items,
                    excludedItems: record.excluded_items,
                    state: 'completed'
                };

        } catch (e) {
            Logger.warn('failed to get report', e);
        }

        return {
            id: -1,
            tdcFspId: undefined,
            reportId: key,
            requestDate: Date.now(),
            content: undefined,
            includedItems: undefined,
            excludedItems: undefined,
            state: 'error'
        };
    }

    /**
     *
     * @param body
     */
    public async createTransaction(body: CreateTransactionDto): Promise<any> {
        // TODO: should the fsp create the credential of the event and pass that to TDC instead of
        // passing the event json
        // TODO: this method could be broken out by each transaction type to reduce complexity for UI
        // TODO: validation of eventType
        Logger.info(`FSP creating transaction ${body.typeId}`);
        const url = `${body.tdcEndpoint}/v2/transactions/create`;
        const data = body;
        const request: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        };
        const result = await this.http.requestWithRetry(request);
        Logger.info(`FSP creating transaction ${request.url}, results data `, result.data);
        return result.data;
    }

    /**
     *
     * @param body: TransactionReportRequestDto
     */
    public async  getTransactionReport(body: TransactionReportRequestDto): Promise<any> {
        Logger.info(`FSP request transaction report data`, body);
        const url = `${body.tdcEndpoint}/v2/transactions/report`;
        const data = {
            fspTdcId: body.fspTdcId,
            troTdcId: body.troTdcId,
            validated: body.validated
        };
        Logger.debug(`connecting to TDC ${url} with data`, data);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        };
        const result = await this.http.requestWithRetry(request);
        Logger.info(`FSP transaction report from TDC ${request.url}`);
        return result.data;
    }
}
