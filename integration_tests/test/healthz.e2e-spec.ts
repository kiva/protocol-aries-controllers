import request from 'supertest';

/**
 * Integration test for our app, this ensures that the production docker image was built correctly
 * This expects the docker containers to be running and return a healthy response
 */
describe('Prod integration test', () => {

    it('Kiva Controller up', () => {
        return request('http://localhost:3011')
        .get('/healthz')
        .expect(200);
    });

    it('NCRA Controller up', () => {
        return request('http://localhost:3012')
        .get('/healthz')
        .expect(200);
    });

    it('FSP Controller up', () => {
        return request('http://localhost:3013')
        .get('/healthz')
        .expect(200);
    });

    it('TDC Controller up', () => {
        return request('http://localhost:3015')
        .get('/healthz')
        .expect(200);
    });
});
