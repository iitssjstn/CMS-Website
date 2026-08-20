import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/utils/database';
import { verifyPassword } from '@/utils/security';

const LOGIN_PATH = '/admin/api/auth/login';

function sendUnauthorized(req: Request, res: Response, message: string, status = 401) {
  // Routers mounted under an /api/ path (e.g. /admin/api/pages) should always
  // get JSON back — that's what the admin panel's own fetch() calls expect.
  // Only the admin panel shell itself (mounted at /admin) should redirect a
  // browser to the login page.
  const isApiRoute = req.baseUrl.includes('/api/');
  if (!isApiRoute) {
    return res.redirect(`${LOGIN_PATH}?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  return res.status(status).json({ error: message });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return sendUnauthorized(req, res, 'Niet geauthenticeerd');
  }

  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    res.clearCookie('sessionId', { httpOnly: true, secure: true, sameSite: 'lax' });
    return sendUnauthorized(req, res, 'Sessie verlopen');
  }

  if (!session.user.isActive) {
    return sendUnauthorized(req, res, 'Account gedeactiveerd', 403);
  }

  req.user = session.user;
  req.user.session = session;
  res.locals.user = session.user;
  next();
}

export async function requireSetup(req: Request, res: Response, next: NextFunction) {
  const setup = await prisma.setupStatus.findUnique({ where: { id: 'singleton' } });
  
  if (setup?.completed) {
    return res.redirect(LOGIN_PATH);
  }
  next();
}

export async function requireNoSetup(req: Request, res: Response, next: NextFunction) {
  const setup = await prisma.setupStatus.findUnique({ where: { id: 'singleton' } });
  
  if (!setup?.completed) {
    return res.redirect('/setup');
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) return next();

  prisma.session.findUnique({
    where: { sessionId },
    include: { user: true },
  }).then(session => {
    if (session && session.expiresAt > new Date() && session.user.isActive) {
      req.user = session.user;
      req.user.session = session;
      res.locals.user = session.user;
    }
    next();
  }).catch(() => next());
}
