import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabase(force: boolean = false) {
  // Check if seeding is needed or if force is true
  const providersCount = await prisma.provider.count();
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@leadflow.com' }
  });

  if (!force && providersCount > 0 && adminUser) {
    console.log('Database already has data. Skipping seeding.');
    return;
  }

  console.log('Seeding database...');

  if (force) {
    // Clean database first
    try {
      await prisma.duplicateLead.deleteMany({});
      await prisma.allocationLog.deleteMany({});
      await prisma.webhookLog.deleteMany({});
      await prisma.lead.deleteMany({});
      await prisma.paymentTransaction.deleteMany({});
      await prisma.provider.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.counter.deleteMany({});
      console.log('Cleaned database before seeding.');
    } catch (e) {
      console.error('Error cleaning database:', e);
    }
  }

  // Create admin user if not exists or if forced
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@leadflow.com' }
  });
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@leadflow.com',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('Admin user seeded: admin@leadflow.com / password123');
  }

  // Seed 8 Providers
  // Categories matching pools:
  // Service 1: Mandatory: Provider 1 | Pool: Provider 2, 3, 4
  // Service 2: Mandatory: Provider 5 | Pool: Provider 6, 7, 8
  // Service 3: Mandatory: Provider 1, 4 | Pool: Provider 2, 3, 5, 6, 7, 8
  const providersData = [
    { name: 'Provider 1', category: 'Service 1, Service 3', email: 'provider1@example.com', phone: '5551230001' },
    { name: 'Provider 2', category: 'Service 1, Service 3', email: 'provider2@example.com', phone: '5551230002' },
    { name: 'Provider 3', category: 'Service 1, Service 3', email: 'provider3@example.com', phone: '5551230003' },
    { name: 'Provider 4', category: 'Service 1, Service 3', email: 'provider4@example.com', phone: '5551230004' },
    { name: 'Provider 5', category: 'Service 2, Service 3', email: 'provider5@example.com', phone: '5551230005' },
    { name: 'Provider 6', category: 'Service 2, Service 3', email: 'provider6@example.com', phone: '5551230006' },
    { name: 'Provider 7', category: 'Service 2, Service 3', email: 'provider7@example.com', phone: '5551230007' },
    { name: 'Provider 8', category: 'Service 2, Service 3', email: 'provider8@example.com', phone: '5551230008' }
  ];

  for (const p of providersData) {
    const existingProvider = await prisma.provider.findFirst({
      where: { name: p.name }
    });
    if (!existingProvider) {
      await prisma.provider.create({
        data: {
          name: p.name,
          category: p.category,
          email: p.email,
          phone: p.phone,
          monthlyQuota: 10,
          allocatedThisMonth: 0,
          isMandatory: false, // We handle assignment logic in the allocation service
          isActive: true,
        }
      });
    }
  }

  // Initialize lead number counter if not exists
  const existingCounter = await prisma.counter.findUnique({
    where: { name: 'leadNumber' }
  });
  if (!existingCounter) {
    await prisma.counter.create({
      data: { name: 'leadNumber', value: 1000 }
    });
  }

  console.log('Seeding completed successfully.');
}
