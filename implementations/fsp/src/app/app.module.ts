import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'protocol-common/logging.interceptor';
import { ConfigModule } from 'protocol-common/config.module';
import { AppService } from 'aries-controller/app/app.service';
import { AppController } from 'aries-controller/app/app.controller';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { AgentControllerModule } from 'aries-controller/controller/agent.controller.module';
import { IssuerModule } from 'aries-controller/issuer/issuer.module';
import { StewardModule } from 'aries-controller/steward/steward.module';
import { VerifierModule } from 'aries-controller/verifier/verifier.module';
import { ApiModule } from 'aries-controller/api/api.module';
import baseEnvData from 'aries-controller/config/env.json';
import fspEnvData from '../config/env.json';
import { MobileModule } from '../mobile/mobile.module';
import { KycModule } from '../kyc/kyc.module';
import { TransactionModule } from '../transactions/transaction.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { OrmConfig } from '../ormconfig';

/**
 * Pull the various modules from aries-controller, and adds in the modules specific for this controller (mobile)
 */
@Module({
    imports: [
        ConfigModule.init({...baseEnvData, ...fspEnvData}),
        OrmConfig(),
        AgentModule,
        AgentControllerModule,
        IssuerModule,
        StewardModule,
        VerifierModule,
        ApiModule,
        MobileModule,
        KycModule,
        TransactionModule,
        PersistenceModule
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor
        }
    ],
    exports: []
})
export class AppModule {}
