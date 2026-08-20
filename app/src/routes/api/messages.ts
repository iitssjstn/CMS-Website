import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireAuth } from '@/middleware/auth';
import { validateParams } from '@/middleware/validation';
import { z } from 'zod';

const router: Router = Router();

router.use(requireAuth);

const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ messages });
}));

router.patch('/:id/read', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const message = await prisma.contactMessage.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json({ message });
}));

router.delete('/:id', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
