'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidePanel } from '@/components/site/side-panel';

export type OutlineDoc = { slug: string; title: string };
export type OutlineSection = { section: string; docs: OutlineDoc[] };

export function GuideSidebar({ outline }: { outline: OutlineSection[] }) {
  const current = usePathname().split('/').pop();
  return (
    <SidePanel label="Guide Contents">
      <nav aria-label="Guide">
        {outline.map(group => (
          <div className="guide-group" key={group.section}>
            <div className="guide-group-title">{group.section}</div>
            <ul>
              {group.docs.map(doc => (
                <li key={doc.slug}>
                  <Link href={`/guide/${doc.slug}`} className={doc.slug === current ? 'is-current' : ''} aria-current={doc.slug === current ? 'page' : undefined}>{doc.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </SidePanel>
  );
}
