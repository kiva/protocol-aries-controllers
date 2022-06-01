import { NestFactory } from '@nestjs/core';
import { INestApplication, Logger } from '@nestjs/common';
import { AppModule } from './app/app.module.js';
import { AppService } from 'aries-controller';

let app: INestApplication;
async function bootstrap() {
    const port = process.env.PORT;
    app = await NestFactory.create(AppModule);

    await AppService.setup(app);
    await app.listen(port);
    Logger.log(`Server started on ${port}`);
    await AppService.initAgent(app);
}
bootstrap();
export { app };
