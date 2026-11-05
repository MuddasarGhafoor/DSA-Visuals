export type SearchEntry = {
  title: string;
  /** Where it lives, such as "AVL Tree Guide". */
  context: string;
  href: string;
  text: string;
  kind: 'Tool' | 'Topic' | 'Guide';
};

export const toHeadingId = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const searchWords = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

/** Every word must appear somewhere. Matches in the title count most, and ready tools come first. */
export function searchEntries(entries: SearchEntry[], query: string, limit = 12): SearchEntry[] {
  const words = searchWords(query);
  if (!words.length) return [];
  const whole = words.join(' ');
  const scored = entries.flatMap(entry => {
    const title = entry.title.toLowerCase();
    const context = entry.context.toLowerCase();
    const text = entry.text.toLowerCase();
    if (!words.every(word => title.includes(word) || context.includes(word) || text.includes(word))) return [];
    let score = entry.kind === 'Tool' ? 5 : 0;
    if (title === whole) score += 100;
    else if (title.startsWith(whole)) score += 60;
    score += words.filter(word => title.includes(word)).length * 20;
    score += words.filter(word => context.includes(word)).length * 3;
    return [{ entry, score }];
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(item => item.entry);
}

/** A short piece of the text around the first matching word. */
export function searchSnippet(text: string, query: string, length = 120): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const hits = searchWords(query).map(word => lower.indexOf(word)).filter(at => at >= 0);
  const at = hits.length ? Math.min(...hits) : 0;
  if (text.length <= length) return text;
  const start = at < 30 ? 0 : text.indexOf(' ', at - 30) + 1;
  const piece = text.slice(start, start + length).trim();
  return `${start > 0 ? '…' : ''}${piece}${start + length < text.length ? '…' : ''}`;
}
