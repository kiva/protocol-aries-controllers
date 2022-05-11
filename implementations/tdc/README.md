# Readme for TDC system

TDC (Transaction Data coordinator) agent is the credit reporting agency, which acts as the mediator
between TRO (think citizen) and FSPs (think bank).

General Workflow for the system
Note: different workflows, identified later in this document, specify in more detail each step.

1. TRO and TDC create and maintain a connection (Credit-CRO-Auth-Id)
2. FSP and TDC create and maintain a connection (Credit-FSP-Auth-Id)
3. TDC grants FSP and TRO identities establishing relationship between TRO and FSP
5. Using the TDC, FSP request credit event (such as query) and generates credit history events (Credit-Event) 
6. At some point, the credit-grant expires or is revoked through TDC


## DB Migrations
For more details about TypeORM migrations, take a look at their [documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md).

To create a new database migration, run the following command from the top level of the tdc controller implementation:
```
npm run typeorm:migration NameOfNewMigration
```
This will create a new typescript class in the `src/migration` folder that concatenates the timestamp of when you ran
the migration and the name you provided. For example, `src/migration/1610566582191-CreateTables.ts` contains a class 
called `CreateTables1610566582191`.
