type PromptParams = {
  style: string;
  brandNotes?: string;
  productDescription?: string;
};

const STYLE_INTENTS: Record<
  string,
  {
    palette: string;
    mood: string;
    composition: string;
  }
> = {
  modern: {
    palette: 'vibrant gradients, neon accents, glossy plastic reflections',
    mood: 'energetic, bold, futuristic',
    composition: 'floating hero objects, soft depth of field, cinematic glow',
  },
  minimal: {
    palette: 'calm monochrome, subtle pastel accents, clean whites',
    mood: 'refined, quiet confidence, editorial',
    composition: 'ample negative space, product centered, gentle shadows',
  },
  luxury: {
    palette: 'deep blacks, rich gold, champagne metals, marble textures',
    mood: 'opulent, sophisticated, high-end fashion',
    composition: 'spotlit hero product, reflective surfaces, dramatic contrast',
  },
  bold: {
    palette: 'high-contrast primaries, electric accents, saturated tones',
    mood: 'dynamic, action-driven, high-impact',
    composition: 'layered graphic shapes, angled lighting, motion blur hints',
  },
};

/**
 * Builds a descriptive prompt used by the image generation API.
 * TODO: Phase 3 currently returns text for mock generation; integrate with OpenAI/Stability in Phase 3b.
 */
export function buildImagePrompt({
  style,
  brandNotes,
  productDescription,
}: PromptParams): string {
  const intent = STYLE_INTENTS[style] ?? STYLE_INTENTS.modern;

  return [
    'Create a high-resolution advertising creative for a premium product.',
    `Use a ${style} art direction with ${intent.palette}.`,
    `Mood should feel ${intent.mood}.`,
    `Composition guidelines: ${intent.composition}.`,
    brandNotes
      ? `Brand notes: ${brandNotes}`
      : 'Respect uploaded brand colors and logo placement.',
    productDescription
      ? `Product focus: ${productDescription}`
      : 'Showcase hero product clearly with tactile lighting.',
    'No typography, no UI chrome, no watermarks, no people unless implied.',
    'Use cinematic lighting, photoreal textures, and presentation-ready framing.',
  ]
    .filter(Boolean)
    .join(' ');
}

