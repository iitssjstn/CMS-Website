import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validatiefout',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'veld';
      return res.status(409).json({ error: `${target} bestaat al` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record niet gevonden' });
    }
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Bestand te groot' });
    }
    return res.status(400).json({ error: 'Uploadfout' });
  }

  res.status(500).json({ error: 'Interne serverfout' });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Niet gevonden' });
}
