'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { PanelView } from '@/components/simulator/panels';
import { analyzeExpression } from '@/lib/expressions';
import { buildExpressionFrames } from '@/lib/expression-frames';
import { operateTree, traversalSteps, type TraversalOrder, type TreeMode, type TreeOperation } from '@/lib/trees';
import { FRAME_MS, prefersReducedMotion } from '@/lib/use-playback';
import { defaultValues, type Panel, type Values } from '@/simulators/kit';
import { loadSimulator } from '@/simulators/registry';
import { expressionVisual, treeTrail, treeVisual } from './mappers';
import { TreeCanvas, type VisualNode } from './tree-canvas';

export type DemoScene = { label: string; href?: string } & (
  | { kind: 'expression'; input: string }
  | { kind: 'tree'; mode: TreeMode; seed?: string; operation?: TreeOperation; values: string }
  | { kind: 'traversal'; mode: TreeMode; values: string; order: TraversalOrder }
  | { kind: 'simulator'; slug: string; values?: Values }
);

type DemoFrame = { title: string } & ({ type: 'tree'; root: VisualNode | null; trail: string[] } | { type: 'panels'; panels: Panel[] });

function buildFrames(scene: Exclude<DemoScene, { kind: 'simulator' }>): DemoFrame[] {
  if (scene.kind === 'expression') {
    const analysis = analyzeExpression(scene.input);
    return buildExpressionFrames(analysis).map(frame => ({ type: 'tree', root: expressionVisual(analysis.root, frame), trail: [], title: frame.title }));
  }
  const seed = scene.kind === 'traversal' ? scene.values : scene.seed;
  const base = seed ? operateTree(null, seed, 'insert', scene.mode).at(-1)!.root : null;
  const steps = scene.kind === 'traversal' ? traversalSteps(base, scene.order) : operateTree(base, scene.values, scene.operation ?? 'insert', scene.mode);
  return steps.map(step => ({ type: 'tree', root: treeVisual(step.root, step, scene.mode), trail: treeTrail(step), title: step.title }));
}

/** A shared simulator, run on the given input. Only its main views fit in a preview, so side panels are left out. */
async function simulatorFrames(slug: string, values?: Values): Promise<DemoFrame[]> {
  const def = await loadSimulator(slug);
  return def.run({ ...defaultValues(def), ...values }).frames.map(frame => ({ type: 'panels', title: frame.title, panels: frame.panels.filter(panel => panel.zone !== 'side') }));
}

const END_PAUSE_MS = 1800;

/** A self-running, read-only visualization. With several scenes it moves from one concept to the next. */
export function LiveDemo({ scenes, height = 280, frameMs = FRAME_MS * 0.85, className = '' }: { scenes: DemoScene[]; height?: number; frameMs?: number; className?: string }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, DemoFrame[]>>({});
  const requested = useRef(new Set<number>());
  const ready = useMemo(() => scenes.map(scene => (scene.kind === 'simulator' ? null : buildFrames(scene))), [scenes]);
  const frames = ready[sceneIndex] ?? loaded[sceneIndex] ?? null;
  const frame = frames?.[Math.min(frameIndex, frames.length - 1)];
  const scene = scenes[sceneIndex];
  const progress = frames ? (frameIndex + 1) / frames.length : 0;
  const several = scenes.length > 1;

  useEffect(() => setRunning(!prefersReducedMotion()), []);

  // A simulator's logic loads only when its scene is showing or next, so the page itself stays light.
  useEffect(() => {
    for (const at of [sceneIndex, (sceneIndex + 1) % scenes.length]) {
      const item = scenes[at];
      if (item.kind !== 'simulator' || requested.current.has(at)) continue;
      requested.current.add(at);
      simulatorFrames(item.slug, item.values)
        .then(built => setLoaded(current => ({ ...current, [at]: built })))
        .catch(() => setLoaded(current => ({ ...current, [at]: [{ type: 'panels', title: 'This preview could not load.', panels: [] }] })));
    }
  }, [sceneIndex, scenes]);

  useEffect(() => {
    if (!running || !frames) return;
    const atEnd = frameIndex >= frames.length - 1;
    const timer = setTimeout(() => {
      if (!atEnd) {
        setFrameIndex(i => i + 1);
      } else {
        setSceneIndex(i => (i + 1) % scenes.length);
        setFrameIndex(0);
      }
    }, atEnd ? END_PAUSE_MS : frameMs);
    return () => clearTimeout(timer);
  }, [running, frameIndex, frames, scenes.length, frameMs]);

  return (
    <figure className={`demo ${className}`}>
      {several && (
        <div className="demo-head">
          <strong key={sceneIndex}>{scene.label}</strong>
          {scene.href && <Link href={scene.href}>Open<ArrowUpRight size={13} /></Link>}
        </div>
      )}
      <div className="demo-stage" key={sceneIndex} style={{ height }}>
        {/* Keyed by scene so nodes do not fly between unrelated trees. */}
        {!frame && <div className="demo-loading">Loading {scene.label}…</div>}
        {frame?.type === 'tree' && <TreeCanvas root={frame.root} trail={frame.trail} bare duration={420} label={scene.label} />}
        {frame?.type === 'panels' && <div className="demo-sim">{frame.panels.map((panel, i) => <PanelView key={i} panel={panel} />)}</div>}
      </div>
      <figcaption className="demo-caption">
        <span>{frame?.title ?? ''}</span>
        {!several && <span className="demo-progress" aria-hidden="true"><i style={{ width: `${progress * 100}%` }} /></span>}
      </figcaption>
      {several && (
        <div className="demo-foot">
          <button className="icon-btn" onClick={() => setRunning(r => !r)} aria-label={running ? 'Pause the preview' : 'Play the preview'}>
            {running ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <div className="demo-segments" role="group" aria-label="Choose a concept">
            {scenes.map((item, i) => (
              <button key={item.label} aria-label={item.label} title={item.label} aria-pressed={i === sceneIndex} onClick={() => { setSceneIndex(i); setFrameIndex(0); }}>
                <i style={{ width: `${i < sceneIndex ? 100 : i === sceneIndex ? progress * 100 : 0}%` }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
