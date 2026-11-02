'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { analyzeExpression } from '@/lib/expressions';
import { buildExpressionFrames } from '@/lib/expression-frames';
import { operateTree, traversalSteps, type TraversalOrder, type TreeMode, type TreeOperation } from '@/lib/trees';
import { FRAME_MS, prefersReducedMotion } from '@/lib/use-playback';
import { expressionVisual, treeTrail, treeVisual } from './mappers';
import { TreeCanvas, type VisualNode } from './tree-canvas';

export type DemoScene = { label: string; href?: string } & (
  | { kind: 'expression'; input: string }
  | { kind: 'tree'; mode: TreeMode; seed?: string; operation?: TreeOperation; values: string }
  | { kind: 'traversal'; mode: TreeMode; values: string; order: TraversalOrder }
);

type DemoFrame = { root: VisualNode | null; trail: string[]; title: string };

function buildFrames(scene: DemoScene): DemoFrame[] {
  if (scene.kind === 'expression') {
    const analysis = analyzeExpression(scene.input);
    return buildExpressionFrames(analysis).map(frame => ({ root: expressionVisual(analysis.root, frame), trail: [], title: frame.title }));
  }
  const seed = scene.kind === 'traversal' ? scene.values : scene.seed;
  const base = seed ? operateTree(null, seed, 'insert', scene.mode).at(-1)!.root : null;
  const steps = scene.kind === 'traversal' ? traversalSteps(base, scene.order) : operateTree(base, scene.values, scene.operation ?? 'insert', scene.mode);
  return steps.map(step => ({
    root: treeVisual(step.root, step, scene.mode),
    trail: treeTrail(step),
    title: step.title,
  }));
}

const END_PAUSE_MS = 1800;

/** A self-running, read-only visualization. With several scenes it moves from one concept to the next. */
export function LiveDemo({ scenes, height = 280, frameMs = FRAME_MS * 0.85, className = '' }: { scenes: DemoScene[]; height?: number; frameMs?: number; className?: string }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const all = useMemo(() => scenes.map(buildFrames), [scenes]);
  const frames = all[sceneIndex];
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const scene = scenes[sceneIndex];
  const progress = (frameIndex + 1) / frames.length;
  const several = scenes.length > 1;

  useEffect(() => setRunning(!prefersReducedMotion()), []);

  useEffect(() => {
    if (!running) return;
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
  }, [running, frameIndex, frames.length, scenes.length, frameMs]);

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
        <TreeCanvas root={frame.root} trail={frame.trail} bare duration={420} label={scene.label} />
      </div>
      <figcaption className="demo-caption">
        <span>{frame.title}</span>
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
