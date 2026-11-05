'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleHelp, Moon, Sun } from 'lucide-react';
import { topicAt } from '@/lib/catalog';
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
  const opened = topicAt(path);
  const inTopics = path.startsWith('/topics') || Boolean(opened);
  const inGuide = path.startsWith('/guide');

  return (
    <header className="nav">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="nav-start">
        <Link href="/" className="nav-brand"><Logo /><span>DSA Visuals</span></Link>
        <span className="nav-sep" aria-hidden="true" />
        <nav className="nav-links" aria-label="Main">
          <Link href="/" className={`nav-link ${path === '/' ? 'is-active' : ''}`} aria-current={path === '/' ? 'page' : undefined}>Home</Link>
          <Link href="/topics" className={`nav-link ${inTopics ? 'is-active' : ''}`} aria-current={path === '/topics' ? 'page' : undefined}>Topics</Link>
        </nav>
      </div>

      {opened ? <div className="nav-topic"><opened.group.Icon size={14} /><span>{opened.topic.title}</span></div> : <div />}

      <div className="nav-end">
        <SiteSearch />
        <Link href="/guide" className={`icon-btn nav-guide ${inGuide ? 'is-active' : ''}`} aria-label="Guide" title="Guide" aria-current={inGuide ? 'page' : undefined}><CircleHelp size={15} /></Link>
        <button className="icon-btn nav-theme" onClick={toggleTheme} aria-label="Switch between light and dark theme" title="Switch theme">
          <Sun className="only-dark" size={15} />
          <Moon className="only-light" size={15} />
        </button>
      </div>
    </header>
  );
}
