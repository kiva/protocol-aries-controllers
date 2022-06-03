import { Module } from '@nestjs/common';
import { DataService } from './data.service.js';

@Module({
    exports: [DataService],
    controllers: [],
    providers: [DataService],
})
export class PersistenceModule {}
