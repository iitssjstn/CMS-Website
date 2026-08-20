import { User, Session } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & { session?: Session };
      csrfToken?: () => string;
    }
    interface Locals {
      user?: User;
      csrfToken: string;
      siteSettings: Record<string, unknown>;
    }
  }
}

export {};
