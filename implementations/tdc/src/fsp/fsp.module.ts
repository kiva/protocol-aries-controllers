import { Module, forwardRef } from '@nestjs/common';
import { IssuerModule } from 'aries-controller/issuer/issuer.module';
import { VerifierModule } from 'aries-controller/verifier/verifier.module';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { GlobalCacheModule } from 'aries-controller/app/global.cache.module';
import { AgentGovernanceFactory } from 'aries-controller/controller/agent.governance.factory';
import { FspService } from './fsp.service';
import { FspController } from './fsp.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { DataService } from '../persistence/data.service';

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
