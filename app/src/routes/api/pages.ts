import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { pageSchema, blockSchema } from '@/utils/validation';
import { validateBody, validateParams } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireAuth } from '@/middleware/auth';
import { generateSlug, ensureUniqueSlug } from '@/utils/slug';
import { z } from 'zod';

type JsonInputValue = string | number | boolean | { [key: string]: JsonInputValue | null } | JsonInputValue[];

const router: Router = Router();

router.use(requireAuth);

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().min(1).max(200) });

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const pages = await prisma.page.findMany({
    include: {
      author: { select: { id: true, username: true } },
      _count: { select: { blocks: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  
  res.json({ pages });
}));

router.get('/published', asyncHandler(async (req: Request, res: Response) => {
  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' },
  });
  
  res.json({ pages });
}));

router.get('/:id', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.page.findUnique({
    where: { id: req.params.id },
    include: {
      blocks: { orderBy: { sortOrder: 'asc' } },
      author: { select: { id: true, username: true } },
    },
  });
  
  if (!page) {
    throw new AppError('Pagina niet gevonden', 404);
  }
  
  res.json({ page });
}));

router.post('/', validateBody(pageSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, slug: providedSlug, status, content, ...rest } = req.body;
  
  const baseSlug = providedSlug || generateSlug(title);
  const existingSlugs = (await prisma.page.findMany({ select: { slug: true } })).map(p => p.slug);
  const slug = ensureUniqueSlug(baseSlug, existingSlugs);
  
  const maxSortOrder = await prisma.page.aggregate({ _max: { sortOrder: true } });
  
  const page = await prisma.page.create({
    data: {
      title,
      slug,
      status,
      content: content as any,
      authorId: req.user!.id,
      sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      ...rest,
    },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });
  
  res.status(201).json({ page });
}));

router.patch('/:id', validateParams(idParamSchema), validateBody(pageSchema.partial()), asyncHandler(async (req: Request, res: Response) => {
  const { title, slug: providedSlug, status, content, ...rest } = req.body;
  
  const updateData: any = { ...rest };
  
  if (title) updateData.title = title;
  if (providedSlug) updateData.slug = providedSlug;
  if (status) {
    updateData.status = status;
    updateData.publishedAt = status === 'PUBLISHED' ? new Date() : null;
  }
  if (content) updateData.content = content;
  
  const page = await prisma.page.update({
    where: { id: req.params.id },
    data: updateData,
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });
  
  res.json({ page });
}));

router.post('/:id/duplicate', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const original = await prisma.page.findUnique({
    where: { id: req.params.id },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });
  
  if (!original) {
    throw new AppError('Pagina niet gevonden', 404);
  }
  
  const baseSlug = generateSlug(`${original.title} kopie`);
  const existingSlugs = (await prisma.page.findMany({ select: { slug: true } })).map(p => p.slug);
  const slug = ensureUniqueSlug(baseSlug, existingSlugs);
  
  const maxSortOrder = await prisma.page.aggregate({ _max: { sortOrder: true } });
  
  const page = await prisma.page.create({
    data: {
      title: `${original.title} (kopie)`,
      slug,
      status: 'DRAFT',
      content: original.content as unknown as JsonInputValue,
      authorId: req.user!.id,
      sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      seoTitle: original.seoTitle,
      metaDescription: original.metaDescription,
      ogTitle: original.ogTitle,
      ogDescription: original.ogDescription,
      ogImage: original.ogImage,
      blocks: {
        create: original.blocks.map(block => ({
          type: block.type as any,
          content: block.content as unknown as JsonInputValue,
          sortOrder: block.sortOrder,
        })),
      },
    },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });
  
  res.status(201).json({ page });
}));

router.delete('/:id', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  await prisma.page.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

router.patch('/reorder', validateBody(z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int() }))), asyncHandler(async (req: Request, res: Response) => {
  await prisma.$transaction(
    req.body.map((item: { id: string; sortOrder: number }) =>
      prisma.page.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
  res.json({ success: true });
}));

export default router;
