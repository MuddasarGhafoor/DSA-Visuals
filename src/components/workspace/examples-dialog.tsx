'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ExampleLevel } from '@/content/examples';

/** A modal with one tab per difficulty. It uses <dialog>, so focus and Escape work natively. */
export function ExamplesDialog<T>({
  open,
  onClose,
  title,
  levels,
  renderItem,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  levels: ExampleLevel<T>[];
  renderItem: (item: T) => ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const level = levels[active];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.focus(); // Otherwise the close button takes focus and looks selected on opening.
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="dialog"
      tabIndex={-1}
      aria-label={title}
      onClose={onClose}
      onClick={e => {
        if (e.target === dialog.current) onClose(); // A click on the backdrop.
      }}
    >
      <div className="dialog-body">
        <header className="dialog-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><X size={15} /></button>
        </header>
        <div className="dialog-tabs" role="tablist">
          {levels.map((item, i) => (
            <button key={item.level} role="tab" aria-selected={i === active} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>{item.level}</button>
          ))}
        </div>
        <p className="dialog-hint">{level.hint}</p>
        <ul className="example-list" role="tabpanel">
          {level.items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}
        </ul>
      </div>
    </dialog>
  );
}
