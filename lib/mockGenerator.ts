import { promises as fs } from 'fs';
import path from 'path';

const PLACEHOLDER_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB' +
    'MklEQVR4nO3bQQ3CMAxF0S5o/7+o2iJGpUpA4mQ0cu7lIOLLmOb2CCbYwAAAAAAAAAAAD8F1P0u' +
    '35vj0XadB1iKsFcEYyvIFwVjK8gXBWMr6JYJ4WcZtPFlgEFYyvIFwVjK8gXBWMr8hXznrsCG2l9' +
    'H14CXBWMryBcFYyvIFwVjK8gXBXMr6JYJ4WcbSLR7l2Q9I1B7pcbVDaAnBWMr8gXBWMryBcFYyv' +
    'IFwVzK+iWC+HmV2Gbn7dqu4s7FWMryBcFYyvIFwVjK8gXBXMr6JYJ4WcbfC7oLk+i3v14CXBWMry' +
    'BcFYyvIFwVjK8gXBWMr6JYL4eZf+BcAAAAAAAAAAAAwN8G0vYgZF8VEAAAAElFTkSuQmCC',
  'base64',
);

type MockCreativeOptions = {
  creativesDir: string;
  count?: number;
  style: string;
  prompt: string;
};

/**
 * Generates placeholder creatives to emulate an AI image batch.
 * TODO: Replace with actual OpenAI/Stability integration in a later phase.
 */
export async function generateMockCreatives({
  creativesDir,
  count = 10,
  style,
  prompt,
}: MockCreativeOptions) {
  const createdFiles: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const fileName = `creative-${String(index + 1).padStart(2, '0')}.png`;
    const filePath = path.join(creativesDir, fileName);

    await fs.writeFile(filePath, PLACEHOLDER_PIXEL);
    createdFiles.push(fileName);
  }

  return createdFiles;
}

