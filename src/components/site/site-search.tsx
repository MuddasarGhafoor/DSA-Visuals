'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchEntries, searchSnippet, searchWords, type SearchEntry } from '@/lib/search';

function Highlight({ text, query }: { text: string; query: string }) {
  const words = searchWords(query).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return text;
  return text.split(new RegExp(`(${words.join('|')})`, 'gi')).map((piece, i) => (i % 2 ? <mark key={i}>{piece}</mark> : piece));
}

/** The search button in the navbar, and the box it opens. Also opens with Ctrl+K. */
export function SiteSearch() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    fetch('/search-index.json')
      .then(response => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(setEntries)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const element = dialog.current!;
    if (open && !element.open) {
      element.showModal();
      input.current?.focus();
      if (!entries) load();
    }
    if (!open && element.open) element.close();
  }, [open, entries, load]);

  const results = useMemo(() => {
    if (!entries) return [];
    if (query.trim()) return searchEntries(entries, query);
    // Before anything is typed, offer what is ready to use and where to start.
    return entries.filter(entry => entry.kind === 'Tool' || entry.href === '/guide/overview');
  }, [entries, query]);

  useEffect(() => {
    list.current?.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' });
  }, [selected, results]);

  function close() {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) setSelected(i => (i + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length);
    }
    if (e.key === 'Enter' && results[selected]) {
      router.push(results[selected].href);
      close();
    }
  }

  const searching = query.trim().length > 0;

  return (
    <>
      <button className="icon-btn nav-search" onClick={() => setOpen(true)} aria-label="Search topics and the guide" title="Search (Ctrl+K)">
        <Search size={15} />
      </button>
      <dialog
        ref={dialog}
        className="search"
        aria-label="Search"
        onClose={close}
        onClick={e => {
          if (e.target === dialog.current) close(); // A click on the backdrop.
        }}
      >
        <div className="search-field">
          <Search size={15} />
          <input
            ref={input}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[selected] ? `search-result-${selected}` : undefined}
            aria-label="Search topics and the guide"
            placeholder="Search topics and the guide"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onInputKey}
          />
          <kbd>Esc</kbd>
        </div>

        <div className="search-results" id="search-results" role="listbox" aria-label="Results" ref={list}>
          {failed && (
            <div className="search-note">
              <strong>Search couldn&apos;t load</strong>
              <p>Check your connection and try again.</p>
              <button className="btn" onClick={load}>Try Again</button>
            </div>
          )}
          {!failed && !entries && <div className="search-note"><p>Loading…</p></div>}
          {entries && !searching && <div className="search-heading">Ready to Use</div>}
          {entries && searching && results.length === 0 && (
            <div className="search-note">
              <strong>No results for &ldquo;{query.trim()}&rdquo;</strong>
              <p>Check the spelling, or try a broader word such as &ldquo;tree&rdquo; or &ldquo;stack&rdquo;.</p>
              <p className="search-note-links">
                <Link href="/topics" onClick={close}>Browse Topics</Link>
                <Link href="/guide" onClick={close}>Read the Guide</Link>
              </p>
            </div>
          )}
          {results.map((entry, i) => {
            const snippet = searching ? searchSnippet(entry.text, query) : '';
            return (
              <Link
                key={entry.href + entry.title}
                id={`search-result-${i}`}
                role="option"
                aria-selected={i === selected}
                tabIndex={-1}
                className={`search-result ${i === selected ? 'is-selected' : ''}`}
                href={entry.href}
                onMouseMove={() => setSelected(i)}
                onClick={close}
              >
                <span className="search-result-title">
                  <strong><Highlight text={entry.title} query={query} /></strong>
                  {entry.soon && <em>Soon</em>}
                  <small>{entry.context}</small>
                </span>
                {snippet && <span className="search-result-text"><Highlight text={snippet} query={query} /></span>}
              </Link>
            );
          })}
        </div>

        <div className="search-foot" aria-hidden="true">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Move</span>
          <span><kbd>Enter</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </dialog>
    </>
  );
}
