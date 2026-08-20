import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'production', 'test']).default('production'),
  APP_PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  UPLOAD_MAX_SIZE: z.coerce.number().default(10_485_760),
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp,image/gif,image/svg+xml'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  SITE_NAME: z.string().default('Mijn Website'),
  SITE_DESCRIPTION: z.string().default('Een professionele website'),
  DEFAULT_LANGUAGE: z.string().default('nl'),
});

export const config = envSchema.parse(process.env);

export const allowedMimeTypes = config.UPLOAD_ALLOWED_TYPES.split(',').map(s => s.trim());
export const maxFileSize = config.UPLOAD_MAX_SIZE;

// Validates a file buffer against known image magic bytes, so an upload's
// real content is checked instead of trusting the client-supplied mimetype.
export function validateImageBuffer(buffer: Buffer): { valid: boolean; mimeType?: string } {
  if (buffer.length < 4) return { valid: false };

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' };
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, mimeType: 'image/png' };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { valid: true, mimeType: 'image/gif' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { valid: true, mimeType: 'image/webp' };
  }
  const head = buffer.subarray(0, 256).toString('utf8').trim().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) {
    return { valid: true, mimeType: 'image/svg+xml' };
  }
  return { valid: false };
}
