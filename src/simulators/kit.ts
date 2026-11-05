import type { NodeTone, VisualNode } from '../components/visual/tree-canvas';

/**
 * Every simulator is a small definition: the inputs it asks for, and a run function that turns those
 * inputs into a list of frames. A frame says which views to draw, so each topic shows what suits it:
 * boxes, bars, a table, a graph, a tree, a timeline, a console, or any mix of them. No React here,
 * which keeps the logic easy to test.
 */
export type Tone = NodeTone;
export type Values = Record<string, string>;
export type Metric = { label: string; value: string | number; tone?: Tone };

export type OpAction = { label: string; op: string; takesValue?: boolean };
export type Field = { key: string; label: string; initial: string; only?: (values: Values) => boolean } & (
  | { kind: 'text'; placeholder?: string; wide?: boolean }
  | { kind: 'number'; min: number; max: number }
  | { kind: 'choice'; options: { value: string; label: string }[] }
  | { kind: 'ops'; actions: OpAction[]; placeholder?: string }
);

export type Cell = { value: string; tone?: Tone; sub?: string };
export type CellRow = { label?: string; cells: Cell[]; pointers?: Record<number, string>; offset?: number; hideIndex?: boolean; firstIndex?: number };
export type GraphNode = { id: string; label?: string; x: number; y: number; tone?: Tone; sub?: string };
export type GraphEdge = { from: string; to: string; label?: string; tone?: Tone; dashed?: boolean };
export type ChartSeries = { label: string; points: [number, number][]; tone: Tone };
export type Legend = { tone: Tone; label: string }[];

type PanelBase = { title?: string; zone?: 'main' | 'side'; legend?: Legend };
export type Panel = PanelBase & (
  | { kind: 'cells'; rows: CellRow[]; small?: boolean }
  | { kind: 'bars'; bars: { value: number; label?: string; tone?: Tone }[] }
  | { kind: 'table'; rows: Cell[][]; rowHead?: string[]; colHead?: string[]; corner?: string }
  | { kind: 'links'; nodes: { id: string; value: string; tone?: Tone; tags?: string[] }[]; double?: boolean; circular?: boolean }
  | { kind: 'stack'; items: Cell[]; empty?: string }
  | { kind: 'buckets'; buckets: { label: string; items: Cell[]; tone?: Tone }[]; chained?: boolean }
  | { kind: 'graph'; nodes: GraphNode[]; edges: GraphEdge[]; directed?: boolean }
  | { kind: 'tree'; root: VisualNode | null; label: string; empty?: string }
  | { kind: 'pegs'; pegs: { label: string; disks: number[]; tone?: Tone }[]; largest: number }
  | { kind: 'chart'; series: ChartSeries[]; xLabel?: string; yLabel?: string; logY?: boolean }
  | { kind: 'timeline'; rows: { label: string; start: number; end: number; tone?: Tone; sub?: string }[]; from: number; to: number }
  | { kind: 'log'; lines: { text: string; tone?: Tone }[]; empty?: string }
  | { kind: 'facts'; items: { label: string; value: string | number; tone?: Tone }[] }
  | { kind: 'note'; text: string }
);

export type SimFrame = { label: string; title: string; detail: string; tone: Tone; group?: string; panels: Panel[]; metrics?: Metric[] };
export type SimResult = { frames: SimFrame[]; summary?: Metric[]; answer?: unknown };
export type SimExample = { title: string; about: string; values: Values };
export type SimulatorDef = { fields: Field[]; examples: SimExample[]; run: (values: Values) => SimResult };

export const defaultValues = (def: SimulatorDef): Values => Object.fromEntries(def.fields.map(field => [field.key, field.initial]));

/** "1 step" or "3 steps". */
export const counted = (count: number, word: string, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`;

// ---------- Input fields ----------

export const textField = (key: string, label: string, initial: string, options: { placeholder?: string; wide?: boolean } = {}): Field => ({ kind: 'text', key, label, initial, ...options });
export const numberField = (key: string, label: string, initial: number, min: number, max: number): Field => ({ kind: 'number', key, label, initial: String(initial), min, max });
export const choiceField = (key: string, label: string, options: [string, string][], initial = options[0][0]): Field => ({ kind: 'choice', key, label, initial, options: options.map(([value, text]) => ({ value, label: text })) });
export const opsField = (key: string, label: string, initial: string, actions: OpAction[]): Field => ({ kind: 'ops', key, label, initial, actions });

/** Shows a field only when it applies, such as a second value that one operation needs and another doesn't. */
export const when = (field: Field, only: (values: Values) => boolean): Field => ({ ...field, only });
export const whenChoice = (field: Field, key: string, ...choices: string[]): Field => when(field, values => choices.includes(values[key]));

// ---------- Reading what was typed ----------

export function numbers(text: string, { label = 'values', min = -9999, max = 9999, minCount = 1, maxCount = 16, integer = true } = {}): number[] {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length < minCount) throw new Error(minCount === 1 ? `Enter at least one number for ${label}.` : `Enter at least ${minCount} numbers for ${label}.`);
  if (parts.length > maxCount) throw new Error(`Use at most ${maxCount} numbers for ${label}, so every step stays readable.`);
  return parts.map(part => {
    const value = Number(part);
    if (!Number.isFinite(value) || (integer && !Number.isInteger(value))) throw new Error(`“${part}” isn't a ${integer ? 'whole ' : ''}number. Separate ${label} with commas or spaces.`);
    if (value < min || value > max) throw new Error(`${label[0].toUpperCase()}${label.slice(1)} must be between ${min} and ${max}. “${part}” is out of range.`);
    return value;
  });
}

export function integer(text: string, label: string, min: number, max: number): number {
  const value = Number(text.trim());
  if (!text.trim() || !Number.isInteger(value)) throw new Error(`${label} must be a whole number.`);
  if (value < min || value > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return value;
}

export function words(text: string, { label = 'text', maxLength = 24, minLength = 1, allowSpaces = false } = {}): string {
  const value = allowSpaces ? text.trim().replace(/\s+/g, ' ') : text.trim();
  if (value.length < minLength) throw new Error(`Enter ${label}.`);
  if (value.length > maxLength) throw new Error(`Keep ${label} to ${maxLength} characters, so every step stays readable.`);
  if (!allowSpaces && /\s/.test(value)) throw new Error(`Write ${label} with no spaces.`);
  return value;
}

/** Reads items such as "A(1,4), B(3,5)" or "(1,4), (3,5)". Every item must have exactly the given numbers. */
export function records(text: string, { label, parts, example, maxCount = 12, minCount = 1, min = -9999, max = 9999 }: { label: string; parts: number; example: string; maxCount?: number; minCount?: number; min?: number; max?: number }): { name: string; values: number[] }[] {
  const found = [...text.matchAll(/(\w*)\s*\(([^)]*)\)/g)];
  const rest = text.replace(/(\w*)\s*\(([^)]*)\)/g, '').replace(/[\s,;]/g, '');
  if (rest) throw new Error(`“${rest}” doesn't fit. Write ${label} like ${example}.`);
  if (found.length < minCount) throw new Error(`Enter at least ${minCount === 1 ? 'one' : minCount} of ${label}, like ${example}.`);
  if (found.length > maxCount) throw new Error(`Use at most ${maxCount} of ${label}, so every step stays readable.`);
  const names = new Set<string>();
  return found.map((match, i) => {
    const name = match[1] || String(i + 1);
    if (names.has(name)) throw new Error(`The name ${name} appears twice in ${label}.`);
    names.add(name);
    const values = match[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (values.length !== parts || values.some(value => !Number.isInteger(value))) throw new Error(`“${match[0].trim()}” must hold ${parts} whole numbers, like ${example}.`);
    if (values.some(value => value < min || value > max)) throw new Error(`The numbers in ${label} must be between ${min} and ${max}.`);
    return { name, values };
  });
}

/** Reads rows of numbers separated by "/", such as "1 3 1 / 1 5 1". */
export function matrix(text: string, { label = 'the grid', maxRows = 8, maxCols = 8, min = -999, max = 999 } = {}): number[][] {
  const rows = text.split(/[/\n]+/).map(part => part.trim()).filter(Boolean).map(part => part.split(/[\s,]+/).filter(Boolean).map(Number));
  if (!rows.length) throw new Error(`Enter ${label}, with rows separated by /.`);
  if (rows.length > maxRows || rows[0].length > maxCols) throw new Error(`Keep ${label} to ${maxRows} rows and ${maxCols} columns.`);
  if (rows.some(line => line.length !== rows[0].length)) throw new Error(`Every row of ${label} must have the same length.`);
  if (rows.flat().some(value => !Number.isInteger(value))) throw new Error(`${label[0].toUpperCase()}${label.slice(1)} must hold whole numbers.`);
  if (rows.flat().some(value => value < min || value > max)) throw new Error(`The numbers in ${label} must be between ${min} and ${max}.`);
  return rows;
}

export type Op = { op: string; value?: string; second?: string };

/** Reads a script such as "push 3, push 4, pop". The map says how many values each operation takes. */
export function operations(text: string, known: Record<string, number>, maxCount = 16): Op[] {
  const parts = text.split(/[,;\n]+/).map(part => part.trim()).filter(Boolean);
  if (!parts.length) throw new Error(`Add at least one operation, such as ${Object.keys(known)[0]}.`);
  if (parts.length > maxCount) throw new Error(`Use at most ${maxCount} operations, so every step stays readable.`);
  return parts.map(part => {
    const [name, ...rest] = part.split(/\s+/);
    const op = name.toLowerCase();
    if (!(op in known)) throw new Error(`“${name}” isn't an operation here. Use: ${Object.keys(known).join(', ')}.`);
    if (rest.length !== known[op]) throw new Error(`“${op}” takes ${known[op] === 0 ? 'no value' : known[op] === 1 ? 'one value' : `${known[op]} values`}, as in “${op}${' 5'.repeat(known[op])}”.`);
    return { op, value: rest[0], second: rest[1] };
  });
}

export type GraphEdgeInput = { from: string; to: string; weight: number };
export type Graph = { nodes: string[]; edges: GraphEdgeInput[]; directed: boolean; adj: Record<string, { to: string; weight: number }[]> };

/** Reads edges such as "A-B:4, B-C:2". A name on its own adds a node with no edges. */
export function graph(text: string, { directed = false, maxNodes = 12, maxEdges = 30, allowNegative = false, defaultWeight = 1 } = {}): Graph {
  const nodes = new Set<string>();
  const edges: GraphEdgeInput[] = [];
  for (const part of text.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean)) {
    const match = part.match(/^([\w]+)\s*(?:-\s*([\w]+)\s*(?::\s*(-?\d+))?)?$/);
    if (!match) throw new Error(`“${part}” isn't an edge. Write edges like A-B or A-B:4, separated by commas.`);
    const [, from, to, weight] = match;
    nodes.add(from);
    if (!to) continue;
    nodes.add(to);
    if (from === to) throw new Error(`“${part}” joins a node to itself, which isn't supported here.`);
    const value = weight === undefined ? defaultWeight : Number(weight);
    if (value < 0 && !allowNegative) throw new Error(`“${part}” has a negative weight, which this algorithm can't handle.`);
    if (Math.abs(value) > 999) throw new Error(`Keep edge weights between -999 and 999.`);
    if (edges.some(edge => (edge.from === from && edge.to === to) || (!directed && edge.from === to && edge.to === from))) throw new Error(`The edge ${from}-${to} appears twice.`);
    edges.push({ from, to, weight: value });
  }
  if (!nodes.size) throw new Error('Enter at least one edge, such as A-B:4.');
  if (nodes.size > maxNodes) throw new Error(`Use at most ${maxNodes} nodes, so the picture stays readable.`);
  if (edges.length > maxEdges) throw new Error(`Use at most ${maxEdges} edges, so the picture stays readable.`);
  const names = [...nodes].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const adj: Graph['adj'] = Object.fromEntries(names.map(name => [name, []]));
  for (const { from, to, weight } of edges) {
    adj[from].push({ to, weight });
    if (!directed) adj[to].push({ to: from, weight });
  }
  for (const name of names) adj[name].sort((a, b) => a.to.localeCompare(b.to, 'en', { numeric: true }));
  return { nodes: names, edges, directed, adj };
}

export function nodeIn(g: Graph, text: string, label: string): string {
  const name = text.trim();
  if (!g.nodes.includes(name)) throw new Error(`${label} “${name}” isn't in the graph. It has: ${g.nodes.join(', ')}.`);
  return name;
}

// ---------- Recording frames ----------

export const MAX_FRAMES = 1500;

export class Trace {
  frames: SimFrame[] = [];
  private skipped = 0;
  group: string | undefined;

  add(label: string, detail: string, panels: Panel[], { tone = 'value', metrics, title }: { tone?: Tone; metrics?: Metric[]; title?: string } = {}) {
    if (this.frames.length >= MAX_FRAMES) {
      this.skipped++;
      return;
    }
    this.frames.push({ label, title: title ?? label, detail, tone, group: this.group, panels, metrics });
  }

  /** The last frame is always kept, and says so if a very long run had to leave some steps out. */
  finish(label: string, detail: string, panels: Panel[], { tone = 'done', metrics, title }: { tone?: Tone; metrics?: Metric[]; title?: string } = {}) {
    const extra = this.skipped ? ` This run has more steps than can be shown, so ${this.skipped} were left out of the list.` : '';
    this.frames.push({ label, title: title ?? label, detail: detail + extra, tone, group: this.group, panels, metrics });
  }
}

// ---------- Building views ----------

type Toner = (index: number) => Tone | undefined;

export function row(values: (string | number)[], options: { tone?: Toner; pointers?: Record<number, string>; label?: string; offset?: number; hideIndex?: boolean; firstIndex?: number; sub?: (index: number) => string | undefined } = {}): CellRow {
  return {
    label: options.label,
    pointers: options.pointers,
    offset: options.offset,
    hideIndex: options.hideIndex,
    firstIndex: options.firstIndex,
    cells: values.map((value, i) => ({ value: String(value), tone: options.tone?.(i), sub: options.sub?.(i) })),
  };
}

export const cells = (title: string | undefined, rows: CellRow | CellRow[], options: { small?: boolean; zone?: 'main' | 'side'; legend?: Legend } = {}): Panel => ({ kind: 'cells', title, rows: Array.isArray(rows) ? rows : [rows], ...options });
export const bars = (title: string | undefined, values: number[], tone?: Toner, labels?: (string | undefined)[], legend?: Legend): Panel => ({ kind: 'bars', title, legend, bars: values.map((value, i) => ({ value, tone: tone?.(i), label: labels?.[i] })) });
export const logPanel = (title: string, lines: (string | { text: string; tone?: Tone })[], zone: 'main' | 'side' = 'side', empty = 'Nothing yet'): Panel => ({ kind: 'log', title, zone, empty, lines: lines.map(line => (typeof line === 'string' ? { text: line } : line)) });
export const factsPanel = (title: string, items: { label: string; value: string | number; tone?: Tone }[], zone: 'main' | 'side' = 'side'): Panel => ({ kind: 'facts', title, zone, items });
export const notePanel = (text: string, zone: 'main' | 'side' = 'main'): Panel => ({ kind: 'note', text, zone });
export const stackPanel = (title: string, items: (string | number)[], options: { tone?: Toner; zone?: 'main' | 'side'; empty?: string } = {}): Panel => ({ kind: 'stack', title, zone: options.zone ?? 'side', empty: options.empty, items: items.map((value, i) => ({ value: String(value), tone: options.tone?.(i) })) });
export const bucketsPanel = (title: string, buckets: { label: string; items: (string | number | Cell)[]; tone?: Tone }[], options: { chained?: boolean; zone?: 'main' | 'side' } = {}): Panel => ({
  kind: 'buckets', title, zone: options.zone, chained: options.chained,
  buckets: buckets.map(bucket => ({ label: bucket.label, tone: bucket.tone, items: bucket.items.map(item => (typeof item === 'object' ? item : { value: String(item) })) })),
});

export function tablePanel(title: string | undefined, values: (string | number | null)[][], options: { rowHead?: (string | number)[]; colHead?: (string | number)[]; corner?: string; tone?: (r: number, c: number) => Tone | undefined; zone?: 'main' | 'side'; legend?: Legend } = {}): Panel {
  return {
    kind: 'table', title, zone: options.zone, corner: options.corner, legend: options.legend,
    rowHead: options.rowHead?.map(String), colHead: options.colHead?.map(String),
    rows: values.map((items, r) => items.map((value, c) => ({ value: value === null ? '' : String(value), tone: options.tone?.(r, c) }))),
  };
}

/** Places nodes evenly around a circle, in a fixed space of 640 by 420. */
export function circleLayout(ids: string[]): Record<string, { x: number; y: number }> {
  const count = ids.length;
  return Object.fromEntries(ids.map((id, i) => {
    if (count === 1) return [id, { x: 320, y: 210 }];
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return [id, { x: 320 + 250 * Math.cos(angle), y: 210 + 165 * Math.sin(angle) }];
  }));
}

export function graphPanel(title: string | undefined, g: Graph, options: {
  node?: (id: string) => { tone?: Tone; sub?: string } | undefined;
  edge?: (edge: GraphEdgeInput) => { tone?: Tone; dashed?: boolean } | undefined;
  weights?: boolean; zone?: 'main' | 'side'; legend?: Legend;
} = {}): Panel {
  const places = circleLayout(g.nodes);
  return {
    kind: 'graph', title, zone: options.zone, legend: options.legend, directed: g.directed,
    nodes: g.nodes.map(id => ({ id, ...places[id], ...options.node?.(id) })),
    edges: g.edges.map(edge => ({ from: edge.from, to: edge.to, label: options.weights ? String(edge.weight) : undefined, ...options.edge?.(edge) })),
  };
}

export const treePanel = (title: string | undefined, root: VisualNode | null, label: string, options: { zone?: 'main' | 'side'; legend?: Legend; empty?: string } = {}): Panel => ({ kind: 'tree', title, root, label, ...options });

export type BinaryNode = { id: string; label: string; tone?: Tone; sub?: string; left?: BinaryNode | null; right?: BinaryNode | null; children?: BinaryNode[]; square?: boolean };

/** Turns a plain tree into what the tree view draws. */
export function visualTree(node: BinaryNode | null | undefined): VisualNode | null {
  if (!node) return null;
  const base = { id: node.id, label: node.label, sublabel: node.sub, shape: node.square ? ('square' as const) : ('round' as const), tone: node.tone ?? ('value' as const) };
  if (node.children) return { ...base, children: node.children.map(child => visualTree(child)!) };
  return { ...base, left: visualTree(node.left), right: visualTree(node.right) };
}

/** Draws several separate trees side by side. */
export function visualForest(trees: BinaryNode[]): VisualNode {
  return { id: 'forest', label: '', shape: 'square', tone: 'muted', hidden: true, children: trees.map(tree => withChildren(tree)) };
}

function withChildren(node: BinaryNode): VisualNode {
  const kids = node.children ?? [node.left, node.right].filter((item): item is BinaryNode => Boolean(item));
  return { id: node.id, label: node.label, sublabel: node.sub, shape: node.square ? 'square' : 'round', tone: node.tone ?? 'value', children: kids.map(withChildren) };
}

export const COMMON_LEGEND: Legend = [{ tone: 'active', label: 'Looking at' }, { tone: 'new', label: 'Changed' }, { tone: 'done', label: 'Finished' }, { tone: 'danger', label: 'Problem' }];

/** Shuffles the same way every time, so a "random" run can be replayed step by step. */
export function seededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return (limit: number) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % limit;
  };
}
