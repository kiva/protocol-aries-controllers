import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 *
 */
@Entity({ name: 'pending_transaction', synchronize: false })
export class PendingTransaction {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 64, nullable: false })
    connection_key: string;

    @Column({ type: 'varchar', length: 64, nullable: false })
    transaction_id: string;
}
