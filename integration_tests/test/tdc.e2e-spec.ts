import request from 'supertest';
import { ProtocolUtility, randomHexString } from 'protocol-common';
import { Logger } from '@nestjs/common';

/**
 * The TDC test is a very specific test to make sure the pieces for the TDC work.
 *
 * These tests follow the demo tests.  The following information is from the demo test script:
 *
 * These tests are designed to be run after the following steps:
 *   docker-compose -f docker-compose.dep.yml up -d
 *   docker exec -it tdc-controller ts-node /www/src/scripts/setup.tdc.ts
 *   docker exec -it tdc-controller ts-node /www/src/scripts/setup.citizen.tdc.ts
 * Or alternatively to be run against a deployed k8s env
 */
describe('Full TDC integration tests for issue and verify flows', () => {
    let holderId: string;
    let holderApiKey: string;
    let tdcInvitation: any;
    let citizenConnectionId: string;
    let fspConnectionId: string;
    let fspTdcId: string;
    let troTdcId: string;
    let reportId: string;
    let oneTimeValue = randomHexString(32);
    const ariesGuardianUrl = 'http://localhost:3010';
    const fspControllerUrl = 'http://localhost:3013';
    const ariesGuardianApiKey = 'adminApiKey';
    const holderDid = 'XTv4YCzYj8jqZgL1wVMGGL';

    beforeAll(() => {
        holderApiKey = ariesGuardianApiKey;
        jest.setTimeout(60000);
    });

    it('Error: FSP sends invalid formatted connection id', async() => {
        let fakeConnectionId: string;
        await request(process.env.TDC_CONTROLLER_URL)
            .get('/v2/fsp/register/onetimekey')
            .expect(200)
            .expect((res) => {
                fakeConnectionId = res.text;
            });

        const data = {
            connectionId: 'fakeConnectionId',
            oneTimeKey: fakeConnectionId,
            tdcEndpoint: 'http://tdc-controller:3015'
        };

        return request(fspControllerUrl)
            .post('/v2/transaction/nonce')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(400);
                expect(res.body.code).toBe('ConnectionNotReady');
            });
    });

    it('Error: Citizen sends invalid formatted connection id', async() => {
        let fakeConnectionId: string;
        await request(process.env.TDC_CONTROLLER_URL)
            .get('/v2/fsp/register/onetimekey')
            .expect(200)
            .expect((res) => {
                fakeConnectionId = res.text;
            });

        const data = {
            connectionId: 'fakeConnectionId',
            oneTimeKey: fakeConnectionId
        };

        return request(process.env.TDC_CONTROLLER_URL)
            .post('/v2/register/onetimekey')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(400);
                expect(res.body.code).toBe('ConnectionNotReady');
            });
    });

    it('Error: FSP does not have Credit-Grant-Auth credential', async() => {
        let fakeConnectionId: string;
        await request(process.env.TDC_CONTROLLER_URL)
            .get('/v2/fsp/register/onetimekey')
            .expect(200)
            .expect((res) => {
                fakeConnectionId = res.text;
            });

        const data = {
            connectionId: fakeConnectionId,
            oneTimeKey: fakeConnectionId,
            tdcEndpoint: 'http://tdc-controller:3015'
        };

        return request(fspControllerUrl)
            .post('/v2/transaction/nonce')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(400);
                expect(res.body.code).toBe('ProofFailedVerification');
            });
    });

    it('Error: Citizen does not have Credit-Grant-Auth credential', async() => {
        let fakeConnectionId: string;
        await request(process.env.TDC_CONTROLLER_URL)
            .get('/v2/fsp/register/onetimekey')
            .expect(200)
            .expect((res) => {
                fakeConnectionId = res.text;
            });

        const data = {
            connectionId: fakeConnectionId,
            oneTimeKey: fakeConnectionId,
        };

        return request(process.env.TDC_CONTROLLER_URL)
            .post('/v2/register/onetimekey')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(400);
                expect(res.body.code).toBe('ProofFailedVerification');
            });
    });

    it('Error: Connection does not exist for FSP on transaction', async() => {
        const data = {
            fspId: 'invalid',
            date: '1/1/2021',
            eventJson: 'extraData',
            typeId: 'payment',
            subjectId: '123456789',
            amount: '500.00',
            tdcEndpoint: 'http://tdc-controller:3015',
            fspHash: 'hashValue',
        };
        return request(fspControllerUrl)
            .post('/v2/transaction/create')
            .send(data)
            .expect(400)
            .expect((res) => {
                expect(res.body.code).toBe('InvalidBackendOperation');
            });
    });

    it('Error: Connection does not exist for FSP on get report', async() => {
        let fakeConnectionId: string;
        await request(process.env.TDC_CONTROLLER_URL)
            .get('/v2/fsp/register/onetimekey')
            .expect(200)
            .expect((res) => {
                fakeConnectionId = res.text;
            });

        const data = {
            fspTdcId: fakeConnectionId,
            troTdcId: fakeConnectionId,
            tdcEndpoint: 'http://tdc-controller:3015'
        };

        return request(fspControllerUrl)
            .post('/v2/transaction/report')
            .send(data)
            .expect(400)
            .expect((res) => {
                expect(res.body.code).toBe('InvalidBackendOperation');
            });
    });

    it('Get onetime value from TDC', async () => {
        return request(process.env.TDC_CONTROLLER_URL)
            .get('/v2/fsp/register/onetimekey')
            .expect(200)
            .expect((res) => {
                oneTimeValue = res.text;
            });
    });

    it('Get connection invite to tdc agent', () => {
        return request(process.env.TDC_CONTROLLER_URL)
            .post('/v1/agent/connection/')
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
                tdcInvitation = res.body.invitation;
            });
    });

    it('Spin up citizen agent in agency (holder)', async () => {
        const data = {
            agentId: 'citizen',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: holderApiKey,
            seed: '000000000000000000000000Steward1',
            did: holderDid
        };
        return request(ariesGuardianUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                holderId = res.body.agentId;
            });
    });

    it('TDC connects to citizen', async () => {
        const data = {
            alias: holderId,
            identityProfileId: 'citizen.identity',
            invitation: tdcInvitation
        };

        return request(process.env.TDC_CONTROLLER_URL)
            .post('/v2/register')
            // .set('x-api-key', holderApiKey)
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                citizenConnectionId = res.body.connectionData.connection_id;
                expect(citizenConnectionId).toBeDefined();
            });
    });

    it('FSP makes connection to TDC', async () => {
        const data = {
            tdcPrefix: 'TDC',
            tdcEndpoint: 'http://tdc-controller:3015'
        };
        return request(fspControllerUrl)
            .post('/v2/transaction/register')
            .send(data)
            .expect(201)
            .expect((res) => {
                fspConnectionId = res.body.connectionData.connection_id;
            });
    });

    it('FSP sends one time data to TDC', async () =>{
        await ProtocolUtility.delay(5000);
        const data = {
            connectionId: fspConnectionId,
            oneTimeKey: oneTimeValue,
            tdcEndpoint: 'http://tdc-controller:3015'
        };
        return request(fspControllerUrl)
            .post('/v2/transaction/nonce')
            // .set('x-api-key', holderApiKey)
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
            });
    });

    it('Citizen sends one time data to TDC', async () =>{
        await ProtocolUtility.delay(10000);
        const data = {
            connectionId: citizenConnectionId,
            oneTimeKey: oneTimeValue
        };
        return request(process.env.TDC_CONTROLLER_URL)
            .post('/v2/register/onetimekey')
            // .set('x-api-key', holderApiKey)
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                troTdcId = res.body.tdcTroId;
                fspTdcId = res.body.tdcFspId;
            });
    });

    it('FSP makes transaction report request', async () => {
        await ProtocolUtility.delay(5000);
        const data = {
            fspTdcId,
            troTdcId,
            tdcEndpoint: 'http://tdc-controller:3015'
        };
        return request(fspControllerUrl)
            .post('/v2/transaction/report')
            // .set('x-api-key', holderApiKey)
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                reportId = res.body.reportId;
            });
    });

    it('FSP retrieves invalid transaction report', async () => {
        return request(fspControllerUrl)
            .get('/v2/transaction/report/invalidId/status')
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.state).toBe('error');
            });
    });

    it('FSP pulls empty transaction report', async () => {
        await ProtocolUtility.delay(20000);
        return request(fspControllerUrl)
            .get(`/v2/transaction/report/${reportId}/status`)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.state).toBe('error');
                Logger.log(`/v2/transaction/report/${reportId}/status data`, res.body);
            });
    });

    it('Spin down citizen agent 1', () => {
        const data = {
            agentId: holderId
        };
        return request(ariesGuardianUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });

});
