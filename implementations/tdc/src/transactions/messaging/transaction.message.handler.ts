import { CreditTransaction } from 'aries-controller/agent/messaging/credit.transaction';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AgentService } from 'aries-controller/agent/agent.service';
import { IBasicMessageHandler } from './basic.message.handler';
import { TransactionMessageStatesEnum } from './transaction.message.states.enum';
import { DataService } from '../../persistence/data.service';
import { PendingTransaction } from '../../persistence/pending.transaction';
import { FspTroConnection } from '../../persistence/fsp.tro.connection';


export class TransactionMessageHandler implements IBasicMessageHandler {
    constructor(private readonly agentService: AgentService,
                private readonly agentId: string,
                private readonly adminApiKey: string,
                private readonly connectionId: string,
                private readonly dbAccessor: DataService,
                private readonly http: ProtocolHttpService) {
    }

    public async respond(message: any): Promise<boolean> {
        if (message.state === TransactionMessageStatesEnum.ACCEPTED) {
            const transactionId = message.id;
            Logger.debug(`'accepted' transaction record ${transactionId}`);
            const pendingTransaction: PendingTransaction = await this.dbAccessor.getPendingTransaction(transactionId);
            const rec: FspTroConnection = await this.dbAccessor.getFspTroConnectionByFspId(pendingTransaction.connection_key);
            await this.sendTransactionMessage(this.agentId, this.adminApiKey, rec.tro_connection_id,
                TransactionMessageStatesEnum.COMPLETED, transactionId, message.credentialId, message.transaction);
            await this.sendTransactionMessage(this.agentId, this.adminApiKey, rec.fsp_connection_id,
                TransactionMessageStatesEnum.COMPLETED, transactionId, message.credentialId, message.transaction);
            // TODO: can we delete this pending transaction?

            return true;
        }
        return false;
    }


    private async sendTransactionMessage(agentId: string, adminApiKey: string, connectionId: string, state: string,
                                         id: string, credentialId: string, eventJson: any): Promise<any> {
        /*
        const msg: CreditTransaction<any> = new CreditTransaction<any>({
            state,
            id,
            credentialId,
            transaction: eventJson
        });
        return await this.agentService.sendBasicMessage(msg, connectionId);
        */
        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/connections/${connectionId}/send-message`;
        const msg: CreditTransaction<any> =new CreditTransaction<any>({
            state,
            id,
            credentialId,
            transaction: eventJson
        });
        const data = { content: JSON.stringify(msg) };
        const req: any = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': adminApiKey,
            },
            data
        };

        Logger.debug(`sendTransactionMessage to ${connectionId}`, msg);
        const res = await this.http.requestWithRetry(req);
        Logger.debug(`${agentId} sendTransactionMessage results`, res.data);
        return res.data;
    }
}
