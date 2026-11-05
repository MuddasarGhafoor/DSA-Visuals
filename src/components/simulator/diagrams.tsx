'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Panel, Tone } from '@/simulators/kit';

type GraphPanel = Extract<Panel, { kind: 'graph' }>;
type ChartPanel = Extract<Panel, { kind: 'chart' }>;

const RADIUS = 19;
/** Short of the middle of an edge, so the labels of two crossing edges don't land on the same spot. */
const LABEL_AT = 0.38;
const scaleStyle = (scale: number) => ({ '--draw-scale': scale }) as CSSProperties;

/** How large the picture is drawn at, compared with its own units, at which its text reads well. */
const COMFORTABLE = 0.8;

/**
 * An SVG shrinks as a whole when its box is narrow or short, which would leave its text too small to read.
 * So when it is drawn smaller than comfortable, nodes and text grow in the picture's own units to make up for it.
 */
function useDrawScale(viewWidth: number, viewHeight: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const drawn = Math.min(width / viewWidth, height / viewHeight);
      const next = drawn > 0 ? Math.min(1.9, Math.max(1, COMFORTABLE / drawn)) : 1;
      setScale(Math.round(next * 100) / 100);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewWidth, viewHeight]);
  return [ref, scale] as const;
}

export function GraphView({ panel }: { panel: GraphPanel }) {
  const [ref, scale] = useDrawScale(640, 420);
  const radius = RADIUS * scale;
  const place = new Map(panel.nodes.map(node => [node.id, node]));
  const toneOf = (tone?: Tone) => `tone-${tone ?? 'muted'}`;
  return (
    <svg ref={ref} className="sim-graph" style={scaleStyle(scale)} viewBox="0 0 640 420" role="img" aria-label={`${panel.title ?? 'Graph'}: ${panel.nodes.map(node => node.label ?? node.id).join(', ')}`}>
      <defs>
        {(['muted', 'active', 'done', 'danger', 'new', 'path', 'accent', 'value', 'op'] as Tone[]).map(tone => (
          <marker key={tone} id={`sim-arrow-${tone}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" className={`tone-${tone}`}>
            <path d="M 0 0 L 10 5 L 0 10 z" className="sim-arrow-head" />
          </marker>
        ))}
      </defs>
      {panel.edges.map((edge, i) => {
        const a = place.get(edge.from);
        const b = place.get(edge.to);
        if (!a || !b) return null;
        const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const ux = (b.x - a.x) / length;
        const uy = (b.y - a.y) / length;
        // Two directed edges between the same pair sit side by side, so both stay visible.
        const paired = panel.directed && panel.edges.some(other => other.from === edge.to && other.to === edge.from);
        const nudgeX = paired ? -uy * 7 * scale : 0;
        const nudgeY = paired ? ux * 7 * scale : 0;
        const x1 = a.x + ux * radius + nudgeX;
        const y1 = a.y + uy * radius + nudgeY;
        const x2 = b.x - ux * (radius + (panel.directed ? 3 : 0)) + nudgeX;
        const y2 = b.y - uy * (radius + (panel.directed ? 3 : 0)) + nudgeY;
        const tone = edge.tone ?? 'muted';
        return (
          <g key={i} className={toneOf(tone)}>
            <line className={`sim-edge ${edge.tone ? 'is-marked' : ''} ${edge.dashed ? 'is-dashed' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={panel.directed ? `url(#sim-arrow-${tone})` : undefined} />
            {edge.label && (
              <text className="sim-edge-label" x={x1 + (x2 - x1) * LABEL_AT + (paired ? nudgeX : 0)} y={y1 + (y2 - y1) * LABEL_AT + (paired ? nudgeY : 0)} textAnchor="middle" dy=".35em">{edge.label}</text>
            )}
          </g>
        );
      })}
      {panel.nodes.map(node => (
        <g key={node.id} className={toneOf(node.tone)} transform={`translate(${node.x} ${node.y})`}>
          <circle className="sim-node" r={radius} />
          <text className="sim-node-label" textAnchor="middle" dy=".35em">{node.label ?? node.id}</text>
          {node.sub !== undefined && <text className="sim-node-sub" textAnchor="middle" y={radius + 14 * scale}>{node.sub}</text>}
        </g>
      ))}
    </svg>
  );
}

const WIDTH = 640;
const HEIGHT = 340;
const LEFT = 58;
const RIGHT = 16;
const TOP = 12;
const BOTTOM = 36;

export function ChartView({ panel }: { panel: ChartPanel }) {
  const [ref, scale] = useDrawScale(WIDTH, HEIGHT);
  const left = LEFT * scale;
  const bottom = BOTTOM * scale;
  const points = panel.series.flatMap(series => series.points);
  const xs = points.map(([x]) => x);
  const scaleY = (y: number) => (panel.logY ? Math.log10(Math.max(y, 1)) : y);
  const ys = points.map(([, y]) => scaleY(y));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs, minX + 1);
  const minY = panel.logY ? 0 : Math.min(0, ...ys);
  const maxY = Math.max(...ys, minY + 1);
  const px = (x: number) => left + ((x - minX) / (maxX - minX)) * (WIDTH - left - RIGHT);
  const py = (y: number) => HEIGHT - bottom - ((scaleY(y) - minY) / (maxY - minY)) * (HEIGHT - TOP - bottom);
  const yTicks = Array.from({ length: 5 }, (_, i) => minY + ((maxY - minY) * i) / 4);
  const format = (value: number) => {
    const shown = panel.logY ? 10 ** value : value;
    if (shown >= 1e6) return shown.toExponential(0).replace('e+', 'e');
    if (shown >= 100) return Math.round(shown).toLocaleString('en-US');
    return String(Math.round(shown * 10) / 10);
  };

  return (
    <div className="sim-chart">
      <svg ref={ref} style={scaleStyle(scale)} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${panel.title ?? 'Chart'}: ${panel.series.map(series => series.label).join(', ')}`}>
        {yTicks.map(tick => {
          const y = HEIGHT - bottom - ((tick - minY) / (maxY - minY)) * (HEIGHT - TOP - bottom);
          return (
            <g key={tick}>
              <line className="sim-grid-line" x1={left} x2={WIDTH - RIGHT} y1={y} y2={y} />
              <text className="sim-axis-text" x={left - 6} y={y} textAnchor="end" dy=".35em">{format(tick)}</text>
            </g>
          );
        })}
        <text className="sim-axis-text" x={left} y={HEIGHT - bottom + 15 * scale} textAnchor="middle">{minX}</text>
        <text className="sim-axis-text" x={WIDTH - RIGHT} y={HEIGHT - bottom + 15 * scale} textAnchor="end">{maxX}</text>
        {panel.xLabel && <text className="sim-axis-text" x={(left + WIDTH - RIGHT) / 2} y={HEIGHT - 6} textAnchor="middle">{panel.xLabel}</text>}
        {panel.series.map(series => (
          <g key={series.label} className={`tone-${series.tone}`}>
            <polyline className="sim-series" points={series.points.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} />
            {series.points.length === 1 && <circle className="sim-point" cx={px(series.points[0][0])} cy={py(series.points[0][1])} r={4 * scale} />}
          </g>
        ))}
      </svg>
      <ul className="sim-legend">
        {panel.series.map(series => <li key={series.label}><i className={`swatch tone-${series.tone}`} />{series.label}</li>)}
      </ul>
    </div>
  );
}
