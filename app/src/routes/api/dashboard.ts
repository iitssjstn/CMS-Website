import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { requireAuth } from '@/middleware/auth';
import { asyncHandler } from '@/utils/errors';

const router: Router = Router();
router.use(requireAuth);

router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalPages, publishedPages, draftPages, mediaCount] = await Promise.all([
    prisma.page.count(),
    prisma.page.count({ where: { status: 'PUBLISHED' } }),
    prisma.page.count({ where: { status: 'DRAFT' } }),
    prisma.media.count(),
  ]);
  res.json({ stats: { totalPages, publishedPages, draftPages, mediaCount } });
}));

export default router;
