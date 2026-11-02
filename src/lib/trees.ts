export type TreeMode = 'bst' | 'avl';
export type TreeOperation = 'insert' | 'delete';
export type TraversalOrder = 'in' | 'pre' | 'post';
export type TreeNode = { value: number; left: TreeNode | null; right: TreeNode | null; height: number };

export type TreeStepKind = 'start' | 'compare' | 'place' | 'duplicate' | 'missing' | 'found' | 'successor' | 'remove' | 'replace' | 'check' | 'imbalance' | 'rotate' | 'done' | 'visit';

export type TreeStep = {
  kind: TreeStepKind;
  root: TreeNode | null;
  title: string;
  message: string;
  active: number[];
  danger: number[]; // Nodes in trouble: about to be removed, or out of balance.
  path: number[]; // Nodes the operation walked through to get here.
  badge?: { on: number; text: string };
  group: number; // Which value of the batch this step belongs to.
  groupLabel: string;
};

export const MAX_NODES = 63;
export const MAX_BATCH = 40;
export const MAX_VALUE = 999999;

const SIDE_NAME = { left: 'left', right: 'right' } as const;
export const height = (n: TreeNode | null): number => n?.height ?? 0;
export const balance = (n: TreeNode | null): number => (n ? height(n.left) - height(n.right) : 0);
export const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

export function values(n: TreeNode | null, order: TraversalOrder = 'in'): number[] {
  if (!n) return [];
  const l = values(n.left, order);
  const r = values(n.right, order);
  return order === 'pre' ? [n.value, ...l, ...r] : order === 'post' ? [...l, ...r, n.value] : [...l, n.value, ...r];
}

const copy = (n: TreeNode | null): TreeNode | null => (n ? { ...n, left: copy(n.left), right: copy(n.right) } : null);
const refresh = (n: TreeNode): TreeNode => ({ ...n, height: 1 + Math.max(height(n.left), height(n.right)) });

function rotateRight(n: TreeNode): TreeNode {
  const pivot = n.left!;
  return refresh({ ...pivot, right: refresh({ ...n, left: pivot.right }) });
}

function rotateLeft(n: TreeNode): TreeNode {
  const pivot = n.right!;
  return refresh({ ...pivot, left: refresh({ ...n, right: pivot.left }) });
}

export function parseValues(input: string): number[] {
  const text = input.trim();
  const tokens = text.split(/\s*,\s*|\s+/);
  if (!text || tokens.some(x => !/^-?\d+$/.test(x))) throw new Error('Enter whole numbers separated by commas, such as 30, 20, 10.');
  const result = tokens.map(x => Number(x) + 0); // + 0 turns -0 into 0.
  if (result.some(x => !Number.isSafeInteger(x) || Math.abs(x) > MAX_VALUE)) throw new Error(`Use whole numbers between -${MAX_VALUE} and ${MAX_VALUE}.`);
  if (result.length > MAX_BATCH) throw new Error(`Apply at most ${MAX_BATCH} values at a time.`);
  return result;
}

export function operateTree(initial: TreeNode | null, input: string, operation: TreeOperation, mode: TreeMode): TreeStep[] {
  const batch = parseValues(input); // Validate the whole batch before touching the tree.
  if (operation === 'insert' && new Set([...values(initial), ...batch]).size > MAX_NODES) throw new Error(`A tree can hold at most ${MAX_NODES} different values.`);

  let root = copy(initial);
  let trail: number[] = [];
  let group = 0;
  let groupLabel = '';
  let changed = false;

  const steps: TreeStep[] = [];
  type Extra = { active?: number[]; danger?: number[]; badge?: TreeStep['badge'] };
  const record = (kind: TreeStepKind, title: string, message: string, extra: Extra = {}) => {
    steps.push({ kind, root: copy(root), title, message, active: extra.active ?? [], danger: extra.danger ?? [], path: [...trail], badge: extra.badge, group, groupLabel });
  };

  // A path lets each subtree change appear in a complete, connected snapshot.
  type Path = ('left' | 'right')[];
  function replace(path: Path, subtree: TreeNode | null) {
    function put(node: TreeNode | null, index: number): TreeNode | null {
      if (index === path.length) return subtree;
      return refresh({ ...node!, [path[index]]: put(node![path[index]], index + 1) });
    }
    root = put(root, 0);
  }

  function rebalance(node: TreeNode, path: Path): TreeNode {
    let n = refresh(node);
    replace(path, n);
    if (mode !== 'avl' || !changed) return n;

    const factor = balance(n);
    if (Math.abs(factor) <= 1) {
      trail = trail.filter(v => v !== n.value);
      record('check', `Check ${n.value}`, `Heading back up: ${n.value} has height ${n.height} and balance ${signed(factor)}, which is within −1 to +1.`, {
        active: [n.value],
        badge: { on: n.value, text: `bf ${signed(factor)}` },
      });
      return n;
    }

    const heavy = factor > 1 ? 'left' : 'right';
    const child = n[heavy]!;
    const inner = heavy === 'left' ? balance(child) < 0 : balance(child) > 0;
    const caseName = inner ? (heavy === 'left' ? 'Left-Right' : 'Right-Left') : heavy === 'left' ? 'Left-Left' : 'Right-Right';
    const plan = inner ? `two rotations: first at ${child.value}, then at ${n.value}` : `one ${heavy === 'left' ? 'right' : 'left'} rotation at ${n.value}`;
    trail = [];
    record('imbalance', `Imbalance at ${n.value}`, `${n.value} has balance ${signed(factor)}, so its ${heavy} side is too tall. This is the ${caseName} case, which needs ${plan}.`, {
      active: [child.value],
      danger: [n.value],
      badge: { on: n.value, text: `bf ${signed(factor)}` },
    });

    if (inner) {
      const pivot = child[heavy === 'left' ? 'right' : 'left']!;
      const rotated = heavy === 'left' ? rotateLeft(child) : rotateRight(child);
      n = refresh({ ...n, [heavy]: rotated });
      replace(path, n);
      const direction = heavy === 'left' ? 'Left' : 'Right';
      record('rotate', `${direction} rotation at ${child.value}`, `${direction} rotation at ${child.value}: ${pivot.value} moves up, turning the zig-zag into a straight line.`, {
        active: [child.value, pivot.value],
        danger: [n.value],
      });
    }

    const old = n.value;
    const direction = heavy === 'left' ? 'Right' : 'Left';
    n = heavy === 'left' ? rotateRight(n) : rotateLeft(n);
    replace(path, n);
    record('rotate', `${direction} rotation at ${old}`, `${direction} rotation at ${old}: ${n.value} becomes this subtree's root and ${old} becomes its ${SIDE_NAME[heavy === 'left' ? 'right' : 'left']} child. Balance restored.`, {
      active: [old, n.value],
    });
    return n;
  }

  function insert(n: TreeNode | null, value: number, path: Path): TreeNode {
    if (!n) {
      const leaf = { value, left: null, right: null, height: 1 };
      changed = true;
      replace(path, leaf);
      record('place', `Place ${value}`, path.length ? `An empty spot: ${value} becomes a new leaf here.` : `The tree is empty, so ${value} becomes the root.`, {
        active: [value],
        badge: { on: value, text: 'new' },
      });
      return leaf;
    }
    if (value === n.value) {
      record('duplicate', `${value} already exists`, `${value} is already in the tree, and duplicates are ignored. Nothing changed.`, { active: [value], badge: { on: value, text: 'duplicate' } });
      return n;
    }
    const side = value < n.value ? 'left' : 'right';
    record('compare', `Compare with ${n.value}`, `${value} is ${side === 'left' ? 'less' : 'greater'} than ${n.value}, so go ${side}.`, {
      active: [n.value],
      badge: { on: n.value, text: `${value} ${side === 'left' ? '<' : '>'} ${n.value}` },
    });
    trail.push(n.value);
    return rebalance({ ...n, [side]: insert(n[side], value, [...path, side]) }, path);
  }

  function remove(n: TreeNode | null, value: number, path: Path): TreeNode | null {
    if (!n) {
      record('missing', `${value} not found`, `The search reached an empty spot, so ${value} is not in the tree. Nothing changed.`);
      return null;
    }
    if (value !== n.value) {
      const side = value < n.value ? 'left' : 'right';
      record('compare', `Compare with ${n.value}`, `${value} is ${side === 'left' ? 'less' : 'greater'} than ${n.value}, so go ${side}.`, {
        active: [n.value],
        badge: { on: n.value, text: `${value} ${side === 'left' ? '<' : '>'} ${n.value}` },
      });
      trail.push(n.value);
      return rebalance({ ...n, [side]: remove(n[side], value, [...path, side]) }, path);
    }

    if (!n.left || !n.right) {
      const child = n.left ?? n.right;
      record('found', `Found ${value}`, child ? `${value} has one child, so that child can take its place.` : `${value} is a leaf, so it can be removed directly.`, { danger: [value], badge: { on: value, text: child ? 'one child' : 'leaf' } });
      changed = true;
      replace(path, child);
      record('remove', `Remove ${value}`, child ? `${value} is removed and ${child.value} moves up into its place.` : `${value} is removed.`, { active: child ? [child.value] : [] });
      return child;
    }

    let successor = n.right;
    while (successor.left) successor = successor.left;
    record('found', `Found ${value}`, `${value} has two children, so replace it with its inorder successor: the smallest value in its right subtree.`, { danger: [value], badge: { on: value, text: 'two children' } });
    record('successor', `Successor is ${successor.value}`, `Go right from ${value}, then as far left as possible. That reaches ${successor.value}.`, { danger: [value], active: [successor.value], badge: { on: successor.value, text: 'successor' } });
    trail.push(n.value);
    const right = remove(n.right, successor.value, [...path, 'right']);
    const result = refresh({ ...n, value: successor.value, right });
    replace(path, result);
    trail = trail.map(v => (v === value ? successor.value : v));
    record('replace', `Replace ${value} with ${successor.value}`, `${successor.value} takes the place of ${value}, which keeps every value in the right order.`, { active: [successor.value] });
    return rebalance(result, path);
  }

  const verb = operation === 'insert' ? 'Insert' : 'Delete';
  batch.forEach((value, index) => {
    group = index;
    groupLabel = `${verb} ${value}`;
    trail = [];
    changed = false;
    record('start', operation === 'insert' ? `Find a spot for ${value}` : `Search for ${value}`, 'Start at the root and walk down, comparing at each node.');
    root = operation === 'insert' ? insert(root, value, []) : remove(root, value, []);
    if (changed) {
      trail = [];
      record('done', `${operation === 'insert' ? 'Inserted' : 'Deleted'} ${value}`, `${operation === 'insert' ? 'Inserted' : 'Deleted'} ${value}. The tree now has ${values(root).length} node${values(root).length === 1 ? '' : 's'} and height ${height(root)}.`, { active: operation === 'insert' ? [value] : [] });
    }
  });
  return steps;
}

const ORDER_RULE: Record<TraversalOrder, string> = {
  in: 'left subtree, node, right subtree',
  pre: 'node, left subtree, right subtree',
  post: 'left subtree, right subtree, node',
};

/** Frames that visit each node in turn. Traversals only read the tree, so `root` never changes. */
export function traversalSteps(root: TreeNode | null, order: TraversalOrder): TreeStep[] {
  const groupLabel = `${{ in: 'Inorder', pre: 'Preorder', post: 'Postorder' }[order]} traversal`;
  const visited: number[] = [];
  return values(root, order).map(value => {
    visited.push(value);
    return {
      kind: 'visit' as const,
      root,
      title: `Visit ${value}`,
      message: `Order at every node: ${ORDER_RULE[order]}. Visited so far: ${visited.join(', ')}.`,
      active: [value],
      danger: [],
      path: [...visited],
      badge: { on: value, text: `#${visited.length}` },
      group: 0,
      groupLabel,
    };
  });
}
