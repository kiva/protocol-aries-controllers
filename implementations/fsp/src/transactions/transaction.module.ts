import { HttpModule, forwardRef, Module } from '@nestjs/common';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { AgentGovernanceFactory } from 'aries-controller/controller/agent.governance.factory';
import { AgentService } from 'aries-controller/agent/agent.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { DataService } from '../persistence/data.service';

/**
 *
 */
@Module({
    imports: [
        forwardRef(() => AgentModule),
        HttpModule
    ],
    controllers: [TransactionController],
    providers: [
        AgentGovernanceFactory,
        TransactionService,
        DataService],
})
export class TransactionModule {}
