import type { ExprFrame } from '@/lib/expression-frames';
import { displayToken, type ExprNode } from '@/lib/expressions';
import type { BuildFrame, TraversalFrame } from '@/lib/expression-tree';
import { balance, signed, type TreeMode, type TreeNode, type TreeStep, type TreeStepKind } from '@/lib/trees';
import type { NodeTone, VisualNode } from './tree-canvas';

const EXPRESSION_TONES: Record<ExprFrame['nodes'][string]['state'], NodeTone> = {
  waiting: 'muted',
  'pending-op': 'op',
  'on-stack': 'value',
  operand: 'active',
  'active-op': 'accent',
  computed: 'done',
  absorbed: 'value',
};

export function expressionVisual(node: ExprNode, frame: ExprFrame): VisualNode {
  const info = frame.nodes[node.id];
  const isOperator = node.children.length > 0 && !info.resolved;
  return {
    id: node.id,
    label: info.label,
    shape: isOperator ? 'square' : 'round', // The shape change marks an operator turning into a value.
    tone: EXPRESSION_TONES[info.state],
    badge: frame.badge?.nodeId === node.id ? frame.badge.text : undefined,
    absorbedInto: info.absorbedInto,
    centerOverChild: node.children.length === 1,
    left: node.children[0] ? expressionVisual(node.children[0], frame) : null,
    right: node.children[1] ? expressionVisual(node.children[1], frame) : null,
  };
}

export const EXPRESSION_LEGEND: { tone: NodeTone; label: string }[] = [
  { tone: 'muted', label: 'Not read yet' },
  { tone: 'value', label: 'On the stack' },
  { tone: 'active', label: 'Being used' },
  { tone: 'done', label: 'Computed' },
];

/** An invisible root lets the canvas draw a stack of separate subtrees, which glide together as they join. */
const forestOf = (children: VisualNode[]): VisualNode => ({ id: 'forest', label: '', shape: 'square', tone: 'muted', hidden: true, children });

function buildVisual(node: ExprNode, frame: BuildFrame): VisualNode {
  const tone: NodeTone = node.id === frame.activeId ? 'new' : frame.childIds.includes(node.id) ? 'active' : node.children.length ? 'op' : 'value';
  return {
    id: node.id,
    label: node.children.length ? displayToken(node.token) : node.token,
    shape: node.children.length ? 'square' : 'round',
    tone,
    children: node.children.map(child => buildVisual(child, frame)),
  };
}
export const buildForest = (frame: BuildFrame): VisualNode => forestOf(frame.forest.map(node => buildVisual(node, frame)));

export const BUILD_LEGEND: { tone: NodeTone; label: string }[] = [
  { tone: 'value', label: 'Number' },
  { tone: 'op', label: 'Operator' },
  { tone: 'active', label: 'Being joined' },
  { tone: 'new', label: 'Just added' },
];

export function traversalTree(node: ExprNode, frame: TraversalFrame): VisualNode {
  const tone: NodeTone = node.id === frame.currentId ? 'active' : frame.visited.includes(node.id) ? 'done' : frame.path.includes(node.id) ? 'path' : 'muted';
  return {
    id: node.id,
    label: node.children.length ? displayToken(node.token) : node.token,
    shape: node.children.length ? 'square' : 'round',
    tone,
    children: node.children.map(child => traversalTree(child, frame)),
  };
}

export const TRAVERSAL_LEGEND: { tone: NodeTone; label: string }[] = [
  { tone: 'muted', label: 'Not reached' },
  { tone: 'path', label: 'Walking through' },
  { tone: 'active', label: 'Visiting' },
  { tone: 'done', label: 'Visited' },
];

const ACTIVE_TONES: Partial<Record<TreeStepKind, NodeTone>> = {
  place: 'new',
  done: 'new',
  replace: 'new',
  remove: 'new',
  rotate: 'accent',
};

export function treeVisual(node: TreeNode | null, step: TreeStep | undefined, mode: TreeMode): VisualNode | null {
  if (!node) return null;
  let tone: NodeTone = 'value';
  if (step) {
    if (step.danger.includes(node.value)) tone = 'danger';
    else if (step.active.includes(node.value)) tone = ACTIVE_TONES[step.kind] ?? 'active';
    else if (step.path.includes(node.value)) tone = step.kind === 'visit' ? 'done' : 'path';
  }
  const factor = balance(node);
  return {
    id: String(node.value),
    label: String(node.value),
    sublabel: mode === 'avl' ? `h${node.height} · ${signed(factor)}` : undefined,
    sublabelDanger: Math.abs(factor) > 1,
    shape: 'round',
    tone,
    badge: step?.badge?.on === node.value ? step.badge.text : undefined,
    left: treeVisual(node.left, step, mode),
    right: treeVisual(node.right, step, mode),
  };
}

export const treeTrail = (step: TreeStep | undefined): string[] =>
  step && step.kind !== 'visit' ? [...step.path, ...step.active].map(String) : [];

export const TREE_LEGEND: { tone: NodeTone; label: string }[] = [
  { tone: 'active', label: 'Looking at' },
  { tone: 'path', label: 'Path taken' },
  { tone: 'new', label: 'Changed' },
  { tone: 'danger', label: 'Problem or removing' },
];
