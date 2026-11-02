'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ScrollArea } from '@/components/site/scroll-area';
import { toHeadingId } from '@/lib/search';
import { useActiveSection } from '@/lib/use-active-section';
import type { OutlineSection } from './guide-sidebar';

type Heading = { id: string; title: string };
type Part = Heading & { subs: Heading[] };

/** The right column: the parts of the page being read, with the current part's sub-headings. */
export function GuideRail({ outline }: { outline: OutlineSection[] }) {
  const current = usePathname().split('/').pop();
  const [parts, setParts] = useState<Part[]>([]);
  const module = outline.flatMap(group => group.modules).find(m => m.docs.some(doc => doc.slug === current));

  // Page bodies are written as plain markup, so their headings are read from the page.
  useEffect(() => {
    const found: Part[] = [];
    for (const h of document.querySelectorAll<HTMLElement>('.doc-body h2, .doc-body h3')) {
      const title = h.textContent ?? '';
      if (h.tagName === 'H2') {
        h.id ||= toHeadingId(title);
        found.push({ id: h.id, title, subs: [] });
      } else if (found.length) {
        // Several parts of a page can share a sub-heading such as "Good to Know".
        const part = found.at(-1)!;
        h.id = `${part.id}-${toHeadingId(title)}`;
        part.subs.push({ id: h.id, title });
      }
    }
    setParts(found);
    // These ids didn't exist when the browser looked for the link's target.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) document.getElementById(hash)?.scrollIntoView();
  }, [current]);

  const ids = useMemo(() => parts.flatMap(part => [part.id, ...part.subs.map(sub => sub.id)]), [parts]);
  const active = useActiveSection(ids);

  if (!module && !parts.length) return <aside className="guide-rail" />;

  const title = module ? module.title : 'On This Page';
  return (
    <aside className={`guide-rail ${module ? 'has-module' : ''}`} aria-label={title}>
      <ScrollArea>
        <div className="guide-rail-title">{title}</div>
        <ul className="guide-rail-docs">
          {parts.map(part => {
            const open = part.id === active || part.subs.some(sub => sub.id === active);
            return (
              <li key={part.id}>
                <a href={`#${part.id}`} className={open ? 'is-current' : ''}>{part.title}</a>
                {open && part.subs.length > 0 && (
                  <ul className="guide-rail-headings">
                    {part.subs.map(sub => (
                      <li key={sub.id}><a href={`#${sub.id}`} className={sub.id === active ? 'is-current' : ''}>{sub.title}</a></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        {module && <Link className="guide-rail-open" href={module.href}>Open {module.title}<ArrowUpRight size={13} /></Link>}
      </ScrollArea>
    </aside>
  );
}
