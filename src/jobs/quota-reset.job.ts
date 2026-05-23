import { prisma } from '../lib/prisma';

let lastResetMonth: number = new Date().getMonth();

/**
 * Periodically checks (every 12 hours) if a new month has started.
 * If so, resets the monthly allocated count for all providers.
 */
export const startQuotaResetJob = () => {
  console.log('Monthly quota reset background job started.');

  // Run the check every 12 hours
  setInterval(async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();

      if (currentMonth !== lastResetMonth) {
        console.log(`New month detected (${currentMonth}). Resetting monthly quotas for all providers...`);

        const result = await prisma.provider.updateMany({
          data: {
            allocatedThisMonth: 0,
          },
        });

        console.log(`Successfully reset quotas for ${result.count} providers.`);
        lastResetMonth = currentMonth;
      }
    } catch (error) {
      console.error('Failed to reset monthly quotas in background job:', error);
    }
  }, 12 * 60 * 60 * 1000); // 12 hours
};
