'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export type RailItem = { key: string; label: string; heading?: string; tone?: string };

/** The side panel: what is happening now, and the full list of steps to jump between. */
export function StepsRail({
  title,
  detail,
  counter,
  extra,
  items,
  current,
  onSelect,
  empty,
}: {
  title: string;
  detail: string;
  counter?: string;
  extra?: ReactNode;
  items: RailItem[];
  current: number;
  onSelect: (index: number) => void;
  empty?: ReactNode;
}) {
  const list = useRef<HTMLOListElement>(null);

  // Scroll only the list. scrollIntoView would also move the page on small screens.
  useEffect(() => {
    const element = list.current;
    const row = element?.querySelector<HTMLElement>('.is-current');
    if (!element) return;
    // Before the first step, no row is current yet.
    if (!row) {
      element.scrollTop = 0;
      return;
    }
    const top = row.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop;
    const bottom = top + row.offsetHeight;
    // The margin keeps the next step in view too, and any heading above the current one.
    const margin = Math.min(44, (element.clientHeight - row.offsetHeight) / 2);
    if (top - margin < element.scrollTop) element.scrollTop = top - margin;
    else if (bottom + margin > element.scrollTop + element.clientHeight) element.scrollTop = bottom + margin - element.clientHeight;
  }, [current, items]);

  return (
    <aside className="rail" aria-label="Steps">
      <div className="rail-now" aria-live="polite">
        {counter && <span className="kicker">{counter}</span>}
        <h2>{title}</h2>
        <p>{detail}</p>
        {extra}
      </div>
      {items.length ? (
        <ol className="rail-list" ref={list}>
          {items.map((item, i) => (
            <li key={item.key}>
              {item.heading && <div className="rail-heading">{item.heading}</div>}
              <button className={`rail-row ${i === current ? 'is-current' : i < current ? 'is-past' : ''}`} aria-current={i === current ? 'step' : undefined} onClick={() => onSelect(i)}>
                <span className={`rail-dot ${item.tone ?? ''}`} />
                <span className="rail-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rail-empty">{empty}</div>
      )}
    </aside>
  );
}
