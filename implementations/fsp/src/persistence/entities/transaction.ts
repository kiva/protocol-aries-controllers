import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/*
    This record is the heart of the TDC.   Every credit event gets recorded here as a hash.  This hash
    is created when the credential is accepted by both parties (FSP, TRO).

    This record does not save all of the data associated with a credit event.  The actual credit event is
    owned (and stored) by the TRO.  This transaction is the TDC "proof" of the record

    TODO: we prob need more fields here, including credential id
*/
@Entity({ name: 'transactions' })
export class Transaction {

    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    fsp_id: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    transaction_id: string;

    @Column({ type: 'timestamp' })
    transaction_date: Date;

    @Column({ type: 'varchar', length: 32, nullable: false })
    hash: string;
}
