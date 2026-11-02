import { GuideRail } from '@/components/guide/guide-rail';
import { GuideSidebar, type OutlineSection } from '@/components/guide/guide-sidebar';
import { guideOutline } from '@/content/guide';

const pick = ({ slug, title }: { slug: string; title: string }) => ({ slug, title });

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  // Only plain data can cross into the client components, and document bodies are not plain data.
  const outline: OutlineSection[] = guideOutline().map(group => ({
    section: group.section,
    docs: group.docs.map(pick),
    modules: group.modules.map(module => ({ title: module.title, href: module.href, docs: module.docs.map(pick) })),
  }));
  return (
    <div className="guide">
      <GuideSidebar outline={outline} />
      {children}
      <GuideRail outline={outline} />
    </div>
  );
}
