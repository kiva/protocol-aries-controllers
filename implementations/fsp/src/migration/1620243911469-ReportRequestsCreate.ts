import { MigrationInterface, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

export class ReportRequestsCreate1620243911469 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        Logger.log('ReportRequestsCreate1620243911469 Creating table');
        // we do not need to preserve existing data as its not deployed yet
        await queryRunner.query(`
            DROP TABLE IF EXISTS requested_reports;
            CREATE TABLE IF NOT EXISTS requested_reports (
                id serial PRIMARY KEY,
                fsp_id varchar(64) NOT NULL,
                report_id varchar(64) NOT NULL,
                request_date TIMESTAMP DEFAULT now(),
                content text DEFAULT '',
                included_items text DEFAULT '',
                excluded_items text DEFAULT ''
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        Logger.log('ReportRequestsCreate1620243911469 dropping table');
        await queryRunner.query(
            'DROP TABLE IF EXISTS requested_reports;'
        );
    }


}
