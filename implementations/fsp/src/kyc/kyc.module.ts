import { Module } from '@nestjs/common';
import { KycService } from './kyc.service.js';
import { KycController } from './kyc.controller.js';
import { ProtocolHttpModule } from 'protocol-common';
import { VerifierModule } from 'aries-controller';

/**
 * TODO This reference the main controller code (with a lot of ..'s), maybe there is a better way to approach this
 * TODO eventually we'll rewrite things so that more of the kyc code is in the verify service, and then we won't have so many cross dependencies
 */
@Module({
    imports: [
        ProtocolHttpModule,
        VerifierModule,
    ],
    controllers: [KycController],
    providers: [
        KycService,
    ],
})
export class KycModule {}
