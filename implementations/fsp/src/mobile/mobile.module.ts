import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { VerifierModule } from 'aries-controller/verifier/verifier.module';

/**
 *
 */
@Module({
    imports: [
        AgentModule,
        VerifierModule,
    ],
    controllers: [MobileController],
    providers: [],
})
export class MobileModule {}
