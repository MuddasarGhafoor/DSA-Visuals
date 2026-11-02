'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Moon, Sun } from 'lucide-react';
import { allTopics, catalog, groupStatus, topicAt } from '@/lib/catalog';
import { Logo } from './logo';
import { SiteSearch } from './site-search';

function toggleTheme() {
  const root = document.documentElement;
  const explicit = root.dataset.theme;
  const isDark = explicit ? explicit === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = isDark ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('dsa-theme', next);
  } catch {
    // The choice just won't survive a reload.
  }
}

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const opened = topicAt(path);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const inTopics = path === '/topics' || Boolean(opened);

  return (
    <header className="nav">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="nav-start">
        <Link href="/" className="nav-brand"><Logo /><span>DSA Visuals</span></Link>
        <span className="nav-sep" aria-hidden="true" />
        <nav className="nav-links" aria-label="Main">
          <Link href="/" className={`nav-link ${path === '/' ? 'is-active' : ''}`} aria-current={path === '/' ? 'page' : undefined}>Home</Link>
          <Link href="/guide" className={`nav-link ${path.startsWith('/guide') ? 'is-active' : ''}`} aria-current={path.startsWith('/guide') ? 'page' : undefined}>Guide</Link>
          <div className="nav-menu" ref={menu}>
            <button className={`nav-link ${inTopics ? 'is-active' : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
              Topics <ChevronDown size={13} />
            </button>
            {open && (
              <div className="nav-panel">
                <div className="nav-panel-grid">
                  {catalog.map(group => (
                    <Link className="nav-panel-group" key={group.id} href={`/topics#${group.id}`} onClick={() => setOpen(false)}>
                      <group.Icon size={15} />
                      <span>
                        <strong>{group.title}</strong>
                        <small>{groupStatus(group)}</small>
                      </span>
                      <ArrowUpRight className="nav-panel-arrow" size={15} />
                    </Link>
                  ))}
                </div>
                <Link className="nav-panel-all" href="/topics" onClick={() => setOpen(false)}>All {allTopics.length} Topics<ArrowRight size={13} /></Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {opened ? <div className="nav-topic"><opened.group.Icon size={14} /><span>{opened.topic.title}</span></div> : <div />}

      <div className="nav-end">
        <SiteSearch />
        <button className="icon-btn nav-theme" onClick={toggleTheme} aria-label="Switch between light and dark theme" title="Switch theme">
          <Sun className="only-dark" size={15} />
          <Moon className="only-light" size={15} />
        </button>
      </div>
    </header>
  );
}
