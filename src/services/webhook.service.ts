import axios from 'axios';
import { prisma } from '../lib/prisma';
import { config } from '../config';

export class WebhookService {
  /**
   * Triggers the webhook for a provider.
   * If Redis/BullMQ is not active, it handles it in-memory asynchronously.
   */
  public static async triggerWebhook(providerId: string, leadId: string): Promise<void> {
    // Run webhook dispatch asynchronously so it does not block the main allocation flow
    setImmediate(async () => {
      try {
        await this.dispatchWebhookWithRetries(providerId, leadId);
      } catch (err) {
        console.error(`Webhook final failure for provider ${providerId}, lead ${leadId}:`, err);
      }
    });
  }

  private static async dispatchWebhookWithRetries(
    providerId: string,
    leadId: string,
    attempt: number = 1
  ): Promise<void> {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!provider || !lead) {
      console.warn(`Webhook skip: provider (${providerId}) or lead (${leadId}) not found.`);
      return;
    }

    // Default fallback url if provider doesn't have one configured
    const url = provider.webhookUrl || 'https://httpbin.org/post';
    const payload = {
      event: 'lead.allocated',
      timestamp: new Date().toISOString(),
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
      },
      lead: {
        id: lead.id,
        leadNumber: lead.leadNumber,
        customerName: lead.customerName,
        email: lead.email,
        phone: lead.phone,
        category: lead.category,
        location: lead.location,
        description: lead.description,
        createdAt: lead.createdAt,
      },
    };

    let responseData = '';
    let success = false;

    try {
      const response = await axios.post(url, payload, {
        timeout: config.webhookTimeoutMs,
        headers: { 'Content-Type': 'application/json' },
      });

      responseData = JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
      success = true;
    } catch (error: any) {
      success = false;
      if (error.response) {
        responseData = JSON.stringify({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      } else {
        responseData = JSON.stringify({
          error: error.message || 'Network Error or Timeout',
        });
      }
    }

    // Save webhook log
    await prisma.webhookLog.create({
      data: {
        providerId,
        leadId,
        payload: JSON.stringify(payload),
        response: responseData,
        status: success ? 'SUCCESS' : 'FAILED',
      },
    });

    if (!success) {
      if (attempt < config.webhookMaxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, etc.
        console.log(`Webhook failed for provider ${providerId}. Retrying attempt ${attempt + 1} in ${delay}ms...`);
        setTimeout(async () => {
          try {
            await this.dispatchWebhookWithRetries(providerId, leadId, attempt + 1);
          } catch (err) {
            console.error(`Retry attempt ${attempt + 1} failed:`, err);
          }
        }, delay);
      } else {
        console.error(`Webhook failed after max retries (${config.webhookMaxRetries}) for provider ${providerId}.`);
      }
    } else {
      console.log(`Webhook successfully sent to provider ${providerId} for lead ${leadId}.`);
    }
  }
}
