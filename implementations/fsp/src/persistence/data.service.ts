import { InjectConnection } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { TdcGrants } from './tdc.grants.js';
import { Transaction } from './transaction.js';
import { RequestedReport } from './requested.report.js';


/*
    This class is the public interface to retrieving and saving records into our persistence
    layer (which happens to be postgres for now)
*/
@Injectable()
export class DataService {
    constructor(
        @InjectConnection() private readonly connection: Connection
    ) { }

    public async saveTdcGrantRecord(record: TdcGrants): Promise<any> {
        await this.connection.getRepository(TdcGrants).save(record);
    }

    public async getTDCGrantRecord(key: string): Promise<TdcGrants> {
        return await this.connection.getRepository(TdcGrants).findOne({ where: { one_time_key: key} });
    }

    public async saveTransaction(record: Transaction): Promise<any> {
        return await this.connection.getRepository(Transaction).save(record);
    }

    public async getTransaction(key: string): Promise<Transaction> {
        return await this.connection.getRepository(Transaction).findOne({ where: {transaction_id: key} });
    }

    public async getReport(key: string): Promise<RequestedReport> {
        return await this.connection.getRepository(RequestedReport).findOne( { where: {report_id: key} });
    }

    public  async saveRequestedReport(record: RequestedReport): Promise<any> {
        return await this.connection.getRepository(RequestedReport).save(record);
    }
}
