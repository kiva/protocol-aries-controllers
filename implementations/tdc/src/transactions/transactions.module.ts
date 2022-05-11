import { Module, forwardRef, HttpModule } from '@nestjs/common';
import { IssuerModule } from 'aries-controller/issuer/issuer.module';
import { VerifierModule } from 'aries-controller/verifier/verifier.module';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { GlobalCacheModule } from 'aries-controller/app/global.cache.module';
import { AgentGovernanceFactory } from 'aries-controller/controller/agent.governance.factory';
import { DataService } from '../persistence/data.service';
import { TransactionMessageResponseFactory } from './messaging/transaction.message.response.factory';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
    imports: [
        forwardRef(() => IssuerModule),
        forwardRef( () => VerifierModule),
        forwardRef(() => AgentModule),
        GlobalCacheModule,
        HttpModule

    ],
    controllers: [TransactionsController],
    providers: [
        AgentGovernanceFactory,
        TransactionsService,
        DataService,
        TransactionMessageResponseFactory
    ],
    exports: [
        TransactionsService
    ]
})
export class TransactionsModule {}
