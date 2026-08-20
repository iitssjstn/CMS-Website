import { Router, Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { blockSchema } from '@/utils/validation';
import { validateBody, validateParams } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireAuth } from '@/middleware/auth';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

const idParamSchema = z.object({ id: z.string().uuid() });
const pageIdParamSchema = z.object({ pageId: z.string().uuid() });

router.get('/page/:pageId', validateParams(pageIdParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const blocks = await prisma.block.findMany({
    where: { pageId: req.params.pageId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ blocks });
}));

router.post('/page/:pageId', validateParams(pageIdParamSchema), validateBody(blockSchema), asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.pageId } });
  if (!page) throw new AppError('Pagina niet gevonden', 404);
  
  const maxSortOrder = await prisma.block.aggregate({
    where: { pageId: req.params.pageId },
    _max: { sortOrder: true },
  });
  
  const block = await prisma.block.create({
    data: {
      pageId: req.params.pageId,
      type: req.body.type,
      content: req.body.content as any,
      sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
    },
  });
  
  res.status(201).json({ block });
}));

router.patch('/:id', validateParams(idParamSchema), validateBody(blockSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
  const block = await prisma.block.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ block });
}));

router.post('/:id/duplicate', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const original = await prisma.block.findUnique({ where: { id: req.params.id } });
  if (!original) throw new AppError('Blok niet gevonden', 404);
  
  const maxSortOrder = await prisma.block.aggregate({
    where: { pageId: original.pageId },
    _max: { sortOrder: true },
  });
  
  const block = await prisma.block.create({
    data: {
      pageId: original.pageId,
      type: original.type as any,
      content: original.content as any,
      sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
    },
  });
  
  res.status(201).json({ block });
}));

router.delete('/:id', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  await prisma.block.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

router.patch('/reorder', validateBody(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int() }))), asyncHandler(async (req: Request, res: Response) => {
  await prisma.$transaction(
    req.body.map((item: { id: string; sortOrder: number }) =>
      prisma.block.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
  res.json({ success: true });
}));

export default router;
