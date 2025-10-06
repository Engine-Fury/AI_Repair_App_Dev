import { createWorker } from 'tesseract.js';

const MAX_IMAGE_DIMENSION = 1024;

interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
}

class OCRServiceClass {
  private worker: any = null;

  private async initializeWorker() {
    if (!this.worker) {
      console.log('Initializing Tesseract OCR worker...');
      try {
        this.worker = await createWorker('eng', 1, {
          logger: (m) => console.log('Tesseract:', m),
          errorHandler: (err) => console.error('Tesseract error:', err)
        });
        console.log('Tesseract worker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Tesseract worker:', error);
        throw new Error('Failed to initialize OCR engine. Please try refreshing the page.');
      }
    }
    return this.worker;
  }

  private resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement): boolean {
    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
        width = MAX_IMAGE_DIMENSION;
      } else {
        width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
        height = MAX_IMAGE_DIMENSION;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);
      return true;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);
    return false;
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (event) => {
        const errorMessage = `Failed to load image: ${file.name}. Please ensure the file is a valid image format (JPG, PNG, etc.).`;
        reject(new Error(errorMessage));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async extractText(file: File): Promise<OCRResult> {
    try {
      console.log('Starting Tesseract OCR text extraction...');
      
      // Initialize Tesseract worker
      const worker = await this.initializeWorker();
      
      console.log('Processing document with Tesseract OCR...');
      const { data: { text } } = await worker.recognize(file);
      
      console.log('OCR extraction completed');
      console.log('Extracted text length:', text.length);
      
      return {
        success: true,
        text: text.trim()
      };
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR extraction failed'
      };
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const OCRService = new OCRServiceClass();