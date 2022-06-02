import { MigrationInterface, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

export class OneTimeKey1611166571882 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        Logger.log('OneTimeKey1611166571882 running up');
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS one_time_key (
                one_time_key varchar(64) NOT NULL PRIMARY KEY,
                fsp_connection_id varchar(64) NULL,
                tro_connection_id varchar(64) NULL,
                sent BOOLEAN NOT NULL DEFAULT FALSE,
                expires_at timestamp DEFAULT CURRENT_TIMESTAMP,
                delete_at timestamp DEFAULT CURRENT_TIMESTAMP
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        Logger.log('OneTimeKey1611166571882 running down');
        await queryRunner.query(
            'DROP TABLE IF EXISTS one_time_key;'
        );
    }
}
