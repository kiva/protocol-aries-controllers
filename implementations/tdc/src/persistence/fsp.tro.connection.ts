import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/*
    This record is created after the FSP and TRO are successfully connected.
*/
@Entity({ name: 'fsp_tro_connection', synchronize: false })
export class FspTroConnection {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 64, nullable: false })
    fsp_connection_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    tro_connection_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    tdc_fsp_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    tdc_tro_id: string;

    @Column( { type: 'int' })
    state: number;
}
