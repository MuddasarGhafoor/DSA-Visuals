'use client';

import { useEffect, useState } from 'react';
import type { SimulatorDef } from '@/simulators/kit';
import { loadSimulator } from '@/simulators/registry';
import { SimulatorShell } from './simulator-shell';

/** Loads only this topic's category of simulators, so no page carries the logic for all of them. */
export function SimulatorPage({ slug, title }: { slug: string; title: string }) {
  const [def, setDef] = useState<SimulatorDef | null>(null);

  useEffect(() => {
    let current = true;
    loadSimulator(slug).then(loaded => {
      if (current) setDef(loaded);
    });
    return () => {
      current = false;
    };
  }, [slug]);

  if (!def) return <div className="ws" aria-busy="true"><div className="ws-error"><p>Loading the {title} simulator…</p></div></div>;
  return <SimulatorShell key={slug} def={def} slug={slug} title={title} />;
}
