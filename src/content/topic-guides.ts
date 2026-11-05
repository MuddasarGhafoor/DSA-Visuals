import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { topicSlug, type Topic } from '../lib/catalog.ts';
import { parseGuide, type ParsedGuide } from '../lib/guide-markdown.ts';

const cache = new Map<string, ParsedGuide>();

/** Reads a topic's guide from src/content/topic-guides/<slug>.md. This runs on the server while the site is built. */
export function topicGuide(topic: Topic): ParsedGuide {
  const slug = topicSlug(topic);
  let guide = cache.get(slug);
  if (!guide) {
    const source = readFileSync(join(process.cwd(), 'src', 'content', 'topic-guides', `${slug}.md`), 'utf8');
    try {
      guide = parseGuide(source);
    } catch (error) {
      throw new Error(`In the guide for ${topic.title}: ${(error as Error).message}`);
    }
    cache.set(slug, guide);
  }
  return guide;
}
