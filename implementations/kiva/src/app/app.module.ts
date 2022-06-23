import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import kivaEnvData from '../config/env.json' assert { type: 'json'};

/**
 * Pull the various modules from aries-controller, and adds in the modules specific for this controller (mobile)
 */
@Module({
    imports: [
        ConfigModule.init({...baseEnvData, ...kivaEnvData}),
        ProtocolLoggerModule,
        AgentModule,
        AgentControllerModule,
        IssuerModule,
        StewardModule,
        VerifierModule,
        ApiModule,
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
