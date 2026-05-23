import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning database...');
  try {
    // Delete duplicate-related models first due to potential relations or simply to clear them
    try {
      await (prisma as any).duplicateLead.deleteMany({});
    } catch (e) {
      console.log('DuplicateLead table not found or failed to clear:', e);
    }

    try {
      await (prisma as any).allocationLog.deleteMany({});
    } catch (e) {
      console.log('AllocationLog table not found or failed to clear:', e);
    }

    try {
      await (prisma as any).webhookLog.deleteMany({});
    } catch (e) {
      console.log('WebhookLog table not found or failed to clear:', e);
    }

    try {
      await prisma.lead.deleteMany({});
      console.log('Leads cleared successfully.');
    } catch (e) {
      console.log('Lead table failed to clear:', e);
    }

    try {
      await prisma.provider.deleteMany({});
      console.log('Providers cleared successfully.');
    } catch (e) {
      console.log('Provider table failed to clear:', e);
    }

    console.log('Database cleanup run completed.');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
