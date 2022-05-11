import request from 'supertest';
import { inspect } from 'util';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

/**
 * Test the issuing and verifying of employee credentials for mobile
 * These tests need the following setup scripts:
 *   docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 *   docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 * Note we're using the KIVA_CONTROLLER_URL for now until the routes have been added to the gateway
 */
describe('Full system issue and verify flows for employee credentials', () => {
    let invitation: any;
    let kivaConnectionId: string;
    let credentialExchangeId: string;
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
        await delayFunc(1000);
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
        await delayFunc(1000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/connection/${kivaConnectionId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('response');
            });
    });

    it('Issue employee credential for mobile', async () => {
        await delayFunc(1000);
        const data: any = {
            profile: 'employee.cred.def.json',
            connectionId: kivaConnectionId,
            entityData : {
                firstName: 'First',
                lastName: 'Last',
                companyEmail: 'company@email.com',
                currentTitle: 'Engineer',
                team: 'Engineering',
                hireDate: '1420070400', // 1/1/2019
                officeLocation: 'Cloud',
                'photo~attach': '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
                type: 'Intern',
                endDate: '1605043300',
                phoneNumber: '+16282185460',
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
                    credentialExchangeId = res.body.credential_exchange_id;
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Initiate verify request for hire date before', async () => {
        await delayFunc(4000);
        const data = {
            profile: 'hiredate.before.proof.request.json',
            connectionId: kivaConnectionId,
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post(`/v2/api/verify`)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('request_sent');
                    expect(res.body.presentation_exchange_id).toBeDefined();
                    presExId = res.body.presentation_exchange_id;
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Check presentation hire date before', async () => {
        if (!presExId) {
            return false;
        }
        await delayFunc(4000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/verify/${presExId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.verified).toBe('true');
                expect(res.body.presentation.requested_proof.revealed_attrs.firstName.raw).toBe('First');
            });
    });

    it('Initiate verify request for hire date after Jan 1 2018', async () => {
        await delayFunc(100);
        const data = {
            profile: 'hiredate.after.proof.request.json',
            connectionId: kivaConnectionId,
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post(`/v2/api/verify`)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('request_sent');
                    expect(res.body.presentation_exchange_id).toBeDefined();
                    presExId = res.body.presentation_exchange_id;
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Check presentation hire date before Jan 1 2018', async () => {
        if (!presExId) {
            return false;
        }
        await delayFunc(4000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/verify/${presExId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.verified).toBe('false'); // false because hire date is before Jan 1 2018
                expect(res.body.presentation.requested_proof.revealed_attrs.firstName.raw).toBe('First');
            });
    });

    it('Check issuer\'s issued credential records', async () => {
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/records`)
            .expect(200)
            .expect((res) => {
                expect(res.body[0].entityData.firstName).toBe('First');
            });
    });

    it('Check revoke status before revoke', async () => {
        await delayFunc(100);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/revoke/state/${credentialExchangeId}`)
            .expect((res) => {
                try {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe('issued');
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Revoke Issued credential', async () => {
        await delayFunc(100);
        const data = {
            credentialExchangeId: credentialExchangeId,
            publish: true,
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post(`/v2/api/revoke`)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Check revoke status after revoke', async () => {
        await delayFunc(1000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/revoke/state/${credentialExchangeId}`)
            .expect((res) => {
                try {
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe('revoked');
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Initiate verify request second time', async () => {
        await delayFunc(1000);
        const data = {
            profile: 'employee.proof.request.json',
            connectionId: kivaConnectionId,
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post(`/v2/api/verify`)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.state).toBe('request_sent');
                    expect(res.body.presentation_exchange_id).toBeDefined();
                    presExId = res.body.presentation_exchange_id;
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Check presentation after revocation', async () => {
        if (!presExId) {
            return false;
        }
        await delayFunc(3000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .get(`/v2/api/verify/${presExId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.state).toBe('verified');
                expect(res.body.verified).toBe('false');
                expect(res.body.presentation.requested_proof.revealed_attrs.firstName.raw).toBe('First');
            });
    });

    it('Error case: AgentCallFailed', async () => {
        const data = {
            credentialExchangeId: credentialExchangeId + '1',
            publish: true,
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post(`/v2/api/revoke`)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.AGENT_CALL_FAILED);
                    expect(res.body.details.ex).toBeDefined();
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });
});
