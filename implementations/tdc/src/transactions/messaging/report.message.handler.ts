import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { SecurityUtility } from 'protocol-common/security.utility';
import { AgentService } from 'aries-controller/agent/agent.service';
import { TransactionReportRequest } from 'aries-controller/agent/messaging/transaction.report.request';
import { VerificationItem } from 'aries-controller/agent/messaging/verification.item';
import { DataService } from '../../persistence/data.service';
import { FspTroConnection } from '../../persistence/fsp.tro.connection';
import { IBasicMessageHandler } from './basic.message.handler';
import { TransactionMessageStatesEnum } from './transaction.message.states.enum';
import { TxReportResponseDto } from '../dtos/tx.report.response.dto';


export class ReportMessageHandler implements IBasicMessageHandler {
    constructor(private readonly agentService: AgentService,
                private readonly agentId: string,
                private readonly adminApiKey: string,
                private readonly connectionId: string,
                private readonly dbAccessor: DataService,
                private readonly http: ProtocolHttpService) {
    }

    public async respond(message: any): Promise<boolean> {
        if (message.state === TransactionMessageStatesEnum.COMPLETED) {
            const reportId = message.id;
            Logger.debug(`'completed' transaction report ${reportId}`);
            const rec: FspTroConnection = await this.dbAccessor.getFspTroConnectionByFspId(message.tdcFspId);
            const includedItems:  VerificationItem[] = [];
            const excludedItems: VerificationItem[] = [];
            let previousHash: string = '';
            const report = this.createTransactionReportRequestFromMessage(message.state, message.id,
                 message.tdcFspId, message.transactions, undefined, undefined);
            for(const dataItem of report.transactions) {
                Logger.debug(`dataItem:`, dataItem);
                const record: TxReportResponseDto = dataItem as TxReportResponseDto;
                // Logger.debug(`order: ${record.order} hash ${record.hash} amount ${record.amount}`);
                const reHash: string = this.generateHash(`${record.order}${record.hash}${previousHash}`);
                const item: VerificationItem = {
                    id: record.transactionId,
                    previousHash,
                    hash: record.hash,
                    reHash
                };

                if (true === this.isTransactionExpired(record)) {
                    // TODO.  once the requirements are defined, eval if the transaction has 'expired' and
                    // if so remove it from transactions and put relevant information in the excludedItems array
                    excludedItems.push(item);
                } else {
                    includedItems.push(item);
                }
                previousHash = record.hash;
            }

            await this.sendReportMessage(rec.fsp_connection_id, TransactionMessageStatesEnum.COMPLETED,
                reportId, message.tdcFspId, message.transactions, includedItems, excludedItems);
            return true;
        }
        return false;
    }

    private createTransactionReportRequestFromMessage(state: string, id: string, tdcFspId: string, reportData?:any,
                                                      included?:  VerificationItem[], excluded?: VerificationItem[]) : TransactionReportRequest<any>
    {
        return new TransactionReportRequest<string>({
            id,
            state,
            tdcFspId,
            transactions: JSON.parse(reportData),
            included,
            excluded
        });
    }

    private async sendReportMessage(connectionId: string, state: string, id: string, tdcFspId: string, reportData?:any,
                                    included?:  VerificationItem[], excluded?: VerificationItem[]): Promise<any> {
        const msg: TransactionReportRequest<any> = new TransactionReportRequest<any>({
            id,
            state,
            tdcFspId,
            transactions: reportData,
            included,
            excluded
        });
        Logger.debug(`sending report basic message ${connectionId}`, msg);
        return await this.agentService.sendBasicMessage(msg, connectionId);
    }

    private isTransactionExpired(record: TxReportResponseDto): boolean {
        // TODO.  once the requirements are defined, eval if the transaction has 'expired' and
        // if so remove it from transactions and put relevant information in the excludedItems array
        return false;
    }

    private generateHash(hashableValue: string) : string {
        return SecurityUtility.hash32(hashableValue);
    }
}
