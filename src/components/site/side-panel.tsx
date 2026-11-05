'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';

/** A left sidebar. On wide screens it is always open. On small ones it folds away after each choice. */
export function SidePanel({ label, children }: { label: string; children: ReactNode }) {
  const path = usePathname();
  const [wide, setWide] = useState(true);
  const details = useRef<HTMLDetailsElement>(null);

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
  }, [wide, path]);

  return (
    <details className="guide-side" ref={details} open>
      <summary><Menu size={14} />{label}</summary>
      <div className="side-scroll">{children}</div>
    </details>
  );
}
