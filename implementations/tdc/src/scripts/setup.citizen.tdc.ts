import { Logger } from 'protocol-common/logger';
import { HttpService } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { readFileSync } from 'fs';

/**
 * Convenience script to setup the TDC agent to issue a citizen credential
 * Note that right now we need to run this script first fully, before spinning up the ncra controller and running the ncra script
 * Note this expects the steward controller is running
 * TODO make robust to different existing states
 *
 * Currently this requires 2 different ways of running for dev and prod - eventually we should get this working in both
 *   Dev : docker exec -it tdc-controller ts-node /www/src/scripts/setup.citizen.tdc.ts
 *   Prod: docker exec -it tdc-controller node /www/scripts/setup.citizen.tdc.js
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
            Logger.log(e);
            process.exit(1);
        }
    }

    private async setup() {
        // steward: publicize did
        const profile = this.fetchValues('profiles/profile.json');
        await this.createSchemas();
        await this.createCredentials();
    }

    private async createSchemas() {
        let res;

        // steward: create schema for citizen.identity
        const schema = this.fetchValues('profiles/citizen.identity.schema.def.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/steward/schema',
            data: schema
        });
        Logger.log('citizen.identity.schema.def', res.data);
    }

    private async createCredentials() {
        let res;

        // issuer: create credential for citizen.identity
        const credDef = this.fetchValues('profiles/citizen.identity.cred.def.json');
        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/issuer/cred-def',
            data: credDef
        });
        Logger.log('citizen.identity.cred.def', res.data);

    }


    private fetchValues(file) {
        const fileJson = JSON.parse(readFileSync('/www/' + file).toString());
        const envValues = {...fileJson.DEFAULT, ...fileJson[process.env.NODE_ENV]};
        return envValues;
    }
}

(new SetupCitizenTDC()).run();
