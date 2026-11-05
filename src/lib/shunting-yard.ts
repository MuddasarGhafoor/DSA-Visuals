import { displayToken, MAX_EXPRESSION_LENGTH, normalizeSymbols, PRECEDENCE, tokenizeInfix, UNARY_PRECEDENCE } from './expressions.ts';

export type ShuntingFrame = {
  step: number; // Index of the token being read. tokens.length means the input has run out.
  phase: 'start' | 'output' | 'push' | 'compare' | 'pop' | 'discard' | 'skip' | 'error' | 'done';
  output: string[];
  stack: string[];
  compare?: { top: string; incoming: string; pops: boolean };
  title: string;
  detail: string;
};

export type ShuntingResult = { tokens: string[]; postfix: string; frames: ShuntingFrame[]; error?: string };

export const precedenceOf = (op: string): number => (op === '~' ? UNARY_PRECEDENCE : PRECEDENCE[op]);

/** Does the operator on top of the stack run before the incoming one? */
export function shouldPop(top: string, incoming: string): boolean {
  if (top === '(') return false;
  if (precedenceOf(top) !== precedenceOf(incoming)) return precedenceOf(top) > precedenceOf(incoming);
  return incoming !== '^'; // Equal precedence: left-associative pops, right-associative waits.
}

const show = (token: string) => (token === '~' ? 'unary −' : displayToken(token));
const isOperand = (token: string) => /^[\w.]/.test(token);

/** The tokenizer can be swapped, so a caller can also allow letters as operands, as in A + B * C. */
export function traceShuntingYard(input: string, tokenize: (text: string) => string[] = tokenizeInfix): ShuntingResult {
  if (!input.trim()) throw new Error('Enter an expression to begin.');
  if (input.length > MAX_EXPRESSION_LENGTH) throw new Error(`Keep expressions to ${MAX_EXPRESSION_LENGTH} characters or fewer.`);
  const tokens = tokenize(normalizeSymbols(input));

  const output: string[] = [];
  const stack: string[] = [];
  const frames: ShuntingFrame[] = [
    { step: -1, phase: 'start', output: [], stack: [], title: 'Ready', detail: 'Operands go straight to the output. Operators wait on the stack until nothing stronger can come before them.' },
  ];
  const record = (step: number, phase: ShuntingFrame['phase'], title: string, detail: string, compare?: ShuntingFrame['compare']) =>
    frames.push({ step, phase, output: [...output], stack: [...stack], compare, title, detail });

  let error: string | undefined;
  const fail = (step: number, message: string) => {
    error = message;
    record(step, 'error', 'Stopped', message);
  };

  let expectOperand = true; // The order check: an operand must come next, or an operator must.

  run: for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (expectOperand) {
      if (isOperand(token)) {
        output.push(token);
        record(i, 'output', `Output ${token}`, 'Operands keep their order, so each one goes straight to the output.');
        expectOperand = false;
      } else if (token === '(') {
        stack.push(token);
        record(i, 'push', 'Push (', 'An opening parenthesis goes on the stack. It acts as a wall: nothing below it can be popped until it is closed.');
      } else if (token === '-') {
        stack.push('~');
        record(i, 'push', 'Push unary −', 'A minus with nothing to subtract from means negate. It is written ~ in postfix, and it pops nothing because it has no left side.');
      } else if (token === '+') {
        record(i, 'skip', 'Skip unary +', 'A plus with nothing to add to changes nothing, so it is dropped.');
      } else {
        fail(i, `Expected a number or “(”, found “${token}”.`);
        break run;
      }
      continue;
    }

    if (token === ')') {
      while (stack.length && stack.at(-1) !== '(') {
        const popped = stack.pop()!;
        output.push(popped);
        record(i, 'pop', `Pop ${show(popped)}`, 'A closing parenthesis pops everything back to its opening one, because the group has ended.');
      }
      if (!stack.length) {
        fail(i, 'Unmatched closing parenthesis.');
        break run;
      }
      stack.pop();
      record(i, 'discard', 'Discard ( )', 'The pair has done its job. Postfix never needs parentheses, because the order of the tokens already says what runs first.');
    } else if (PRECEDENCE[token] !== undefined) {
      while (stack.length && stack.at(-1) !== '(' && shouldPop(stack.at(-1)!, token)) {
        const top = stack.at(-1)!;
        const reason = precedenceOf(top) > precedenceOf(token) ? `${show(top)} binds tighter than ${show(token)}` : `${show(top)} and ${show(token)} are equal and group from the left`;
        record(i, 'compare', `Compare ${show(top)} with ${show(token)}`, `${reason[0].toUpperCase()}${reason.slice(1)}, so ${show(top)} must run first.`, { top, incoming: token, pops: true });
        stack.pop();
        output.push(top);
        record(i, 'pop', `Pop ${show(top)}`, `${show(top)} moves to the output.`);
      }
      const top = stack.at(-1);
      if (top && top !== '(') {
        const reason = precedenceOf(top) < precedenceOf(token) ? `${show(token)} binds tighter than ${show(top)}` : `${show(token)} groups from the right`;
        record(i, 'compare', `Compare ${show(top)} with ${show(token)}`, `${reason[0].toUpperCase()}${reason.slice(1)}, so ${show(top)} has to keep waiting.`, { top, incoming: token, pops: false });
      }
      stack.push(token);
      record(i, 'push', `Push ${show(token)}`, top === '(' ? `${show(token)} stops at the parenthesis, because a group is worked out by itself.` : `${show(token)} waits on the stack, because its right side hasn't been read yet.`);
      expectOperand = true;
    } else {
      fail(i, `Missing operator between “${tokens[i - 1]}” and “${token}”.`);
      break run;
    }
  }

  if (!error && expectOperand) fail(tokens.length, 'Expected a number or “(” at the end.');
  if (!error) {
    while (stack.length) {
      const popped = stack.pop()!;
      if (popped === '(') {
        fail(tokens.length, 'Missing closing parenthesis.');
        break;
      }
      output.push(popped);
      record(tokens.length, 'pop', `Pop ${show(popped)}`, 'The input has run out, so every operator still waiting moves to the output, from the top down.');
    }
  }

  const postfix = output.join(' ');
  if (!error) record(tokens.length, 'done', 'Finished', `The postfix form is ${postfix}. A stack can evaluate it left to right with no parentheses or precedence rules.`);

  return { tokens, postfix, frames, error };
}
