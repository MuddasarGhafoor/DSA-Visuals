import { compactNumber, displayToken, formatNumber, type ExprNode, type ExpressionResult } from './expressions.ts';

export type ExprNodeState = 'waiting' | 'pending-op' | 'on-stack' | 'operand' | 'active-op' | 'computed' | 'absorbed';
export type ExprFramePhase = 'start' | 'read' | 'pick' | 'compute' | 'merge' | 'done';
export type StackItem = { id: string; value: number };
export type Tray = { left?: number; op: string; right: number; result?: number };

/**
 * One animation frame. An operator takes three frames (pick its operands, compute, merge the
 * nodes into one value), which is what makes the tree visibly collapse as evaluation proceeds.
 */
export type ExprFrame = {
  phase: ExprFramePhase;
  step: number; // Index into result.steps, or -1 before the first token.
  stack: StackItem[];
  tray: Tray | null;
  freshId?: string;
  nodes: Record<string, { label: string; state: ExprNodeState; resolved?: boolean; absorbedInto?: string }>;
  badge?: { nodeId: string; text: string };
  title: string;
  detail: string;
};

export function buildExpressionFrames(analysis: ExpressionResult): ExprFrame[] {
  let nodes: ExprFrame['nodes'] = {};
  const collect = (node: ExprNode) => {
    nodes[node.id] = {
      label: node.children.length ? displayToken(node.token) : compactNumber(Number(node.token)),
      state: node.children.length ? 'pending-op' : 'waiting',
    };
    node.children.forEach(collect);
  };
  collect(analysis.root);

  const patch = (changes: Record<string, Partial<ExprFrame['nodes'][string]>>) => {
    nodes = { ...nodes };
    for (const [id, change] of Object.entries(changes)) nodes[id] = { ...nodes[id], ...change };
  };

  let stack: StackItem[] = [];
  const frames: ExprFrame[] = [
    {
      phase: 'start',
      step: -1,
      stack,
      tray: null,
      nodes,
      title: 'Ready',
      detail: 'Numbers are leaves and operators join them. Read the postfix form left to right, so children are always worked out before their parent.',
    },
  ];

  analysis.steps.forEach((step, index) => {
    const shared = { step: index };
    if (step.kind === 'push') {
      stack = [...stack, { id: step.nodeId, value: step.value }];
      patch({ [step.nodeId]: { state: 'on-stack' } });
      frames.push({
        ...shared,
        phase: 'read',
        stack,
        tray: null,
        freshId: step.nodeId,
        nodes,
        title: `Read ${step.token}`,
        detail: `${step.token} is a number, so it goes on the stack and waits for an operator.`,
      });
      return;
    }

    const op = displayToken(step.token);
    const unary = step.operands.length === 1;
    const [a, b] = step.operands.map(formatNumber);
    const operandStates = Object.fromEntries(step.operandIds.map(id => [id, { state: 'operand' as const }]));
    const base: Tray = unary ? { op, right: step.operands[0] } : { left: step.operands[0], op, right: step.operands[1] };

    // Pick: pop the operands off the stack.
    stack = stack.slice(0, stack.length - step.operands.length);
    patch({ ...operandStates, [step.nodeId]: { state: 'active-op' } });
    frames.push({
      ...shared,
      phase: 'pick',
      stack,
      tray: base,
      nodes,
      title: unary ? `Take ${a}` : `Take ${a} and ${b}`,
      detail: unary
        ? `Unary minus needs one value, so pop ${a} off the stack.`
        : `${op} needs two values. Pop ${b} first (it is the right side), then ${a} (the left side).`,
    });

    // Compute: the operator node shows the sum it is doing.
    frames.push({
      ...shared,
      phase: 'compute',
      stack,
      tray: { ...base, result: step.value },
      nodes,
      badge: { nodeId: step.nodeId, text: step.message },
      title: step.message,
      detail: unary ? `Negate ${a}.` : `Apply ${op} to ${a} and ${b}, keeping that order.`,
    });

    // Merge: children collapse into the operator, which becomes a plain value.
    const value = formatNumber(step.value);
    stack = [...stack, { id: step.nodeId, value: step.value }];
    patch({
      ...Object.fromEntries(step.operandIds.map(id => [id, { state: 'absorbed' as const, absorbedInto: step.nodeId }])),
      [step.nodeId]: { state: 'computed', label: compactNumber(step.value), resolved: true },
    });
    frames.push({
      ...shared,
      phase: 'merge',
      stack,
      tray: null,
      freshId: step.nodeId,
      nodes,
      title: `Push ${value}`,
      detail: `The ${op} node and its ${unary ? 'child' : 'two children'} collapse into a single value, ${value}, which goes back on the stack.`,
    });
  });

  const result = formatNumber(analysis.result);
  frames.push({
    phase: 'done',
    step: analysis.steps.length - 1,
    stack,
    tray: null,
    nodes,
    title: `Result: ${result}`,
    detail: 'One value is left on the stack, and the whole tree has collapsed into its root. That value is the answer.',
  });
  return frames;
}
