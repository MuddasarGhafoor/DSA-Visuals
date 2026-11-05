'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { SidePanel } from '@/components/site/side-panel';
import type { OutlineItem } from '@/lib/guide-markdown';
import { useActiveSection } from '@/lib/use-active-section';

/** Only this one topic: the way back, its category, its sections, and the way on to its simulator. */
export function TopicGuideSidebar({ title, category, categoryId, simulator, outline }: {
  title: string;
  category: string;
  categoryId: string;
  simulator: string;
  outline: OutlineItem[];
}) {
  const ids = useMemo(() => outline.flatMap(item => [item.id, ...item.subs.map(sub => sub.id)]), [outline]);
  const active = useActiveSection(ids);

  return (
    <SidePanel label="Contents">
      <nav className="article-nav" aria-label={`${title} contents`}>
        <Link className="article-nav-back" href={`/topics#${categoryId}`}><ArrowLeft size={14} />Back to Topics</Link>
        <div className="article-nav-category">{category}</div>
        <hr className="article-nav-rule" />
        <div className="article-nav-topic">{title}</div>
        <ul className="article-nav-sections">
          {outline.map(item => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={item.id === active ? 'is-active' : ''}>{item.title}</a>
              {item.subs.length > 0 && (
                <ul className="article-nav-subs">
                  {item.subs.map(sub => (
                    <li key={sub.id}><a href={`#${sub.id}`} className={sub.id === active ? 'is-active' : ''}>{sub.title}</a></li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <hr className="article-nav-rule" />
        <Link className="btn btn-primary article-nav-simulator" href={simulator}>Open Simulator<ArrowUpRight size={14} /></Link>
      </nav>
    </SidePanel>
  );
}
