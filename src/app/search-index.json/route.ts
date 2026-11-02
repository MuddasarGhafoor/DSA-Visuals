import { buildSearchIndex } from '@/content/search-index';

export const dynamic = 'force-static';

// Served as a file and fetched when search first opens, so pages don't carry the whole guide.
export function GET() {
  return Response.json(buildSearchIndex());
}
