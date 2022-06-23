import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'requested_reports' })
export class RequestedReport {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    fsp_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    report_id: string;

    @Column({ type: 'timestamp' })
    request_date: Date;

    @Column({ type: 'varchar', nullable: false })
    content: string;

    @Column({ type: 'varchar', nullable: false })
    included_items: string;

    @Column({ type: 'varchar', nullable: false })
    excluded_items: string;
}
