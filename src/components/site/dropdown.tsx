'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type DropdownOption<T> = { value: T; label: string };

const ROW_HEIGHT = 30;

/** A styled replacement for <select>, with the same keyboard controls. It opens upward when there is no room below. */
export function Dropdown<T extends string | number>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex(option => option.value === value));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function show() {
    const box = root.current!.getBoundingClientRect();
    const below = window.innerHeight - box.bottom;
    setAbove(below < options.length * ROW_HEIGHT + 16 && box.top > below);
    setActive(selected);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, options.length - 1),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div className="dropdown" ref={root}>
      <button
        type="button"
        className="dropdown-button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span>{options[selected]?.label}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        // The button keeps focus while the list is open, so pressing on the list must not take it away.
        <ul className={`dropdown-list ${above ? 'opens-up' : 'opens-down'}`} id={`${id}-list`} role="listbox" aria-label={label} onMouseDown={e => e.preventDefault()}>
          {options.map((option, i) => (
            <li
              key={option.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === selected}
              className={`dropdown-option ${i === active ? 'is-active' : ''}`}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {option.label}
              {i === selected && <Check size={13} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
