import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/*
    This record is created after the FSP and TRO are successfully connected.
*/
@Entity({ name: 'tdc_grants', synchronize: false })
export class TdcGrants {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 64, nullable: false })
    tdc_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    fsp_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    one_time_key: string;

}
