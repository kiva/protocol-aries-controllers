import request from 'supertest';
import { inspect } from 'util';
import { readFileSync } from 'fs';
import { ProtocolErrorCode } from 'protocol-common';

/**
 * Test the issuing and verifying of employee credentials for guardianship
 * These tests need the following setup scripts:
 *   docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 *   docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 * Note we're using the KIVA_CONTROLLER_URL for now until the routes have been added to the gateway
 */
describe('Full system issue and verify flows for employee credentials', () => {
    let email: string;
    let fingerprintEnroll: string;
    let fingerprintVerify: string;
    let credExId: string;
    const phoneNumber = '+16282185460'; // Test twilio number
    const photo = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000';

    const delayFunc = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    beforeAll(() => {
        // Note that the register endpoint expects images hex encoded, and the kyc endpoint base64
        fingerprintEnroll = readFileSync('./images/fingerprint.png').toString('hex');
        fingerprintVerify = readFileSync('./images/fingerprint.png').toString('base64');
        // We use email as the employees unique identifier so needs to be unique
        // This gives us a predictable and unique exact 7 digits that doesn't start with 0
        const id = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10);
        email = `company${id}@email.com`;
        jest.setTimeout(60000);
    });

    it('Enroll employee in guardianship', async () => {
        await delayFunc(5000);
        const data: any = {
            guardianData: [{
                pluginType: 'FINGERPRINT',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params:
                    {
                        image: fingerprintEnroll,
                        position: '1',
                        type_id: '1',
                        capture_date: '2021-04-05T13:22:59.000Z',
                        missing_code: null,
                    },
            }]
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/enroll')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.id).toBeDefined();
                    expect(res.body.connectionData).toBeDefined();
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Error case: ProofFailedUnfulfilled', async () => {
        await delayFunc(1000);
        const data = {
            profile: 'employee.proof.request.json',
            guardianData: {
                pluginType: 'FINGERPRINT',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params: {
                    image: fingerprintVerify,
                    position: 1,
                },
            },
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/verify')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.PROOF_FAILED_UNFULFILLED);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Issue employee credential', async () => {
        await delayFunc(5000);
        const data: any = {
            profile: 'employee.cred.def.json',
            guardianVerifyData: {
                pluginType: 'FINGERPRINT',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params: {
                    image: fingerprintVerify,
                    position: 1,
                },
            },
            entityData : {
                firstName: 'First',
                lastName: 'Last',
                companyEmail: email,
                currentTitle: 'Engineer',
                team: 'Engineering',
                hireDate: '1420070400', // 1/1/2015
                officeLocation: 'Cloud',
                'photo~attach': photo,
                type: 'Staff',
                endDate: '',
                phoneNumber
            }
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/issue')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.agentId).toBeDefined();
                    expect(res.body.agentData.credential_exchange_id).toBeDefined();
                    credExId = res.body.agentData.credential_exchange_id;
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Verify employee in guardianship', async () => {
        await delayFunc(1000);
        const data = {
            profile: 'kiva.employee.proof.request.json',
            guardianData: {
                pluginType: 'FINGERPRINT',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params: {
                    image: fingerprintVerify,
                    position: 1,
                },
            },
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/verify')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.companyEmail).toBe(email);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Revoke credential in guardianship', async () => {
        await delayFunc(100);
        const data = {
            credentialExchangeId: credExId,
            publish: true
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/revoke')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Error case: ProofFailedVerification', async () => {
        await delayFunc(1000);
        const data = {
            profile: 'employee.proof.request.json',
            guardianData: {
                pluginType: 'FINGERPRINT',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params: {
                    image: fingerprintVerify,
                    position: 1,
                },
            },
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/verify')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.PROOF_FAILED_VERIFICATION);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    // TODO ProofFailedNoResponse: There's not a great way to test this error case, it's more of a catch all for when there's an issue with the
    //  holder's agent
});
