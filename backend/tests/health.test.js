const request = require('supertest');
const app = require('../src/app');

describe('Health route', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
