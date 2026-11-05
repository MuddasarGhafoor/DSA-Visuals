'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/use-playback';

export type NodeTone = 'muted' | 'op' | 'value' | 'active' | 'accent' | 'done' | 'danger' | 'new' | 'path';

export type VisualNode = {
  id: string;
  label: string;
  sublabel?: string;
  sublabelDanger?: boolean;
  shape: 'round' | 'square';
  tone: NodeTone;
  badge?: string;
  absorbedInto?: string; // Slides into this node and fades out.
  centerOverChild?: boolean; // Unary operators sit straight above their one child.
  left?: VisualNode | null;
  right?: VisualNode | null;
  children?: VisualNode[]; // For trees whose nodes can have any number of children. Use instead of left and right.
  hidden?: boolean; // An invisible root, which lets a canvas draw several separate trees side by side.
};

type Point = { x: number; y: number };
type View = { x: number; y: number; w: number; h: number };
type Scene = { positions: Record<string, Point>; view: View };

const SLOT = 50;
const LEVEL = 72;
const NODE_HEIGHT = 36;
const PAD_X = 48;
const PAD_TOP = 52;
const PAD_BOTTOM = 34;
const MAX_SCALE = 1.25;

const nodeWidth = (label: string) => Math.max(NODE_HEIGHT, label.length * 7.6 + 16);

const GAP = 14;
const LEGEND_ROOM = 40;

/** Leaves take the width they need, and each parent sits over the middle of its children. */
function layoutGeneral(root: VisualNode) {
  const placed: { node: VisualNode; parent?: VisualNode; depth: number }[] = [];
  const positions: Record<string, Point> = {};
  let cursor = 0;

  const shift = (node: VisualNode, by: number) => {
    positions[node.id].x += by;
    node.children?.forEach(child => shift(child, by));
  };

  function visit(node: VisualNode, depth: number, parent?: VisualNode) {
    placed.push({ node, parent, depth });
    const start = cursor;
    const width = node.hidden ? 0 : nodeWidth(node.label) + GAP;
    const kids = node.children ?? [];
    kids.forEach(child => visit(child, depth + 1, node));
    const spread = cursor - start;
    if (spread < width) {
      kids.forEach(child => shift(child, (width - spread) / 2)); // A wide parent makes room, so it doesn't overlap its neighbors.
      cursor = start + width;
    }
    const x = kids.length ? (positions[kids[0].id].x + positions[kids.at(-1)!.id].x) / 2 : start + width / 2;
    positions[node.id] = { x, y: depth * LEVEL };
  }
  visit(root, root.hidden ? -1 : 0);

  const xs = placed.filter(p => !p.node.hidden).map(p => positions[p.node.id].x);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  for (const id of Object.keys(positions)) positions[id].x -= minX;
  // The extra height keeps the bottom row clear of the legend.
  const content = { width: maxX - minX, height: placed.reduce((max, p) => Math.max(max, p.depth), 0) * LEVEL + LEGEND_ROOM };
  return { placed, positions, content };
}

function layout(root: VisualNode | null) {
  if (root?.children) return layoutGeneral(root);
  const placed: { node: VisualNode; parent?: VisualNode; depth: number }[] = [];
  const positions: Record<string, Point> = {};
  let slot = 0;

  function visit(node: VisualNode, depth: number, parent?: VisualNode) {
    placed.push({ node, parent, depth });
    if (node.left) visit(node.left, depth + 1, node);
    else if (node.right) slot++; // Keep a lone right child visibly on the right.
    const x = node.centerOverChild && node.left ? positions[node.left.id].x : slot++ * SLOT;
    positions[node.id] = { x, y: depth * LEVEL };
    if (node.right) visit(node.right, depth + 1, node);
    else if (node.left && !node.centerOverChild) slot++; // And a lone left child on the left.
  }
  if (root) visit(root, 0);

  const content = {
    width: Math.max(0, Object.values(positions).reduce((max, p) => Math.max(max, p.x), 0)),
    height: placed.reduce((max, p) => Math.max(max, p.depth), 0) * LEVEL,
  };
  return { placed, positions, content };
}

function fitView(content: { width: number; height: number }, size: { w: number; h: number }): View {
  const w = content.width + PAD_X * 2;
  const h = content.height + PAD_TOP + PAD_BOTTOM;
  // Small trees keep a readable size instead of being blown up to fill the canvas.
  const viewW = Math.max(w, size.w / MAX_SCALE);
  const viewH = Math.max(h, size.h / MAX_SCALE);
  return { x: -PAD_X - (viewW - w) / 2, y: -PAD_TOP - (viewH - h) / 2, w: viewW, h: viewH };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** Moves every node (and the camera) toward its target, so rotations and collapses are visible. */
function useTweenedScene(target: Scene, sourceOf: (id: string) => string | undefined, duration: number): Scene {
  const [scene, setScene] = useState(target);
  const live = useRef(target);
  const key = JSON.stringify(target);

  useEffect(() => {
    if (duration <= 0 || prefersReducedMotion()) {
      live.current = target;
      setScene(target);
      return;
    }
    const from = live.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const k = ease(t);
      const positions: Record<string, Point> = {};
      for (const [id, to] of Object.entries(target.positions)) {
        const source = sourceOf(id);
        const start = from.positions[id] ?? (source ? from.positions[source] : undefined) ?? to; // New nodes grow out of their parent.
        positions[id] = { x: mix(start.x, to.x, k), y: mix(start.y, to.y, k) };
      }
      const view = {
        x: mix(from.view.x, target.view.x, k),
        y: mix(from.view.y, target.view.y, k),
        w: mix(from.view.w, target.view.w, k),
        h: mix(from.view.h, target.view.h, k),
      };
      live.current = { positions, view };
      setScene(live.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // The serialized key is the dependency: unchanged layouts should not restart the motion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration]);

  return scene;
}

type CanvasProps = {
  root: VisualNode | null;
  trail?: string[];
  duration?: number;
  bare?: boolean; // No zoom controls or dragging.
  empty?: ReactNode;
  legend?: { tone: NodeTone; label: string }[];
  label?: string;
};

export function TreeCanvas(props: CanvasProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize({ w: width, h: height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Wait for the real size, so the first paint is already fitted instead of zooming into place.
  return <div className="canvas" ref={box}>{size && <CanvasContent {...props} size={size} />}</div>;
}

function CanvasContent({ root, trail = [], duration = 480, bare = false, empty, legend, label = 'Tree diagram', size }: CanvasProps & { size: { w: number; h: number } }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const drag = useRef<Point | null>(null);

  const { placed, positions, content } = useMemo(() => layout(root), [root]);
  const parents = useMemo(() => new Map(placed.map(p => [p.node.id, p.parent?.hidden ? undefined : p.parent?.id])), [placed]);

  // Absorbed nodes aim for the node that swallows them.
  const targets: Record<string, Point> = {};
  for (const { node } of placed) targets[node.id] = node.absorbedInto ? positions[node.absorbedInto] : positions[node.id];
  const scene = useTweenedScene({ positions: targets, view: fitView(content, size) }, id => parents.get(id), duration);

  const at = (id: string): Point => {
    const parent = parents.get(id);
    return scene.positions[id] ?? (parent ? scene.positions[parent] : undefined) ?? targets[id];
  };
  const hot = new Set(trail);
  const { view } = scene;
  const centerX = view.x + view.w / 2;
  const centerY = view.y + view.h / 2;

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = Math.max(view.w / rect.width, view.h / rect.height);
    const { x, y } = drag.current;
    setPan(p => ({ x: p.x + (e.clientX - x) * scale, y: p.y + (e.clientY - y) * scale }));
    drag.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <>
      {root ? (
        <svg
          className={bare ? 'canvas-svg' : 'canvas-svg is-draggable'}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          role="img"
          aria-label={`${label}: ${placed.filter(p => !p.node.absorbedInto && !p.node.hidden).map(p => p.node.label).join(', ')}`}
          onPointerDown={bare ? undefined : e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={bare ? undefined : onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <g transform={`translate(${centerX + pan.x} ${centerY + pan.y}) scale(${zoom}) translate(${-centerX} ${-centerY})`}>
            {placed.map(({ node, parent }) => {
              if (!parent || parent.hidden) return null;
              const a = at(parent.id);
              const b = at(node.id);
              const classes = ['edge', hot.has(node.id) && hot.has(parent.id) ? 'is-hot' : '', node.absorbedInto ? 'is-gone' : ''].join(' ');
              return <line key={node.id} className={classes} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
            {placed.map(({ node }) => {
              if (node.hidden) return null;
              const p = at(node.id);
              const width = nodeWidth(node.label);
              return (
                <g key={node.id} className={`node tone-${node.tone} ${node.absorbedInto ? 'is-gone' : ''}`} transform={`translate(${p.x} ${p.y})`}>
                  <rect
                    style={{ x: -width / 2, width, rx: node.shape === 'round' ? NODE_HEIGHT / 2 : 8 }}
                    y={-NODE_HEIGHT / 2}
                    height={NODE_HEIGHT}
                  />
                  <text className="node-label" textAnchor="middle" dy=".35em">{node.label}</text>
                  {node.sublabel && <text className={`node-sub ${node.sublabelDanger ? 'is-danger' : ''}`} textAnchor="middle" y={NODE_HEIGHT / 2 + 13}>{node.sublabel}</text>}
                </g>
              );
            })}
            {placed.map(({ node }) => {
              if (!node.badge) return null;
              const p = at(node.id);
              const width = node.badge.length * 6.4 + 16;
              return (
                <g key={`${node.id}:${node.badge}`} className="badge" transform={`translate(${p.x} ${p.y - NODE_HEIGHT / 2 - 7})`}>
                  <g className="badge-pop">
                    <rect x={-width / 2} y={-20} width={width} height={20} rx={6} />
                    <text textAnchor="middle" y={-6}>{node.badge}</text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      ) : (
        <div className="canvas-empty">{empty}</div>
      )}

      {!bare && root && (
        <div className="canvas-tools">
          <button className="icon-btn" aria-label="Zoom out" title="Zoom out" onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}><Minus size={14} /></button>
          <button className="icon-btn" aria-label="Reset view" title="Reset view" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize size={13} /></button>
          <button className="icon-btn" aria-label="Zoom in" title="Zoom in" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><Plus size={14} /></button>
        </div>
      )}
      {legend && root && (
        <ul className="canvas-legend">
          {legend.map(item => <li key={item.label}><i className={`swatch tone-${item.tone}`} />{item.label}</li>)}
        </ul>
      )}
    </>
  );
}
