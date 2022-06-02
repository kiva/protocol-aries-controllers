import { Injectable, Inject, Logger } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service.js';
import { Proofs } from '../common/proofs.js';
import { DataService } from '../persistence/data.service.js';
import { ExceptionHandler } from '../common/exception.handler.js';
import { TransactionMessageStatesEnum } from '../transactions/messaging/transaction.message.states.enum.js';
import { OneTimeKey } from '../persistence/one.time.key.js';
import { AgentGovernance, AgentService, IssuerService, TdcGrant, VerifierService } from 'aries-controller';
import { ProtocolUtility, SecurityUtility } from 'protocol-common';

/**
 *
 */
@Injectable()
export class FspService {

    constructor(
        private readonly agentService: AgentService,
        private readonly issuerService: IssuerService,
        private readonly verifierService: VerifierService,
        private readonly transactionService: TransactionsService,
        private readonly databaseService: DataService,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance
    ) {
    }

    /**
     * key is issued by the FSP and shared with the CRO.  Both the FSP and TRO send the
     * key to the TDC.  When both the FSP and TRO have completed this step, the TDC
     * issues the credit grant credentials and it issues the FSP and TRO unique ids for this
     * connection.  It returns nothing useful at this time.
     *
     * @param connectionId
     * @param key
     */
    public async registerOneTimeKey(connectionId: string, key: string): Promise<any> {
        try {
            Logger.log(`FspService.registerOneTimeKey: ${connectionId}, ${key}`);
            // 1 - prove we have credit-fsp-auth-Id for the given connection
            await this.proveFSPAuthIdCredential(connectionId);
            // 2 - save data
            let record: OneTimeKey = await this.databaseService.getOneTimeKeyRecord(key);
            if (!record) {
                Logger.log('FSP onetime key saved, waiting on TRO');
                record = new OneTimeKey();
                record.one_time_key = key;
                record.fsp_connection_id = connectionId;
                record.sent = false;
                await this.databaseService.saveOneTimeKeyRecord(record);

                await this.sendGrantMessage(connectionId, TransactionMessageStatesEnum.STARTED, key, '', '');

                // This means the FSP was first in requesting the grant and now has to wait for the TRO
                // to respond.  The results are not very useful to the caller (the fsp).
                // TODO consider a different response
                return { tdcTroId: undefined, tdcFspId: undefined, state: 'started' };
            }

            // looks like tro already sent their record
            record.fsp_connection_id = connectionId;
            await this.databaseService.saveOneTimeKeyRecord(record);

            // 3 - if data is complete (have both TRO and FSP data), issue the credit grant
            if (record.fsp_connection_id && record.tro_connection_id && false === record.sent) {
                Logger.log('issuing Grants from FSP');
                // This means the FSP and TRO have both responded to the grant, the credentials
                // can be created
                return await this.transactionService.issueGrantCredentials(key);
            }

            await this.sendGrantMessage(connectionId, 'started', key, '', '');

            // this means the FSP requested the grant with the same key as a previous request
            // and the TRO has still yet to respond.  The results are not very useful to the caller (the fsp).
            // TODO consider a different response
            return { tdcTroId: undefined, tdcFspId: undefined, state: 'started' };
        } catch (e) {
            ExceptionHandler.evaluateAndThrow(e);
        }
    }

    /**
     *  This method does a few things:
     *  1 - creates connection between TDC and FSP, using the inputted invitation
     *  2 - proves FSP identity
     *  3 - if identity is good, creates a CRA-FSP-ID credential
     *
     *  toThink(): can we, should we move these behaviors into governance?
     */
    public async registerAndIssue(body: any): Promise<any> {
        Logger.log('creating connection with FSP', body.invitation);
        const connectionData = await this.establishConnection(body.alias, body.invitation);

        // TODO: this is a temporary hack to give the fsp a credential that can be proven
        // ideally another issuer issued the id and we can just verify it
        await ProtocolUtility.delay(5000);
        Logger.log(`creating FSP identity ${body.identityProfileId as string}.cred.def.json`);
        await this.createFSPIdentityCredential(`${body.identityProfileId as string}.cred.def.json`, connectionData.connection_id);

        await ProtocolUtility.delay(5000);
        Logger.log(`proving FSP identity using '${body.identityProfileId as string}.proof.request.json'`);
        // TODO: what if the proof fails, probably shouldn't let exception be the way we handle it
        // TODO: the Proofs.proveIdentity call fails:  leaving it in here to understand and fix later
        // await Proofs.proveIdentity(this.verifierService, `${identityProfileId}.proof.request.json`, connectionData.connectionId);
        await this.proveFSPIdentity(`${body.identityProfileId as string}.proof.request.json`, connectionData.connection_id);

        await ProtocolUtility.delay(5000);
        Logger.log('issuing TDC-FSP credential');
        await this.issueCraCredential(body.alias, connectionData.connection_id);

        // TODO !!!!
        // it is temporary that we return connection data.  this data should not be exposed but until
        // we get the governance to allow for custom handling of basic messages, we have to return this data for
        // the tests to work
        Logger.log('FspService.registerAndIssue returns', connectionData);
        return connectionData;
    }

    private async proveFSPIdentity(identityProfile: string, connectionId: string): Promise<any> {
        await Proofs.proveIdentity(this.verifierService, identityProfile, connectionId);
    }
    /*
     * tell TRO to receive the citizen invitation.  the governance policies should handle all of the
     * remaining steps to allow for the connection to be made
     */
    private async establishConnection(alias: string, invitation: any): Promise<any> {
        return await this.agentService.acceptConnection(alias, invitation);
    }

    // TEMP!
    // TODO: this method should go away as another agent should be handling identity
    // credential issuance
    private async createFSPIdentityCredential(identityProfile: string, connectionId: string): Promise<any> {
        const data = {
            citizenId : 'citizenId-01',
            firstName : 'firstName',
            lastName : 'lastName'
        };
        await this.issuerService.issueCredential(identityProfile, connectionId, data);
    }

    private async issueCraCredential(alias: string, connectionId: string): Promise<any> {
        // TODO: get fields from identity proof
        const craFSPId: string = FspService.generateTroFspId(alias);
        const now = new Date();
        const entityData = {
            fspName: 'fspName',
            craFSPId,
            issueDate: `${now.getFullYear()}-${now.getMonth()}-${now.getDay()}`
        };
        const results = await this.issuerService.issueCredential('credit-fsp-auth-Id.cred.def.json', connectionId, entityData);
        Logger.log('fsp issueCredentialResults', results);

        // TODO: we need to save the craCroId with the connection
    }

    private async proveFSPAuthIdCredential(connectionId: string): Promise<any> {
        const results = await Proofs.proveIdentity(this.verifierService, 'credit-fsp-auth-Id.proof.request.json', connectionId);
        Logger.log('proveFSPAuthIdCredential', results);
    }

    private static generateTroFspId(key: string): string {
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
