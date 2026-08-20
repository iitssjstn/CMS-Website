import { Router, Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { settingsSchema } from '@/utils/validation';
import { validateBody } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireAuth } from '@/middleware/auth';
import { getSiteSettings, updateSettings } from '@/utils/siteSettings';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.setting.findMany({
    orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json({ settings });
}));

router.patch('/', validateBody(settingsSchema), asyncHandler(async (req: Request, res: Response) => {
  await updateSettings(req.body);
  const settings = await getSiteSettings();
  res.json({ settings });
}));

export default router;
