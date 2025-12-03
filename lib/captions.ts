const STYLE_TONES: Record<
  string,
  {
    voice: string;
    hookTemplate: (product: string) => string;
    bodyTemplate: (goal: string) => string;
    hashtags: string[];
  }
> = {
  modern: {
    voice: 'Bold, innovative, tech-forward.',
    hookTemplate: (product) => `${product} reimagined for the now.`,
    bodyTemplate: (goal) =>
      `${goal || 'Launch your next campaign'} with motion-inspired energy.`,
    hashtags: ['#FutureReady', '#DesignForward', '#CreativeTech'],
  },
  minimal: {
    voice: 'Quiet confidence with editorial clarity.',
    hookTemplate: (product) => `Pure focus on ${product}.`,
    bodyTemplate: (goal) =>
      `${goal || 'Let simplicity sell'} with crafted negative space.`,
    hashtags: ['#LessButBetter', '#CleanLines', '#VisualCalm'],
  },
  luxury: {
    voice: 'Opulent, tactile, couture-inspired.',
    hookTemplate: (product) => `${product}, elevated to icon status.`,
    bodyTemplate: (goal) =>
      `${goal || 'Curate desire'} with cinematic depth and metallic light.`,
    hashtags: ['#LuxuryEdit', '#GoldenHourGlow', '#IconicDesign'],
  },
  bold: {
    voice: 'High-impact, high-contrast, adrenaline creative.',
    hookTemplate: (product) => `${product} in full volume.`,
    bodyTemplate: (goal) =>
      `${goal || 'Spark instant attention'} with unapologetic color hits.`,
    hashtags: ['#LoudAndClear', '#MakeItPop', '#ScrollStopping'],
  },
};

type CaptionOptions = {
  count: number;
  style?: string;
  productName?: string;
  campaignGoal?: string;
  tone?: string;
};

const generateHashtagSet = (base: string[], index: number) => {
  const rotated = [...base.slice(index % base.length), ...base];
  return rotated.slice(0, 3);
};

/**
 * Produces mock captions so the gallery can display copy per creative.
 * TODO: Replace with actual LLM call (OpenAI GPT-4o mini or similar) in production.
 */
export function generateMockCaptions({
  count,
  style = 'modern',
  productName = 'your product',
  campaignGoal = 'Drive awareness',
  tone,
}: CaptionOptions) {
  const intent = STYLE_TONES[style] ?? STYLE_TONES.modern;

  return Array.from({ length: count }, (_, index) => {
    const baseTitle = intent.hookTemplate(productName);
    const numberedTitle =
      count > 1 ? `${baseTitle} #${index + 1}` : baseTitle;

    return {
      title: numberedTitle,
      tagline: intent.bodyTemplate(campaignGoal),
      hashtags: generateHashtagSet(intent.hashtags, index),
      voice: tone || intent.voice,
    };
  });
}

