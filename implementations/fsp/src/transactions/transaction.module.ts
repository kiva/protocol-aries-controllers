import { forwardRef, Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
import { DataService } from '../persistence/data.service.js';
import { AgentGovernanceFactory, AgentModule } from 'aries-controller';
import { ProtocolHttpModule } from 'protocol-common';

/**
 *
 */
@Module({
    imports: [
        forwardRef(() => AgentModule),
        ProtocolHttpModule
    ],
    controllers: [TransactionController],
    providers: [
        AgentGovernanceFactory,
        TransactionService,
        DataService],
})
export class TransactionModule {}
