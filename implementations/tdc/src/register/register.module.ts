import { Module, forwardRef } from '@nestjs/common';
import { RegisterService } from './register.service.js';
import { RegisterController } from './register.controller.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { DataService } from '../persistence/data.service.js';
import { AgentGovernanceFactory, AgentModule, GlobalCacheModule, IssuerModule, VerifierModule } from 'aries-controller';

@Module({
    imports: [
        forwardRef(() => IssuerModule),
        forwardRef( () => VerifierModule),
        forwardRef(() => AgentModule),
        TransactionsModule,
        GlobalCacheModule
    ],
    controllers: [RegisterController],
    providers: [
        AgentGovernanceFactory,
        DataService,
        RegisterService
    ],
})
export class RegisterModule {}
