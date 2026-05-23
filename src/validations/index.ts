import { z } from 'zod';
import { Role } from '@prisma/client';

// ----------------- AUTH SCHEMAS -----------------
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ----------------- LEAD SCHEMAS -----------------
export const CreateLeadSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  email: z.string().email('Invalid email address'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
});

export const ReassignLeadSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const QueryLeadSchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ----------------- PROVIDER SCHEMAS -----------------
export const CreateProviderSchema = z.object({
  name: z.string().min(2, 'Provider name must be at least 2 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  monthlyQuota: z.number().int().positive('Quota must be positive').optional().default(10),
  isMandatory: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  webhookUrl: z.string().url('Invalid webhook URL').optional().or(z.literal('')),
});

export const UpdateProviderSchema = CreateProviderSchema.partial();
