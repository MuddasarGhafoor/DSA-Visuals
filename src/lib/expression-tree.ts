import { displayToken, notationsOf, parseExpression, type ExprNode, type Notation } from './expressions.ts';

export type TreeOrder = 'in' | 'pre' | 'post';
export type TreeView = 'build' | TreeOrder;

export type BuildFrame = {
  step: number;
  phase: 'start' | 'leaf' | 'pick' | 'link' | 'done';
  forest: ExprNode[]; // The stack: each entry is the root of a finished subtree.
  activeId?: string;
  childIds: string[];
  title: string;
  detail: string;
};

export type TraversalFrame = {
  step: number;
  phase: 'start' | 'visit' | 'done';
  currentId?: string;
  visited: string[];
  path: string[]; // The nodes the walk is inside right now, from the root down.
  output: string[];
  title: string;
  detail: string;
};

export type ExpressionTreeResult = { root: ExprNode; notation: Notation; infix: string; prefix: string; postfix: string; tokens: string[] };

export const ORDER_LABELS: Record<TreeOrder, string> = { in: 'Inorder', pre: 'Preorder', post: 'Postorder' };

export function analyzeExpressionTree(input: string): ExpressionTreeResult {
  const { root, notation } = parseExpression(input);
  const forms = notationsOf(root);
  return { root, notation, ...forms, tokens: forms.postfix.split(' ') };
}

/** Builds the tree the classic way: read postfix, push a leaf for a number, and join the top subtrees for an operator. */
export function buildTreeFrames(root: ExprNode): BuildFrame[] {
  const frames: BuildFrame[] = [
    { step: -1, phase: 'start', forest: [], childIds: [], title: 'Ready', detail: 'Read the postfix form left to right. The stack holds finished subtrees, and each operator joins the ones it needs.' },
  ];
  const forest: ExprNode[] = [];
  let step = 0;

  (function visit(node: ExprNode) {
    node.children.forEach(visit);
    const label = displayToken(node.token);
    if (!node.children.length) {
      forest.push(node);
      frames.push({ step, phase: 'leaf', forest: [...forest], activeId: node.id, childIds: [], title: `Leaf ${node.token}`, detail: `${node.token} is a number, so it becomes a tree of one node and goes on the stack.` });
    } else {
      const arity = node.children.length;
      const childIds = node.children.map(child => child.id);
      frames.push({
        step,
        phase: 'pick',
        forest: [...forest],
        childIds,
        title: arity === 1 ? 'Pop 1 subtree' : 'Pop 2 subtrees',
        detail: arity === 1 ? 'Unary minus needs one operand, so it takes the subtree on top of the stack.' : `${label} needs two operands. The top subtree becomes its right child, and the one below becomes its left child.`,
      });
      forest.splice(forest.length - arity, arity);
      forest.push(node);
      frames.push({ step, phase: 'link', forest: [...forest], activeId: node.id, childIds: [], title: `Join with ${label}`, detail: `The ${label} node becomes the parent, and the new subtree goes back on the stack.` });
    }
    step++;
  })(root);

  frames.push({ step: step - 1, phase: 'done', forest: [...forest], childIds: [], title: 'Tree finished', detail: 'One subtree is left on the stack, and it is the whole expression. The operator that runs last is at the root.' });
  return frames;
}

const TRAVERSAL_INTROS: Record<TreeOrder, string> = {
  in: 'Inorder visits the left side, then the node, then the right side. This gives back the way people write math.',
  pre: 'Preorder visits the node first, then its left and right sides. This gives prefix notation.',
  post: 'Postorder visits the left and right sides, then the node. This gives postfix notation, and it is the order a stack evaluates in.',
};

/** Walks the finished tree. A unary minus has one child, and inorder writes it before that child, as in -x. */
export function traversalFrames(root: ExprNode, order: TreeOrder, infix: string): TraversalFrame[] {
  const frames: TraversalFrame[] = [
    { step: -1, phase: 'start', visited: [], path: [], output: [], title: ORDER_LABELS[order], detail: TRAVERSAL_INTROS[order] },
  ];
  const visited: string[] = [];
  const output: string[] = [];
  const path: string[] = [];

  const visitNode = (node: ExprNode) => {
    visited.push(node.id);
    output.push(node.token);
    frames.push({
      step: visited.length - 1,
      phase: 'visit',
      currentId: node.id,
      visited: [...visited],
      path: [...path],
      output: [...output],
      title: `Visit ${displayToken(node.token)}`,
      detail: `Write ${displayToken(node.token)}. The output so far is ${output.map(displayToken).join(' ')}.`,
    });
  };

  (function walk(node: ExprNode) {
    path.push(node.id);
    const [left, right] = node.children;
    if (order === 'pre' || (order === 'in' && node.children.length === 1)) visitNode(node);
    if (left) walk(left);
    if (order === 'in' && node.children.length !== 1) visitNode(node);
    if (right) walk(right);
    if (order === 'post') visitNode(node);
    path.pop();
  })(root);

  const finish =
    order === 'in'
      ? `Inorder alone loses the grouping, so the same tokens could mean something else. Adding parentheses around each operator keeps the meaning: ${infix}`
      : `Every node has been visited once. Unlike inorder, this form needs no parentheses, because the order of the tokens already fixes the meaning.`;
  frames.push({ step: visited.length - 1, phase: 'done', visited: [...visited], path: [], output: [...output], title: 'Finished', detail: finish });
  return frames;
}
