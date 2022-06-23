import { Module } from '@nestjs/common';
import { DataService } from '../../persistence/data.service.js';
import { TransactionMessageResponseFactory } from './transaction.message.response.factory.js';
import { AgentModule } from 'aries-controller';
import { ProtocolHttpModule } from 'protocol-common';


/**
 *
 */
@Module({
    imports: [
        AgentModule,
        ProtocolHttpModule,
    ],
    controllers: [],
    providers: [
        TransactionMessageResponseFactory,
        DataService
    ],
    exports: [TransactionMessageResponseFactory]
})
export class TransactionMessagingModule {}
