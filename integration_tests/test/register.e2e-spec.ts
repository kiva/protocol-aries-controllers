import request from 'supertest';
import { readFileSync } from 'fs';
import { inspect } from 'util';

/**
 * I want to log the response body on error so that we can better diagnose what's going on. It doesn't seem like there's an automatic way:
 * https://github.com/visionmedia/supertest/issues/12
 * So instead we manually add a catch statement to every test :(
 */
describe('Full system eKYC integration tests for ncra register flows', () => {
    let fingerprintRegister: string;
    let fingerprintKyc: string;
    let device: any;
    let voterId: number;
    let nationalId: string;
    let registerData: any;

    beforeAll(() => {
        // Note that the register endpoint expects images hex encoded, and the kyc endpoint base64
        fingerprintRegister = readFileSync('./images/fingerprint3.png').toString('hex');
        fingerprintKyc = readFileSync('./images/fingerprint3.png').toString('base64');
        voterId = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
        nationalId = `N${voterId.toString(10)}`;
        device = {
            FingerprintSensorSerialNumber: 'xyz123',
            TellerComputerUsername: 'testTeller',
        };
        registerData = {
            voterId,
            nationalId,
            firstName: 'First',
            middleName: 'Middle',
            lastName: 'Last',
            gender: 1,
            birthDate: '1955-11-12 00:00:00',
            phoneNumber: '+23276543210',
            motherFirstName: 'MotherFirst',
            motherLastName: 'MotherLast',
            fatherFirstName: 'FatherFirst',
            fatherLastName: 'FatherLast',
            occupation: 1,
            maritalStatus: 1,
            faceImage: '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a00000000',
            signatureImage: '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000584027fc25b1e2a000',
            birthPlace: 'Birth',
            residentialAddress: 'Res Address',
            permanentAddress: 'Perm Address',
            fingerprints: [
                {
                    image: fingerprintRegister,
                    position: 1,
                },
            ],
        };
        jest.setTimeout(60000); // The first request is slow as it needs to create the wallet and fingerprint templates
    });

    it('Register new user', () => {
        return request(process.env.NCRA_CONTROLLER_URL)
            .post('/v2/register')
            .send(registerData)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.success).toBe(true);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });

    it('KYC registered user', () => {
        const data = {
            position: 1,
            filters: {
                externalIds: {
                    sl_national_id: nationalId
                }
            },
            image: fingerprintKyc,
            device,
        };

        return request(process.env.FSP_CONTROLLER_URL)
            .post('/v2/kyc')
            .send(data)
            .expect((res) => {
                try {
                    expect(res.status).toBe(201);
                    expect(res.body.nationalId).toBe(nationalId);
                } catch (e) {
                    e.message = `${e.message as string}\nDetails: ${inspect(res.body as string)}`;
                    throw e;
                }
            });
    });
});
