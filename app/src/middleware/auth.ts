import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/utils/database';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Niet geauthenticeerd' });
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
    return res.status(401).json({ error: 'Sessie verlopen' });
  }

  if (!session.user.isActive) {
    return res.status(403).json({ error: 'Account gedeactiveerd' });
  }

  req.user = session.user;
  req.user.session = session;
  res.locals.user = session.user;
  next();
}

export async function requireSetup(req: Request, res: Response, next: NextFunction) {
  const setup = await prisma.setupStatus.findUnique({ where: { id: 'singleton' } });
  
  if (setup?.completed) {
    return res.redirect('/admin/login');
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
