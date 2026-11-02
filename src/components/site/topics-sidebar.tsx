'use client';

import { catalog } from '@/lib/catalog';
import { useActiveSection } from '@/lib/use-active-section';
import { ScrollArea } from './scroll-area';

const ids = catalog.map(group => group.id);

export function TopicsSidebar() {
  const active = useActiveSection(ids);
  return (
    <nav className="topics-side" aria-label="Categories">
      <ScrollArea>
        <ul>
          {catalog.map(group => (
            <li key={group.id}>
              <a href={`#${group.id}`} className={group.id === active ? 'is-active' : ''} aria-current={group.id === active ? 'location' : undefined}>
                <group.Icon size={13} /><span title={group.title}>{group.shortTitle ?? group.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </nav>
  );
}
