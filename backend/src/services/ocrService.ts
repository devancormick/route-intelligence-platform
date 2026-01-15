import Tesseract from 'tesseract.js';
import { logger } from '../utils/logger';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
    confidence: number;
  }>;
}

export class OCRService {
  async extractText(imageBuffer: Buffer, language: string = 'eng'): Promise<OCRResult> {
    try {
      logger.info('Starting OCR processing', { language });
      
      const { data } = await Tesseract.recognize(imageBuffer, language, {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            logger.debug('OCR progress', { progress: info.progress });
          }
        },
      });

      const words = data.words.map((word: any) => ({
        text: word.text,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        },
        confidence: word.confidence,
      }));

      return {
        text: data.text,
        confidence: data.confidence,
        words,
      };
    } catch (error: any) {
      logger.error('OCR processing error', { error: error.message });
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async extractAddresses(imageBuffer: Buffer): Promise<string[]> {
    const result = await this.extractText(imageBuffer);
    const lines = result.text.split('\n').filter(line => line.trim().length > 0);
    
    // Simple heuristic to identify addresses
    const addressPattern = /(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5})/i;
    
    return lines.filter(line => addressPattern.test(line));
  }

  async extractPhoneNumbers(imageBuffer: Buffer): Promise<string[]> {
    const result = await this.extractText(imageBuffer);
    const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const matches = result.text.match(phonePattern) || [];
    return [...new Set(matches)];
  }

  async extractPrices(imageBuffer: Buffer): Promise<number[]> {
    const result = await this.extractText(imageBuffer);
    const pricePattern = /\$(\d+\.?\d*)/g;
    const matches = [...result.text.matchAll(pricePattern)];
    return matches.map(match => parseFloat(match[1]));
  }
}

export const ocrService = new OCRService();
