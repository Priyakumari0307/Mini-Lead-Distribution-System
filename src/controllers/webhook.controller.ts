import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { emitProviderUpdated } from '../sockets/socket';

export class WebhookController {
  /**
   * Receives incoming payment notifications to reset provider quotas.
   * Designed with database-level idempotency checks.
   */
  public static async receivePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { providerId, transactionId } = req.body;

      if (!providerId || !transactionId) {
        res.status(400).json({
          success: false,
          message: 'Both providerId and transactionId are required.'
        });
        return;
      }

      // Check if provider exists
      const provider = await prisma.provider.findUnique({
        where: { id: providerId }
      });

      if (!provider) {
        res.status(404).json({
          success: false,
          message: 'Provider not found.'
        });
        return;
      }

      try {
        // Run payment transaction creation and quota reset in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Attempt to record the payment transaction (unique index enforces idempotency)
          const txn = await tx.paymentTransaction.create({
            data: {
              transactionId,
              providerId
            }
          });

          // Reset provider quota (allocatedThisMonth to 0)
          const updatedProvider = await tx.provider.update({
            where: { id: providerId },
            data: {
              allocatedThisMonth: 0
            }
          });

          return { provider: updatedProvider, transaction: txn };
        }, {
          timeout: 20000
        });

        // Emit Socket update to the dashboard
        emitProviderUpdated(result.provider);

        res.status(200).json({
          success: true,
          message: `Quota reset successfully for ${result.provider.name}.`,
          data: result
        });
      } catch (error: any) {
        // Check for Prisma unique constraint violation (P2002) on transactionId
        if (error.code === 'P2002') {
          console.log(`Duplicate webhook payment received. Transaction ID: ${transactionId}. Responding with 200 OK (idempotent).`);
          res.status(200).json({
            success: true,
            message: 'Webhook payment processed already (idempotent bypass).',
            duplicate: true
          });
          return;
        }

        // Throw other errors
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
}
