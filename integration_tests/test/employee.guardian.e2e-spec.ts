import request from 'supertest';
import { inspect } from 'util';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode'

/**
 * Test the issuing and verifying of employee credentials for guardianship
 * These tests need the following setup scripts:
 *   docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
 *   docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
 * Note we're using the KIVA_CONTROLLER_URL for now until the routes have been added to the gateway
 */
describe('Full system issue and verify flows for employee credentials', () => {
    let email: string;
    let data: any;
    const phoneNumber = '+16282185460'; // Test twilio number

    const delayFunc = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    beforeAll(() => {
        // We use email as the employees unique identifier so needs to be unique
        const id = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
        email = `company${id}@email.com`;
        data = {
            profile: 'employee.cred.def.json',
            guardianData: [{
                pluginType: 'SMS_OTP',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params: {
                    phoneNumber
                },

            }],
            entityData : {
                firstName: 'First',
                lastName: 'Last',
                companyEmail: email,
                currentTitle: 'Engineer',
                team: 'Engineering',
                hireDate: '1420070400', // 1/1/2015
                officeLocation: 'Cloud',
                'photo~attach': '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
                type: 'Staff',
                endDate: '',
                phoneNumber
            }
        };
        jest.setTimeout(60000);
    });

    it('Onboard employee and issue credential', async () => {
        await delayFunc(5000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/onboard')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.agentId).toBeDefined();
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Verify employee in guardianship', async () => {
        await delayFunc(1000);
        const data = {
            profile: 'employee.proof.request.json',
            guardianData: {
                pluginType: 'SMS_OTP',
                filters: {
                    externalIds: {
                        companyEmail: email
                    }
                },
                params: {
                    phoneNumber
                },
            },
        };
        return request(process.env.KIVA_CONTROLLER_URL)
            .post(`/v2/api/guardian/verify`)
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.status).toBe('sent');
                } catch (e) {
                    e.message = e.message + '\nDetails: ' + inspect(res.body);
                    throw e;
                }
            });
    });

    it('Calling onboard for existing entity succeeds', async () => {
        await delayFunc(5000);
        return request(process.env.KIVA_CONTROLLER_URL)
            .post('/v2/api/guardian/onboard')
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
});
