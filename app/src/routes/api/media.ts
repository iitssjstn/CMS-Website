import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { mediaUploadSchema } from '@/utils/validation';
import { validateBody, validateParams } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireAuth } from '@/middleware/auth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { config, allowedMimeTypes, maxFileSize, validateImageBuffer } from '@/config';
import { z } from 'zod';

const router: Router = Router();

router.use(requireAuth);

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Bestandstype niet toegestaan', 400));
    }
  },
});

const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { username: true } } },
  });
  res.json({ media });
}));

router.post('/upload', upload.single('file'), validateBody(mediaUploadSchema), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Geen bestand geüpload', 400);
  }
  
  const filePath = req.file.path;
  const buffer = await fs.readFile(filePath);
  
  const validation = validateImageBuffer(buffer);
  if (!validation.valid) {
    await fs.unlink(filePath).catch(() => {});
    throw new AppError('Ongeldig afbeeldingsbestand', 400);
  }
  
  if (!allowedMimeTypes.includes(validation.mimeType!)) {
    await fs.unlink(filePath).catch(() => {});
    throw new AppError('Bestandstype niet toegestaan', 400);
  }
  
  let width: number | undefined;
  let height: number | undefined;
  
  if (validation.mimeType !== 'image/svg+xml') {
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch {
      await fs.unlink(filePath).catch(() => {});
      throw new AppError('Kon afbeelding niet verwerken', 400);
    }
  }
  
  const media = await prisma.media.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: validation.mimeType!,
      size: req.file.size,
      width,
      height,
      alt: req.body.alt || '',
      description: req.body.description || '',
      uploadedById: req.user!.id,
    },
  });
  
  res.status(201).json({ media });
}));

router.patch('/:id', validateParams(idParamSchema), validateBody(mediaUploadSchema), asyncHandler(async (req: Request, res: Response) => {
  const media = await prisma.media.update({
    where: { id: req.params.id },
    data: {
      alt: req.body.alt,
      description: req.body.description,
    },
  });
  res.json({ media });
}));

router.delete('/:id', validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) throw new AppError('Media niet gevonden', 404);
  
  const filePath = path.join(uploadDir, media.filename);
  await fs.unlink(filePath).catch(() => {});
  
  await prisma.media.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;
