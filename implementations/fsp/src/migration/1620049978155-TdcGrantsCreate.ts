import {MigrationInterface, QueryRunner} from 'typeorm';
import { Logger } from 'protocol-common/logger';

export class TdcGrantsCreate1620049978155 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`TdcGrants1620049978155 creating table`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS tdc_grants (
                id serial PRIMARY KEY,
                tdc_id varchar(64) NOT NULL,
                fsp_id varchar(64) NOT NULL,
                one_time_key  varchar(64) NOT NULL
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`TdcGrants1620049978155 dropping table`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS tdc_grants;`
        );
    }

}
