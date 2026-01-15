import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ocrService } from '../services/ocrService';
import { upload } from '../utils/fileUpload';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

router.use(authenticate);

// Configure multer for image uploads
const imageUpload = upload.fields([
  { name: 'image', maxCount: 1 },
]);

// Extract text from image
router.post('/extract-text', imageUpload, async (req: AuthRequest, res, next) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      throw new AppError('No image file provided', 400);
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(imageFile.mimetype)) {
      throw new AppError('Invalid image format. Only JPEG, PNG, GIF, and WebP are supported', 400);
    }

    const language = (req.body.language as string) || 'eng';
    const result = await ocrService.extractText(imageFile.buffer, language);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Extract addresses from image
router.post('/extract-addresses', imageUpload, async (req: AuthRequest, res, next) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      throw new AppError('No image file provided', 400);
    }

    const addresses = await ocrService.extractAddresses(imageFile.buffer);
    res.json({ addresses });
  } catch (error) {
    next(error);
  }
});

// Extract phone numbers from image
router.post('/extract-phones', imageUpload, async (req: AuthRequest, res, next) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      throw new AppError('No image file provided', 400);
    }

    const phoneNumbers = await ocrService.extractPhoneNumbers(imageFile.buffer);
    res.json({ phoneNumbers });
  } catch (error) {
    next(error);
  }
});

// Extract prices from image
router.post('/extract-prices', imageUpload, async (req: AuthRequest, res, next) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      throw new AppError('No image file provided', 400);
    }

    const prices = await ocrService.extractPrices(imageFile.buffer);
    res.json({ prices });
  } catch (error) {
    next(error);
  }
});

export default router;
