import { promises as fs } from 'fs';
import path from 'path';

export const TMP_ROOT = path.join(process.cwd(), 'tmp');

export const getBatchPaths = (batchId: string) => {
  const batchDir = path.join(TMP_ROOT, batchId);
  return {
    batchDir,
    creativesDir: path.join(batchDir, 'creatives'),
    captionsPath: path.join(batchDir, 'captions.json'),
    metadataPath: path.join(batchDir, 'metadata.json'),
  };
};

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function prepareBatchDirectories(batchId: string) {
  const { batchDir, creativesDir } = getBatchPaths(batchId);
  await ensureDir(creativesDir);
  return { batchDir, creativesDir };
}

export async function saveUploadedFile(file: File, targetPath: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, buffer);
}

