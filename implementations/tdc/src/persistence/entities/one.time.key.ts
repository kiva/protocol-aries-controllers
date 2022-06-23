import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * This record holds fsp_connection_id or tro_connection_id until the system receives both (then the record is deleted)
 * The one_time_key is provided by either the FSP or TRO when the record is created.  We save the record
 * so that connection isn't lost should the service go down before the two are connected.
 */
@Entity({ name: 'one_time_key', synchronize: false })
export class OneTimeKey {

    /**
     * This value is provided from an external source (it could be from the FSP, but it can originate from any source
     * as long as the value is unique and not identifiable).
     */
    @PrimaryColumn({ type: 'varchar', length: 64, nullable: false })
    one_time_key: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    fsp_connection_id: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    tro_connection_id: string;

    /**
     * indicates the ids have been generated and sent to the FSP and TRO
     * (and a FspTroConnection record should exist).  This is prevent
     * some other actor from accidently connecting to another actor using the same key
     */
    @Column({type: 'boolean'})
    sent: boolean;

    /**
     * when does this onetimekey become invalid
     * example 15 minutes in the future
     */
    @Column({type: 'timestamp', nullable: true})
    expires_at: boolean;

    /**
     * when can this record be deleted, prob by some batch process
     * we want to keep the record around for a while to prevent reuse of key
     * example 6 months in the future
     */
    @Column({type: 'timestamp', nullable: true})
    delete_at: boolean;

}
