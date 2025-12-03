import JSZip from 'jszip';
import path from 'path';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { getBatchPaths } from '@/lib/storage';

type ZipRequest = {
  batchId?: string;
};

const isJson = (contentType: string | null) =>
  Boolean(contentType?.includes('application/json'));

const fileExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const extractBatchId = async (request: Request): Promise<string | null> => {
  if (isJson(request.headers.get('content-type'))) {
    const payload = (await request.json()) as ZipRequest;
    return typeof payload?.batchId === 'string' ? payload.batchId : null;
  }

  const formData = await request.formData();
  const batchId = formData.get('batchId');
  return typeof batchId === 'string' ? batchId : null;
};

const validAsset = (fileName: string) =>
  ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(
    path.extname(fileName).toLowerCase(),
  );

export async function POST(request: Request) {
  try {
    const batchId = await extractBatchId(request);

    if (!batchId) {
      return NextResponse.json(
        { message: 'batchId is required to export assets.' },
        { status: 400 },
      );
    }

    const { batchDir, creativesDir, captionsPath, metadataPath } =
      getBatchPaths(batchId);

    const hasCreatives = await fileExists(creativesDir);
    if (!hasCreatives) {
      return NextResponse.json(
        {
          message:
            'Batch not found. Generate creatives first or verify the tmp directory.',
        },
        { status: 404 },
      );
    }

    const creativeFiles = (await fs.readdir(creativesDir))
      .filter(validAsset)
      .sort();

    if (creativeFiles.length === 0) {
      return NextResponse.json(
        { message: 'No creatives available to export for this batch.' },
        { status: 422 },
      );
    }

    const zip = new JSZip();
    const creativesFolder = zip.folder('creatives');

    if (!creativesFolder) {
      throw new Error('Failed to initialize creatives folder in ZIP archive.');
    }

    await Promise.all(
      creativeFiles.map(async (fileName) => {
        const fileBuffer = await fs.readFile(
          path.join(creativesDir, fileName),
        );
        creativesFolder.file(fileName, fileBuffer);
      }),
    );

    const captionsExists = await fileExists(captionsPath);
    const captionsPayload = captionsExists
      ? await fs.readFile(captionsPath, 'utf-8')
      : JSON.stringify(
          {
            message:
              'Captions were not generated for this batch. Run /api/captions first to include copy.',
            batchId,
          },
          null,
          2,
        );

    zip.file('captions.json', captionsPayload);

    const metadata = {
      batchId,
      exportedAt: new Date().toISOString(),
      files: creativeFiles,
      captionsIncluded: captionsExists,
      paths: {
        batchDir,
        creativesDir,
        captionsPath: captionsExists ? captionsPath : null,
      },
    };

    const metadataString = JSON.stringify(metadata, null, 2);
    await fs.writeFile(metadataPath, metadataString, 'utf-8');
    zip.file('metadata.json', metadataString);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${batchId}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error('[Phase 6] ZIP export failed', error);
    return NextResponse.json(
      {
        message:
          'Failed to build the ZIP archive. Please try again or regenerate the batch.',
      },
      { status: 500 },
    );
  }
}

