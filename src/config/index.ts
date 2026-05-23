import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  databaseUrl: process.env.DATABASE_URL || 'mongodb+srv://kumaripriyee73_db_user:Ejg898NwNdoxGmWr@cluster0.plqpxux.mongodb.net/lead_distribution',
  jwtSecret: process.env.JWT_SECRET || 'lead_distribution_super_secret_key_98765',
  jwtExpire: process.env.JWT_EXPIRE || '24h',
  duplicateWindowHours: process.env.DUPLICATE_WINDOW_HOURS ? parseInt(process.env.DUPLICATE_WINDOW_HOURS, 10) : 24,
  webhookTimeoutMs: process.env.WEBHOOK_TIMEOUT_MS ? parseInt(process.env.WEBHOOK_TIMEOUT_MS, 10) : 5000,
  webhookMaxRetries: process.env.WEBHOOK_MAX_RETRIES ? parseInt(process.env.WEBHOOK_MAX_RETRIES, 10) : 3,
  nodeEnv: process.env.NODE_ENV || 'development',
};
