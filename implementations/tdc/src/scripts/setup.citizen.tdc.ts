import { readFileSync } from 'fs';
import { ProtocolHttpService } from 'protocol-common';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

/**
 * Convenience script to setup the TDC agent to issue a citizen credential
 * Note this expects the steward controller is running
 * TODO make robust to different existing states
 */
class SetupCitizenTDC {

    private readonly http: ProtocolHttpService;
    // TODO pull these from configs
    private selfUrl = 'http://localhost:3015';

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

    private async setup() {
        // steward: publicize did
        SetupCitizenTDC.fetchValues('profiles/profile.json');
        await this.createSchemas();
        await this.createCredentials();
    }

    private async createSchemas() {
        // steward: create schema for citizen.identity
        const schema = SetupCitizenTDC.fetchValues('profiles/citizen.identity.schema.def.json');
        const response = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/steward/schema',
            data: schema
        });
        Logger.log('citizen.identity.schema.def', response.data);
    }

    private async createCredentials() {
        // issuer: create credential for citizen.identity
        const credDef = SetupCitizenTDC.fetchValues('profiles/citizen.identity.cred.def.json');
        const response = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/issuer/cred-def',
            data: credDef
        });
        Logger.log('citizen.identity.cred.def', response.data);

    }


    private static fetchValues(file: string) {
        const fileJson = JSON.parse(readFileSync(`/www/${file}`).toString());
        return {...fileJson.DEFAULT, ...fileJson[process.env.NODE_ENV]};
    }
}

(new SetupCitizenTDC()).run().catch(e => {
    Logger.error(e.message);
});
