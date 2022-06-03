import { Logger } from 'protocol-common/logger';
import { HttpService } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { readFileSync } from 'fs';

/**
 * Convenience script to setup the Kiva agent to issue employee credentials
 * Note that right now we need to run this script first fully, before spinning up the ncra controller and running the ncra script
 * Note this expects the steward controller is running
 * TODO make robust to different existing states
 *
 * Currently this requires 2 different ways of running for dev and prod - eventually we should get this working in both
 *   Dev : docker exec -it kiva-controller ts-node /www/scripts/setup.note.kiva.ts
 *   Prod: docker exec -it kiva-controller node /www/scripts/setup.note.kiva.js
 */
class SetupNoteKiva {

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
     * Creates Note schema and cred def
     */
    private async setup() {
        let res;

        // steward: create note schema
        const schema = this.fetchValues('profiles/note.schema.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/steward/schema',
            data: schema
        });
        Logger.log(res.data);

         // issuer: create cred def
         const credDef = this.fetchValues('profiles/note.cred.def.json');
         res = await this.http.requestWithRetry({
             method: 'POST',
             url: this.selfUrl + '/v1/issuer/cred-def',
             data: credDef
         });
         Logger.log(res.data);
    }


    private fetchValues(file) {
        const fileJson = JSON.parse(readFileSync('/www/' + file).toString());
        const envValues = {...fileJson.DEFAULT, ...fileJson[process.env.NODE_ENV]};
        return envValues;
    }
}

(new SetupNoteKiva()).run();
