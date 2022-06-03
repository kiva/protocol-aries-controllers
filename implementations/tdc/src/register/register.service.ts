import { Injectable, Inject, Logger } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service.js';
import { Proofs } from '../common/proofs.js';
import { ExceptionHandler } from '../common/exception.handler.js';
import { TransactionMessageStatesEnum } from '../transactions/messaging/transaction.message.states.enum.js';
import { OneTimeKey } from '../persistence/entities/one.time.key.js';
import { DataService } from '../persistence/data.service.js';
import { AgentGovernance, AgentService, IssuerService, TdcGrant, VerifierService } from 'aries-controller';
import { ProtocolUtility, SecurityUtility } from 'protocol-common';

/**
 * Functions specific to TRO behaviors.
 */
@Injectable()
export class RegisterService {

    constructor(
        private readonly agentService: AgentService,
        private readonly issuerService: IssuerService,
        private readonly verifierService: VerifierService,
        private readonly transactionService: TransactionsService,
        private readonly databaseService: DataService,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance
    ) {}

    /**
     * key is issued by the FSP and shared with the TRO.  Both the FSP and TRO send the
     * key to the TDC.  When both the FSP and TRO have completed this step, the TDC
     * issues the credit grant credentials.
     *
     * Using cache to store this is temporary.
     *
     * @param connectionId
     * @param key
     */
    public async registerOneTimeKey(connectionId: string, key: string): Promise<any> {
        try {
            Logger.log(`RegisterService.registerOneTimeKey: ${connectionId}, ${key}`);
            // 1 - prove we have credit-fsp-auth-Id for the given connection
            await this.proveTroAuthIdCredential(connectionId);
            let record: OneTimeKey = await this.databaseService.getOneTimeKeyRecord(key);
            if (!record) {
                Logger.log('TRO onetime key saved, waiting on FSP');
                record = new OneTimeKey();
                record.one_time_key = key;
                record.tro_connection_id = connectionId;
                record.sent = false;
                await this.databaseService.saveOneTimeKeyRecord(record);
                await this.sendGrantMessage(connectionId, TransactionMessageStatesEnum.STARTED, key, '', '');

                // todo leave this here until TRO correctly handles basic messages
                return { tdcTroId: '', tdcFspId: '', state: 'started' };
            }

            // looks like fsp already sent their record
            record.tro_connection_id = connectionId;
            await this.databaseService.saveOneTimeKeyRecord(record);

            // 3 - if data is complete (have both TRO and FSP data), issue the credit grant
            if (record.fsp_connection_id && record.tro_connection_id && false === record.sent) {
                Logger.log('issuing Grants from TRO');
                return await this.transactionService.issueGrantCredentials(key);
            }

            await this.sendGrantMessage(connectionId, TransactionMessageStatesEnum.STARTED, key, '', '');

            // todo leave this here until TRO correctly handles basic messages
            return { tdcTroId: '', tdcFspId: '', state: 'started' };
        } catch (e) {
            ExceptionHandler.evaluateAndThrow(e);
        }
    }

    /**
     *  This method does a few things:
     *  1 - creates connection between TDC and citizen, using the inputted invitation
     *  2 - proves citizen identity
     *  3 - if identity is good, creates a CRA-CRO-ID credential
     *
     *  toThink(): can we, should we move these behaviors into governance?
     */
    public async registerAndIssue(body: any): Promise<any> {
        Logger.log('creating connection with TRO with invitation', body.invitation);
        const connectionData = await this.establishConnection(body.alias, body.invitation);

        // TODO: this is a temporary hack to give the citizen a credential that can be proven
        await ProtocolUtility.delay(5000);
        Logger.log(`creating citizen identity ${body.identityProfileId as string}.cred.def.json`);
        await this.createCitizenIdentityCredential(`${body.identityProfileId as string}.cred.def.json`, connectionData.connection_id);

        await ProtocolUtility.delay(5000);
        Logger.log(`proving citizen identity using '${body.identityProfileId as string}.proof.request.json'`);
        // TODO: what if the proof fails, probably shouldn't let exception be the way we handle it
        // TODO: the Proofs.proveIdentity call fails:  leaving it in here to understand and fix later
        // await Proofs.proveIdentity(this.verifierService, `${body.identityProfileId}.proof.request.json`, connectionData.connectionId);
        await this.proveCitizenIdentity(`${body.identityProfileId as string}.proof.request.json`, connectionData.connection_id);

        await ProtocolUtility.delay(5000);
        Logger.log('issuing TDC-TRO credential');
        await this.issueTroCredential(body.alias, connectionData.connection_id);

        // TODO !!!!
        // it is temporary that we return connection data.  this data should not be exposed but until
        // we get the governance to allow for custom handling of basic messages, we have to return this data for
        // the tests to work
        return connectionData;

    }

    private async proveCitizenIdentity(identityProfile: string, connectionId: string): Promise<any> {
        await Proofs.proveIdentity(this.verifierService, identityProfile, connectionId);
    }

    /**
     * tell TDC to receive the citizen invitation.  the governance policies should handle all of the
     * remaining steps to allow for the connection to be made
     */
    private async establishConnection(alias: string, invitation: any): Promise<any> {
        return await this.agentService.acceptConnection(alias, invitation);
    }

    // TEMP!
    // TODO: this method should go away as another agent should be handling identity
    // credential issuance
    private async createCitizenIdentityCredential(identityProfile: string, connectionId: string): Promise<any> {
        const data = {
            citizenId : 'citizenId-01',
            firstName : 'firstName',
            lastName : 'lastName'
        };
        await this.issuerService.issueCredential(identityProfile, connectionId, data);
    }

    private async issueTroCredential(alias: string, connectionId: string): Promise<any> {
        // TODO: get fields from identity proof
        // TODO: clean up credential
        const craCroId: string = RegisterService.generateTroCroId(alias);
        const now = new Date();
        const entityData = {
            lastName: 'lastName',
            firstName: 'firstName',
            craCroId,
            credentialType: 'citizen',
            issueDate: `${now.getFullYear()}-${now.getMonth()}-${now.getDay()}`
        };
        const results = await this.issuerService.issueCredential('credit-tro-auth-Id.cred.def.json', connectionId, entityData);
        Logger.log('citizen issueCredentialResults', results);

        // TODO: we need to save the craCroId with the connection
    }

    private async proveTroAuthIdCredential(connectionId: string): Promise<any> {
        // TODO: the Proofs.proveIdentity call fails:  leaving it in here to understand and fix later
        // const results = await Proofs.proveIdentity(this.verifierService, 'credit-tro-auth-Id.proof.request.json', connectionId);
        const proof = await this.verifierService.verify('credit-tro-auth-Id.proof.request.json', connectionId);
        const results = await this.verifierService.getVerifyResult(proof.presentation_exchange_id);
        Logger.log('proveTroAuthIdCredential', results);
    }

    private static generateTroCroId(key: string): string {
        return `${process.env.TDC_PREFIX}-${key}-${SecurityUtility.hash32(key).substr(10)}`;
    }

    private async sendGrantMessage(connectionId: string, state: string, id: string, tdcTroId: string, tdcFspId: string) : Promise<any> {
        const msg: TdcGrant = new TdcGrant({
            state,
            id,
            tdcFspId,
            tdcTroId
        });
        return await this.agentService.sendBasicMessage(msg, connectionId);
    }
}
