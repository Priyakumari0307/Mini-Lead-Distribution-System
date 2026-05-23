import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

describe('Prowider Mini Lead Distribution System Integration Tests', () => {
  let adminToken = '';
  let salesToken = '';
  const providerIds: Record<string, string> = {};

  beforeAll(async () => {
    // 1. Connect to database
    await prisma.$connect();

    // 2. Database cleanup
    await prisma.paymentTransaction.deleteMany({});
    await prisma.duplicateLead.deleteMany({});
    await prisma.webhookLog.deleteMany({});
    await prisma.allocationLog.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.counter.deleteMany({});
    await prisma.counter.create({
      data: { name: 'leadNumber', value: 1000 }
    });

    // 3. Register and Login Admin
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'System Admin',
        email: 'admin@leadflow.com',
        password: 'password123',
        role: 'ADMIN',
      });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@leadflow.com',
        password: 'password123',
      });
    adminToken = `Bearer ${adminLoginRes.body.data.token}`;

    // 4. Register and Login Sales
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sales Rep',
        email: 'sales@leadflow.com',
        password: 'password123',
        role: 'SALES',
      });

    const salesLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sales@leadflow.com',
        password: 'password123',
      });
    salesToken = `Bearer ${salesLoginRes.body.data.token}`;

    // 5. Create Providers 1 to 8 as required by the rules
    // Service 1: Mandatory: Provider 1 | Pool: Provider 2, 3, 4
    // Service 2: Mandatory: Provider 5 | Pool: Provider 6, 7, 8
    // Service 3: Mandatory: Provider 1, 4 | Pool: Provider 2, 3, 5, 6, 7, 8
    for (let i = 1; i <= 8; i++) {
      let categories = '';
      if (i === 1) categories = 'Service 1, Service 3';
      else if (i === 2 || i === 3) categories = 'Service 1, Service 3';
      else if (i === 4) categories = 'Service 1, Service 3';
      else if (i === 5) categories = 'Service 2, Service 3';
      else if (i === 6 || i === 7 || i === 8) categories = 'Service 2, Service 3';

      const provRes = await request(app)
        .post('/api/providers')
        .set('Authorization', adminToken)
        .send({
          name: `Provider ${i}`,
          category: categories,
          monthlyQuota: 10,
          email: `provider${i}@leadflow.com`,
          phone: `987654320${i}`,
          isActive: true
        });

      providerIds[`Provider ${i}`] = provRes.body.data.id;
    }
  }, 90000);

  afterAll(async () => {
    // Disconnect prisma client
    await prisma.$disconnect();
  });

  describe('1. Authentication & RBAC Checks', () => {
    it('should block anonymous requests to protected provider routes', async () => {
      const res = await request(app).get('/api/providers');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block SALES user from creating a provider (RBAC check)', async () => {
      const res = await request(app)
        .post('/api/providers')
        .set('Authorization', salesToken)
        .send({
          name: 'Unauthorized Provider',
          category: 'Service 1',
          monthlyQuota: 10,
          email: 'unauth@leadflow.com',
          phone: '9999999999',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('2. Lead Routing Allocation Rules (3-Provider Allocation)', () => {
    it('should route Service 1 to Provider 1 (mandatory) and two pool providers fairly sorted by alphabetical tie-breaker initially', async () => {
      // First submission for Service 1
      const res = await request(app)
        .post('/api/leads')
        .send({
          customerName: 'Alice Customer',
          phone: '9811111111',
          email: 'alice@gmail.com',
          category: 'Service 1',
          location: 'Delhi',
          description: 'Plumbing repair service 1',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ALLOCATED');
      
      const lead = await prisma.lead.findUnique({
        where: { id: res.body.data.id },
        include: { providers: true }
      });
      
      expect(lead?.providers.length).toBe(3);
      
      // Mandatory Provider 1 must be present
      const providerNames = lead?.providers.map(p => p.name) || [];
      expect(providerNames).toContain('Provider 1');
      
      // Pools for Service 1 are Provider 2, Provider 3, Provider 4.
      // With 0 allocations, they are sorted alphabetically: Provider 2, Provider 3.
      expect(providerNames).toContain('Provider 2');
      expect(providerNames).toContain('Provider 3');
      expect(providerNames).not.toContain('Provider 4');
    });

    it('should apply fair round-robin rotation sorting on subsequent Service 1 submissions', async () => {
      // Current allocations:
      // Provider 1: 1 (mandatory)
      // Provider 2: 1
      // Provider 3: 1
      // Provider 4: 0
      
      // Next submission for Service 1 should assign Provider 1 (mandatory)
      // and from pool [Provider 2, 3, 4], Provider 4 (allocation=0) must be picked first.
      // Next, between Provider 2 (allocation=1) and Provider 3 (allocation=1), Provider 2 should be picked
      // because it was allocated earlier or by alphabetical order. Let's check what is picked.
      const res = await request(app)
        .post('/api/leads')
        .send({
          customerName: 'Bob Customer',
          phone: '9822222222',
          email: 'bob@gmail.com',
          category: 'Service 1',
          location: 'Delhi',
          description: 'Plumbing repair service 1',
        });

      expect(res.status).toBe(201);
      const lead = await prisma.lead.findUnique({
        where: { id: res.body.data.id },
        include: { providers: true }
      });
      
      expect(lead?.providers.length).toBe(3);
      const providerNames = lead?.providers.map(p => p.name) || [];
      
      expect(providerNames).toContain('Provider 1');
      expect(providerNames).toContain('Provider 4'); // Had 0 allocations, must be selected!
    });
  });

  describe('3. Database-Level Unique Constraint', () => {
    it('should reject duplicate leads with the same phone and category, returning 409 Conflict', async () => {
      // Alice Customer submitted for 'Service 1' with '9811111111' in previous test.
      // Try to submit the same phone and category again.
      const res = await request(app)
        .post('/api/leads')
        .send({
          customerName: 'Alice Duplicate Submission',
          phone: '9811111111',
          email: 'alice.dup@gmail.com',
          category: 'Service 1',
          location: 'Delhi',
          description: 'Plumbing repair duplicate request',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Duplicate submission');

      // Verify that no new lead was created
      const duplicateLeads = await prisma.lead.findMany({
        where: {
          phone: '9811111111',
          category: 'Service 1'
        }
      });
      expect(duplicateLeads.length).toBe(1); // Only the original one exists!
    });
  });

  describe('4. Quota Enforcement & Pending Rollback', () => {
    it('should roll back allocation and leave lead in PENDING if exactly 3 eligible providers are not found', async () => {
      // Exhaust quotas of Providers 2, 3, and 4 to 10/10 so they are no longer eligible for Service 1.
      await prisma.provider.updateMany({
        where: { name: { in: ['Provider 2', 'Provider 3', 'Provider 4'] } },
        data: { allocatedThisMonth: 10 }
      });

      // Submit a new lead for Service 1.
      // Mandatory: Provider 1 (has quota)
      // Pool: Provider 2, 3, 4 (all exhausted, quota = 10)
      // Available providers: only Provider 1. We cannot find exactly 3!
      const res = await request(app)
        .post('/api/leads')
        .send({
          customerName: 'Charlie Customer',
          phone: '9833333333',
          email: 'charlie@gmail.com',
          category: 'Service 1',
          location: 'Delhi',
          description: 'No providers left test',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.providerIds.length).toBe(0);

      // Verify the lead has status PENDING in database
      const lead = await prisma.lead.findUnique({
        where: { id: res.body.data.id }
      });
      expect(lead?.status).toBe('PENDING');
    });
  });

  describe('5. Payment Webhook for Quota Reset & Idempotency', () => {
    it('should reset quota to 0 via payment webhook and enforce transaction-level idempotency', async () => {
      const p2Id = providerIds['Provider 2'];
      const txnId = `TEST-TXN-12345`;

      // 1. Reset quota of Provider 2 (currently at 10)
      const res1 = await request(app)
        .post('/api/webhooks/payment')
        .send({
          providerId: p2Id,
          transactionId: txnId
        });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const p2 = await prisma.provider.findUnique({ where: { id: p2Id } });
      expect(p2?.allocatedThisMonth).toBe(0);

      // 2. Submit same payment webhook again to verify idempotency (it should return 200 but not insert/throw error)
      const res2 = await request(app)
        .post('/api/webhooks/payment')
        .send({
          providerId: p2Id,
          transactionId: txnId
        });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.duplicate).toBe(true); // Flag to check duplicate transaction
    });
  });

  describe('6. Concurrency Safety Test', () => {
    it('should handle concurrent submissions without race conditions or double allocations', async () => {
      // Clear previous leads and logs to isolate concurrency test
      await prisma.duplicateLead.deleteMany({});
      await prisma.webhookLog.deleteMany({});
      await prisma.allocationLog.deleteMany({});
      await prisma.lead.deleteMany({});

      // Let's reset all providers monthly quotas to 0
      await prisma.provider.updateMany({
        data: { allocatedThisMonth: 0 }
      });

      // Submit 10 concurrent requests to Service 1
      // Pool size for Service 1 is Provider 1 (mandatory) and [Provider 2, 3, 4]
      // Provider 1 will receive 10 allocations.
      // Pool [Provider 2, 3, 4] will receive 20 allocations total (2 per lead).
      // Since quota is 10 per provider, the maximum total leads we can allocate is 10,
      // because Provider 1 can only take 10 leads, and it's mandatory.
      // If we submit 12 leads concurrently, the first 10 should be ALLOCATED, and the next 2 should remain PENDING!
      
      const concurrentRequests = Array.from({ length: 12 }).map((_, i) => {
        return request(app)
          .post('/api/leads')
          .send({
            customerName: `Concurrent Customer ${i + 1}`,
            phone: `989999990${i}`,
            email: `concurrent${i}@test.com`,
            category: 'Service 1',
            location: 'Delhi',
            description: 'Concurrency test request',
          });
      });

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should respond successfully
      responses.forEach(res => {
        expect(res.status).toBe(201);
      });

      // Wait a moment for database state to settle
      const leads = await prisma.lead.findMany({
        where: { category: 'Service 1' },
      });

      const allocatedLeads = leads.filter(l => l.status === 'ALLOCATED');
      const pendingLeads = leads.filter(l => l.status === 'PENDING');

      // 10 leads should be allocated because Provider 1 quota maxes out at 10.
      // The remaining leads should stay PENDING.
      expect(allocatedLeads.length).toBe(10);
      expect(pendingLeads.length).toBe(2);

      // Verify Provider 1 quota has exactly 10 allocations
      const p1 = await prisma.provider.findFirst({ where: { name: 'Provider 1' } });
      expect(p1?.allocatedThisMonth).toBe(10);
    }, 90000);
  });
});
