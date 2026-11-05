export const MAX_BRACKET_INPUT = 200;

const CLOSES: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const OPENS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

export type OpenBracket = { char: string; position: number };
export type BracketPair = { open: number; close: number; depth: number };

export type BracketFrame = {
  step: number; // Index into the list of brackets, or -1 before the first one.
  phase: 'start' | 'skip' | 'push' | 'match' | 'error' | 'done';
  cursor: number; // One past the last character read.
  stack: OpenBracket[];
  pairs: BracketPair[];
  current?: number;
  bad: number[]; // Positions that caused the problem.
  title: string;
  detail: string;
};

export type BracketResult = {
  source: string;
  balanced: boolean;
  pairCount: number;
  maxDepth: number;
  verdict: string;
  frames: BracketFrame[];
  items: { key: string; label: string; tone: string }[];
};

const where = (position: number) => `position ${position + 1}`;

export function traceBrackets(source: string): BracketResult {
  if (!source.trim()) throw new Error('Enter some text with brackets to begin.');
  if (source.length > MAX_BRACKET_INPUT) throw new Error(`Keep the input to ${MAX_BRACKET_INPUT} characters or fewer.`);

  const stack: OpenBracket[] = [];
  const pairs: BracketPair[] = [];
  const items: BracketResult['items'] = [];
  const frames: BracketFrame[] = [
    { step: -1, phase: 'start', cursor: 0, stack: [], pairs: [], bad: [], title: 'Ready', detail: 'Read left to right. Each opening bracket waits on the stack, and each closing bracket must match the one on top, because the most recently opened must close first.' },
  ];
  const record = (phase: BracketFrame['phase'], cursor: number, title: string, detail: string, current?: number, bad: number[] = []) =>
    frames.push({ step: items.length - 1, phase, cursor, stack: [...stack], pairs: [...pairs], current, bad, title, detail });

  let maxDepth = 0;
  let verdict = '';
  let i = 0;

  while (i < source.length && !verdict) {
    const char = source[i];
    if (CLOSES[char]) {
      stack.push({ char, position: i });
      maxDepth = Math.max(maxDepth, stack.length);
      items.push({ key: String(i), label: `Push ${char}`, tone: 'tone-value' });
      record('push', i + 1, `Push ${char}`, `An opening bracket at ${where(i)}. It goes on the stack until its partner ${CLOSES[char]} arrives.`, i);
    } else if (OPENS[char]) {
      const top = stack.at(-1);
      if (!top) {
        verdict = `Unmatched “${char}” at ${where(i)}: nothing is open.`;
        items.push({ key: String(i), label: `${char} has no partner`, tone: 'tone-danger' });
        record('error', i + 1, 'Nothing is open', `${verdict} The stack is empty, so this closing bracket has no partner.`, i, [i]);
      } else if (top.char !== OPENS[char]) {
        verdict = `“${char}” at ${where(i)} can't close “${top.char}” from ${where(top.position)}.`;
        items.push({ key: String(i), label: `${char} doesn't match ${top.char}`, tone: 'tone-danger' });
        record('error', i + 1, 'Wrong type', `${verdict} The top of the stack needs ${CLOSES[top.char]} first.`, i, [i, top.position]);
      } else {
        stack.pop();
        pairs.push({ open: top.position, close: i, depth: stack.length });
        items.push({ key: String(i), label: `${top.char}${char} match`, tone: 'tone-done' });
        record('match', i + 1, `${top.char} ${char} match`, `${char} at ${where(i)} closes ${top.char} from ${where(top.position)}, so both are finished and the opening bracket leaves the stack.`, i);
      }
    } else {
      const start = i;
      while (i + 1 < source.length && !CLOSES[source[i + 1]] && !OPENS[source[i + 1]]) i++;
      record('skip', i + 1, 'Skip other characters', `${source.slice(start, i + 1).trim() ? 'Everything that is not a bracket' : 'Whitespace'} has no effect on the stack.`, undefined);
    }
    i++;
  }

  if (!verdict && stack.length) {
    const left = stack.at(-1)!;
    verdict = `“${left.char}” at ${where(left.position)} was never closed.`;
    items.push({ key: 'end', label: 'Left open', tone: 'tone-danger' });
    record('error', source.length, 'Left open', `The text has ended, but ${stack.length === 1 ? 'one bracket is' : `${stack.length} brackets are`} still on the stack. ${verdict}`, undefined, stack.map(item => item.position));
  }

  const balanced = !verdict;
  if (balanced) {
    verdict = pairs.length ? `Balanced: ${pairs.length} pair${pairs.length === 1 ? '' : 's'}, nested ${maxDepth} deep.` : 'Balanced: the text has no brackets at all.';
    items.push({ key: 'end', label: 'Stack empty', tone: 'tone-done' });
    record('done', source.length, 'Balanced', `The text has ended and the stack is empty, so every bracket found its partner. ${verdict}`);
  }

  return { source, balanced, pairCount: pairs.length, maxDepth, verdict, frames, items };
}
