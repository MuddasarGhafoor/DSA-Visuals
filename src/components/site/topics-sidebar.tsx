'use client';

import { catalog } from '@/lib/catalog';
import { useActiveSection } from '@/lib/use-active-section';

const ids = catalog.map(group => group.id);

export function TopicsSidebar() {
  const active = useActiveSection(ids);
  return (
    <nav className="topics-side" aria-label="Categories">
      <div className="side-scroll">
        <ul>
          {catalog.map(group => (
            <li key={group.id}>
              <a href={`#${group.id}`} className={group.id === active ? 'is-active' : ''} aria-current={group.id === active ? 'location' : undefined}>
                <group.Icon size={13} /><span>{group.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
