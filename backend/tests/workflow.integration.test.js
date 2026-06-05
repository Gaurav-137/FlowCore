const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma/client');

describe('Workflow run integration', () => {
  let authToken;
  let workflowId;
  let webhookSecret = 'integration-test-secret';

  beforeAll(async () => {
    const email = `test-run-${Date.now()}@example.com`;
    const password = 'Password123!';
    const registerRes = await request(app).post('/auth/register').send({ email, password });
    authToken = registerRes.body.tokens?.accessToken;
    expect(authToken).toBeDefined();

    const workflowRes = await request(app)
      .post('/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Integration Workflow',
        description: 'A simple workflow for integration testing',
        nodes: [
          {
            type: 'condition',
            config: { left: 1, right: 1, operator: 'equals' }
          }
        ]
      });

    expect(workflowRes.status).toBe(201);
    workflowId = workflowRes.body.id;
    expect(workflowId).toBeDefined();

    await prisma.webhook.create({
      data: {
        workflowId,
        secret: webhookSecret,
        enabled: true
      }
    });
  });

  afterAll(async () => {
    try {
      if (workflowId) {
        await prisma.workflowRun.deleteMany({ where: { workflowId } });
        await prisma.workflow.delete({ where: { id: workflowId } });
      }
      await prisma.user.deleteMany({ where: { email: { contains: 'test-run-' } } });
    } catch (err) {
      console.warn('Cleanup failed', err.message);
    } finally {
      await prisma.$disconnect();
    }
  });

  it('creates a workflow run via webhook and returns the run id', async () => {
    const triggerRes = await request(app)
      .post(`/webhooks/${workflowId}/${webhookSecret}`)
      .send({ test: true });

    expect(triggerRes.status).toBe(202);
    expect(triggerRes.body.runId).toBeDefined();

    const runId = triggerRes.body.runId;
    const runRes = await request(app)
      .get(`/runs/${runId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(runRes.status).toBe(200);
    expect(runRes.body.id).toBe(runId);
    expect(runRes.body.workflowId).toBe(workflowId);
    expect(Array.isArray(runRes.body.nodeExecutions)).toBe(true);
  });
});
