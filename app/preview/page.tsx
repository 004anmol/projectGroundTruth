import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { getBatchPaths } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams =
  | Record<string, string | string[] | undefined>
  | undefined;

type CaptionEntry = {
  title: string;
  tagline: string;
  hashtags: string[];
  voice?: string;
};

type CreativeCard = {
  fileName: string;
  dataUrl: string;
  caption: CaptionEntry;
};

const IMAGE_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const FALLBACK_CAPTION = (index: number): CaptionEntry => ({
  title: `Creative ${index + 1}`,
  tagline: 'Caption pending generation. Run Phase 4 to unlock copy.',
  hashtags: ['#AIcreative', '#HackathonBuild', '#ComingSoon'],
  voice: 'Preview placeholder',
});

const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const encodeFileToDataUrl = async (filePath: string) => {
  const fileBuffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = IMAGE_MIME_MAP[ext] ?? 'image/png';
  return `data:${mime};base64,${fileBuffer.toString('base64')}`;
};

const loadBatch = async (batchId: string) => {
  const { batchDir, creativesDir, captionsPath } = getBatchPaths(batchId);

  const hasCreatives = await fileExists(creativesDir);
  if (!hasCreatives) {
    return null;
  }

  const creativeFiles = (await fs.readdir(creativesDir))
    .filter((file) =>
      ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(
        path.extname(file).toLowerCase(),
      ),
    )
    .sort();

  if (creativeFiles.length === 0) {
    return null;
  }

  const dataUrls = await Promise.all(
    creativeFiles.map((file) =>
      encodeFileToDataUrl(path.join(creativesDir, file)),
    ),
  );

  let captions: CaptionEntry[] = [];
  let captionsSource: 'file' | 'fallback' = 'file';

  if (await fileExists(captionsPath)) {
    try {
      const rawJson = await fs.readFile(captionsPath, 'utf-8');
      const parsed = JSON.parse(rawJson);
      captions = Array.isArray(parsed?.entries) ? parsed.entries : [];
    } catch (error) {
      console.warn('[Preview] Failed to parse captions.json', error);
      captionsSource = 'fallback';
    }
  } else {
    captionsSource = 'fallback';
  }

  const cards: CreativeCard[] = creativeFiles.map((fileName, index) => ({
    fileName,
    dataUrl: dataUrls[index],
    caption: captions[index] ?? FALLBACK_CAPTION(index),
  }));

  return {
    cards,
    batchMeta: {
      batchId,
      imagesCount: cards.length,
      captionsCount: captions.filter(Boolean).length,
      captionsSource,
      batchDir,
      creativesDir,
      captionsPath,
    },
  };
};

const Heading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="text-center space-y-3">
    <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-blue-700 shadow">
      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      Preview Gallery · Phase 5
    </p>
    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{title}</h1>
    <p className="text-lg text-gray-500 max-w-3xl mx-auto">{subtitle}</p>
  </div>
);

const EmptyState = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
    <Heading
      title="Bring a batch to preview"
      subtitle="Generate creatives first, then open this page with ?batchId=..."
    />
    <div className="rounded-3xl bg-white/80 p-8 shadow-lg border border-dashed border-gray-200 max-w-xl space-y-4">
      <ol className="space-y-3 text-left text-gray-600">
        <li>1. Return to the home page and upload your assets.</li>
        <li>2. Copy the batch ID after generation completes.</li>
        <li>3. Append ?batchId=YOUR_ID to /preview.</li>
      </ol>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-white font-semibold shadow hover:bg-black"
      >
        Back to generator
      </Link>
    </div>
  </div>
);

const BatchMissingState = ({ batchId }: { batchId: string }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
    <Heading
      title="Batch not found"
      subtitle="We couldn't locate creatives for this batch. Make sure Phase 3 ran successfully and the tmp folder still exists."
    />
    <div className="rounded-3xl bg-white/80 p-6 shadow-lg border border-red-200 max-w-2xl space-y-4">
      <p className="font-mono text-sm text-red-700">batchId: {batchId}</p>
      <p className="text-gray-600">
        Generate a fresh batch and try again, or confirm that `/tmp/{batchId}`
        still exists on disk.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-white font-semibold shadow hover:bg-black"
      >
        Generate again
      </Link>
    </div>
  </div>
);

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawParam = resolvedParams?.batchId;
  const batchId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

  if (!batchId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="mx-auto max-w-6xl py-16 px-4">
          <EmptyState />
        </div>
      </main>
    );
  }

  const batchData = await loadBatch(batchId);

  if (!batchData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="mx-auto max-w-6xl py-16 px-4">
          <BatchMissingState batchId={batchId} />
        </div>
      </main>
    );
  }

  const { cards, batchMeta } = batchData;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-6xl py-16 px-4 space-y-10">
        <Heading
          title="Preview your AI creatives"
          subtitle="A polished grid showing every generated mock creative with captions, ready for demo moments."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-white/90 p-6 shadow-xl border border-white/50">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Batch ID
            </p>
            <p className="mt-3 font-mono text-sm text-gray-900 break-all">
              {batchMeta.batchId}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Assets live in <span className="font-mono">tmp/{batchMeta.batchId}</span>
            </p>
          </article>

          <article className="rounded-3xl bg-white/90 p-6 shadow-xl border border-white/50">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Creatives
            </p>
            <p className="mt-3 text-4xl font-bold text-gray-900">
              {batchMeta.imagesCount}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Each image is streamed from `/tmp` as a Data URL for demo safety.
            </p>
          </article>

          <article className="rounded-3xl bg-white/90 p-6 shadow-xl border border-white/50">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Captions
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {batchMeta.captionsCount}{' '}
              <span className="text-base font-medium text-gray-500">
                of {batchMeta.imagesCount}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Source: {batchMeta.captionsSource === 'file' ? 'captions.json' : 'fallback placeholders'}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Batch Actions
              </p>
              <p className="text-sm text-gray-500">
                Download assets or return home to generate another batch.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action="/api/zip" method="POST">
                <input type="hidden" name="batchId" value={batchMeta.batchId} />
                <button
                  type="submit"
                  className="rounded-2xl bg-black px-5 py-3 text-white font-semibold shadow hover:bg-gray-900"
                >
                  Download ZIP
                </button>
              </form>
              <Link
                href="/"
                className="rounded-2xl border border-gray-300 px-5 py-3 text-gray-800 font-semibold shadow-sm hover:border-gray-400"
              >
                New Batch
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ fileName, dataUrl, caption }, index) => (
            <article
              key={fileName}
              className="group rounded-3xl bg-white/90 shadow-lg border border-white/40 overflow-hidden flex flex-col"
            >
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={caption.title}
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                  #{index + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                  {fileName}
                </p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {caption.title}
                </h3>
                <p className="text-gray-600 flex-1">{caption.tagline}</p>
                <p className="text-xs text-purple-600 font-medium">
                  {caption.voice}
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  {caption.hashtags.map((tag) => (
                    <span
                      key={`${fileName}-${tag}`}
                      className="rounded-full bg-gray-100 px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-center shadow-inner">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
            Next phase
          </p>
          <p className="text-lg text-gray-700">
            Phase 6 will turn the ZIP button into a full export pipeline with creatives,
            captions, and metadata bundled for sharing.
          </p>
        </section>
      </div>
    </main>
  );
}

