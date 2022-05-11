import {MigrationInterface, QueryRunner} from 'typeorm';
import { Logger } from 'protocol-common/logger';

export class TransactionsCreate1620222763813 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`TransactionCreate1620222763813 Creating table`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id serial PRIMARY KEY,
                fsp_id varchar(64) NOT NULL,
                transaction_id varchar(64) NOT NULL,
                transaction_date TIMESTAMP DEFAULT now(),
                hash varchar(32) NOT NULL
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`TransactionCreate1620222763813 dropping table`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS transactions;`
        );
    }

}
