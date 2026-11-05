import { GuideSidebar, type OutlineSection } from '@/components/guide/guide-sidebar';
import { guideOutline } from '@/content/guide';

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  // Only plain data can cross into the client components, and document bodies are not plain data.
  const outline: OutlineSection[] = guideOutline().map(group => ({
    section: group.section,
    docs: group.docs.map(({ slug, title }) => ({ slug, title })),
  }));
  return (
    <div className="guide">
      <GuideSidebar outline={outline} />
      {children}
    </div>
  );
}
