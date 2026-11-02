'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/use-playback';

/** A column with no scrollbar. When its content doesn't fit, a round arrow at the bottom moves it. */
export function ScrollArea({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'fits' | 'more' | 'end'>('fits');

  useEffect(() => {
    const el = box.current!;
    const update = () => {
      const hidden = el.scrollHeight - el.clientHeight;
      setState(hidden <= 1 ? 'fits' : el.scrollTop >= hidden - 1 ? 'end' : 'more');
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(el.firstElementChild!);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  function move() {
    const el = box.current!;
    const top = state === 'end' ? 0 : el.scrollTop + el.clientHeight * 0.7;
    el.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  return (
    <div className={`scroll-area is-${state}`}>
      <div className="scroll-box" ref={box}><div>{children}</div></div>
      {state !== 'fits' && (
        <button className="scroll-more" onClick={move} aria-label={state === 'end' ? 'Back to the top of this list' : 'Show more of this list'}>
          {state === 'end' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        </button>
      )}
    </div>
  );
}
