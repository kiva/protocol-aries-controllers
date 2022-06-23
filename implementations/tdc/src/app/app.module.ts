import { Module } from '@nestjs/common';
import { OrmConfig } from '../ormconfig.js';
import { RegisterModule } from '../register/register.module.js';
import { FspModule } from '../fsp/fsp.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionMessagingModule } from '../transactions/messaging/transaction.messaging.module.js';
import { ConfigModule, LoggingInterceptor, ProtocolLoggerModule } from 'protocol-common';
import {
    AgentControllerModule,
    AgentModule,
    ApiModule,
    AppController,
    AppService,
    IssuerModule,
    StewardModule,
    VerifierModule
} from 'aries-controller';

// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import baseEnvData from 'aries-controller/config/env.json' assert { type: 'json'};
// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import tdcEnvData from '../config/env.json' assert { type: 'json'};

/**
 * Pull the various modules from aries-controller, and adds in the modules specific for this controller (mobile)
 */
@Module({
    imports: [
        ConfigModule.init({...baseEnvData, ...tdcEnvData}),
        ProtocolLoggerModule,
        OrmConfig(),
        AgentModule,
        AgentControllerModule,
        IssuerModule,
        StewardModule,
        VerifierModule,
        ApiModule,
        RegisterModule,
        FspModule,
        TransactionsModule,
        PersistenceModule,
        TransactionMessagingModule
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor
        }
    ],
    exports: [],
})
export class AppModule {}
