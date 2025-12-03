import { promises as fs } from 'fs';
import path from 'path';

type StabilityImageOptions = {
  prompt: string;
  count: number;
  creativesDir: string;
  style: string;
};

type StabilityArtifact = {
  base64?: string;
};

type StabilityResponse = {
  artifacts?: StabilityArtifact[];
};

const DEFAULT_ENGINE =
  process.env.STABILITY_ENGINE_ID ?? 'stable-diffusion-xl-1024-v1-0';

const STABILITY_API_URL = (engineId: string) =>
  `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

const ALLOWED_STYLE_PRESETS = [
  "analog-film",
  "anime",
  "cinematic",
  "comic-book",
  "digital-art",
  "enhance",
  "fantasy-art",
  "isometric",
  "line-art",
  "low-poly",
  "modeling-compound",
  "neon-punk",
  "origami",
  "photographic",
  "pixel-art",
  "3d-model",
  "tile-texture",
];

export async function generateStabilityImages({
  prompt,
  count,
  creativesDir,
  style,
}: StabilityImageOptions) {
  
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("STABILITY_API_KEY is not configured.");

  const finalStyle = ALLOWED_STYLE_PRESETS.includes(style)
    ? style
    : "photographic";

  const body = {
    text_prompts: [{ text: prompt }],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    samples: count,
    style_preset: finalStyle,
  };

  const response = await fetch(STABILITY_API_URL(DEFAULT_ENGINE), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `Stability image API failed (${response.status}): ${errorPayload}`
    );
  }

  const payload = (await response.json()) as StabilityResponse;
  const artifacts = payload?.artifacts ?? [];

  if (!artifacts.length) {
    throw new Error("Stability image API returned no artifacts.");
  }

  const savedFiles: string[] = [];

  await Promise.all(
    artifacts.slice(0, count).map(async (artifact, index) => {
      if (!artifact.base64) return;
      const buffer = Buffer.from(artifact.base64, "base64");
      const fileName = `creative-${String(index + 1).padStart(2, "0")}.png`;
      const filePath = path.join(creativesDir, fileName);
      await fs.writeFile(filePath, buffer);
      savedFiles.push(fileName);
    })
  );

  if (!savedFiles.length) {
    throw new Error("Failed to persist Stability images.");
  }

  return savedFiles;
}
