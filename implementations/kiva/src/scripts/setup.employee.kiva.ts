import { readFileSync } from 'fs';
import { ProtocolHttpService } from 'protocol-common';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

/**
 * Convenience script to setup the Kiva agent to issue employee credentials
 * Note this expects the steward controller is running
 * TODO make robust to different existing states
 *
 * Currently this requires 2 different ways of running for dev and prod - eventually we should get this working in both
 *   Dev : docker exec -it kiva-controller ts-node /www/scripts/setup.employee.kiva.ts
 *   Prod: docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 */
class SetupEmployeeKiva {

    private readonly http: ProtocolHttpService;
    // TODO pull these from configs
    private selfUrl = 'http://localhost:3011';

    constructor(http?: HttpService) {
        this.http = new ProtocolHttpService(http || new HttpService());
    }

    public async run() {
        try {
            await this.setup();
        } catch(e) {
            Logger.log(e);
            process.exit(1);
        }
    }

    /**
     * Creates Employee schema and cred def
     */
    private async setup() {
        let res;

        // steward: create employee schema
        const schema = SetupEmployeeKiva.fetchValues('profiles/employee.schema.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/steward/schema',
            data: schema
        });
        Logger.log(res.data);

         // issuer: create cred def
         const credDef = SetupEmployeeKiva.fetchValues('profiles/employee.cred.def.json');
         res = await this.http.requestWithRetry({
             method: 'POST',
             url: this.selfUrl + '/v1/issuer/cred-def',
             data: credDef
         });
         Logger.log(res.data);
    }


    private static fetchValues(file: string) {
        const fileJson = JSON.parse(readFileSync(`/www/${file}`).toString());
        return {...fileJson.DEFAULT, ...fileJson[process.env.NODE_ENV]};
    }
}

(new SetupEmployeeKiva()).run().catch(e => {
    Logger.error(e.message);
});
