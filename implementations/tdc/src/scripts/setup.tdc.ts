import { Logger } from 'protocol-common/logger';
import { HttpService } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { readFileSync } from 'fs';

/**
 * Convenience script to setup the TDC agent for the SL context
 * Note that right now we need to run this script first fully, before spinning up the ncra controller and running the ncra script
 * Note this expects the steward controller is running
 *
 * Currently this requires 2 different ways of running for dev and prod - eventually we should get this working in both
 *   Dev : docker exec -it tdc-controller ts-node /www/src/scripts/setup.tdc.ts
 *   Prod: docker exec -it tdc-controller node /www/scripts/setup.tdc.js
 */
class SetupTDC {

    private readonly http: ProtocolHttpService;
    // TODO pull these from configs
    private selfUrl = 'http://localhost:3015';
    private stewardUrl = 'http://kiva-controller:3011';

    private profiles: string[] = [];

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
     * Creates all of the schemas used in credit history.
     * TODO !! will add new schemas as new parts of the system are added
     */
    private async setup() {
        try {
            // there is a file that contains lines with the names of the
            // schemas and credentials to read from the profiles directory.
            // it lives in two different places so attempt to read it from production
            // location first and then local environment next.
            try {
                this.profiles = this.fetchNames('scripts/credentials');
            }
            catch {
                this.profiles = this.fetchNames('src/scripts/credentials');
            }
        } catch (e) {
            Logger.warn(`failed to read profiles from file`, e);
            throw e;
        }

        Logger.debug(`read profiles from file`, this.profiles);

        // steward: publicize did
        let res;
        const profile = this.fetchValues('profiles/profile.json');

        try {
            res = await this.http.requestWithRetry({
                method: 'POST',
                url: this.stewardUrl + '/v1/steward/endorser',
                data: profile
            });
            Logger.log(`endorser`, res.data);
        } catch (e) {
            Logger.error('endorsing TDC DID failed ', e.message);
            process.exit(1);
        }

        res = await this.http.requestWithRetry({
            method: 'POST',
            url: this.selfUrl + '/v1/agent/publicize-did',
            data: {
                did: profile.did
            }
        });
        Logger.log('publicize-did', res.data);

        await this.createSchemas();
        await this.createCredentials();
    }

    private async createSchemas() {
        for(const name of this.profiles ) {

            if (!name || name === '' || name.length === 0)
                continue;

            const schema: string = `${name}.schema.def.json`;
            const content = this.fetchValues(`profiles/${schema}`);
            const res = await this.http.requestWithRetry({
                method: 'POST',
                url: this.selfUrl + '/v1/steward/schema',
                data: content
            });
            Logger.log(`${schema} posted`, res.data);
        }
    }

    private async createCredentials() {
        for(const name of this.profiles ) {
            if (!name || name === '' || name.length === 0)
                continue;

            const credential: string = `${name}.cred.def.json`;
            const content = this.fetchValues(`profiles/${credential}`);
            const res = await this.http.requestWithRetry({
                method: 'POST',
                url: this.selfUrl + '/v1/issuer/cred-def',
                data: content
            });
            Logger.log(`${credential} posted`, res.data);
        }
    }

    private fetchValues(fileName: string) {
        const fileJson = JSON.parse(readFileSync(`/www/${fileName}`).toString());
        const envValues = {...fileJson.DEFAULT, ...fileJson[process.env.NODE_ENV]};
        return envValues;
    }

    private fetchNames(fileName: string): string[] {
        const data = readFileSync(`/www/${fileName}`).toString();
        Logger.log(`data read is`, data);
        return data.split('\n');
    }
}

(new SetupTDC()).run();
