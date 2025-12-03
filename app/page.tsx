'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// UPDATED Stability AI official presets
const STYLE_PRESETS = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Moody, dramatic lighting with film-style depth',
  },
  {
    value: 'photographic',
    label: 'Photographic',
    description: 'Realistic lighting, textures, shadows, camera-like feel',
  },
  {
    value: 'digital-art',
    label: 'Digital Art',
    description: 'Sharp detail, stylized highlights, vibrant composition',
  },
  {
    value: 'anime',
    label: 'Anime',
    description: 'Clean linework, expressive lighting, soft gradients',
  },
  {
    value: 'neon-punk',
    label: 'Neon Punk',
    description: 'Electric colors, glowing accents, futuristic vibes',
  },
  {
    value: 'fantasy-art',
    label: 'Fantasy Art',
    description: 'Epic lighting, magical atmospheres, painterly detail',
  },
  {
    value: 'isometric',
    label: 'Isometric',
    description: 'Isometric geometry, structured composition',
  },
  {
    value: 'line-art',
    label: 'Line Art',
    description: 'Minimal outlines, monochrome or simple shading',
  },
  {
    value: 'pixel-art',
    label: 'Pixel Art',
    description: 'Retro pixel grid style, vibrant tiny details',
  },
  {
    value: '3d-model',
    label: '3D Model',
    description: 'Plastic, glossy, toy-like rendering',
  },
];

const MAX_ATTEMPTS = 2;

type UploadStatus = 'idle' | 'submitting' | 'success' | 'error';

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [style, setStyle] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [serverEcho, setServerEcho] = useState('');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [generationProvider, setGenerationProvider] = useState<string>('');
  const [captionsStatus, setCaptionsStatus] = useState('');
  const [captionsReady, setCaptionsReady] = useState(false);

  const disableSubmit = useMemo(() => {
    return !logoFile || !productFile || !style || status === 'submitting';
  }, [logoFile, productFile, style, status]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'product',
  ) => {
    const files = event.target.files;
    const selectedFile = files && files[0] ? files[0] : null;

    if (type === 'logo') {
      setLogoFile(selectedFile);
    } else {
      setProductFile(selectedFile);
    }

    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!logoFile || !productFile || !style) {
      setError('Please upload both images and choose a style.');
      return;
    }

    setStatus('submitting');
    setStatusMessage('Uploading assets...');
    setError(null);
    setServerEcho('');
    setBatchId(null);
    setGeneratedFiles([]);
    setGenerationProvider('');
    setCaptionsStatus('');
    setCaptionsReady(false);

    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('product', productFile);
    formData.append('style', style);

    const sendRequest = async (attemptIndex = 1): Promise<any> => {
      if (attemptIndex > 1) {
        setStatusMessage(
          `Retrying upload (attempt ${attemptIndex}/${MAX_ATTEMPTS})...`,
        );
        await sleep(1200);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (attemptIndex < MAX_ATTEMPTS) {
          return sendRequest(attemptIndex + 1);
        }

        const retryAfterSuffix = data?.retryAfterSeconds
          ? ` Wait ~${data.retryAfterSeconds}s and try again.`
          : '';

        throw new Error(
          data?.message ??
            `Upload failed. Please try again.${retryAfterSuffix}`,
        );
      }

      return data;
    };

    try {
      const data = await sendRequest();

      setStatus('success');
      setBatchId(data.batchId ?? null);
      setGeneratedFiles(Array.isArray(data?.assets?.files) ? data.assets.files : []);
      setGenerationProvider(data?.provider ?? data?.generator ?? 'mock');
      setStatusMessage(
        data.message ??
          'Assets uploaded successfully. Batch ready for captioning.',
      );

      let combinedEcho: Record<string, unknown> = { generation: data };

      if (data?.batchId) {
        const captionPayload = await requestCaptions(data.batchId, style);
        if (captionPayload) {
          combinedEcho = { ...combinedEcho, captions: captionPayload };
          setStatusMessage(
            'Images and captions ready. Open the preview gallery to inspect creatives.',
          );
        } else {
          setStatusMessage(
            'Images ready. Captions could not be generated automatically.',
          );
        }
      }

      setServerEcho(JSON.stringify(combinedEcho, null, 2));
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Unexpected error while uploading.';

      setStatus('error');
      setStatusMessage(message);
      setBatchId(null);
      setError(message);
    }
  };

  const requestCaptions = async (batch: string, currentStyle: string) => {
    setCaptionsStatus('Generating captions...');
    try {
      const response = await fetch('/api/captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: batch, style: currentStyle }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Failed to generate captions.');
      }

      setCaptionsReady(true);
      setCaptionsStatus('Captions ready.');
      return payload;
    } catch (captionError) {
      const captionMessage =
        captionError instanceof Error
          ? captionError.message
          : 'Failed to generate captions.';
      setCaptionsReady(false);
      setCaptionsStatus(captionMessage);
      return null;
    }
  };

  const renderFileSummary = (file: File | null) => {
    if (!file) {
      return <p className="text-sm text-gray-400">No file selected</p>;
    }

    const readableSize = `${(file.size / 1024).toFixed(1)} KB`;

    return (
      <div className="text-sm text-gray-600">
        <p className="font-medium">{file.name}</p>
        <p>
          {readableSize} • {file.type || 'image/*'}
        </p>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-12">
      
      {/* BLUR BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-purple-200 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-60" />
      </div>

      {/* LOADING OVERLAY */}
      {status === 'submitting' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <LoadingSpinner label="Uploading assets and generating mock creatives..." />
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col space-y-10">
        
        {/* HERO HEADER */}
        <header className="text-center space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1 text-sm font-medium text-purple-700 shadow">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
            Phase 7 · Production polish
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            AI Creative Studio
          </h1>
          <p className="text-xl md:text-2xl text-gray-600">
            Auto Ad Creative Generator
          </p>
          <p className="text-lg text-gray-500 mx-auto max-w-3xl">
            Upload your brand assets, pick a style, and watch the system build
            prompts, persist assets, and generate 10 placeholder creatives in
            `/tmp`. Real AI hooks drop in next.
          </p>
        </header>

        {/* THREE FEATURE CARDS */}
        <section className="grid gap-6 md:grid-cols-3">
          <article className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/40">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Prompt Engine
            </h3>
            <p className="text-gray-600">
              Tailored prompts per style preset keep brand cues consistent and
              ban text overlays.
            </p>
          </article>
          <article className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/40">
            <div className="text-3xl mb-3">🧪</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Batch Storage
            </h3>
            <p className="text-gray-600">
              `/api/generate` stores uploads + mock outputs in `/tmp/batch-*`
              for easy debugging.
            </p>
          </article>
          <article className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/40">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready for Phase 3
            </h3>
            <p className="text-gray-600">
              Ten placeholder creatives prove the pipeline before pointing at
              OpenAI/Stability.
            </p>
          </article>
        </section>

        {/* FORM SECTION */}
        <section className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/40 p-8">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl font-semibold text-gray-900">
              Upload Brand Assets
            </h2>
            <p className="text-gray-500">
              Upload a transparent brand logo and a product image. Supported
              formats: PNG, JPG, SVG.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* FILE INPUTS */}
            <div className="grid gap-6 md:grid-cols-2">
              <label className="group relative flex flex-col gap-4 rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-6 text-center transition hover:border-purple-400 hover:bg-purple-50">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">
                    Brand Logo
                  </p>
                  <p className="text-gray-600">High-res PNG/SVG</p>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-inner">
                  {renderFileSummary(logoFile)}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => handleFileChange(event, 'logo')}
                  required
                />
              </label>

              <label className="group relative flex flex-col gap-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Product Image
                  </p>
                  <p className="text-gray-600">Transparent or studio shot</p>
                </div>
                <div className="rounded-xl bg-white/80 p-4 shadow-inner">
                  {renderFileSummary(productFile)}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => handleFileChange(event, 'product')}
                  required
                />
              </label>
            </div>

            {/* STYLE SELECTOR */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Design Style
                  </p>
                  <p className="text-gray-500">
                    Choose a preset that aligns with your brand personality
                  </p>
                </div>
                {style && (
                  <span className="rounded-full bg-gray-900/90 px-4 py-1 text-sm font-medium text-white">
                    {style}
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setStyle(preset.value);
                      setError(null);
                    }}
                    className={`rounded-2xl border p-5 text-left transition shadow-sm hover:shadow ${
                      style === preset.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="text-lg font-semibold text-gray-900">
                      {preset.label}
                    </p>
                    <p className="text-sm text-gray-500">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON & ERRORS */}
            <div className="space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={disableSubmit}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
              >
                {status === 'submitting' ? 'Uploading...' : 'Generate Creatives'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Files are uploaded securely. AI generation begins in Phase 3.
              </p>
            </div>
          </form>
        </section>

        {/* STATUS + PREVIEW SECTION */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/50 bg-white/90 p-6 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Upload Status
            </p>
            <p
              className={`mt-3 text-lg font-medium ${
                status === 'success'
                  ? 'text-green-600'
                  : status === 'error'
                  ? 'text-red-600'
                  : 'text-gray-700'
              }`}
            >
              {statusMessage || 'Waiting for upload'}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Status transitions: idle → submitting → success/error.
            </p>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">Provider:</span>{' '}
                {generationProvider || 'pending'}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Creatives:</span>{' '}
                {generatedFiles.length ? `${generatedFiles.length} files` : 'pending'}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Captions:</span>{' '}
                {captionsReady ? 'ready' : 'pending'}{' '}
                <span className="text-gray-500">{captionsStatus || ''}</span>
              </p>
            </div>

            {batchId && (
              <div className="mt-4 space-y-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
                <div>
                  <p className="font-semibold">Batch ID</p>
                  <p className="font-mono text-xs text-green-700">{batchId}</p>
                </div>
                <p>Creatives saved in `/tmp/{batchId}/creatives`.</p>
                <p className="text-xs text-green-700/80">
                  10 placeholder PNGs ready for caption generation.
                </p>
                <Link
                  href={`/preview?batchId=${batchId}`}
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
                >
                  Open Preview Gallery
                </Link>
              </div>
            )}
          </div>

          {/* API ECHO */}
          <div className="rounded-3xl border border-white/50 bg-gray-900 text-gray-100 p-6 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              API Echo
            </p>
            {serverEcho ? (
              <pre className="mt-4 max-h-48 overflow-y-auto rounded-2xl bg-black/40 p-4 text-sm text-green-200">
                {serverEcho}
              </pre>
            ) : (
              <p className="mt-4 text-sm text-gray-400">
                Submit the form to view the server payload logged by
                `/api/generate`.
              </p>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-center shadow-inner">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
            Upcoming
          </p>
          {/* <p className="text-lg text-gray-700">
            Phase 4 will turn each batch into smart copy (titles, taglines,
            hashtags) saved alongside the creatives.
          </p> */}
        </footer>
      </main>
    </div>
  );
}
