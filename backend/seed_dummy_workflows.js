const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy workflows...');

  // 1. Get or create a default user
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log('No users found in database. Creating default user admin@flowcore.io...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    user = await prisma.user.create({
      data: {
        email: 'admin@flowcore.io',
        passwordHash,
        role: 'admin'
      }
    });
    console.log(`Created default user: ${user.email} (id: ${user.id})`);
  } else {
    console.log(`Using existing user: ${user.email} (id: ${user.id})`);
  }

  const userId = user.id;

  // 2. Define 5 workflows
  const dummyWorkflows = [
    {
      name: 'Stripe Webhook Alert Sync',
      description: 'Receive charge webhook notifications from Stripe and forward them to a Slack channel.',
      status: 'ACTIVE',
      version: 1,
      nodes: [
        { type: 'webhook', label: 'Stripe webhook', config: { secret: 'stripe_charge_secret' }, positionX: 100, positionY: 200 },
        { type: 'httpRequest', label: 'Query Stripe API', config: { method: 'GET', url: 'https://api.stripe.com/v1/charges/{{$json.body.id}}' }, positionX: 420, positionY: 200 },
        { type: 'notify', label: 'Slack Notify', config: { type: 'slack', webhookUrl: 'https://hooks.slack.com/services/test-url', text: 'Charge processed: {{$json.data.amount}} USD' }, positionX: 740, positionY: 200 }
      ],
      edges: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 1, targetIdx: 2 }
      ]
    },
    {
      name: 'Daily DB Backup Scheduler',
      description: 'Trigger daily database backups and send reporting alerts to the operations team.',
      status: 'ACTIVE',
      version: 1,
      nodes: [
        { type: 'schedule', label: 'Every 24h cron', config: { cronExpression: '0 0 * * *' }, positionX: 100, positionY: 200 },
        { type: 'code', label: 'Compile Backup Log', config: { jsCode: 'return { json: { status: "ready", dumpName: `backup-${Date.now()}.sql` } };' }, positionX: 420, positionY: 200 },
        { type: 'httpRequest', label: 'Post Backup Payload', config: { method: 'POST', url: 'https://backup-server.internal/upload' }, positionX: 740, positionY: 200 }
      ],
      edges: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 1, targetIdx: 2 }
      ]
    },
    {
      name: 'Hubspot Leads Status Filter',
      description: 'Check Hubspot contact lead statuses and dispatch conditional slack alerts.',
      status: 'DRAFT',
      version: 1,
      nodes: [
        { type: 'webhook', label: 'Hubspot Lead Trigger', config: { secret: 'hubspot_lead_secret' }, positionX: 100, positionY: 200 },
        { type: 'if', label: 'Is Lead Valid?', config: { conditions: { leftValue: '{{$json.body.status}}', operator: 'equals', rightValue: 'qualified' } }, positionX: 420, positionY: 200 },
        { type: 'notify', label: 'Alert Sales Team', config: { type: 'slack', webhookUrl: 'https://hooks.slack.com/services/sales', text: 'New qualified lead ready!' }, positionX: 740, positionY: 100 },
        { type: 'delay', label: 'Wait 1 Hour', config: { value: 1, unit: 'hours' }, positionX: 740, positionY: 300 }
      ],
      edges: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 1, targetIdx: 2, sourceOutput: 0 },
        { sourceIdx: 1, targetIdx: 3, sourceOutput: 1 }
      ]
    },
    {
      name: 'Daily System Status Reporter',
      description: 'Aggregate operations logs from system databases and dispatch weekly status briefs.',
      status: 'ACTIVE',
      version: 1,
      nodes: [
        { type: 'schedule', label: 'Daily cron check', config: { cronExpression: '0 8 * * *' }, positionX: 100, positionY: 200 },
        { type: 'postgres', label: 'Get Health Logs', config: { operation: 'executeQuery', query: 'SELECT * FROM health_logs LIMIT 10;' }, positionX: 420, positionY: 200 },
        { type: 'notify', label: 'Email Report', config: { type: 'email', to: 'devops@firm.com', subject: 'System Health Report' }, positionX: 740, positionY: 200 }
      ],
      edges: [
        { sourceIdx: 0, targetIdx: 1 },
        { sourceIdx: 1, targetIdx: 2 }
      ]
    },
    {
      name: 'IMAP Incoming Auto-Responder',
      description: 'Monitor incoming IMAP inbox folders and reply immediately using auto-acknowledgements.',
      status: 'INACTIVE',
      version: 1,
      nodes: [
        { type: 'emailImap', label: 'Poll IMAP INBOX', config: { mailbox: 'INBOX', limit: 5 }, positionX: 100, positionY: 200 },
        { type: 'respondToWebhook', label: 'Acknowledge Mail', config: { responseCode: 200, responseBody: '{"status": "received"}' }, positionX: 420, positionY: 200 }
      ],
      edges: [
        { sourceIdx: 0, targetIdx: 1 }
      ]
    }
  ];

  // 3. Create workflows in database
  for (const wf of dummyWorkflows) {
    // Check if workflow already exists to prevent duplicate seeding
    const existing = await prisma.workflow.findFirst({
      where: { name: wf.name, userId }
    });

    if (existing) {
      console.log(`Workflow already exists: "${wf.name}". Skipping.`);
      continue;
    }

    const created = await prisma.workflow.create({
      data: {
        userId,
        name: wf.name,
        description: wf.description,
        status: wf.status,
        version: wf.version,
        nodes: {
          create: wf.nodes.map(n => ({
            type: n.type,
            label: n.label,
            config: n.config,
            positionX: n.positionX,
            positionY: n.positionY
          }))
        }
      },
      include: { nodes: true }
    });

    // Create edges using the DB node IDs
    if (wf.edges && wf.edges.length > 0) {
      const edgesData = wf.edges.map(e => ({
        workflowId: created.id,
        sourceNodeId: created.nodes[e.sourceIdx].id,
        targetNodeId: created.nodes[e.targetIdx].id,
        sourceOutput: e.sourceOutput !== undefined ? e.sourceOutput : 0,
        targetInput: e.targetInput !== undefined ? e.targetInput : 0
      }));

      await prisma.workflowEdge.createMany({
        data: edgesData
      });
    }

    console.log(`Created dummy workflow: "${created.name}"`);
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding dummy workflows:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
