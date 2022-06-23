import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MobileModule } from '../mobile/mobile.module.js';
import { KycModule } from '../kyc/kyc.module.js';
import { TransactionModule } from '../transactions/transaction.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { OrmConfig } from '../ormconfig.js';
import { ConfigModule, LoggingInterceptor, ProtocolLoggerModule } from 'protocol-common';
import {
    AgentControllerModule,
    AgentModule,
    ApiModule, AppController, AppService,
    IssuerModule,
    StewardModule,
    VerifierModule
} from 'aries-controller';

// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import baseEnvData from 'aries-controller/config/env.json' assert { type: 'json'};
// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import fspEnvData from '../config/env.json' assert { type: 'json'};

/**
 * Pull the various modules from aries-controller, and adds in the modules specific for this controller (mobile)
 */
@Module({
    imports: [
        ConfigModule.init({...baseEnvData, ...fspEnvData}),
        ProtocolLoggerModule,
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
