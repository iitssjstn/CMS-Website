import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import path from 'path';
import fs from 'fs/promises';
import { config } from '@/config';
import { prisma } from '@/utils/database';
import { initializeDefaultSettings } from '@/utils/siteSettings';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import setupRoutes from '@/routes/api/setup';
import authRoutes from '@/routes/api/auth';
import pageRoutes from '@/routes/api/pages';
import blockRoutes from '@/routes/api/blocks';
import mediaRoutes from '@/routes/api/media';
import settingsRoutes from '@/routes/api/settings';
import messageRoutes from '@/routes/api/messages';
import dashboardRoutes from '@/routes/api/dashboard';
import publicRoutes from '@/routes/public';
import adminRoutes from '@/routes/admin';

export function createApp(): express.Express {
  const app = express();

  // Trust proxy (needed for secure cookies behind NPM)
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: { error: 'Te veel verzoeken, probeer later opnieuw' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Stricter rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Te veel inlogpogingen, probeer over 15 minuten opnieuw' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(config.SESSION_SECRET));
  app.use(compression());

  // CSRF protection (disabled for API routes that use token in body)
  const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax', secure: config.APP_ENV === 'production' } });
  
  // Apply CSRF to non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/setup') || req.path === '/healthz' || req.path === '/readyz') {
      return next();
    }
    csrfProtection(req as never, res as never, next as never);
  });

  // Make CSRF token available to views
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken?.() || '';
    next();
  });

  // Static files (uploads)
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      // Prevent execution of uploaded files
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    },
  }));

  // API Routes
  app.use('/setup', setupRoutes);
  app.use('/admin/api/auth', authLimiter, authRoutes);
  app.use('/admin/api/pages', pageRoutes);
  app.use('/admin/api/blocks', blockRoutes);
  app.use('/admin/api/media', mediaRoutes);
  app.use('/admin/api/settings', settingsRoutes);
  app.use('/admin/api/messages', messageRoutes);
  app.use('/admin/api/dashboard', dashboardRoutes);

  // Authentication pages and actions
  app.use('/admin', authRoutes);

  // Admin panel (SPA)
  app.use('/admin', adminRoutes);

  // Public routes (must be last)
  app.use('/', publicRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export async function initializeApp(): Promise<express.Express> {
  const app = createApp();

  await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
  
  // Initialize default settings
  await initializeDefaultSettings();
  
  // Ensure setup status exists
  await prisma.setupStatus.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', completed: false },
    update: {},
  });

  return app;
}
