'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { ScrollArea } from '@/components/site/scroll-area';

export type OutlineDoc = { slug: string; title: string };
export type OutlineModule = { title: string; href: string; docs: OutlineDoc[] };
export type OutlineSection = { section: string; docs: OutlineDoc[]; modules: OutlineModule[] };

export function GuideSidebar({ outline }: { outline: OutlineSection[] }) {
  const current = usePathname().split('/').pop();
  const [wide, setWide] = useState(true);
  const details = useRef<HTMLDetailsElement>(null);

  // On wide screens the sidebar is always open. On small ones it folds away after each choice.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 981px)');
    const update = () => setWide(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (details.current) details.current.open = wide;
    if (wide) details.current?.querySelector('.is-current')?.scrollIntoView({ block: 'nearest' });
  }, [wide, current]);

  return (
    <details className="guide-side" ref={details} open>
      <summary><Menu size={14} />Guide Contents</summary>
      <ScrollArea>
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
                {/* A module is one row here. Its parts are listed on the right once it's open. */}
                {group.modules.map(module => (
                  <li key={module.title}>
                    <Link href={`/guide/${module.docs[0].slug}`} className={module.docs.some(doc => doc.slug === current) ? 'is-current' : ''}>{module.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </details>
  );
}
