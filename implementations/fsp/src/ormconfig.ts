import { DynamicModule, Logger } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

// @tothink we could also use Typeorm's environment variables feature:
// https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables
export const OrmConfig = (): DynamicModule => {
    const options: TypeOrmModuleOptions = {
        type: 'postgres',
        synchronize: false,
        migrationsRun: true,
        entities: ['dist/persistence/entities/**/*.js'],
        migrations: ['dist/migration/**/*.js'],
        host: process.env.POSTGRES_HOST,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        port: parseInt(process.env.POSTGRES_PORT, 10),
    };
    const module = TypeOrmModule.forRoot(options);

    Logger.log(`OrmConfig() loaded using ${options.host} db ${options.database}, with synchronize ${options.synchronize.toString()}`);

    return module;
};
