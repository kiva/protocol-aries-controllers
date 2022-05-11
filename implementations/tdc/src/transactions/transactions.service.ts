import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SecurityUtility } from 'protocol-common/security.utility';
import { AgentGovernance, ControllerCallback } from 'aries-controller/controller/agent.governance';
import { Topics } from 'aries-controller/controller/handler/topics';
import { AgentService } from 'aries-controller/agent/agent.service';
import { IssuerService } from 'aries-controller/issuer/issuer.service';
import { VerifierService } from 'aries-controller/verifier/verifier.service';
import { TdcGrant } from 'aries-controller/agent/messaging/tdc.grant';
import { TransactionReportRequest } from 'aries-controller/agent/messaging/transaction.report.request';
import { CreditTransaction } from 'aries-controller/agent/messaging/credit.transaction';
import { Proofs } from '../common/proofs';
import { ExceptionHandler } from '../common/exception.handler';
import { FspTroConnection} from '../persistence/fsp.tro.connection';
import { DataService } from '../persistence/data.service';
import { PendingTransaction } from '../persistence/pending.transaction';
import { OneTimeKey } from '../persistence/one.time.key';
import { CreateTransactionDto } from './dtos/create.transaction.dto';
import { TransactionReportDto } from './dtos/transaction.report.dto';
import { IBasicMessageHandler } from './messaging/basic.message.handler';
import { TransactionMessageResponseFactory } from './messaging/transaction.message.response.factory';
import { TransactionMessageStatesEnum } from './messaging/transaction.message.states.enum';

/**
 *  Responsible for all of the different transactions (aka credit events) in the system
 */
@Injectable()
export class TransactionsService {

    private static TRO_GRANT_CREDENTIAL_NAME: string = 'credit-tro-grant';
    private static FSP_GRANT_CREDENTIAL_NAME: string = 'credit-fsp-grant';
    private static TRO_TRX_CREDENTIAL_NAME: string = 'transaction';

    constructor(
        private readonly agentService: AgentService,
        private readonly issuerService: IssuerService,
        private readonly verifierService: VerifierService,
        private readonly databaseService: DataService,
        private readonly responseFactory: TransactionMessageResponseFactory,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance
    ) {
        agentGovernance.registerHandler('TDC-TX-BASIC', Topics.BASIC_MESSAGES, this.basicMessageHandler);
    }

    /**
     * receives basicmessage notifications and will respond in kind to transactional basic messages
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
            const data = JSON.parse(body.content);
            const handler: IBasicMessageHandler = this.responseFactory.getMessageHandler(this.agentService, agentId, adminApiKey, body.connection_id,
                data.messageTypeId);
            if (handler)
                result = await handler.respond(data);

            return result;
        }

    public async getConnectionIds(key: string, source?:string): Promise<any> {
        try {
            const record: OneTimeKey = await this.databaseService.getOneTimeKeyRecord(key);
            if (record && record.fsp_connection_id && record.tro_connection_id) {
                let id: string = '';
                // get FspTroConnection
                // set id
                if (source !== undefined && source === 'tro') {
                    const fspTroConnectionRecord: FspTroConnection =
                        await this.databaseService.getFspTroConnectionByTroConnectionId(record.tro_connection_id);
                    id = fspTroConnectionRecord.tdc_tro_id;
                }
                return {key, state: 'accepted', id, source};
            }
            else
                return { key, state: 'waiting'};
        } catch (e) {
            Logger.warn(`getOneTimeKeyIds errored`, e);
        }

        return { key, state: 'error'};
    }

    /*
        Issues Credit-Grant and Credit-Grant-Auth credentials to the FSP and TDO, respectively
    */
    public async issueGrantCredentials(key: string) {
        Logger.info(`TransactionsService.issueGrantCreds -> key ${key}`);
        const record: OneTimeKey = await this.databaseService.getOneTimeKeyRecord(key);
        if (!record) {
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, 'TransactionsService.issueGrantCreds key not found');
        }

        if (true === record.sent) {
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, 'TransactionsService.issueGrantCreds data was sent');
        }

        const tdcTroId: string = this.generateTdcTroId('TRO', record.tro_connection_id);
        const now = new Date();
        const issueDate: string = `${now.getFullYear()}-${now.getMonth()}-${now.getDay()}`;
        // TODO: permission level would be based on FSP permission request
        const troData = {
            'craId': 'tbd',
            'fspId': 'tbd',
            craCroId: tdcTroId,
            issueDate,
            'permission': 'all'
        };
        Logger.debug(`citizen credit-tro-grant data with connectionId ${record.tro_connection_id} ${now}`, );
        let results = await this.issuerService.issueCredential(`${TransactionsService.TRO_GRANT_CREDENTIAL_NAME}.cred.def.json`,
            record.tro_connection_id, troData);
        Logger.info('citizen credit-tro-grant results', results);

        // TODO: permission level would be based on TDO response to the request
        const tdcFspId: string = this.generateTdcTroId('FSP', record.fsp_connection_id);
        const fspData = {
            'craId': 'tbd',
            'fspId': 'tbd',
            craFspId: tdcFspId,
            issueDate,
            'permission': 'all'
        };
        Logger.debug(`fsp credit-fsp-grant data with connectionId ${record.fsp_connection_id}`, fspData);
        results = await this.issuerService.issueCredential(`${TransactionsService.FSP_GRANT_CREDENTIAL_NAME}.cred.def.json`,
            record.fsp_connection_id, fspData);
        Logger.info('fsp credit-fsp-grant', results);

        const rec: FspTroConnection = new FspTroConnection();
        rec.fsp_connection_id = record.fsp_connection_id;
        rec.tro_connection_id = record.tro_connection_id;
        rec.tdc_fsp_id = tdcFspId;
        rec.tdc_tro_id = tdcTroId;

        await this.databaseService.saveFspTroConnection(rec);
        await this.sendGrantMessage(record.fsp_connection_id, TransactionMessageStatesEnum.COMPLETED, key, tdcTroId, tdcFspId);
        await this.sendGrantMessage(record.tro_connection_id, TransactionMessageStatesEnum.COMPLETED, key, tdcTroId, tdcFspId);

        // TODO: need to leave this here until FSP and TRO save data into their DB stores
        return { tdcTroId, tdcFspId, state: TransactionMessageStatesEnum.COMPLETED };
    }

    public async createTransaction(data: CreateTransactionDto): Promise<any> {
        Logger.debug(`TDC transactionService.createTransaction started`, data);
        // 1 - get the fsp record
        const rec: FspTroConnection = await this.databaseService.getFspTroConnectionByFspId(data.fspId);
        if (!rec)
            throw new ProtocolException(ProtocolErrorCode.INVALID_BACKEND_OPERATION, 'record not found');

        try {
            // 2 - validate fsp has credential to work with tro
            await this.proveCredential(rec.fsp_connection_id, TransactionsService.FSP_GRANT_CREDENTIAL_NAME);
            // 3 - validate tro is still in agreement to work with fsp
            await this.proveCredential(rec.tro_connection_id, TransactionsService.TRO_GRANT_CREDENTIAL_NAME);
            const transactionId = this.generateTransactionId(data.fspHash);
            const record: PendingTransaction = new PendingTransaction();
            record.transaction_id = transactionId;
            record.connection_key = data.fspId;
            await this.databaseService.savePendingTransaction(record);

            // 4 issue credential
            const txData = {
                tdcTroId: rec.tdc_tro_id,
                tdcFspId: rec.tdc_fsp_id,
                id: transactionId,
                typeId: data.typeId,
                subjectId: data.subjectId,
                amount: data.amount,
                date: data.date,
                eventData: JSON.stringify(data)
            };
            Logger.debug(`citizen ${TransactionsService.TRO_TRX_CREDENTIAL_NAME}.cred.def.json data with connectionId ${rec.tro_connection_id}`,
                txData);
            const results = await this.issuerService.issueCredential(`${TransactionsService.TRO_TRX_CREDENTIAL_NAME}.cred.def.json`,
                rec.tro_connection_id, txData);
            Logger.info(`citizen ${TransactionsService.TRO_TRX_CREDENTIAL_NAME}`, results);
            const credentialId: string = results.credential_exchange_id;
            // 5 - send start message to tro
            // 6 - inform
            Logger.debug(`sending transaction started message`);
            await this.sendTransactionMessage(rec.tro_connection_id, TransactionMessageStatesEnum.STARTED, transactionId, credentialId, data);
            await this.sendTransactionMessage(rec.fsp_connection_id, TransactionMessageStatesEnum.STARTED, transactionId, credentialId, data);
            // 7 - return transaction id, prob not necessary
            return { transactionId };
        } catch (e) {
            ExceptionHandler.evaluateAndThrow(e);
        }
    }

    /*
        For any FSP and TRO that is validated in the system (credit-grant ids), generate credit report for the
        inputted TRO.

        toThink() do we need security beyond credential proofs?
    */
    public async createTransactionReport(data: TransactionReportDto): Promise<any> {
        // 0 - load record from database
        Logger.info(`createTransactionReport get connection records`);
        // TODO: should look up work like create transaction -> await this.databaseService.getFspTroConnectionByFspId(data.fspId);
        const rec: FspTroConnection = await this.databaseService.getFspTroConnection(data.fspTdcId, data.troTdcId);
        if (!rec)
            throw new ProtocolException(ProtocolErrorCode.INVALID_BACKEND_OPERATION, 'record not found');

        try {
            // 1 - validate FSP has valid credential
            Logger.info(`createTransactionReport verify credit-fsp-grant`);
            await Proofs.proveIdentity(this.verifierService,`${TransactionsService.FSP_GRANT_CREDENTIAL_NAME}.proof.req.json`,
                rec.fsp_connection_id);
            // 2 - validate TRO has valid credential
            Logger.info(`createTransactionReport verify credit-tro-grant`);
            await Proofs.proveIdentity(this.verifierService, `${TransactionsService.TRO_GRANT_CREDENTIAL_NAME}.proof.req.json`,
                rec.tro_connection_id);

            // 3 generate report Id
            const reportId = this.generateTransactionId(`${data.fspTdcId}${Date.now().toString() }`);
            // 4 send basic message to TRO to generate transaction report
            await this.sendReportMessage(rec.tro_connection_id, TransactionMessageStatesEnum.STARTED, reportId, data.fspTdcId);
            await this.sendReportMessage(rec.fsp_connection_id, TransactionMessageStatesEnum.STARTED, reportId, data.fspTdcId);

            // 5 return transaction report ID to caller
            return { reportId };
        } catch (e) {
            ExceptionHandler.evaluateAndThrow(e);
        }
    }

    /*
        Generates an id.  In context of the transaction system, this id allows an entity such as FSP
        to identify a TRO without actually revealing the TRO.  The TDC will use this value to look up the
        entity.
    */
    private generateTdcTroId(key: string, hashableValue: string): string {
        return `${process.env.TDC_PREFIX}-${key}-${SecurityUtility.hash32(hashableValue).substr(10)}`;
    }

    private generateTransactionId(hashableValue: string) : string {
        return SecurityUtility.hash32(hashableValue).substr(10);
    }

    private async proveCredential(connectionId: string, credentialName: string) {
        Logger.debug(`proveCredential ${credentialName} for connection ${connectionId}`);
        const results = await Proofs.proveIdentity(this.verifierService, `${credentialName}.proof.req.json`, connectionId);
        Logger.info(`proveCredential ${credentialName}`, results);
    }

    private async sendGrantMessage(connectionId: string, state: string, id: string, tdcTroId: string, tdcFspId: string): Promise<any> {
        // @ts-ignore
        const msg: TdcGrant = new TdcGrant({
            state,
            id,
            tdcFspId,
            tdcTroId
        });
        Logger.debug(`TransactionsService sending sendGrantMessage connectionId: ${connectionId}`);
        return await this.agentService.sendBasicMessage(msg, connectionId);
    }

    private async sendTransactionMessage(connectionId: string, state: string, id: string, credentialId: string, eventJson: any): Promise<any> {
        const msg: CreditTransaction<any> =new CreditTransaction<any>({
                state,
                id,
                credentialId,
                transaction: eventJson
            });
        Logger.debug(`sending transaction basic message tp ${connectionId}`, msg);
        return await this.agentService.sendBasicMessage(msg, connectionId);
    }

    private async sendReportMessage(connectionId: string, state: string, id: string, tdcFspId: string, reportData?:any): Promise<any> {
        const msg: TransactionReportRequest<any> = new TransactionReportRequest<any>({
                id,
                state,
                tdcFspId,
                transactions: reportData
            });
        Logger.debug(`sending report basic message tp ${connectionId}`, msg);
        return await this.agentService.sendBasicMessage(msg, connectionId);
    }

}
