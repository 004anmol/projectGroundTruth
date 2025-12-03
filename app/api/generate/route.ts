import { generateBatchId } from '@/lib/utils';
import { buildImagePrompt } from '@/lib/prompts';
import {
  prepareBatchDirectories,
  saveUploadedFile,
  TMP_ROOT,
} from '@/lib/storage';
import { generateMockCreatives } from '@/lib/mockGenerator';
import { generateStabilityImages } from '@/lib/imageGenerator';
import { rateLimit } from '@/lib/rateLimiter';
import path from 'path';
import { NextResponse } from 'next/server';

type UploadMeta = {
  name: string;
  size: number;
  type: string;
  storedAs: string;
};

const extractFileMeta = (
  file: File,
  storedAs: string,
): UploadMeta => ({
  name: file.name,
  size: file.size,
  type: file.type || 'application/octet-stream',
  storedAs,
});

const getSafeExtension = (file: File, fallback = 'bin') => {
  const nameExt = file.name?.split('.').pop();
  if (nameExt) return nameExt;

  const typeExt = file.type?.split('/').pop();
  if (typeExt) return typeExt;

  return fallback;
};

export async function POST(request: Request) {
  try {
    const identifier =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'local-dev';

    const { limited, remaining } = rateLimit(identifier, {
      windowMs: 60_000,
      max: 3,
    });

    if (limited) {
      return NextResponse.json(
        {
          message:
            'Too many generation requests. Please wait a few moments before trying again.',
          retryAfterSeconds: 60,
        },
        { status: 429 },
      );
    }

    const formData = await request.formData();

    const style = formData.get('style');
    const logoFile = formData.get('logo');
    const productFile = formData.get('product');

    if (
      typeof style !== 'string' ||
      !logoFile ||
      typeof logoFile === 'string' ||
      !productFile ||
      typeof productFile === 'string'
    ) {
      return NextResponse.json(
        {
          message:
            'Missing logo, product, or style. Please upload both images and select a style.',
        },
        { status: 400 },
      );
    }

    const batchId = generateBatchId();
    const { batchDir, creativesDir } = await prepareBatchDirectories(batchId);

    const logoFileName = `brand-logo.${getSafeExtension(logoFile, 'png')}`;
    const productFileName = `product.${getSafeExtension(productFile, 'png')}`;

    await Promise.all([
      saveUploadedFile(logoFile, path.join(batchDir, logoFileName)),
      saveUploadedFile(productFile, path.join(batchDir, productFileName)),
    ]);

    const promptPreview = buildImagePrompt({
      style,
      brandNotes: 'Maintain brand colors and logo prominence.',
      productDescription: 'Hero product on clean stage, dynamic lighting.',
    });

    let mockFallback = false;
    let generatorType: 'stability' | 'mock' | 'mock-fallback' = 'mock';
    let generatedFiles: string[] = [];

    if (process.env.STABILITY_API_KEY) {
      try {
        generatedFiles = await generateStabilityImages({
          prompt: promptPreview,
          count: 10,
          creativesDir,
          style,
        });
        generatorType = 'stability';
      } catch (error) {
        mockFallback = true;
        console.error(
          '[Phase 3] Stability generation failed, falling back to mock',
          error,
        );
      }
    }

    if (generatedFiles.length === 0) {
      generatedFiles = await generateMockCreatives({
        creativesDir,
        count: 10,
        style,
        prompt: promptPreview,
      });
      generatorType = mockFallback ? 'mock-fallback' : 'mock';
    }

    console.log('[Phase 3] Batch ready', {
      batchId,
      promptPreview,
      files: generatedFiles,
      storedAt: batchDir,
    });

    const payload = {
      message:
        'Mock generation complete. Batch is ready for captioning and preview.',
      batchId,
      assets: {
        tmpRoot: TMP_ROOT,
        batchDir,
        creativesDir,
        files: generatedFiles,
      },
      uploads: {
        logo: extractFileMeta(logoFile, logoFileName),
        product: extractFileMeta(productFile, productFileName),
      },
      rateLimit: {
        remainingRequests: remaining,
        windowSeconds: 60,
      },
      generator: generatorType,
      provider: generatorType === 'stability' ? 'stability' : 'mock',
      promptPreview,
    };

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error('[Phase 3] Generation failed', error);

    return NextResponse.json(
      {
        message:
          'Failed to process generation request. Please retry in a few moments.',
      },
      { status: 500 },
    );
  }
}

