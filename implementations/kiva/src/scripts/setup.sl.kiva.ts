import { readFileSync } from 'fs';
import { ProtocolHttpService } from 'protocol-common';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';

/**
 * Convenience script to setup the Kiva agent for the SL context
 * Note this expects the steward controller is running
 * TODO make robust to different existing states
 *
 * Currently this requires 2 different ways of running for dev and prod - eventually we should get this working in both
 *   Dev : docker exec -it kiva-controller ts-node /www/scripts/setup.kiva.ts
 *   Prod: docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 */
class SetupSlKiva {

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
     * Creates KYC schema
     * TODO figure out a better way to reference file paths - I'm only using readFileSync because import with relative paths is causing issues
     */
    private async setup() {
        let res;

        // steward: publicize did
        const profile = SetupSlKiva.fetchValues('profiles/profile.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/agent/publicize-did',
            data: {
                did: profile.did
            }
        });
        Logger.log(res.data);

        // steward: create schema
        const schema = SetupSlKiva.fetchValues('profiles/sl.kyc.schema.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/steward/schema',
            data: schema
        });
        Logger.log(res.data);
    }


    private static fetchValues(file: string) {
        const fileJson = JSON.parse(readFileSync(`/www/${file}`).toString());
        return {...fileJson.DEFAULT, ...fileJson[process.env.NODE_ENV]};
    }
}

(new SetupSlKiva()).run().catch(e => {
    Logger.error(e.message);
});
