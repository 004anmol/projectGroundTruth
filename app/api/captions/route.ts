import path from 'path';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { TMP_ROOT } from '@/lib/storage';
import { generateMockCaptions } from '@/lib/captions';

type CaptionRequest = {
  batchId?: string;
  style?: string;
  productName?: string;
  campaignGoal?: string;
  tone?: string;
};

const ensureDirectoryExists = async (targetDir: string) => {
  try {
    await fs.access(targetDir);
    return true;
  } catch {
    return false;
  }
};

const readCreatives = async (creativesDir: string) => {
  const files = await fs.readdir(creativesDir);
  return files
    .filter((file) => file.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/))
    .sort();
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CaptionRequest;
    const { batchId, style = 'modern', productName, campaignGoal, tone } =
      payload ?? {};

    if (!batchId) {
      return NextResponse.json(
        { message: 'batchId is required to generate captions.' },
        { status: 400 },
      );
    }

    const batchDir = path.join(TMP_ROOT, batchId);
    const creativesDir = path.join(batchDir, 'creatives');
    const captionsPath = path.join(batchDir, 'captions.json');

    const hasBatch = await ensureDirectoryExists(batchDir);
    const hasCreatives = await ensureDirectoryExists(creativesDir);

    if (!hasBatch || !hasCreatives) {
      return NextResponse.json(
        {
          message:
            'Batch not found. Please run the image generation step before requesting captions.',
        },
        { status: 404 },
      );
    }

    const creativeFiles = await readCreatives(creativesDir);

    if (creativeFiles.length === 0) {
      return NextResponse.json(
        {
          message:
            'No creatives found for this batch. Please regenerate images first.',
        },
        { status: 422 },
      );
    }

    const captions = generateMockCaptions({
      count: creativeFiles.length,
      style,
      productName,
      campaignGoal,
      tone,
    }).map((entry, index) => ({
      image: creativeFiles[index],
      ...entry,
    }));

    const payloadToPersist = {
      batchId,
      style,
      generatedAt: new Date().toISOString(),
      entries: captions,
    };

    await fs.writeFile(
      captionsPath,
      JSON.stringify(payloadToPersist, null, 2),
      'utf-8',
    );

    console.log('[Phase 4] Captions ready', {
      batchId,
      count: captions.length,
      captionsPath,
    });

    return NextResponse.json(
      {
        message:
          'Captions generated successfully. Saved to captions.json inside the batch directory.',
        batchId,
        entries: captions,
        captionsFile: 'captions.json',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Phase 4] Caption generation failed', error);

    return NextResponse.json(
      {
        message:
          'Failed to generate captions. Please confirm the request payload and try again.',
      },
      { status: 500 },
    );
  }
}

