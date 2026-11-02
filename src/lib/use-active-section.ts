'use client';

import { useEffect, useState } from 'react';

/** Which section the reader is at, for highlighting it in a sidebar. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join();

  useEffect(() => {
    if (!ids.length) return;
    const update = () => {
      const line = (document.querySelector<HTMLElement>('.nav')?.offsetHeight ?? 0) + 24;
      const passed = ids.filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= line);
      let next = passed.at(-1) ?? ids[0];
      // Sections near the end can't scroll up to the line, so at the bottom the link just used wins.
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        const hash = decodeURIComponent(window.location.hash.slice(1));
        const target = ids.includes(hash) ? document.getElementById(hash)?.getBoundingClientRect() : undefined;
        next = target && target.top < window.innerHeight ? hash : ids.at(-1)!;
      }
      setActive(next);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('hashchange', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}
