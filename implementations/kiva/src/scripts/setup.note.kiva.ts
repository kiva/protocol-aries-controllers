import { readFileSync } from 'fs';
import { ProtocolHttpService } from 'protocol-common';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';

/**
 * Convenience script to setup the Kiva agent to issue employee credentials
 * Note this expects the steward controller is running
 * TODO make robust to different existing states
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
            Logger.log(JSON.stringify(e));
            process.exit(1);
        }
    }

    /**
     * Creates Note schema and cred def
     */
    private async setup() {
        let res;

        // steward: create note schema
        const schema = SetupNoteKiva.fetchValues('profiles/note.schema.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/steward/schema',
            data: schema
        });
        Logger.log(res.data);

         // issuer: create cred def
         const credDef = SetupNoteKiva.fetchValues('profiles/note.cred.def.json');
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

(new SetupNoteKiva()).run().catch(e => {
    Logger.error(e.message);
});
