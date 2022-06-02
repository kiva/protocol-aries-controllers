import request from 'supertest';
import { inspect } from 'util';

/**
 * Test the issuing and verifying of note credentials for mobile
 * These tests need the following setup scripts:
 *   prod_setup.sh
 * Note we're using the KIVA_CONTROLLER_URL for now until the routes have been added to the gateway
 */
describe('Full system issue and verify flows for note credentials', () => {
    let invitation: any;
    let kivaConnectionId: string;
    let presExId: string;

    const delayFunc = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    beforeAll(() => {
        jest.setTimeout(60000);
    });

    it('Start mobile connection to kiva agent', () => {
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/connection')
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
                kivaConnectionId = res.body.connection_id;
                invitation = res.body.invitation;
            });
    });

    // Note we're using the fsp agent to simulate a mobile agent, since an actual mobile agent isn't available for this test
    it('Mobile (aka FSP) agent receives fsp connection invite', async () => {
        await delayFunc(5000);
        const data = {
            invitation,
            alias: 'mobile-connection'
        };
        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v1/agent/accept-connection')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
            });
    });

    it('Check mobile connection', async () => {
        await delayFunc(5000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/connection/${kivaConnectionId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('response');
            });
    });

    it('Issue note credential for mobile', async () => {
        await delayFunc(5000);
        const data: any = {
            profile: 'note.cred.def.json',
            connectionId: kivaConnectionId,
            entityData : {
                code: 'uniquecode',
                value: '100',
                issued: '2020-12-21T19:11:21Z',
                expiry: '2022-12-21T19:11:21Z'
            }
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/issue')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('offer_sent');
                    expect(res.body.credential_exchange_id).toBeDefined();
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Initiate verify request', async () => {
        await delayFunc(5000);
        const data = {
            profile: 'note.proof.request.json',
            connectionId: kivaConnectionId,
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/verify')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('request_sent');
                    expect(res.body.presentation_exchange_id).toBeDefined();
                    presExId = res.body.presentation_exchange_id;
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Check presentation', async () => {
        if (!presExId) {
            return false;
        }
        await delayFunc(5000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/verify/${presExId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.presentation.requested_proof.revealed_attrs.value.raw).toBe('100');
            });
    });
});
