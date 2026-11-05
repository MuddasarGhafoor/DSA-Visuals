import { normalizeSymbols, PRECEDENCE, UNARY_PRECEDENCE } from '../lib/expressions.ts';
import { precedenceOf, shouldPop, traceShuntingYard } from '../lib/shunting-yard.ts';
import { cells, choiceField, factsPanel, row, stackPanel, textField, Trace, treePanel, visualTree, when, whenChoice, type BinaryNode, type Panel, type SimulatorDef, type Tone, type Values } from './kit.ts';

const MAX_TOKENS = 30;
const isOperator = (token: string) => PRECEDENCE[token] !== undefined;
const isOperand = (token: string) => /^[\w.]/.test(token);

/** Like the evaluator's reader, and it also accepts letters, since notation is usually taught with A + B * C. */
function readTokens(input: string, { infix }: { infix: boolean }): string[] {
  const text = normalizeSymbols(input);
  const raw: string[] = [];
  let offset = 0;
  while (offset < text.length) {
    if (/\s/.test(text[offset])) {
      offset++;
      continue;
    }
    const match = text.slice(offset).match(infix ? /^(?:\d+(?:\.\d*)?|\.\d+|[A-Za-z_]\w*|[()+\-*/^])/ : /^(?:\d+(?:\.\d*)?|\.\d+|[A-Za-z_]\w*|[+\-*/^~])/);
    if (!match) throw new Error(`“${text[offset]}” can't be used here. Use numbers, letters, and + - * / ^${infix ? ' ( )' : ' ~'}.`);
    raw.push(match[0]);
    offset += match[0].length;
  }
  if (!raw.length) throw new Error('Enter an expression to begin.');
  if (raw.length > MAX_TOKENS) throw new Error(`Keep the expression to ${MAX_TOKENS} parts, so every step stays readable.`);
  if (!infix) return raw;
  // Implicit multiplication, as in 2(3), (a)b, and (a)(b).
  const tokens: string[] = [];
  raw.forEach((token, i) => {
    const previous = raw[i - 1];
    if (previous && ((isOperand(previous) && token === '(') || (previous === ')' && (token === '(' || isOperand(token))))) tokens.push('*');
    tokens.push(token);
  });
  return tokens;
}

/** One finished piece of the expression, written in every notation at once. */
type Piece = { infix: string; full: string; prefix: string[]; postfix: string[]; precedence: number; node: BinaryNode };

let serial = 0;
const leaf = (token: string): Piece => ({ infix: token, full: token, prefix: [token], postfix: [token], precedence: 9, node: { id: `e${serial++}`, label: token, tone: 'value' } });

function joinPieces(op: string, left: Piece, right: Piece): Piece {
  const level = precedenceOf(op);
  const leftText = left.precedence < level || (left.precedence === level && op === '^') ? `(${left.infix})` : left.infix;
  const rightText = right.precedence < level || (right.precedence === level && op !== '^') ? `(${right.infix})` : right.infix;
  return {
    infix: `${leftText} ${op} ${rightText}`,
    full: `(${left.full} ${op} ${right.full})`,
    prefix: [op, ...left.prefix, ...right.prefix],
    postfix: [...left.postfix, ...right.postfix, op],
    precedence: level,
    node: { id: `e${serial++}`, label: op, tone: 'accent', square: true, left: left.node, right: right.node },
  };
}

function negate(inner: Piece): Piece {
  return {
    infix: inner.precedence < UNARY_PRECEDENCE ? `-(${inner.infix})` : `-${inner.infix}`,
    full: `(-${inner.full})`,
    prefix: ['~', ...inner.prefix],
    postfix: [...inner.postfix, '~'],
    precedence: UNARY_PRECEDENCE,
    node: { id: `e${serial++}`, label: '−', tone: 'accent', square: true, left: inner.node },
  };
}

/** Builds the expression from infix with an operator stack and an operand stack, reporting each move. */
function fromInfix(tokens: string[], report?: (event: { kind: string; token: string; at: number; ops: string[]; values: Piece[]; compare?: { top: string; pops: boolean } }) => void): Piece {
  const ops: string[] = [];
  const values: Piece[] = [];
  const tell = (kind: string, token: string, at: number, compare?: { top: string; pops: boolean }) => report?.({ kind, token, at, ops: [...ops], values: [...values], compare });
  const apply = (at: number) => {
    const op = ops.pop()!;
    if (op === '~') {
      values.push(negate(values.pop()!));
    } else {
      const right = values.pop()!;
      const left = values.pop()!;
      values.push(joinPieces(op, left, right));
    }
    tell('apply', op, at);
  };
  let expectOperand = true;
  tokens.forEach((token, at) => {
    if (expectOperand) {
      if (isOperand(token)) {
        values.push(leaf(token));
        tell('operand', token, at);
        expectOperand = false;
      } else if (token === '(') {
        ops.push(token);
        tell('open', token, at);
      } else if (token === '-') {
        ops.push('~');
        tell('unary', token, at);
      } else if (token === '+') {
        tell('skip', token, at);
      } else throw new Error(`Expected a number, a letter, or “(”, but found “${token}”.`);
      return;
    }
    if (token === ')') {
      while (ops.length && ops.at(-1) !== '(') apply(at);
      if (!ops.length) throw new Error('There is a closing parenthesis with no opening one.');
      ops.pop();
      tell('close', token, at);
    } else if (isOperator(token)) {
      while (ops.length && ops.at(-1) !== '(' && shouldPop(ops.at(-1)!, token)) {
        tell('compare', token, at, { top: ops.at(-1)!, pops: true });
        apply(at);
      }
      if (ops.length && ops.at(-1) !== '(') tell('compare', token, at, { top: ops.at(-1)!, pops: false });
      ops.push(token);
      tell('push', token, at);
      expectOperand = true;
    } else throw new Error(`An operator is missing between “${tokens[at - 1]}” and “${token}”.`);
  });
  if (expectOperand) throw new Error('The expression ends too soon: it needs a number or a letter at the end.');
  while (ops.length) {
    if (ops.at(-1) === '(') throw new Error('There is an opening parenthesis with no closing one.');
    apply(tokens.length);
  }
  return values[0];
}

const finalPanels = (piece: Piece, full: boolean, target: string): Panel[] => {
  const forms = { infix: full ? piece.full : piece.infix, prefix: piece.prefix.join(' '), postfix: piece.postfix.join(' ') };
  return [
    treePanel('The same expression as a tree', visualTree(piece.node), 'Expression tree'),
    factsPanel('In every notation', (['infix', 'prefix', 'postfix'] as const).map(name => ({ label: `${name[0].toUpperCase()}${name.slice(1)}`, value: forms[name], tone: (name === target ? 'done' : undefined) as Tone | undefined }))),
  ];
};

const inputRow = (tokens: string[], at: number, title = 'Input', reversed = false): Panel => cells(title, row(tokens, { hideIndex: !reversed && false, pointers: at >= 0 && at < tokens.length ? { [at]: 'reading' } : undefined, tone: i => (i === at ? 'active' : i < at ? 'muted' : undefined) }));

// ---------- Infix to Postfix: the shunting yard ----------

function infixToPostfix(values: Values) {
  const result = traceShuntingYard(values.infix, text => readTokens(text, { infix: true }));
  if (result.error) throw new Error(result.error);
  const trace = new Trace();
  const toneOf: Record<string, Tone> = { start: 'muted', output: 'value', push: 'accent', compare: 'active', pop: 'new', discard: 'muted', skip: 'muted', done: 'done' };
  result.frames.filter(frame => frame.phase !== 'done').forEach(frame => {
    const growing = frame.phase === 'output' || frame.phase === 'pop';
    const panels: Panel[] = [
      inputRow(result.tokens, frame.step),
      cells('Output', row(frame.output, { hideIndex: true, tone: i => (growing && i === frame.output.length - 1 ? 'new' : 'value') })),
      stackPanel('Operator stack', frame.stack, { tone: i => (i === frame.stack.length - 1 ? (frame.phase === 'compare' ? 'active' : frame.phase === 'push' ? 'new' : undefined) : undefined), empty: 'Empty' }),
    ];
    if (frame.compare) {
      panels.push(factsPanel('Which goes first?', [
        { label: `On the stack: ${frame.compare.top === '~' ? 'unary −' : frame.compare.top}`, value: `Level ${precedenceOf(frame.compare.top)}` },
        { label: `Incoming: ${frame.compare.incoming}`, value: `Level ${precedenceOf(frame.compare.incoming)}` },
        { label: 'Result', value: frame.compare.pops ? 'Pop' : 'Wait', tone: frame.compare.pops ? 'new' : 'path' },
      ]));
    }
    trace.add(frame.title, frame.detail, panels, { tone: toneOf[frame.phase] ?? 'value' });
  });
  const piece = fromInfix(result.tokens);
  trace.finish(`Postfix: ${result.postfix}`, 'A stack can evaluate this from left to right, with no parentheses or precedence rules.', [cells('Output', row(result.postfix.split(' '), { hideIndex: true, tone: () => 'done' })), ...finalPanels(piece, false, 'postfix')]);
  return { frames: trace.frames, answer: { output: result.postfix, infix: piece.infix, prefix: piece.prefix.join(' '), postfix: piece.postfix.join(' ') } };
}

// ---------- Infix to Prefix ----------

function infixToPrefixStacks(values: Values) {
  const tokens = readTokens(values.infix, { infix: true });
  const trace = new Trace();
  const piece = fromInfix(tokens, ({ kind, token, at, ops, values: stackValues, compare }) => {
    const panels: Panel[] = [
      inputRow(tokens, at),
      stackPanel('Operand stack: finished prefix pieces', stackValues.map(item => item.prefix.join(' ')), { zone: 'main', tone: i => (i === stackValues.length - 1 && (kind === 'operand' || kind === 'apply') ? 'new' : undefined), empty: 'Empty' }),
      stackPanel('Operator stack', ops, { tone: i => (i === ops.length - 1 ? 'accent' : undefined), empty: 'Empty' }),
    ];
    if (compare) panels.push(factsPanel('Which goes first?', [{ label: `On the stack: ${compare.top === '~' ? 'unary −' : compare.top}`, value: `Level ${precedenceOf(compare.top)}` }, { label: `Incoming: ${token}`, value: `Level ${precedenceOf(token)}` }, { label: 'Result', value: compare.pops ? 'Apply' : 'Wait', tone: compare.pops ? 'new' : 'path' }]));
    const text: Record<string, [string, string, Tone]> = {
      operand: [`Operand ${token}`, 'A number or letter is a finished piece, so it goes on the operand stack.', 'value'],
      open: ['Push (', 'It acts as a wall, until its closing parenthesis arrives.', 'accent'],
      unary: ['Push unary −', 'A minus with nothing before it means negate. It is written as ~ in prefix.', 'accent'],
      skip: ['Skip unary +', 'A plus with nothing before it changes nothing.', 'muted'],
      close: ['Discard ( )', 'The group is finished, so the pair has done its job.', 'muted'],
      push: [`Push ${token}`, `${token} has to wait, because its right side hasn't been read yet.`, 'accent'],
      compare: [`Compare ${compare?.top} with ${token}`, compare?.pops ? `${compare.top} has to run first, so apply it now.` : `${compare?.top} has to keep waiting, since ${token} runs first.`, 'active'],
      apply: [token === '~' ? 'Apply unary −' : `Apply ${token}`, token === '~' ? 'Pop one piece, and write ~ in front of it.' : 'Pop two pieces. The first popped is the right side. Write the operator first, then left, then right.', 'new'],
    };
    const [title, detail, tone] = text[kind];
    trace.add(title, detail, panels, { tone });
  });
  const output = piece.prefix.join(' ');
  trace.finish(`Prefix: ${output}`, 'Each operator now comes before its two operands, so no parentheses are needed.', [cells('Output', row(piece.prefix, { hideIndex: true, tone: () => 'done' })), ...finalPanels(piece, false, 'prefix')]);
  return { frames: trace.frames, answer: { output, infix: piece.infix, prefix: output, postfix: piece.postfix.join(' ') } };
}

function infixToPrefixReverse(values: Values) {
  const tokens = readTokens(values.infix, { infix: true });
  const piece = fromInfix(tokens);
  if (piece.prefix.includes('~')) throw new Error('This method can\'t handle unary minus, since reversing moves it after its operand. Choose two stacks instead.');
  const trace = new Trace();
  const reversed = [...tokens].reverse().map(token => (token === '(' ? ')' : token === ')' ? '(' : token));
  const output: string[] = [];
  const stack: string[] = [];
  trace.group = 'Reverse the input';
  trace.add('Reverse and swap', 'Reverse the tokens, and swap each ( with ). Reading from the right makes operators come out before their operands.', [cells('Input', row(tokens, { hideIndex: true })), cells('Reversed', row(reversed, { hideIndex: true, tone: () => 'new' })), stackPanel('Operator stack', stack, { empty: 'Empty' })], { tone: 'new' });
  trace.group = 'Convert the reversed input';
  const scene = (at: number, tone?: Tone): Panel[] => [
    inputRow(reversed, at, 'Reversed input'),
    cells('Output so far', row(output, { hideIndex: true, tone: i => (i === output.length - 1 ? 'new' : 'value') })),
    stackPanel('Operator stack', stack, { tone: i => (i === stack.length - 1 ? tone : undefined), empty: 'Empty' }),
  ];
  // Reading backward flips grouping: left-grouping operators of equal level must wait, and ^ must pop.
  const popsReversed = (top: string, incoming: string) => precedenceOf(top) > precedenceOf(incoming) || (precedenceOf(top) === precedenceOf(incoming) && incoming === '^');
  reversed.forEach((token, at) => {
    if (isOperand(token)) {
      output.push(token);
      trace.add(`Output ${token}`, 'Operands go straight to the output.', scene(at), { tone: 'value' });
    } else if (token === '(') {
      stack.push(token);
      trace.add('Push (', 'It acts as a wall, until its partner arrives.', scene(at, 'accent'), { tone: 'accent' });
    } else if (token === ')') {
      while (stack.at(-1) !== '(') {
        output.push(stack.pop()!);
        trace.add(`Pop ${output.at(-1)}`, 'The group has ended, so everything back to its partner goes out.', scene(at), { tone: 'new' });
      }
      stack.pop();
      trace.add('Discard ( )', 'The pair has done its job.', scene(at), { tone: 'muted' });
    } else {
      while (stack.length && stack.at(-1) !== '(' && popsReversed(stack.at(-1)!, token)) {
        output.push(stack.pop()!);
        trace.add(`Pop ${output.at(-1)}`, `It runs before ${token}. Because this input is reversed, equal levels of + - * / now wait, and only ^ pops.`, scene(at), { tone: 'new' });
      }
      stack.push(token);
      trace.add(`Push ${token}`, 'It waits on the stack.', scene(at, 'accent'), { tone: 'accent' });
    }
  });
  while (stack.length) {
    output.push(stack.pop()!);
    trace.add(`Pop ${output.at(-1)}`, 'The input has run out, so everything still waiting goes out.', scene(reversed.length), { tone: 'new' });
  }
  trace.group = 'Reverse the output';
  const final = [...output].reverse();
  trace.add('Reverse the output', 'Reversing once more gives the prefix form.', [cells('Output so far', row(output, { hideIndex: true })), cells('Reversed output', row(final, { hideIndex: true, tone: () => 'done' })), stackPanel('Operator stack', [], { empty: 'Empty' })], { tone: 'new' });
  trace.group = undefined;
  const text = final.join(' ');
  trace.finish(`Prefix: ${text}`, 'This gives the same answer as the two stacks method.', [cells('Output', row(final, { hideIndex: true, tone: () => 'done' })), ...finalPanels(piece, false, 'prefix')]);
  return { frames: trace.frames, answer: { output: text, infix: piece.infix, prefix: piece.prefix.join(' '), postfix: piece.postfix.join(' ') } };
}

// ---------- Postfix and prefix input: a stack of finished pieces ----------

function fromStackForm(values: Values, source: 'postfix' | 'prefix', target: 'infix' | 'postfix' | 'prefix', full: boolean) {
  const tokens = readTokens(values[source], { infix: false });
  const order = source === 'postfix' ? tokens.map((_, i) => i) : tokens.map((_, i) => tokens.length - 1 - i);
  const stack: Piece[] = [];
  const trace = new Trace();
  const write = (piece: Piece) => (target === 'infix' ? (full ? piece.full : piece.infix) : target === 'prefix' ? piece.prefix.join(' ') : piece.postfix.join(' '));
  const scene = (at: number, tone?: Tone): Panel[] => [
    cells(source === 'prefix' ? 'Input, read from the right' : 'Input, read from the left', row(tokens, { hideIndex: true, pointers: at >= 0 ? { [at]: 'reading' } : undefined, tone: i => (i === at ? 'active' : (source === 'postfix' ? i < at : i > at) ? 'muted' : undefined) })),
    stackPanel(`Stack of finished ${target} pieces`, stack.map(write), { zone: 'main', tone: i => (i === stack.length - 1 ? tone : undefined), empty: 'Empty' }),
  ];
  trace.add('Start', source === 'postfix' ? 'Read from the left. An operator always comes after its operands, so they are already on the stack.' : 'Read from the right. An operator comes before its operands, so reading backward puts them on the stack first.', scene(-1), { tone: 'muted' });
  order.forEach(at => {
    const token = tokens[at];
    if (isOperand(token)) {
      stack.push(leaf(token));
      trace.add(`Push ${token}`, 'An operand is already a finished piece.', scene(at, 'new'), { tone: 'value' });
    } else if (token === '~') {
      if (!stack.length) throw new Error('Unary ~ has nothing to apply to. There are too few operands.');
      stack.push(negate(stack.pop()!));
      trace.add('Apply unary −', `Pop one piece, and negate it: ${write(stack.at(-1)!)}.`, scene(at, 'new'), { tone: 'new' });
    } else {
      if (stack.length < 2) throw new Error(`The operator ${token} needs two operands, but the stack has ${stack.length}. Check that this is written in ${source} form.`);
      const first = stack.pop()!;
      const second = stack.pop()!;
      const [left, right] = source === 'postfix' ? [second, first] : [first, second];
      stack.push(joinPieces(token, left, right));
      trace.add(`Apply ${token}`, source === 'postfix'
        ? `Pop two pieces. The first popped is the right side: ${write(second)} ${token} ${write(first)} becomes ${write(stack.at(-1)!)}.`
        : `Pop two pieces. Reading backward, the first popped is the left side: ${write(first)} ${token} ${write(second)} becomes ${write(stack.at(-1)!)}.`, scene(at, 'new'), { tone: 'new' });
    }
  });
  if (stack.length !== 1) throw new Error(`${stack.length} pieces are left at the end, when there should be one. There are too few operators for these operands.`);
  const piece = stack[0];
  const output = write(piece);
  trace.finish(`${target[0].toUpperCase()}${target.slice(1)}: ${output}`, target === 'infix' ? (full ? 'Every operation has its own parentheses, which is how many textbooks write it.' : 'Parentheses appear only where precedence would otherwise change the meaning.') : 'One piece is left on the stack, and it is the whole expression.', [cells('Output', row(output.split(' '), { hideIndex: true, tone: () => 'done' })), ...finalPanels(piece, full, target)]);
  return { frames: trace.frames, answer: { output, infix: piece.infix, prefix: piece.prefix.join(' '), postfix: piece.postfix.join(' ') } };
}

const CONVERSIONS: [string, string][] = [['infix-postfix', 'Infix to Postfix'], ['infix-prefix', 'Infix to Prefix'], ['postfix-infix', 'Postfix to Infix'], ['postfix-prefix', 'Postfix to Prefix'], ['prefix-infix', 'Prefix to Infix'], ['prefix-postfix', 'Prefix to Postfix']];

const notationConversion: SimulatorDef = {
  fields: [
    choiceField('conversion', 'Convert', CONVERSIONS),
    when(textField('infix', 'Infix', 'A + B * (C - D)', { wide: true }), values => values.conversion.startsWith('infix')),
    when(textField('postfix', 'Postfix', 'A B C D - * +', { wide: true }), values => values.conversion.startsWith('postfix')),
    when(textField('prefix', 'Prefix', '+ A * B - C D', { wide: true }), values => values.conversion.startsWith('prefix')),
    whenChoice(choiceField('method', 'Method', [['stacks', 'Two stacks'], ['reverse', 'Reverse, then convert']]), 'conversion', 'infix-prefix'),
    when(choiceField('parens', 'Parentheses', [['minimal', 'Only where needed'], ['full', 'Around every operation']]), values => values.conversion.endsWith('infix')),
  ],
  examples: [
    { title: 'Infix to Postfix', about: 'The shunting yard: * goes before +, and parentheses come first.', values: { conversion: 'infix-postfix', infix: 'A + B * (C - D)' } },
    { title: 'Right to left', about: 'In 2 ^ 3 ^ 2, the second ^ waits, as ^ groups from the right.', values: { conversion: 'infix-postfix', infix: '2 ^ 3 ^ 2' } },
    { title: 'Infix to Prefix', about: 'Two stacks build each piece as soon as it is finished.', values: { conversion: 'infix-prefix', infix: '(A - B / C) * (A / K - L)', method: 'stacks' } },
    { title: 'The reverse method', about: 'The textbook trick: reverse, convert, and reverse again.', values: { conversion: 'infix-prefix', infix: '(A - B / C) * (A / K - L)', method: 'reverse' } },
    { title: 'Postfix to Infix', about: 'A stack rebuilds the expression, and adds parentheses where needed.', values: { conversion: 'postfix-infix', postfix: 'A B + C *', parens: 'minimal' } },
    { title: 'Prefix to Postfix', about: 'Read from the right, and the first popped piece is the left side.', values: { conversion: 'prefix-postfix', prefix: '* + A B - C D' } },
    { title: 'A unary minus', about: 'Written ~ in prefix and postfix, since it takes one operand.', values: { conversion: 'infix-postfix', infix: '-A * (B + -C)' } },
  ],
  run(values) {
    serial = 0;
    const [source, target] = values.conversion.split('-') as ['infix' | 'postfix' | 'prefix', 'infix' | 'postfix' | 'prefix'];
    if (source === 'infix') {
      if (target === 'postfix') return infixToPostfix(values);
      return values.method === 'reverse' ? infixToPrefixReverse(values) : infixToPrefixStacks(values);
    }
    return fromStackForm(values, source, target, values.parens === 'full');
  },
};

export const simulators: Record<string, SimulatorDef> = {
  'notation-conversion': notationConversion,
};
