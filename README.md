# AI Creative Studio – Auto Ad Creative Generator

A hackathon-quality web application for generating AI-powered advertising creatives.

## 🎯 Project Overview

Transform your brand assets into stunning advertising creatives:
- Upload brand logo and product image
- Choose a design style preset
- Generate 10 AI-created advertising creatives
- Generate matching ad captions
- Preview creatives in a gallery
- Export everything as a ZIP file

## 🧱 Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **OpenAI/Stability AI** for image generation
- **JSZip** for ZIP file generation
- **Axios** for HTTP requests

## 📁 Project Structure

```
app/
  api/
    generate/     # Image generation API (Phase 3)
    captions/      # Caption generator API (Phase 4)
    zip/           # ZIP export API (Phase 6)
  preview/         # Preview gallery page (Phase 5)
components/        # Reusable UI components
lib/               # Utility functions
public/
  uploads/         # Temporary file storage
tmp/               # Runtime batches (auto-created)
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.9.0 (recommended, though 18.18.0+ may work)
- npm or yarn

### Installation

Dependencies are already installed. To reinstall:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Development Phases

### ✅ Phase 1: Project Setup (COMPLETE)

- [x] Next.js 14 project initialized
- [x] Tailwind CSS configured
- [x] Folder structure created
- [x] Dependencies installed (JSZip, Axios)
- [x] Landing page created
- [x] API route placeholders created

### ✅ Phase 2: Upload UI (COMPLETE)

- [x] Brand logo + product image uploads with metadata preview
- [x] Design style presets (modern, minimal, luxury, bold)
- [x] Responsive form with validation + status messaging
- [x] FormData submission to `/api/generate`
- [x] API handler logs file metadata for debugging

> **Testing**: Run `npm run dev`, submit sample images/styles, and check the server console for `[Phase 2] Upload payload received` logs that echo the file metadata.

### ✅ Phase 3: Image Generation API (COMPLETE)

- [x] `/api/generate` stores uploads under `/tmp/batch-*`
- [x] Prompt builder in `lib/prompts.ts` respects style presets + brand notes
- [x] Connects to Stability Images API when `STABILITY_API_KEY` is set
- [x] Falls back to local mock generator if Stability is unavailable
- [x] Response returns `batchId`, prompt preview, file inventory
- [x] Utilities added for storage + generation (`lib/storage.ts`, `lib/mockGenerator.ts`, `lib/imageGenerator.ts`)

> **Testing**:
> 1. Run `npm run dev` and upload logo + product + style.
> 2. Watch the server console for `[Phase 3] Batch ready …`.
> 3. Inspect the `tmp/batch-*/creatives` folder (created at project root) to confirm 10 `.png` files plus stored uploads.

### ✅ Phase 4: Caption Generator API (Mock COMPLETE)

- [x] `/api/captions` accepts `batchId`, style, and optional metadata
- [x] Reads creatives from `tmp/batch-*/creatives`
- [x] Generates title/tagline/hashtags per image via `lib/captions.ts`
- [x] Persists `captions.json` beside the batch assets
- [x] Returns structured entries aligned with image filenames

> **Testing**:
> 1. After Phase 3, grab the returned `batchId`.
> 2. POST to `/api/captions` with `{ "batchId": "…" }` (use Thunder Client or curl).
> 3. Check server logs for `[Phase 4] Captions ready …`.
> 4. Inspect `tmp/batch-*/captions.json` to confirm the entries array matches 10 creatives.

### ✅ Phase 5: Preview Gallery (COMPLETE)

- [x] `/preview?batchId=...` renders creatives directly from `tmp/batch-*`
- [x] Captions appear under each tile with hover zoom interactions
- [x] Download ZIP CTA wired for Phase 6
- [x] Home page status card links to preview once a batch finishes

> **Testing**:
> 1. Generate a batch on the home page to obtain a `batchId`.
> 2. Visit `http://localhost:3000/preview?batchId=YOUR_BATCH_ID`.
> 3. Verify all creatives load, captions display, and the ZIP button is visible.
> 4. Use the “Open Preview Gallery” button on the home page to confirm navigation.

### ✅ Phase 6: ZIP Export System (COMPLETE)

- [x] `/api/zip` packages creatives, captions, and metadata with JSZip
- [x] Accepts both JSON and form submissions (used by preview CTA)
- [x] Adds fallback captions notice if `captions.json` is missing
- [x] Persists `metadata.json` describing batch + included files

> **Testing**:
> 1. Generate a batch and (optionally) run `/api/captions`.
> 2. Open `/preview?batchId=...` and click “Download ZIP”.
> 3. Confirm a `.zip` downloads containing `/creatives`, `captions.json`, and `metadata.json`.
> 4. Inspect `metadata.json` to ensure file lists and paths look correct.

### ✅ Phase 7: Production Polish (COMPLETE)

- [x] Glassmorphism hero tweaks + background glows for presentation polish
- [x] Loading overlay + animated spinner during generation
- [x] Client-side retry logic plus server-side rate limiting
- [x] Expanded docs with run instructions, API key guidance, and demo flow

> **Testing**:
> 1. Trigger a generation and cancel your network to force a retry; UI will auto-attempt once more.
> 2. Spam the Generate button >3 times per minute to see the 429 rate-limit message.
> 3. Verify the spinner overlay appears only during uploads.

## ⚙️ How to Run Locally

1. `npm install`
2. Create `.env.local` and add API keys when upgrading to real AI providers:
   ```
   STABILITY_API_KEY=your_stability_token
   STABILITY_ENGINE_ID=stable-diffusion-xl-1024-v1-0   # optional override
   ```
3. `npm run dev`
4. Visit [http://localhost:3000](http://localhost:3000)

> **Production tip**: The mock generators write to `/tmp`. Ensure your deploy target has writable ephemeral storage or adapt the helpers to use object storage before going live.

## 🧪 Demo Flow

1. **Generate creatives** on the home page (upload logo + product + choose style)
2. Copy the surfaced **batch ID** and jump to `/preview?batchId=...`
3. Run `/api/captions` (Thunder Client/curl) to populate copy if desired
4. Use the preview gallery to present the grid, captions, and batch stats
5. Download the ready-to-share ZIP directly from the preview page

## 🔐 API Keys

- **STABILITY_API_KEY** — enables real image generation via Stability.
- Optional override: `STABILITY_ENGINE_ID` for custom engines.
- When unset, the app automatically falls back to mock creatives for local demos.

> Costs: Stability image generation consumes paid API credits. Be sure to guard your key and monitor usage.

## 📝 Notes

- Temporary assets live under `/tmp/batch-*`
- Batch IDs use timestamps + random strings for easy sorting
- Async/await everywhere (no `.then` chains)
- Rate limiting guards the generation endpoint (3 req/min per IP)

## 🎨 Design Philosophy

- Minimalistic and modern UI
- Tailwind spacing rules
- Rounded-xl cards
- Soft shadows
- Centered containers
- Grid gallery with hover effects

---

**Status**: Phase 7 Complete ✅ | Project ready to demo
