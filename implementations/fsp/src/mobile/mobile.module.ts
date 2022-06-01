import { Module } from '@nestjs/common';
import { MobileController } from './mobile.controller.js';
import { AgentModule, VerifierModule } from 'aries-controller';

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
