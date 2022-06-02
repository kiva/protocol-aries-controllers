import { Module, forwardRef } from '@nestjs/common';
import { DataService } from '../persistence/data.service.js';
import { TransactionMessageResponseFactory } from './messaging/transaction.message.response.factory.js';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { AgentGovernanceFactory, AgentModule, GlobalCacheModule, IssuerModule, VerifierModule } from 'aries-controller';
import { ProtocolHttpModule } from 'protocol-common';

@Module({
    imports: [
        forwardRef(() => IssuerModule),
        forwardRef( () => VerifierModule),
        forwardRef(() => AgentModule),
        GlobalCacheModule,
        ProtocolHttpModule

    ],
    controllers: [TransactionsController],
    providers: [
        AgentGovernanceFactory,
        TransactionsService,
        DataService,
        TransactionMessageResponseFactory
    ],
    exports: [TransactionsService]
})
export class TransactionsModule {}
