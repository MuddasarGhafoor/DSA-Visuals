export type Notation = 'infix' | 'prefix' | 'postfix';
export type NotationChoice = Notation | 'auto';
export type ExprNode = { id: string; token: string; children: ExprNode[] };

/** One postfix token being processed. Steps line up one-to-one with the postfix tokens. */
export type EvalStep = {
  kind: 'push' | 'apply';
  token: string;
  nodeId: string;
  value: number;
  operands: number[];
  operandIds: string[];
  stack: number[];
  message: string;
};

export type ExpressionResult = {
  root: ExprNode;
  notation: Notation;
  infix: string;
  prefix: string;
  postfix: string;
  result: number;
  steps: EvalStep[];
};

export const MAX_EXPRESSION_LENGTH = 500;

const NUMERIC = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const OPERATOR = /^[+\-*/^~]$/;
const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };
const UNARY_PRECEDENCE = 3; // Below ^ so that -2^2 is -(2^2), above * and /.

export const formatNumber = (n: number): string => (Number.isInteger(n) ? String(n + 0) : String(Number(n.toPrecision(12))));

/** Shorter form for tree nodes, where long decimals would not fit. */
export function compactNumber(n: number): string {
  const full = formatNumber(n);
  return full.length <= 7 ? full : String(Number(n.toPrecision(4)));
}

export const displayToken = (token: string): string => ({ '~': '−', '-': '−', '*': '×', '/': '÷' })[token] ?? token;

type MakeNode = (token: string, children?: ExprNode[]) => ExprNode;

function tokenizeInfix(input: string): string[] {
  const raw: string[] = [];
  let offset = 0;
  while (offset < input.length) {
    if (/\s/.test(input[offset])) {
      offset++;
      continue;
    }
    const match = input.slice(offset).match(/^(?:\d+(?:\.\d*)?|\.\d+|[()+\-*/^])/);
    if (!match) throw new Error(`Unexpected character “${input[offset]}” at position ${offset + 1}. Use numbers and + - * / ^ ( ).`);
    const end = offset + match[0].length;
    if (input[end] === '.' && NUMERIC.test(match[0])) throw new Error(`Invalid number at position ${offset + 1}. A number can have only one decimal point.`);
    raw.push(match[0]);
    offset = end;
  }
  // Implicit multiplication: 2(3), (2)3 and (2)(3).
  const tokens: string[] = [];
  raw.forEach((token, i) => {
    const prev = raw[i - 1];
    if (prev && ((NUMERIC.test(prev) && token === '(') || (prev === ')' && (token === '(' || NUMERIC.test(token))))) tokens.push('*');
    tokens.push(token);
  });
  return tokens;
}

function parseInfix(input: string, make: MakeNode): ExprNode {
  const tokens = tokenizeInfix(input);
  let cursor = 0;

  function parse(min = 0): ExprNode {
    const token = tokens[cursor++];
    let left: ExprNode;
    if (token === '-' || token === '+') {
      const child = parse(UNARY_PRECEDENCE);
      left = token === '-' ? make('~', [child]) : child;
    } else if (token === '(') {
      left = parse();
      if (tokens[cursor++] !== ')') throw new Error('Missing closing parenthesis.');
    } else if (token && NUMERIC.test(token)) {
      left = make(token);
    } else {
      throw new Error(`Expected a number or “(”${token ? `, found “${token}”` : ' at the end'}.`);
    }
    while (cursor < tokens.length) {
      const op = tokens[cursor];
      const precedence = PRECEDENCE[op];
      if (precedence === undefined || precedence < min) break;
      cursor++;
      // ^ is right-associative, so its right side may contain another ^.
      left = make(op, [left, parse(op === '^' ? precedence : precedence + 1)]);
    }
    return left;
  }

  const root = parse();
  if (cursor !== tokens.length) {
    const token = tokens[cursor];
    if (token === ')') throw new Error('Unmatched closing parenthesis.');
    throw new Error(`Missing operator between “${tokens[cursor - 1]}” and “${token}”.`);
  }
  return root;
}

function parseStackNotation(input: string, notation: 'prefix' | 'postfix', make: MakeNode): ExprNode {
  const tokens = input.trim().split(/\s+/);
  const stack: ExprNode[] = [];
  for (const token of notation === 'prefix' ? [...tokens].reverse() : tokens) {
    if (NUMERIC.test(token)) {
      stack.push(make(token));
    } else if (OPERATOR.test(token)) {
      const arity = token === '~' ? 1 : 2;
      if (stack.length < arity) throw new Error(`Operator “${token}” needs ${arity} operand${arity > 1 ? 's' : ''}. Separate every token with spaces.`);
      const children = stack.splice(stack.length - arity, arity);
      if (notation === 'prefix') children.reverse();
      stack.push(make(token, children));
    } else {
      throw new Error(`Invalid token “${token}”. Separate numbers and operators with spaces, and use ~ for unary minus.`);
    }
  }
  if (stack.length !== 1) throw new Error('Too many operands. Each binary operator must combine exactly two values.');
  return stack[0];
}

/** Infix goes first: it is the common case, and the only one where "- 3 -2" style input is ambiguous. */
function parseAuto(input: string, make: MakeNode): { root: ExprNode; notation: Notation } {
  const errors = {} as Record<Notation, Error>;
  for (const notation of ['infix', 'prefix', 'postfix'] as const) {
    try {
      const root = notation === 'infix' ? parseInfix(input, make) : parseStackNotation(input, notation, make);
      return { root, notation };
    } catch (e) {
      errors[notation] = e as Error;
    }
  }
  // Nothing parsed, so report the error for the notation the input most resembles.
  const tokens = input.trim().split(/\s+/);
  const isNumber = (t?: string) => !!t && NUMERIC.test(t);
  if (tokens.length >= 3 && OPERATOR.test(tokens[0]) && isNumber(tokens.at(-1)) && isNumber(tokens.at(-2))) throw errors.prefix;
  if (tokens.length >= 3 && isNumber(tokens[0]) && isNumber(tokens[1]) && OPERATOR.test(tokens.at(-1)!)) throw errors.postfix;
  throw errors.infix;
}

function apply(op: string, a: number, b: number): number {
  switch (op) {
    case '~':
      return -a;
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) throw new Error(`Division by zero: ${formatNumber(a)} ÷ 0 is undefined.`);
      return a / b;
    default: {
      if (a === 0 && b < 0) throw new Error(`0 ^ ${formatNumber(b)} divides by zero, so it is undefined.`);
      const power = a ** b;
      if (Number.isNaN(power)) throw new Error(`${formatNumber(a)} ^ ${formatNumber(b)} has no real result: a negative base needs a whole-number power.`);
      return power;
    }
  }
}

const describeOperation = (op: string, operands: number[], value: number): string =>
  op === '~'
    ? `−(${formatNumber(operands[0])}) = ${formatNumber(value)}`
    : `${formatNumber(operands[0])} ${displayToken(op)} ${formatNumber(operands[1])} = ${formatNumber(value)}`;

function evaluateTree(root: ExprNode): { result: number; steps: EvalStep[] } {
  const steps: EvalStep[] = [];
  const stack: number[] = [];

  function visit(node: ExprNode): number {
    const operands = node.children.map(visit);
    stack.splice(stack.length - operands.length, operands.length);
    const value = node.children.length ? apply(node.token, operands[0], operands[1]) : Number(node.token);
    if (!Number.isFinite(value)) throw new Error(node.children.length ? 'The result is too large to represent.' : `The number ${node.token.slice(0, 12)}… is too large to represent.`);
    stack.push(value);
    steps.push({
      kind: node.children.length ? 'apply' : 'push',
      token: node.token,
      nodeId: node.id,
      value,
      operands,
      operandIds: node.children.map(child => child.id),
      stack: [...stack],
      message: node.children.length ? describeOperation(node.token, operands, value) : `Push ${node.token}`,
    });
    return value;
  }

  return { result: visit(root), steps };
}

function toInfix(node: ExprNode): string {
  if (!node.children.length) return node.token.startsWith('-') ? `(${node.token})` : node.token; // A bare -3 would re-parse as -(3 ^ 2).
  if (node.token === '~') return `(-${toInfix(node.children[0])})`;
  return `(${toInfix(node.children[0])} ${node.token} ${toInfix(node.children[1])})`;
}
const toPrefix = (node: ExprNode): string => [node.token, ...node.children.map(toPrefix)].join(' ');
const toPostfix = (node: ExprNode): string => [...node.children.map(toPostfix), node.token].join(' ');

export function analyzeExpression(input: string, choice: NotationChoice = 'auto'): ExpressionResult {
  if (!input.trim()) throw new Error('Enter an expression to begin.');
  if (input.length > MAX_EXPRESSION_LENGTH) throw new Error(`Keep expressions to ${MAX_EXPRESSION_LENGTH} characters or fewer.`);
  const text = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');

  let id = 0;
  const make: MakeNode = (token, children = []) => ({ id: `e${id++}`, token, children });
  const { root, notation } =
    choice === 'auto'
      ? parseAuto(text, make)
      : { root: choice === 'infix' ? parseInfix(text, make) : parseStackNotation(text, choice, make), notation: choice };

  const { result, steps } = evaluateTree(root);
  return { root, notation, infix: toInfix(root), prefix: toPrefix(root), postfix: toPostfix(root), result, steps };
}
