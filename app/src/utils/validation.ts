import { z } from 'zod';

export const setupSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  csrfToken: z.string().min(1),
});

export const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^\/$|^[a-z0-9-]+$/, 'Ongeldige slug'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  seoTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  ogImage: z.string().uuid().optional().nullable(),
  content: z.array(z.unknown()), // Blocks validated separately
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const blockSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum([
    'HEADING', 'TEXT', 'IMAGE', 'BUTTON', 'LINK', 'VIDEO',
    'HERO', 'TWO_COLUMNS', 'THREE_COLUMNS', 'SPACER', 'DIVIDER', 'HTML'
  ]),
  content: z.record(z.unknown()),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const mediaUploadSchema = z.object({
  alt: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});

export const settingsSchema = z.record(z.unknown());

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  honeypot: z.string().optional(), // Spam protection
});