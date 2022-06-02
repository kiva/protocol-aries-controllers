import { InjectConnection } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { OneTimeKey } from './one.time.key.js';
import { FspTroConnection } from './fsp.tro.connection.js';
import { PendingTransaction } from './pending.transaction.js';


/**
 * This class is the public interface to retrieving and saving records into our persistence
 * layer (which happens to be postgres for now)
 */
@Injectable()
export class DataService {
    constructor(
        @InjectConnection() private readonly connection: Connection
    ) { }

    public async getOneTimeKeyRecord(key: string): Promise<OneTimeKey> {
        return await this.connection.getRepository(OneTimeKey).findOne({where: {one_time_key: key}});
    }

    public async saveOneTimeKeyRecord(record: OneTimeKey) : Promise<any> {
        await this.connection.getRepository(OneTimeKey).save(record);
    }

    public async saveFspTroConnection(record: FspTroConnection): Promise<any> {
        await this.connection.getRepository(FspTroConnection).save(record);
    }

    public async getFspTroConnection(tdcFspId: string, troTdcId: string): Promise<FspTroConnection> {
        return await this.connection.getRepository(FspTroConnection).findOne({where: {tdc_fsp_id: tdcFspId, tdc_tro_id: troTdcId}});
    }

    public async getFspTroConnectionByFspId(tdcFspId: string): Promise<FspTroConnection> {
        return await this.connection.getRepository(FspTroConnection).findOne({where: {tdc_fsp_id: tdcFspId }});
    }

    public async getFspTroConnectionByTroConnectionId(troConnectionId: string): Promise<FspTroConnection> {
        return await this.connection.getRepository(FspTroConnection).findOne({where: {tro_connection_id: troConnectionId }});
    }

    public async savePendingTransaction(record: PendingTransaction): Promise<any> {
        return await this.connection.getRepository(PendingTransaction).save(record);
    }

    public async getPendingTransaction(transactionId: string): Promise<PendingTransaction> {
        return await this.connection.getRepository(PendingTransaction).findOne({where: {transaction_id : transactionId}});
    }
}
