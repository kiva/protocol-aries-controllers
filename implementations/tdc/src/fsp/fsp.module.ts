import { Module, forwardRef } from '@nestjs/common';
import { FspService } from './fsp.service.js';
import { FspController } from './fsp.controller.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { DataService } from '../persistence/data.service.js';
import { AgentGovernanceFactory, AgentModule, GlobalCacheModule, IssuerModule, VerifierModule } from 'aries-controller';

@Module({
    imports: [
        forwardRef(() => IssuerModule),
        forwardRef( () => VerifierModule),
        forwardRef(() => AgentModule),
        TransactionsModule,
        GlobalCacheModule,
        PersistenceModule
    ],
    controllers: [FspController],
    providers: [
        AgentGovernanceFactory,
        DataService,
        FspService
    ],
})
export class FspModule {}
