import {MigrationInterface, QueryRunner} from 'typeorm';

export class PendingTransactionCreate1620157523198 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS pending_transaction (
                id serial PRIMARY KEY,
                connection_key varchar(64) NOT NULL,
                transaction_id varchar(64) NOT NULL
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TABLE IF EXISTS pending_transaction;`
        );
    }

}
