import { Module, HttpModule } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { VerifierModule } from 'aries-controller/verifier/verifier.module';

/**
 * TODO This reference the main controller code (with a lot of ..'s), maybe there is a better way to approach this
 * TODO eventually we'll rewrite things so that more of the kyc code is in the verify service, and then we won't have so many cross dependencies
 */
@Module({
    imports: [
        HttpModule,
        VerifierModule,
    ],
    controllers: [KycController],
    providers: [
        KycService,
    ],
})
export class KycModule {}
