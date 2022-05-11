import {MigrationInterface, QueryRunner} from 'typeorm';

export class FspTroConnectionCreate1611257923775 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS fsp_tro_connection (
                id serial PRIMARY KEY,
                fsp_connection_id varchar(64) NOT NULL,
                tro_connection_id varchar(64) NOT NULL,
                tdc_fsp_id varchar(64) not null,
                tdc_tro_id varchar(64) NOT NULL,
                state INT
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TABLE IF EXISTS fsp_tro_connection;`
        );
    }
}
