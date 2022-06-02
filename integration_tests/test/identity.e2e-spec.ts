import request from 'supertest';
import { readFileSync } from 'fs';
import { inspect } from 'util';
import { ProtocolErrorCode } from 'protocol-common';

/**
 * I want to log the response body on error so that we can better diagnose what's going on. It doesn't seem like there's an automatic way:
 * https://github.com/visionmedia/supertest/issues/12
 * So instead we manually add a catch statement to every test :(
 */
describe('Full system integration tests for eKYC flows', () => {
    let fingerprint1: string;
    let fingerprint2: string;
    let device: any;

    beforeAll(() => {
        fingerprint1 = readFileSync('./images/fingerprint1.png').toString('base64');
        fingerprint2 = readFileSync('./images/fingerprint2.png').toString('base64');
        device = {
            FingerprintSensorSerialNumber: 'xyz123',
            TellerComputerUsername: 'testTeller',
        };

        jest.setTimeout(60000); // The first request is slow as it needs to create the wallet and fingerprint templates
    });

    it('KYC endpoint, wallet already created', () => {
        const data = {
            position: 1,
            filters: {
                externalIds: {
                    sl_national_id: 'NIN00001'
                }
            },
            image: fingerprint1,
            device,
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.nationalId).toBe('NIN00001');
                    expect(res.body.voterId).toBe('1000001');
                    expect(res.body.nationalIssueDate).toBeDefined();
                    expect(res.body.voterIssueDate).toBeDefined();
                    expect(res.body.firstName).toBe('MOHAMED');
                    expect(res.body.middleName).toBe('TAMBA');
                    expect(res.body.lastName).toBe('KAMARA');
                    expect(res.body.gender).toBe('MALE');
                    expect(res.body.birthDate).toBe('1956-10-22T00:00:00.000Z');
                    expect(res.body.birthPlace).toBe('Brookfield\'s, West, Western Area Urban');
                    expect(res.body.residentialAddress).toBe('Mochatiamama, Kagboro, Moyamba');
                    expect(res.body.permanentAddress).toBe('Mochatiamama, Kagboro, Moyamba');
                    expect(res.body.phoneNumber).toBe('76543211');
                    expect(res.body.motherFirstName).toBe('MAMA');
                    expect(res.body.motherLastName).toBe('KAMARA');
                    expect(res.body.fatherFirstName).toBe('PAPA');
                    expect(res.body.fatherLastName).toBe('KAMARA');
                    expect(res.body.occupation).toBe('ADMINISTRATIVE ASSISTANT');
                    expect(res.body.maritalStatus).toBe('Marriage');

                    let attached = res.body['photo~attach'];
                    expect(attached).toBeDefined();
                    expect(attached.length).toBe(49308);
                    attached = res.body['signature~attach'];
                    expect(attached).toBeDefined();

                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    // TODO I don't think we're going to support on-demand wallet creation in our new architecture, need to discuss
    // TODO I also don't know about requested attribute support, I think we will just have pre-defined proofs
    it('KYC endpoint, on-demand wallet creation, attributes set', () => {
        const data = {
            position: 1,
            filters: {
                externalIds: {
                    sl_national_id: 'NIN00002'
                }
            },
            image: fingerprint2,
            device,
            requestedAttributes: [
                'nationalId',
                'firstName',
                'photo~attach',
            ],
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.nationalId).toBe('NIN00002');
                    expect(res.body.firstName).toBe('FATIMA');
                    const photoAttach = res.body['photo~attach'];
                    expect(photoAttach).not.toBeNull();
                    // expect(res.body.lastName).toBeUndefined();
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('KYC endpoint, search params', () => {
        const data = {
            position: 1,
            search: {
                firstName: 'FATIMA',
                lastName: 'BANGURA',
                mothersFirstName: 'MAMA',
                fathersFirstName: 'PAPA',
            },
            image: fingerprint2,
            device,
            requestedAttributes: [
                'nationalId',
            ],
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.nationalId).toBe('NIN00002');
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    // This test relies on a second citizen with the same first/last/birth but different fingerprints (2-insert-test-data.sql)
    it('KYC endpoint, search params with double match', () => {
        const data = {
            position: 1,
            search: {
                firstName: 'MOHAMED',
                lastName: 'KAMARA',
                birthDate: '1956-10-22',
            },
            image: fingerprint1,
            device,
            requestedAttributes: [
                'nationalId',
            ],
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.nationalId).toBe('NIN00001');
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('KYC SMS endpoint, sms sent', () => {
        const data = {
            filters: {
                externalIds: {
                    sl_national_id: 'NIN00001'
                }
            },
            device,
            phoneNumber: '+23276543211',
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc/sms')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.status).toBe('sent');
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    // // Error cases

    it('Fail KYC endpoint missing input', () => {
        const data = {
            filters: {
                externalIds: {
                    sl_national_id: 'NIN00002'
                }
            },
            image: fingerprint2,
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.VALIDATION_EXCEPTION);
                    expect(res.body.details[0].property).toBe('position');
                    expect(res.body.details[1].property).toBe('device');
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('Fail KYC endpoint bad input', () => {
        const data = {
            position: 1,
            filters: {
                externalIds: {
                    garbage: 'NIN00002'
                }
            },
            image: fingerprint2,
            device,
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.NO_CITIZEN_FOUND);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('KYC endpoint, search params failure not found', () => {
        const data = {
            position: 1,
            search: {
                firstName: 'FATIMA',
                lastName: 'BANGURA',
                birthDate: '1982-07-04',
            },
            image: fingerprint2,
            device,
            requestedAttributes: [
                'nationalId',
            ],
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.NO_CITIZEN_FOUND);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    // @tothink because this is an integration test there's no good way to mock the otp value, so we just verify it fails
    it('KYC endpoint, otp failed', () => {
        const data = {
            filters: {
                externalIds: {
                    sl_national_id: 'NIN00001'
                }
            },
            device,
            otp: 123456,
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc/sms')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(400);
                    expect(res.body.code).toBe(ProtocolErrorCode.OTP_NO_MATCH);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

});
