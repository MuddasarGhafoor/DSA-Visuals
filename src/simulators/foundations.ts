import { counted,
  bars, cells, choiceField, factsPanel, graph, graphPanel, integer, logPanel, numberField, numbers, operations, opsField, row,
  stackPanel, tablePanel, textField, Trace, treePanel, visualTree, when,
  type BinaryNode, type ChartSeries, type Panel, type SimulatorDef, type Tone,
} from './kit.ts';

const grouped = (value: number) => (Math.abs(value) >= 1e15 ? value.toExponential(2).replace('e+', ' × 10^') : Math.round(value).toLocaleString('en-US'));

// ---------- Abstract Data Types ----------

const abstractDataTypes: SimulatorDef = {
  fields: [
    choiceField('adt', 'ADT', [['stack', 'Stack'], ['queue', 'Queue']]),
    opsField('ops', 'Operations', 'add 10, add 20, add 30, remove, peek', [{ label: 'Add', op: 'add', takesValue: true }, { label: 'Remove', op: 'remove' }, { label: 'Peek', op: 'peek' }]),
  ],
  examples: [
    { title: 'A stack', about: 'The last value added leaves first, in both versions.', values: { adt: 'stack', ops: 'add 1, add 2, add 3, remove, remove' } },
    { title: 'A queue', about: 'The array version has to shift. The linked version doesn\'t.', values: { adt: 'queue', ops: 'add 1, add 2, add 3, remove, remove' } },
  ],
  run(values) {
    const isStack = values.adt === 'stack';
    const list = operations(values.ops, { add: 1, remove: 0, peek: 0 });
    const items: string[] = [];
    const results: string[] = [];
    const trace = new Trace();
    let moves = 0;
    let links = 0;
    const names = isStack ? { add: 'push', remove: 'pop', peek: 'peek' } : { add: 'enqueue', remove: 'dequeue', peek: 'front' };
    const scene = (active?: number): Panel[] => [
      cells('The array version', row(items, { tone: i => (i === active ? 'new' : undefined) })),
      { kind: 'links', title: 'The linked version', nodes: (isStack ? [...items].reverse() : items).map((value, i) => ({ id: `${value}-${i}`, value, tone: (isStack ? items.length - 1 - i : i) === active ? 'new' : undefined, tags: i === 0 ? [isStack ? 'top' : 'head'] : undefined })) },
      logPanel('What the operations returned', results),
    ];
    const metrics = () => [{ label: 'Array moves', value: moves }, { label: 'Link changes', value: links }, { label: 'Size', value: items.length }];
    trace.add('Start', `A ${values.adt} promises the same behavior however it is built. Both versions below keep that promise, at different costs.`, scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      const name = names[op as keyof typeof names];
      if (op === 'add') {
        items.push(value!);
        moves++;
        links++;
        trace.add(`${name} ${value}`, `Both versions now hold ${value}. The array writes one slot, and the linked version creates one node.`, scene(items.length - 1), { tone: 'new', metrics: metrics() });
      } else if (!items.length) {
        results.push(`${name}: empty`);
        trace.add(`${name} failed`, `The ${values.adt} is empty, so there is nothing to ${name === 'peek' || name === 'front' ? 'read' : 'remove'}.`, scene(), { tone: 'danger', metrics: metrics() });
      } else if (op === 'peek') {
        const at = isStack ? items.length - 1 : 0;
        results.push(`${name}: ${items[at]}`);
        trace.add(`${name} gives ${items[at]}`, 'Reading the next value changes nothing, and it costs one step in both versions.', scene(at), { tone: 'active', metrics: metrics() });
      } else if (isStack) {
        const out = items.pop()!;
        results.push(`${name}: ${out}`);
        moves++;
        links++;
        trace.add(`${name} gives ${out}`, 'The last value added leaves first. Both versions do this in one step.', scene(), { tone: 'accent', metrics: metrics() });
      } else {
        const out = items.shift()!;
        results.push(`${name}: ${out}`);
        moves += items.length;
        links++;
        trace.add(`${name} gives ${out}`, `The first value added leaves first. The array shifts ${counted(items.length, 'value')} left, while the linked version moves one pointer. Same behavior, different cost.`, scene(), { tone: 'accent', metrics: metrics() });
      }
    }
    trace.finish('Finished', `Both versions gave the same results. The ADT is the promise, and the structure is how it is kept. The array made ${moves} moves, and the linked version changed ${links} links.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { results, items } };
  },
};

// ---------- Asymptotic Notation ----------

const RANKS: Record<string, { label: string; rank: number; value: (n: number) => number }> = {
  n: { label: 'n', rank: 1, value: n => n },
  nlogn: { label: 'n log n', rank: 1.5, value: n => n * Math.log2(Math.max(n, 2)) },
  n2: { label: 'n²', rank: 2, value: n => n * n },
  n3: { label: 'n³', rank: 3, value: n => n * n * n },
};

const asymptoticNotation: SimulatorDef = {
  fields: [
    numberField('a', 'f(n) = a·n²', 3, 0, 50), numberField('b', '+ b·n', 5, 0, 200), numberField('k', '+ k', 2, 0, 500),
    choiceField('g', 'Compare with g(n)', [['n2', 'n²'], ['n', 'n'], ['nlogn', 'n log n'], ['n3', 'n³']]),
    numberField('c', 'Constant c', 4, 1, 100),
  ],
  examples: [
    { title: 'A tight bound', about: '3n² + 5n + 2 is Θ(n²), and c = 4 works from n = 6.', values: { a: '3', b: '5', k: '2', g: 'n2', c: '4' } },
    { title: 'A loose bound', about: 'Linear growth is O(n²), but not Ω(n²).', values: { a: '0', b: '5', k: '2', g: 'n2', c: '1' } },
    { title: 'A failing upper bound', about: 'n² can never stay below c·n, whatever c is.', values: { a: '1', b: '0', k: '0', g: 'n', c: '10' } },
  ],
  run(values) {
    const a = integer(values.a, 'a', 0, 50);
    const b = integer(values.b, 'b', 0, 200);
    const k = integer(values.k, 'k', 0, 500);
    const c = integer(values.c, 'c', 1, 100);
    if (!a && !b && !k) throw new Error('f(n) must not be zero. Give a, b, or k a value.');
    const g = RANKS[values.g];
    const f = (n: number) => a * n * n + b * n + k;
    const name = `${[a && `${a}n²`, b && `${b}n`, k && String(k)].filter(Boolean).join(' + ')}`;
    const rank = a ? 2 : b ? 1 : 0;
    const bigO = rank <= g.rank;
    const omega = rank >= g.rank;
    let n0: number | null = null;
    for (let n = 5000; n >= 1; n--) {
      if (f(n) > c * g.value(n)) break;
      n0 = n;
    }
    const trace = new Trace();
    const shown = Math.min(14, Math.max(8, (n0 ?? 8) + 3));
    const results: (string | number)[][] = [];
    const series = (upTo: number): ChartSeries[] => [
      { label: `f(n) = ${name}`, tone: 'accent', points: Array.from({ length: upTo }, (_, i) => [i + 1, f(i + 1)]) },
      { label: `${c} · ${g.label}`, tone: 'done', points: Array.from({ length: upTo }, (_, i) => [i + 1, c * g.value(i + 1)]) },
    ];
    const summary = [
      { label: 'f = O(g)', value: bigO ? 'Yes' : 'No', tone: (bigO ? 'done' : 'danger') as Tone },
      { label: 'f = Ω(g)', value: omega ? 'Yes' : 'No', tone: (omega ? 'done' : 'danger') as Tone },
      { label: 'f = Θ(g)', value: bigO && omega ? 'Yes' : 'No', tone: (bigO && omega ? 'done' : 'danger') as Tone },
      { label: `n₀ for c = ${c}`, value: n0 ?? 'None' },
    ];
    for (let n = 1; n <= shown; n++) {
      const left = f(n);
      const right = c * g.value(n);
      results.push([n, grouped(left), grouped(right), left <= right ? 'Yes' : 'No']);
      trace.add(`n = ${n}`, `f(${n}) = ${grouped(left)} and ${c} · g(${n}) = ${grouped(right)}. ${left <= right ? 'The bound holds here.' : 'The bound fails here.'}`, [
        { kind: 'chart', title: 'f(n) against c · g(n)', series: series(Math.max(n, 2)), xLabel: 'n' },
        tablePanel('Does f(n) ≤ c · g(n)?', results, { colHead: ['n', 'f(n)', 'c·g(n)', 'Holds'], zone: 'side', tone: (r, col) => (col === 3 ? (results[r][3] === 'Yes' ? 'done' : 'danger') : undefined) }),
      ], { tone: left <= right ? 'done' : 'danger' });
    }
    const verdict = n0 === null ? `With c = ${c}, the bound never settles, so this c doesn't prove f = O(g).` : `With c = ${c}, f(n) ≤ c · g(n) for every n from ${n0} onward, so n₀ = ${n0}.`;
    trace.finish('Verdict', `${verdict} Comparing growth rates: f is ${bigO ? '' : 'not '}O(${g.label}), ${omega ? '' : 'not '}Ω(${g.label}), and ${bigO && omega ? '' : 'not '}Θ(${g.label}).`, [
      { kind: 'chart', title: 'f(n) against c · g(n)', series: series(shown), xLabel: 'n' },
      tablePanel('Does f(n) ≤ c · g(n)?', results, { colHead: ['n', 'f(n)', 'c·g(n)', 'Holds'], zone: 'side', tone: (r, col) => (col === 3 ? (results[r][3] === 'Yes' ? 'done' : 'danger') : undefined) }),
    ]);
    return { frames: trace.frames, summary, answer: { bigO, omega, theta: bigO && omega, n0 } };
  },
};

// ---------- Best, Average, and Worst Case ----------

const bestAverageWorst: SimulatorDef = {
  fields: [
    choiceField('algorithm', 'Algorithm', [['linear', 'Linear search'], ['binary', 'Binary search'], ['insertion', 'Insertion sort']]),
    textField('values', 'Values', '7, 3, 9, 1, 5, 8'),
  ],
  examples: [
    { title: 'Linear search', about: 'Finding the first value takes 1 comparison. A missing value takes all of them.', values: { algorithm: 'linear', values: '7, 3, 9, 1, 5, 8' } },
    { title: 'Binary search', about: 'Every case stays small, even on 15 values.', values: { algorithm: 'binary', values: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15' } },
    { title: 'Insertion sort', about: 'Sorted input is its best case, and reversed input is its worst.', values: { algorithm: 'insertion', values: '4, 2, 6, 1, 5, 3' } },
  ],
  run(input) {
    const list = numbers(input.values, { minCount: 2, maxCount: 16 });
    const trace = new Trace();
    const labels: string[] = [];
    const counts: number[] = [];
    const record = (label: string, count: number, detail: string, panel: Panel) => {
      labels.push(label);
      counts.push(count);
      trace.add(`${label}: ${count}`, detail, [panel, bars('Comparisons for each case', counts, i => (i === counts.length - 1 ? 'active' : 'value'), labels)]);
    };
    if (input.algorithm === 'insertion') {
      const sorted = [...list].sort((a, b) => a - b);
      const insertion = (start: number[]) => {
        const items = [...start];
        let comparisons = 0;
        for (let i = 1; i < items.length; i++) {
          const current = items[i];
          let j = i - 1;
          while (j >= 0) {
            comparisons++;
            if (items[j] <= current) break;
            items[j + 1] = items[j];
            j--;
          }
          items[j + 1] = current;
        }
        return comparisons;
      };
      for (const [label, arrangement, about] of [['Sorted', sorted, 'Each value only looks at the one before it.'], ['Your order', list, 'Values move back part of the way.'], ['Reversed', [...sorted].reverse(), 'Every value slides all the way to the front.']] as const) {
        record(label, insertion([...arrangement]), `On ${label.toLowerCase()} input: ${about}`, cells(`${label} input`, row([...arrangement], { hideIndex: true })));
      }
    } else {
      const binary = input.algorithm === 'binary';
      const items = binary ? [...list].sort((a, b) => a - b) : list;
      const search = (target: number) => {
        let comparisons = 0;
        if (binary) {
          let low = 0;
          let high = items.length - 1;
          while (low <= high) {
            const mid = (low + high) >> 1;
            comparisons++;
            if (items[mid] === target) return comparisons;
            if (items[mid] < target) low = mid + 1;
            else high = mid - 1;
          }
          return comparisons;
        }
        for (const item of items) {
          comparisons++;
          if (item === target) return comparisons;
        }
        return comparisons;
      };
      items.forEach((value, i) => record(`Find ${value}`, search(value), `Searching for the value at index ${i} takes ${search(value)} comparison${search(value) === 1 ? '' : 's'}.`, cells(binary ? 'Sorted values' : 'Values', row(items, { tone: at => (at === i ? 'active' : undefined) }))));
      const missing = Math.max(...items) + 1;
      record('Missing', search(missing), `Searching for a value that isn't there takes ${search(missing)} comparisons.`, cells(binary ? 'Sorted values' : 'Values', row(items)));
    }
    const best = Math.min(...counts);
    const worst = Math.max(...counts);
    const relevant = input.algorithm === 'insertion' ? counts : counts.slice(0, -1);
    const average = Math.round((relevant.reduce((a, b) => a + b, 0) / relevant.length) * 100) / 100;
    const summary = [{ label: 'Best', value: best, tone: 'done' as Tone }, { label: 'Average', value: average }, { label: 'Worst', value: worst, tone: 'danger' as Tone }];
    trace.finish('The three cases', `For ${list.length} values, the best case took ${counted(best, 'comparison')}, the worst took ${worst}, and the average was ${average}.`, [
      bars('Comparisons for each case', counts, i => (counts[i] === best ? 'done' : counts[i] === worst ? 'danger' : 'value'), labels, [{ tone: 'done', label: 'Best' }, { tone: 'danger', label: 'Worst' }]),
    ]);
    return { frames: trace.frames, summary, answer: { best, worst, average } };
  },
};

// ---------- Big-O Growth Comparison ----------

const factorial = (n: number) => { let total = 1; for (let i = 2; i <= n; i++) total *= i; return total; };
const GROWTH: { label: string; tone: Tone; value: (n: number) => number }[] = [
  { label: 'O(1)', tone: 'muted', value: () => 1 },
  { label: 'O(log n)', tone: 'value', value: n => Math.max(1, Math.log2(n)) },
  { label: 'O(n)', tone: 'done', value: n => n },
  { label: 'O(n log n)', tone: 'path', value: n => n * Math.max(1, Math.log2(n)) },
  { label: 'O(n²)', tone: 'active', value: n => n * n },
  { label: 'O(2ⁿ)', tone: 'accent', value: n => 2 ** n },
  { label: 'O(n!)', tone: 'danger', value: factorial },
];
const timeText = (steps: number) => {
  const seconds = steps / 1e9;
  if (seconds < 1e-3) return 'Under 1 ms';
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 3600) return `${Math.round(seconds)} s`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`;
  return seconds / 31536000 > 1e6 ? 'Over a million years' : `${Math.round(seconds / 31536000)} years`;
};

const bigOGrowth: SimulatorDef = {
  fields: [numberField('n', 'Grow n up to', 20, 2, 25), choiceField('scale', 'Height scale', [['log', 'Logarithmic'], ['linear', 'Linear']])],
  examples: [
    { title: 'Small inputs', about: 'At n = 8, the slow rates don\'t look so bad yet.', values: { n: '8', scale: 'linear' } },
    { title: 'Larger inputs', about: 'By n = 25, factorial and exponential leave everything behind.', values: { n: '25', scale: 'log' } },
  ],
  run(values) {
    const limit = integer(values.n, 'n', 2, 25);
    const logY = values.scale === 'log';
    const trace = new Trace();
    const scene = (n: number): Panel[] => [
      { kind: 'chart', title: `Steps as n grows (${logY ? 'logarithmic' : 'linear'} height)`, logY, xLabel: 'n', series: GROWTH.filter(item => logY || item.value(limit) <= limit * limit * 4).map(item => ({ label: item.label, tone: item.tone, points: Array.from({ length: Math.max(n, 2) }, (_, i) => [i + 1, item.value(i + 1)] as [number, number]) })) },
      tablePanel(`At n = ${n}, with a billion steps per second`, GROWTH.map(item => [item.label, grouped(item.value(n)), timeText(item.value(n))]), { colHead: ['Rate', 'Steps', 'Time'] }),
    ];
    for (let n = 1; n <= limit; n++) {
      trace.add(`n = ${n}`, `When n is ${n}: n² takes ${grouped(n * n)} step${n === 1 ? '' : 's'}, 2ⁿ takes ${grouped(2 ** n)}, and n! takes ${grouped(factorial(n))}.`, scene(n), { tone: n * n < 2 ** n ? 'active' : 'value' });
    }
    trace.finish('Compared', `Doubling n adds one step to O(log n), doubles O(n), and quadruples O(n²). At n = ${limit}, O(2ⁿ) already needs ${timeText(2 ** limit)}, and O(n!) needs ${timeText(factorial(limit))}.`, scene(limit));
    return { frames: trace.frames, answer: Object.fromEntries(GROWTH.map(item => [item.label, item.value(limit)])) };
  },
};

// ---------- Bit Manipulation ----------

const BIT_OPS: [string, string][] = [['and', 'a AND b'], ['or', 'a OR b'], ['xor', 'a XOR b'], ['not', 'NOT a'], ['shl', 'a << b'], ['shr', 'a >> b'], ['set', 'Set bit b of a'], ['clear', 'Clear bit b of a'], ['toggle', 'Flip bit b of a'], ['check', 'Read bit b of a'], ['count', 'Count 1s in a'], ['power', 'Is a a power of 2?']];
const bitsOf = (value: number) => Array.from({ length: 8 }, (_, i) => (value >> (7 - i)) & 1);

const bitManipulation: SimulatorDef = {
  fields: [choiceField('op', 'Operation', BIT_OPS), numberField('a', 'a', 12, 0, 255), when(numberField('b', 'b', 10, 0, 255), values => !['not', 'count', 'power'].includes(values.op))],
  examples: [
    { title: 'AND, OR, and XOR', about: '12 and 10 share only one bit.', values: { a: '12', b: '10', op: 'xor' } },
    { title: 'Count the 1 bits', about: 'x & (x - 1) removes one 1 bit each time.', values: { a: '13', op: 'count' } },
    { title: 'Power of two', about: 'A power of two has exactly one 1 bit.', values: { a: '64', op: 'power' } },
    { title: 'Set a bit', about: 'OR with a mask turns one bit on.', values: { a: '5', b: '1', op: 'set' } },
  ],
  run(values) {
    const a = integer(values.a, 'a', 0, 255);
    const b = integer(values.b, 'b', 0, 255);
    const op = values.op;
    const trace = new Trace();
    const header = row([7, 6, 5, 4, 3, 2, 1, 0], { label: 'bit', hideIndex: true, tone: () => 'muted' });
    const line = (label: string, value: number, tone?: (i: number) => Tone | undefined) => row(bitsOf(value), { label: `${label} = ${value}`, hideIndex: true, tone });
    const usesBit = ['set', 'clear', 'toggle', 'check'].includes(op);
    if (usesBit && b > 7) throw new Error('b is the bit position here, so it must be between 0 and 7.');
    if ((op === 'shl' || op === 'shr') && b > 8) throw new Error('b is the shift amount here, so it must be between 0 and 8.');
    let result = 0;
    let note = '';

    if (op === 'and' || op === 'or' || op === 'xor') {
      const apply = (x: number, y: number) => (op === 'and' ? x & y : op === 'or' ? x | y : x ^ y);
      result = apply(a, b);
      const rule = { and: '1 only if both bits are 1', or: '1 if either bit is 1', xor: '1 if the bits differ' }[op];
      let partial = 0;
      for (let i = 0; i < 8; i++) {
        const bit = 7 - i;
        const out = apply((a >> bit) & 1, (b >> bit) & 1);
        partial |= out << bit;
        const mark = (at: number) => (at === i ? 'active' as Tone : undefined);
        trace.add(`Bit ${bit}: ${(a >> bit) & 1} ${op.toUpperCase()} ${(b >> bit) & 1} = ${out}`, `${op.toUpperCase()} gives ${rule}.`, [cells('Bits', [header, line('a', a, mark), line('b', b, mark), row(bitsOf(partial).map((value, at) => (at <= i ? value : '')), { label: 'result', hideIndex: true, tone: at => (at === i ? 'new' : at < i ? 'done' : undefined) })])], { tone: out ? 'new' : 'value' });
      }
      note = `The result is ${result}.`;
    } else if (op === 'not') {
      result = ~a & 255;
      trace.add('Flip every bit', 'NOT turns each 0 into 1, and each 1 into 0. These are 8-bit values, so the result stays between 0 and 255.', [cells('Bits', [header, line('a', a), line('NOT a', result, () => 'new')])], { tone: 'new' });
      note = `In 8 bits, NOT ${a} is ${result}. In Python, where integers have no fixed size, ~${a} is ${-a - 1}.`;
    } else if (op === 'shl' || op === 'shr') {
      result = op === 'shl' ? (a << b) & 255 : a >> b;
      let value = a;
      for (let i = 1; i <= b; i++) {
        value = op === 'shl' ? (value << 1) & 255 : value >> 1;
        trace.add(`Shift ${op === 'shl' ? 'left' : 'right'} ${i}`, `Every bit moves one place ${op === 'shl' ? 'left, which doubles the value unless a bit falls off' : 'right, which halves the value and drops any remainder'}.`, [cells('Bits', [header, line('a', a), line('now', value, () => 'new')])], { tone: 'new' });
      }
      if (b === 0) trace.add('No shift', 'Shifting by 0 changes nothing.', [cells('Bits', [header, line('a', a)])]);
      note = `The result is ${result}.`;
    } else if (usesBit) {
      const mask = 1 << b;
      const at = 7 - b;
      const mark = (i: number) => (i === at ? 'active' as Tone : undefined);
      trace.add(`Build the mask 1 << ${b}`, `The mask has a single 1, in position ${b}.`, [cells('Bits', [header, line('a', a), line('mask', mask, mark)])], { tone: 'active' });
      if (op === 'check') {
        result = (a >> b) & 1;
        note = `Bit ${b} of ${a} is ${result}.`;
        trace.add(`(a >> ${b}) & 1 = ${result}`, 'Moving the bit to the end and masking everything else leaves just that bit.', [cells('Bits', [header, line('a', a, mark)])], { tone: 'new' });
      } else {
        result = op === 'set' ? a | mask : op === 'clear' ? a & ~mask : a ^ mask;
        const how = { set: 'a | mask: OR with 1 always gives 1', clear: 'a & ~mask: AND with 0 always gives 0', toggle: 'a ^ mask: XOR with 1 always flips' }[op];
        trace.add(`${op === 'toggle' ? 'Flip' : op === 'set' ? 'Set' : 'Clear'} bit ${b}`, `${how}, and every other bit stays as it was.`, [cells('Bits', [header, line('a', a), line('mask', mask, mark), line('result', result, i => (i === at ? 'new' : undefined))])], { tone: 'new' });
        note = `The result is ${result}.`;
      }
    } else if (op === 'count') {
      let value = a;
      while (value) {
        const next = value & (value - 1);
        result++;
        trace.add(`Remove a 1 bit (${result})`, `x & (x - 1) clears the lowest 1 bit: ${value} becomes ${next}. Each pass removes exactly one, so the loop runs once per 1 bit.`, [cells('Bits', [header, line('x', value, i => (((value >> (7 - i)) & 1) && !((next >> (7 - i)) & 1) ? 'danger' : undefined)), line('x & (x - 1)', next)])], { tone: 'accent' });
        value = next;
      }
      if (!a) trace.add('No 1 bits', 'Zero has no 1 bits.', [cells('Bits', [header, line('a', a)])]);
      note = `${a} has ${result} one bit${result === 1 ? '' : 's'}.`;
    } else {
      const minus = Math.max(a - 1, 0);
      const answer = a > 0 && (a & (a - 1)) === 0;
      result = answer ? 1 : 0;
      trace.add(`a & (a - 1) = ${a & minus}`, 'A power of two has exactly one 1 bit, so subtracting 1 turns it off and sets everything below it. AND-ing the two then gives 0.', [cells('Bits', [header, line('a', a), line('a - 1', minus), line('AND', a & minus, () => (answer ? 'done' : 'danger'))])], { tone: answer ? 'done' : 'danger' });
      note = answer ? `${a} is a power of two.` : `${a} isn't a power of two.`;
    }
    const final = ['check', 'count', 'power'].includes(op) ? [header, line('a', a)] : [header, line('a', a), ...(op === 'not' || op === 'shl' || op === 'shr' || usesBit ? [] : [line('b', b)]), line('result', result, () => 'done')];
    trace.finish('Finished', note, [cells('Bits', final)]);
    return { frames: trace.frames, summary: [{ label: 'Result', value: op === 'power' ? (result ? 'Yes' : 'No') : result, tone: 'done' }], answer: result };
  },
};

// ---------- GCD ----------

const gcdSimulator: SimulatorDef = {
  fields: [numberField('a', 'a', 48, 0, 1000000), numberField('b', 'b', 18, 0, 1000000), choiceField('method', 'Method', [['remainder', 'Euclid, with remainders'], ['subtract', 'Euclid, with subtraction'], ['extended', 'Extended Euclid']])],
  examples: [
    { title: '48 and 18', about: 'The classic example, which takes three steps.', values: { a: '48', b: '18', method: 'remainder' } },
    { title: 'Subtraction is slower', about: 'The same answer, with many more steps.', values: { a: '48', b: '18', method: 'subtract' } },
    { title: 'Neighboring Fibonacci numbers', about: 'The slowest inputs for their size.', values: { a: '89', b: '55', method: 'remainder' } },
    { title: 'Extended Euclid', about: 'Also finds x and y, so that 240x + 46y = gcd.', values: { a: '240', b: '46', method: 'extended' } },
  ],
  run(values) {
    const a0 = integer(values.a, 'a', 0, 1000000);
    const b0 = integer(values.b, 'b', 0, 1000000);
    if (!a0 && !b0) throw new Error('At least one number must be above zero, since every number divides 0.');
    const method = values.method;
    if (method === 'subtract' && (!a0 || !b0)) throw new Error('The subtraction method needs both numbers above zero.');
    if (method === 'subtract' && Math.max(a0, b0) / Math.max(1, Math.min(a0, b0)) > 400) throw new Error('Those numbers are too far apart for the subtraction method: it would take hundreds of steps. Try the remainder method.');
    const trace = new Trace();
    const rows: (string | number)[][] = [];
    const head = method === 'subtract' ? ['a', 'b', 'Larger - smaller'] : method === 'extended' ? ['a', 'b', 'q', 'r'] : ['a', 'b', 'a mod b'];
    const scene = (active?: number): Panel[] => [tablePanel('Each step', rows, { colHead: head, tone: r => (r === active ? 'active' : undefined) })];
    let a = a0;
    let b = b0;
    const stack: { q: number }[] = [];
    if (method === 'subtract') {
      while (a !== b) {
        const next = Math.abs(a - b);
        rows.push([a, b, next]);
        trace.add(`${Math.max(a, b)} - ${Math.min(a, b)} = ${next}`, 'A common divisor of two numbers also divides their difference. So replace the larger number with the difference.', scene(rows.length - 1));
        if (a > b) a = next;
        else b = next;
      }
    } else {
      while (b) {
        const q = Math.floor(a / b);
        const r = a % b;
        rows.push(method === 'extended' ? [a, b, q, r] : [a, b, r]);
        stack.push({ q });
        trace.add(`${a} mod ${b} = ${r}`, `${a} = ${q} × ${b} + ${r}. The GCD of ${a} and ${b} is the same as the GCD of ${b} and ${r}.`, scene(rows.length - 1));
        a = b;
        b = r;
      }
    }
    const gcd = a;
    const lcm = a0 && b0 ? (a0 / gcd) * b0 : 0;
    let x = 1;
    let y = 0;
    if (method === 'extended') {
      const back: (string | number)[][] = [[gcd, 0, 1, 0]];
      for (const { q } of [...stack].reverse()) {
        [x, y] = [y, x - q * y];
        back.push([q, '', x, y]);
        trace.add(`Back up: x = ${x}, y = ${y}`, `Work back through the quotients. Each step takes (x, y) from the row below to (y, x - q·y). This one used q = ${q}.`, [
          ...scene(),
          tablePanel('Working back', back.map(item => [item[0], item[2], item[3]]), { colHead: ['q', 'x', 'y'], zone: 'side', tone: r => (r === back.length - 1 ? 'new' : undefined) }),
        ], { tone: 'accent' });
      }
    }
    const summary = [{ label: 'GCD', value: gcd, tone: 'done' as Tone }, { label: 'LCM', value: lcm }, { label: 'Steps', value: rows.length }, ...(method === 'extended' ? [{ label: 'x', value: x }, { label: 'y', value: y }] : [])];
    trace.finish(`GCD = ${gcd}`, method === 'extended' ? `The GCD is ${gcd}, and ${a0} × ${x} + ${b0} × ${y} = ${gcd}.` : `${method === 'subtract' ? 'Both numbers are now equal' : 'The second number has reached 0'}, so the GCD is ${gcd}. The LCM is ${a0} × ${b0} ÷ ${gcd} = ${lcm}.`, scene());
    return { frames: trace.frames, summary, answer: { gcd, lcm, x, y, steps: rows.length } };
  },
};

// ---------- Iteration vs Recursion ----------

const iterationVsRecursion: SimulatorDef = {
  fields: [choiceField('fn', 'Function', [['factorial', 'Factorial'], ['sum', 'Sum 1 to n'], ['fibonacci', 'Fibonacci']]), numberField('n', 'n', 5, 0, 10)],
  examples: [
    { title: 'Factorial', about: 'The same multiplications, and very different memory.', values: { fn: 'factorial', n: '5' } },
    { title: 'Fibonacci', about: 'The plain recursive version repeats a lot of work.', values: { fn: 'fibonacci', n: '7' } },
  ],
  run(values) {
    const n = integer(values.n, 'n', 0, 10);
    const fn = values.fn;
    const trace = new Trace();
    let steps = 0;
    let peak = 1;
    const metrics = (memory: number) => [{ label: 'Steps', value: steps }, { label: 'Memory now', value: memory }, { label: 'Peak memory', value: peak }];
    trace.group = 'With a loop';
    let loopValue: number;
    if (fn === 'fibonacci') {
      let previous = 0;
      let current = 1;
      for (let i = 0; i < n; i++) {
        [previous, current] = [current, previous + current];
        steps++;
        trace.add(`i = ${i}: value is ${previous}`, 'A loop keeps only the last two values, and overwrites them each time.', [cells('Loop variables', row([previous, current], { hideIndex: true, sub: i2 => ['previous', 'current'][i2], tone: () => 'new' }))], { metrics: metrics(2) });
      }
      loopValue = previous;
    } else {
      let total = fn === 'factorial' ? 1 : 0;
      for (let i = fn === 'factorial' ? 2 : 1; i <= n; i++) {
        total = fn === 'factorial' ? total * i : total + i;
        steps++;
        trace.add(`i = ${i}: total is ${total}`, 'A loop updates the same variables each time, so memory stays fixed.', [cells('Loop variables', row([i, total], { hideIndex: true, sub: i2 => ['i', 'total'][i2], tone: () => 'new' }))], { metrics: metrics(2) });
      }
      loopValue = total;
    }
    const loopSteps = steps;
    trace.add(`Loop result: ${loopValue}`, `The loop took ${steps} steps and never used more than 2 variables.`, [cells('Loop variables', row([loopValue], { hideIndex: true, sub: () => 'result', tone: () => 'done' }))], { tone: 'done', metrics: metrics(2) });

    trace.group = 'With recursion';
    steps = 0;
    peak = 0;
    const stack: string[] = [];
    const lines: string[] = [];
    const record = (label: string, detail: string, tone: Tone) => {
      peak = Math.max(peak, stack.length);
      trace.add(label, detail, [
        stackPanel('Call stack', stack, { zone: 'main', tone: i => (i === stack.length - 1 ? tone : undefined) }),
        logPanel('Returned', lines),
      ], { tone, metrics: metrics(stack.length) });
    };
    const call = (k: number): number => {
      stack.push(`${fn === 'factorial' ? 'fact' : fn === 'sum' ? 'sum' : 'fib'}(${k})`);
      steps++;
      record(`Call ${stack.at(-1)}`, k <= (fn === 'fibonacci' ? 1 : fn === 'factorial' ? 1 : 0) ? 'This is the base case, so it can answer directly.' : 'This call has to wait for a smaller one, so its frame stays on the stack.', 'active');
      let value: number;
      if (fn === 'factorial') value = k <= 1 ? 1 : k * call(k - 1);
      else if (fn === 'sum') value = k <= 0 ? 0 : k + call(k - 1);
      else value = k < 2 ? k : call(k - 1) + call(k - 2);
      lines.push(`${stack.at(-1)} = ${value}`);
      const done = stack.at(-1);
      record(`${done} = ${value}`, 'The call returns its answer to the one below it, and its frame is removed.', 'done');
      stack.pop();
      return value;
    };
    const recursive = call(n);
    const callCount = steps;
    trace.group = undefined;
    trace.finish('Compared', `Both gave ${recursive}. The loop took ${loopSteps} steps and 2 variables. Recursion took ${callCount} calls and up to ${peak} frames of memory at once.`, [
      tablePanel('Side by side', [['Loop', loopSteps, 2], ['Recursion', callCount, peak]], { colHead: ['Version', 'Steps', 'Peak memory'], tone: (_, c) => (c === 0 ? 'path' : undefined) }),
    ], { metrics: [{ label: 'Result', value: recursive, tone: 'done' }] });
    return { frames: trace.frames, answer: { loop: loopValue, recursive, loopSteps, calls: callCount, peak } };
  },
};

// ---------- Master Theorem ----------

const masterTheorem: SimulatorDef = {
  fields: [numberField('a', 'a (subproblems)', 2, 1, 16), numberField('b', 'b (shrink by)', 2, 2, 8), textField('k', 'f(n) = n^k, with k', '1', { wide: false }), numberField('p', '× log^p n, with p', 0, 0, 4)],
  examples: [
    { title: 'Merge sort', about: '2T(n/2) + n is a tie, so every level costs the same.', values: { a: '2', b: '2', k: '1', p: '0' } },
    { title: 'Binary search', about: 'T(n/2) + 1 is also a tie.', values: { a: '1', b: '2', k: '0', p: '0' } },
    { title: 'Leaves win', about: '8T(n/2) + n²: the work grows toward the bottom.', values: { a: '8', b: '2', k: '2', p: '0' } },
    { title: 'Top wins', about: '2T(n/2) + n²: the work shrinks toward the bottom.', values: { a: '2', b: '2', k: '2', p: '0' } },
    { title: 'Tie with a log', about: '2T(n/2) + n log n picks up one more log.', values: { a: '2', b: '2', k: '1', p: '1' } },
  ],
  run(values) {
    const a = integer(values.a, 'a', 1, 16);
    const b = integer(values.b, 'b', 2, 8);
    const [k] = numbers(values.k, { label: 'k', min: 0, max: 5, maxCount: 1, integer: false });
    const p = integer(values.p, 'p', 0, 4);
    const c = Math.log(a) / Math.log(b);
    const close = Math.abs(c - k) < 1e-9;
    const fText = `n^${k}${p ? ` log^${p} n` : ''}`;
    const round = (value: number) => Math.round(value * 100) / 100;
    const caseNumber = close ? 2 : k < c ? 1 : 3;
    const exponent = (e: number) => (e === 0 ? '1' : e === 1 ? 'n' : `n^${round(e)}`);
    const logs = (count: number) => (count === 0 ? '' : count === 1 ? ' log n' : ` log^${count} n`);
    const answer = caseNumber === 1 ? `Θ(${exponent(c)})` : caseNumber === 2 ? `Θ(${exponent(c) === '1' ? '' : exponent(c)}${logs(p + 1)})`.replace('( ', '(') : `Θ(${exponent(k)}${logs(p)})`;
    const trace = new Trace();
    const levels = 6;
    const n = b ** levels;
    const f = (size: number) => size ** k * (p ? Math.log2(Math.max(size, 2)) ** p : 1);
    const work: number[] = [];
    const rows: (string | number)[][] = [];
    const labels: string[] = [];
    const scene = (): Panel[] => [
      bars('Total work on each level', work.map(value => Math.round(value)), i => (i === work.length - 1 ? 'active' : 'value'), labels),
      tablePanel('Level by level', rows, { colHead: ['Level', 'Calls', 'Size', 'Work'], zone: 'side' }),
    ];
    for (let level = 0; level <= levels; level++) {
      const calls = a ** level;
      const size = n / b ** level;
      const total = level === levels ? calls : calls * f(size);
      work.push(total);
      labels.push(String(level));
      rows.push([level, grouped(calls), grouped(size), grouped(total)]);
      trace.add(`Level ${level}: work ${grouped(total)}`, level === levels ? `The bottom level has ${grouped(calls)} call${calls === 1 ? '' : 's'} of size 1, which is n^log_b(a) leaves.` : calls === 1 ? `1 call, of size ${grouped(size)}, doing f(${grouped(size)}) work.` : `${grouped(calls)} calls, each of size ${grouped(size)}, each doing f(${grouped(size)}) work.`, scene(), { tone: 'active' });
    }
    const reason = caseNumber === 1
      ? `k = ${k} is below log_${b}(${a}) = ${round(c)}, so the leaves dominate.`
      : caseNumber === 2 ? `k = ${k} equals log_${b}(${a}) = ${round(c)}, so every level does about the same work, and you multiply by the number of levels.`
      : `k = ${k} is above log_${b}(${a}) = ${round(c)}, so the top level dominates. The regularity condition holds, because a / b^k = ${round(a / b ** k)} is below 1.`;
    trace.finish(`Case ${caseNumber}: ${answer}`, reason, [
      bars('Total work on each level', work.map(value => Math.round(value)), i => (caseNumber === 1 ? (i === levels ? 'danger' : 'value') : caseNumber === 3 ? (i === 0 ? 'danger' : 'value') : 'done'), labels),
      factsPanel('The recurrence', [{ label: 'T(n)', value: `${a === 1 ? '' : a}T(n/${b}) + ${fText}` }, { label: 'log_b(a)', value: round(c) }, { label: 'Case', value: caseNumber }, { label: 'Answer', value: answer, tone: 'done' }]),
    ]);
    return { frames: trace.frames, summary: [{ label: 'log_b(a)', value: round(c) }, { label: 'Case', value: caseNumber }, { label: 'T(n)', value: answer, tone: 'done' }], answer: { caseNumber, answer } };
  },
};

// ---------- NP-Complete Problems ----------

function* subsetsOfSize<T>(items: T[], size: number, start = 0, chosen: T[] = []): Generator<T[]> {
  if (chosen.length === size) {
    yield chosen;
    return;
  }
  for (let i = start; i < items.length; i++) yield* subsetsOfSize(items, size, i + 1, [...chosen, items[i]]);
}

const npComplete: SimulatorDef = {
  fields: [
    choiceField('problem', 'Problem', [['cover', 'Vertex Cover'], ['independent', 'Independent Set'], ['clique', 'Clique']]),
    textField('edges', 'Graph', 'A-B, A-C, B-C, B-D, C-E, D-E'),
    numberField('k', 'Size k', 3, 1, 8),
  ],
  examples: [
    { title: 'Vertex Cover', about: 'Can 3 nodes touch every edge?', values: { problem: 'cover', k: '3' } },
    { title: 'Too small a cover', about: 'Every set of 2 nodes gets checked, and each one fails.', values: { problem: 'cover', k: '2' } },
    { title: 'Independent Set', about: 'The other nodes always form a vertex cover.', values: { problem: 'independent', k: '2' } },
    { title: 'Clique', about: 'Are there 3 nodes that are all joined?', values: { problem: 'clique', k: '3' } },
  ],
  run(values) {
    const g = graph(values.edges, { maxNodes: 8, maxEdges: 16 });
    const k = integer(values.k, 'k', 1, 8);
    if (k > g.nodes.length) throw new Error(`k is ${k}, but the graph only has ${g.nodes.length} nodes.`);
    const problem = values.problem;
    const joined = (a: string, b: string) => g.edges.some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    const pairs = (set: string[]) => set.flatMap((a, i) => set.slice(i + 1).map(b => [a, b] as const));
    const failures = (set: string[]) => (problem === 'cover'
      ? g.edges.filter(e => !set.includes(e.from) && !set.includes(e.to)).map(e => `${e.from}-${e.to} isn't touched`)
      : problem === 'independent'
        ? pairs(set).filter(([a, b]) => joined(a, b)).map(([a, b]) => `${a}-${b} are joined`)
        : pairs(set).filter(([a, b]) => !joined(a, b)).map(([a, b]) => `${a}-${b} aren't joined`));
    const names = { cover: 'vertex cover', independent: 'independent set', clique: 'clique' } as Record<string, string>;
    const trace = new Trace();
    let tried = 0;
    let found: string[] | null = null;
    const scene = (set: string[], ok: boolean): Panel[] => [
      graphPanel(`Trying ${set.join(', ')}`, g, {
        node: id => (set.includes(id) ? { tone: ok ? 'done' : 'active' } : { tone: 'muted' }),
        edge: e => {
          const bad = problem === 'cover' ? !set.includes(e.from) && !set.includes(e.to) : problem === 'independent' ? set.includes(e.from) && set.includes(e.to) : false;
          const good = problem === 'cover' ? !bad : problem === 'clique' ? set.includes(e.from) && set.includes(e.to) : false;
          return bad ? { tone: 'danger' } : good ? { tone: 'done' } : undefined;
        },
      }),
      logPanel('Checking this answer', failures(set).length ? failures(set).map(text => ({ text, tone: 'danger' as Tone })) : [{ text: 'Every condition holds', tone: 'done' }]),
    ];
    for (const set of subsetsOfSize(g.nodes, k)) {
      tried++;
      const bad = failures(set);
      if (!bad.length) {
        found = set;
        trace.add(`${set.join(', ')}: valid`, `Checking took only a quick pass over the edges. Finding this answer took ${counted(tried, 'try', 'tries')}, and that gap is what NP is about.`, scene(set, true), { tone: 'done', metrics: [{ label: 'Tried', value: tried }] });
        break;
      }
      trace.add(`${set.join(', ')}: fails`, `This set fails, because ${bad[0]}. Move on to the next one.`, scene(set, false), { tone: 'danger', metrics: [{ label: 'Tried', value: tried }] });
    }
    const total = (() => { let count = 0; for (const _ of subsetsOfSize(g.nodes, k)) count++; return count; })();
    const complement = found ? g.nodes.filter(node => !found!.includes(node)) : null;
    const link = problem === 'cover' && complement ? ` The other nodes, ${complement.join(', ') || 'none'}, form an independent set. That is the classic reduction between these two problems.` : problem === 'independent' && complement ? ` The other nodes, ${complement.join(', ') || 'none'}, form a vertex cover. That is the classic reduction between these two problems.` : '';
    trace.finish(found ? `Yes: ${found.join(', ')}` : 'No answer exists', found ? `This graph has a ${names[problem]} of size ${k}.${link}` : `All ${total} sets of size ${k} failed, so no ${names[problem]} of that size exists. With no shortcut known, proving "no" took every try.`, [
      graphPanel('Result', g, { node: id => (found?.includes(id) ? { tone: 'done' } : { tone: 'muted' }) }),
    ], { tone: found ? 'done' : 'danger' });
    return { frames: trace.frames, summary: [{ label: 'Answer', value: found ? 'Yes' : 'No', tone: found ? 'done' : 'danger' }, { label: 'Sets tried', value: `${tried} of ${total}` }], answer: found };
  },
};

// ---------- P vs NP ----------

const pVsNp: SimulatorDef = {
  fields: [textField('values', 'Values', '3, 34, 4, 12, 5, 2'), numberField('target', 'Target', 9, 1, 9999)],
  examples: [
    { title: 'An answer exists', about: 'Finding it takes many tries, while checking it takes a few additions.', values: { values: '3, 34, 4, 12, 5, 2', target: '9' } },
    { title: 'No answer exists', about: 'Every subset must be tried before saying no.', values: { values: '2, 4, 6, 8', target: '7' } },
  ],
  run(input) {
    const items = numbers(input.values, { min: 1, max: 999, maxCount: 8 });
    const target = integer(input.target, 'Target', 1, 9999);
    const trace = new Trace();
    trace.group = 'Solving: try every subset';
    const count = 2 ** items.length;
    let found: number[] | null = null;
    let tries = 0;
    const chart = (solveAt: number): Panel => ({
      kind: 'chart', title: 'Work as the input grows', logY: true, xLabel: 'number of values',
      series: [
        { label: 'Solving: 2ⁿ tries', tone: 'danger', points: Array.from({ length: Math.max(solveAt, 30) }, (_, i) => [i + 1, 2 ** (i + 1)]) },
        { label: 'Checking: n additions', tone: 'done', points: Array.from({ length: Math.max(solveAt, 30) }, (_, i) => [i + 1, i + 1]) },
      ],
    });
    for (let mask = 0; mask < count && !found; mask++) {
      tries++;
      const chosen = items.filter((_, i) => mask & (1 << i));
      const total = chosen.reduce((a, b) => a + b, 0);
      const hit = total === target && chosen.length > 0;
      if (hit) found = chosen;
      trace.add(`{${chosen.join(', ')}} = ${total}`, hit ? `This subset adds up to ${target}, after ${counted(tries, 'try', 'tries')}.` : `Adds up to ${total}, not ${target}.`, [cells('Values', row(items, { tone: i => (mask & (1 << i) ? (hit ? 'done' : 'active') : 'muted') })), chart(items.length)], { tone: hit ? 'done' : 'muted', metrics: [{ label: 'Tries', value: tries }, { label: 'Worst case', value: count }] });
    }
    let additions = 0;
    if (found) {
      trace.group = 'Checking: add up one answer';
      let running = 0;
      for (const value of found) {
        running += value;
        additions++;
        trace.add(`Add ${value}: ${running}`, 'Checking a proposed answer needs just one pass over it.', [cells('The proposed answer', row(found, { tone: i => (found![i] === value ? 'new' : 'done') })), chart(items.length)], { tone: 'new', metrics: [{ label: 'Additions', value: additions }] });
      }
    }
    trace.group = undefined;
    trace.finish(found ? 'Checked in a moment' : 'No subset works', found
      ? `Solving took ${counted(tries, 'try', 'tries')}, and checking took ${counted(additions, 'addition')}. This gap is the heart of P vs NP: is there always a way to solve as fast as we can check? Nobody knows.`
      : `All ${count} subsets failed. Each extra value doubles the work. Nobody has found a general method that avoids this, and nobody has proved one can't exist.`, [chart(items.length)], { tone: found ? 'done' : 'danger' });
    return { frames: trace.frames, summary: [{ label: 'Solving', value: `${tries} tries` }, { label: 'Checking', value: found ? `${additions} additions` : 'Nothing to check' }, { label: 'Answer', value: found ? `{${found.join(', ')}}` : 'None', tone: found ? 'done' : 'danger' }], answer: found };
  },
};

// ---------- Recurrences ----------

const RECURRENCES: Record<string, { label: string; halving: boolean; base: number; next: (t: (m: number) => number, n: number) => number; explain: (n: number) => string; closed: (n: number) => number; closedText: string; bigO: string }> = {
  r1: { label: 'T(n) = T(n-1) + 1', halving: false, base: 0, next: (t, n) => t(n - 1) + 1, explain: n => `T(${n - 1}) + 1`, closed: n => n, closedText: 'n', bigO: 'O(n)' },
  r2: { label: 'T(n) = T(n-1) + n', halving: false, base: 0, next: (t, n) => t(n - 1) + n, explain: n => `T(${n - 1}) + ${n}`, closed: n => (n * (n + 1)) / 2, closedText: 'n(n + 1) / 2', bigO: 'O(n²)' },
  r3: { label: 'T(n) = 2T(n-1) + 1', halving: false, base: 0, next: (t, n) => 2 * t(n - 1) + 1, explain: n => `2 · T(${n - 1}) + 1`, closed: n => 2 ** n - 1, closedText: '2ⁿ - 1', bigO: 'O(2ⁿ)' },
  r4: { label: 'T(n) = T(n/2) + 1', halving: true, base: 1, next: (t, n) => t(n / 2) + 1, explain: n => `T(${n / 2}) + 1`, closed: n => Math.log2(n) + 1, closedText: 'log₂ n + 1', bigO: 'O(log n)' },
  r5: { label: 'T(n) = 2T(n/2) + 1', halving: true, base: 1, next: (t, n) => 2 * t(n / 2) + 1, explain: n => `2 · T(${n / 2}) + 1`, closed: n => 2 * n - 1, closedText: '2n - 1', bigO: 'O(n)' },
  r6: { label: 'T(n) = 2T(n/2) + n', halving: true, base: 1, next: (t, n) => 2 * t(n / 2) + n, explain: n => `2 · T(${n / 2}) + ${n}`, closed: n => n * Math.log2(n) + n, closedText: 'n log₂ n + n', bigO: 'O(n log n)' },
};

const recurrences: SimulatorDef = {
  fields: [choiceField('recurrence', 'Recurrence', Object.entries(RECURRENCES).map(([key, item]) => [key, item.label])), numberField('n', 'Up to n', 8, 1, 64)],
  examples: [
    { title: 'Selection sort', about: 'T(n-1) + n adds up to about n²/2.', values: { recurrence: 'r2', n: '10' } },
    { title: 'Tower of Hanoi', about: '2T(n-1) + 1 doubles at each step.', values: { recurrence: 'r3', n: '10' } },
    { title: 'Merge sort', about: '2T(n/2) + n, on powers of two.', values: { recurrence: 'r6', n: '64' } },
    { title: 'Binary search', about: 'T(n/2) + 1 grows very slowly.', values: { recurrence: 'r4', n: '64' } },
  ],
  run(values) {
    const item = RECURRENCES[values.recurrence];
    const limit = integer(values.n, 'n', 1, 64);
    if (!item.halving && limit > 20 && values.recurrence === 'r3') throw new Error('This recurrence doubles at each step, so keep n to 20 or below.');
    const sizes: number[] = [];
    if (item.halving) for (let n = 1; n <= limit; n *= 2) sizes.push(n);
    else for (let n = 0; n <= limit; n++) sizes.push(n);
    const memo = new Map<number, number>();
    const t = (n: number): number => memo.get(n) ?? item.base;
    const trace = new Trace();
    const rows: (string | number)[][] = [];
    const scene = (active: number): Panel[] => [
      { kind: 'chart', title: 'T(n) as n grows', xLabel: 'n', series: [{ label: item.label, tone: 'accent', points: sizes.slice(0, Math.max(active + 1, 2)).map(n => [n, memo.get(n) ?? 0] as [number, number]) }] },
      tablePanel('Worked out step by step', rows, { colHead: ['n', 'T(n)', item.closedText], zone: 'side', tone: (r, c) => (r === active ? (c === 2 ? 'done' : 'active') : undefined) }),
    ];
    sizes.forEach((n, i) => {
      const value = i === 0 ? item.base : item.next(t, n);
      memo.set(n, value);
      rows.push([n, value, item.closed(n)]);
      trace.add(`T(${n}) = ${value}`, i === 0 ? `The base case: T(${n}) = ${item.base}.` : `T(${n}) = ${item.explain(n)} = ${value}. The formula ${item.closedText} gives ${item.closed(n)}.`, scene(i), { tone: i === 0 ? 'muted' : 'active' });
    });
    const last = sizes.at(-1)!;
    trace.finish(`T(${last}) = ${memo.get(last)}`, `Every row matches the formula ${item.closedText}, so ${item.label} is ${item.bigO}.`, scene(sizes.length - 1));
    return { frames: trace.frames, summary: [{ label: `T(${last})`, value: grouped(memo.get(last)!), tone: 'done' }, { label: 'Formula', value: item.closedText }, { label: 'Growth', value: item.bigO }], answer: { value: memo.get(last), matches: rows.every(entry => entry[1] === entry[2]) } };
  },
};

// ---------- Recursion and the Call Stack ----------

const CALLS: Record<string, { label: string; name: string; children: (n: number) => number[]; combine: (n: number, parts: number[]) => number; max: number; about: string }> = {
  factorial: { label: 'Factorial', name: 'fact', children: n => (n <= 1 ? [] : [n - 1]), combine: (n, parts) => (parts.length ? n * parts[0] : 1), max: 10, about: 'n × fact(n - 1)' },
  sum: { label: 'Sum 1 to n', name: 'sum', children: n => (n <= 0 ? [] : [n - 1]), combine: (n, parts) => (parts.length ? n + parts[0] : 0), max: 10, about: 'n + sum(n - 1)' },
  power: { label: 'Power of 2', name: 'pow', children: n => (n <= 0 ? [] : [n - 1]), combine: (_, parts) => (parts.length ? 2 * parts[0] : 1), max: 10, about: '2 × pow(n - 1)' },
  fibonacci: { label: 'Fibonacci', name: 'fib', children: n => (n < 2 ? [] : [n - 1, n - 2]), combine: (n, parts) => (parts.length ? parts[0] + parts[1] : n), max: 7, about: 'fib(n - 1) + fib(n - 2)' },
};

const recursionCallStack: SimulatorDef = {
  fields: [choiceField('fn', 'Function', Object.entries(CALLS).map(([key, item]) => [key, item.label])), numberField('n', 'n', 4, 0, 10)],
  examples: [
    { title: 'Factorial', about: 'A straight line of calls, then answers coming back.', values: { fn: 'factorial', n: '4' } },
    { title: 'Fibonacci', about: 'Two calls at each step make a whole tree.', values: { fn: 'fibonacci', n: '5' } },
  ],
  run(values) {
    const item = CALLS[values.fn];
    const n = integer(values.n, 'n', 0, item.max);
    const trace = new Trace();
    const stack: string[] = [];
    const returned: string[] = [];
    let calls = 0;
    let peak = 0;
    type CallNode = BinaryNode & { children: CallNode[] };
    const root: CallNode = { id: 'r', label: `${item.name}(${n})`, children: [], tone: 'muted', square: true };
    const scene = (): Panel[] => [
      treePanel('Calls made so far', visualTree(root), 'Call tree'),
      stackPanel('Call stack', stack, { tone: i => (i === stack.length - 1 ? 'active' : undefined) }),
      logPanel('Returned', returned),
    ];
    const metrics = () => [{ label: 'Calls', value: calls }, { label: 'Stack depth', value: stack.length }, { label: 'Deepest', value: peak }];
    const visit = (k: number, node: CallNode): number => {
      calls++;
      stack.push(`${item.name}(${k})`);
      peak = Math.max(peak, stack.length);
      node.tone = 'active';
      const kids = item.children(k);
      trace.add(`Call ${item.name}(${k})`, kids.length ? `${item.name}(${k}) = ${item.about.replaceAll('n', String(k)).replace(`${item.name}(${k} - 1)`, `${item.name}(${k - 1})`)}. It has to wait for that, so a new frame goes on the stack.` : `This is the base case, so ${item.name}(${k}) can answer straight away.`, scene(), { tone: 'active', metrics: metrics() });
      node.tone = 'path';
      const parts = kids.map((kid, i) => {
        const child: CallNode = { id: `${node.id}-${i}`, label: `${item.name}(${kid})`, children: [], tone: 'muted', square: true };
        node.children.push(child);
        return visit(kid, child);
      });
      const value = item.combine(k, parts);
      node.tone = 'done';
      node.sub = `= ${value}`;
      returned.push(`${item.name}(${k}) = ${value}`);
      stack.pop();
      trace.add(`${item.name}(${k}) returns ${value}`, stack.length ? `The frame is removed, and ${value} goes back to ${stack.at(-1)}.` : 'The last frame is removed, and the stack is empty again.', scene(), { tone: 'done', metrics: metrics() });
      return value;
    };
    const result = visit(n, root);
    trace.finish(`Result: ${result}`, `It took ${calls} calls, and the stack was never more than ${peak} frames deep. Memory depends on that depth, and not on the total number of calls.`, scene(), { metrics: [{ label: 'Result', value: result, tone: 'done' }, { label: 'Calls', value: calls }, { label: 'Deepest', value: peak }] });
    return { frames: trace.frames, answer: { result, calls, peak } };
  },
};

// ---------- Space Complexity ----------

const spaceComplexity: SimulatorDef = {
  fields: [choiceField('algorithm', 'Algorithm', [['loop', 'Sum with a loop'], ['recursive', 'Sum with recursion'], ['copy', 'Reverse into a copy'], ['inplace', 'Reverse in place'], ['matrix', 'Build an n × n table']]), numberField('n', 'n', 5, 1, 8)],
  examples: [
    { title: 'Loop vs recursion', about: 'Recursion holds one frame per value, even with no arrays.', values: { algorithm: 'recursive', n: '6' } },
    { title: 'In place', about: 'Two variables are enough, however long the list is.', values: { algorithm: 'inplace', n: '6' } },
    { title: 'A table', about: 'Memory grows with n × n.', values: { algorithm: 'matrix', n: '5' } },
  ],
  run(values) {
    const n = integer(values.n, 'n', 1, 8);
    const trace = new Trace();
    const algorithm = values.algorithm;
    const peakFor: Record<string, (k: number) => number> = { loop: () => 2, recursive: k => k + 1, copy: k => k + 1, inplace: () => 2, matrix: k => k * k };
    const growth = { loop: 'O(1)', recursive: 'O(n)', copy: 'O(n)', inplace: 'O(1)', matrix: 'O(n²)' }[algorithm]!;
    const chart = (): Panel => ({ kind: 'chart', title: 'Peak extra memory as n grows', xLabel: 'n', series: [{ label: `This algorithm: ${growth}`, tone: 'accent', points: Array.from({ length: 12 }, (_, i) => [i + 1, peakFor[algorithm](i + 1)] as [number, number]) }] });
    let peak = 0;
    const show = (label: string, detail: string, memory: string[], tone: Tone = 'new') => {
      peak = Math.max(peak, memory.length);
      trace.add(label, detail, [cells('Extra memory in use', row(memory, { hideIndex: true, tone: i => (i === memory.length - 1 ? tone : 'value') })), chart()], { tone, metrics: [{ label: 'In use', value: memory.length }, { label: 'Peak', value: peak }] });
    };
    if (algorithm === 'loop') {
      let total = 0;
      for (let i = 1; i <= n; i++) {
        total += i;
        show(`i = ${i}, total = ${total}`, 'The same two variables are overwritten. Memory doesn\'t grow, however large n is.', [`i=${i}`, `total=${total}`]);
      }
    } else if (algorithm === 'recursive') {
      const frames: string[] = [];
      for (let i = n; i >= 0; i--) {
        frames.push(`sum(${i})`);
        show(`Call sum(${i})`, 'Each waiting call keeps a frame on the stack, so memory grows with the depth, even with no arrays.', [...frames]);
      }
      for (let i = 0; i <= n; i++) {
        frames.pop();
        show(`Return from sum(${i})`, 'A finished call frees its frame.', [...frames], 'done');
      }
    } else if (algorithm === 'copy') {
      const copy: string[] = [];
      for (let i = n; i >= 1; i--) {
        copy.push(String(i));
        show(`Copy ${i}`, 'The result is a new list, so memory grows with the input.', ['i', ...copy]);
      }
    } else if (algorithm === 'inplace') {
      for (let low = 0, high = n - 1; low < high; low++, high--) show(`Swap ${low} and ${high}`, 'Only two index variables are needed, because the list is reversed inside itself.', [`low=${low}`, `high=${high}`]);
      if (n === 1) show('Nothing to swap', 'A list of one value is already reversed.', ['low', 'high']);
    } else {
      const cellsUsed: string[] = [];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) cellsUsed.push(`${r},${c}`);
        show(`Fill row ${r}`, `Each row adds ${n} more cells, for ${n * n} in total.`, [...cellsUsed]);
      }
    }
    trace.finish(`Peak: ${peak}`, `This algorithm used at most ${counted(peak, 'extra slot')} for n = ${n}, which is ${growth} space. The input itself isn't counted as extra.`, [chart()], { metrics: [{ label: 'Peak', value: peak, tone: 'done' }, { label: 'Space', value: growth }] });
    return { frames: trace.frames, answer: { peak, growth } };
  },
};

// ---------- Time-Space Tradeoff ----------

const timeSpaceTradeoff: SimulatorDef = {
  fields: [textField('values', 'Values', '3, 8, 1, 6, 2, 8')],
  examples: [
    { title: 'Has a duplicate', about: 'All three methods find the repeated 8.', values: { values: '3, 8, 1, 6, 2, 8' } },
    { title: 'No duplicates', about: 'The worst case: nothing can stop early.', values: { values: '5, 2, 9, 1, 7, 3, 8' } },
  ],
  run(input) {
    const list = numbers(input.values, { minCount: 2, maxCount: 12 });
    const trace = new Trace();
    const results: (string | number)[][] = [];
    const finishRow = () => tablePanel('The three methods', results, { colHead: ['Method', 'Comparisons', 'Extra memory', 'Found'] });

    trace.group = 'Compare every pair: O(n²) time, O(1) space';
    let comparisons = 0;
    let found: number | null = null;
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        comparisons++;
        const hit = list[i] === list[j];
        trace.add(`${list[i]} and ${list[j]}`, hit ? 'These match.' : 'These differ, so try the next pair.', [cells('Values', row(list, { tone: at => (at === i || at === j ? (hit ? 'done' : 'active') : undefined) })), finishRow()], { tone: hit ? 'done' : 'muted', metrics: [{ label: 'Comparisons', value: comparisons }, { label: 'Extra memory', value: 0 }] });
        if (hit) {
          found = list[i];
          break outer;
        }
      }
    }
    results.push(['Every pair', comparisons, 0, found ?? 'None']);

    trace.group = 'Sort a copy first: O(n log n) time, O(n) space';
    const sorted = [...list].sort((a, b) => a - b);
    let sortedComparisons = Math.ceil(list.length * Math.log2(list.length));
    trace.add('Sort a copy', `Sorting takes about n log n = ${sortedComparisons} comparisons, and puts equal values side by side.`, [cells('Sorted copy', row(sorted, { tone: () => 'new' })), finishRow()], { tone: 'new', metrics: [{ label: 'Comparisons', value: sortedComparisons }, { label: 'Extra memory', value: list.length }] });
    let foundSorted: number | null = null;
    for (let i = 0; i + 1 < sorted.length; i++) {
      sortedComparisons++;
      const hit = sorted[i] === sorted[i + 1];
      trace.add(`${sorted[i]} and ${sorted[i + 1]}`, hit ? 'These neighbors match.' : 'Only neighbors need comparing now.', [cells('Sorted copy', row(sorted, { tone: at => (at === i || at === i + 1 ? (hit ? 'done' : 'active') : undefined) })), finishRow()], { tone: hit ? 'done' : 'muted', metrics: [{ label: 'Comparisons', value: sortedComparisons }, { label: 'Extra memory', value: list.length }] });
      if (hit) {
        foundSorted = sorted[i];
        break;
      }
    }
    results.push(['Sort first', sortedComparisons, list.length, foundSorted ?? 'None']);

    trace.group = 'Remember in a set: O(n) time, O(n) space';
    const seen: number[] = [];
    let lookups = 0;
    let foundSet: number | null = null;
    for (let i = 0; i < list.length; i++) {
      lookups++;
      const hit = seen.includes(list[i]);
      trace.add(`Is ${list[i]} in the set?`, hit ? 'It is, so this is a duplicate.' : 'It isn\'t, so remember it. A set lookup takes one step on average.', [cells('Values', row(list, { tone: at => (at === i ? (hit ? 'done' : 'active') : at < i ? 'muted' : undefined) })), cells('The set', row(seen, { hideIndex: true, tone: () => 'path' })), finishRow()], { tone: hit ? 'done' : 'value', metrics: [{ label: 'Lookups', value: lookups }, { label: 'Extra memory', value: seen.length }] });
      if (hit) {
        foundSet = list[i];
        break;
      }
      seen.push(list[i]);
    }
    results.push(['Use a set', lookups, seen.length, foundSet ?? 'None']);
    trace.group = undefined;
    trace.finish('Compared', `The set needed the fewest steps, ${lookups}, and the most memory per value. Comparing every pair used no memory, and took ${comparisons} steps. More memory buys less time.`, [tablePanel('The three methods', results, { colHead: ['Method', 'Steps', 'Extra memory', 'Found'] })]);
    return { frames: trace.frames, answer: { pairs: comparisons, lookups, hasDuplicate: found !== null, agree: found === foundSet && (foundSorted !== null) === (found !== null) } };
  },
};

// ---------- Tower of Hanoi ----------

const towerOfHanoi: SimulatorDef = {
  fields: [numberField('disks', 'Disks', 3, 1, 7), choiceField('target', 'Move to', [['C', 'Peg C'], ['B', 'Peg B']])],
  examples: [
    { title: 'Three disks', about: 'The classic: 7 moves.', values: { disks: '3', target: 'C' } },
    { title: 'Five disks', about: 'Each extra disk doubles the moves, plus one.', values: { disks: '5', target: 'C' } },
  ],
  run(values) {
    const n = integer(values.disks, 'Disks', 1, 7);
    const target = values.target;
    const spare = target === 'C' ? 'B' : 'C';
    const pegs: Record<string, number[]> = { A: Array.from({ length: n }, (_, i) => n - i), B: [], C: [] };
    const moves: string[] = [];
    const trace = new Trace();
    const scene = (active?: string): Panel[] => [
      { kind: 'pegs', title: 'Pegs', largest: n, pegs: ['A', 'B', 'C'].map(label => ({ label, disks: [...pegs[label]], tone: label === active ? 'new' as Tone : undefined })) },
      logPanel('Moves so far', moves),
    ];
    trace.add('Start', `Move all ${n} disks from A to ${target}, one at a time, never putting a larger disk on a smaller one.`, scene(), { tone: 'muted', metrics: [{ label: 'Moves', value: 0 }, { label: 'Minimum', value: 2 ** n - 1 }] });
    const solve = (count: number, from: string, to: string, via: string) => {
      if (count === 0) return;
      solve(count - 1, from, via, to);
      const disk = pegs[from].pop()!;
      pegs[to].push(disk);
      moves.push(`${disk}: ${from} → ${to}`);
      trace.add(`Disk ${disk}: ${from} → ${to}`, count === 1 ? `Disk ${disk} moves freely.` : `All ${count - 1} smaller disks are out of the way on ${via}, so disk ${disk} can move. Then they follow it.`, scene(to), { tone: disk === n ? 'accent' : 'new', metrics: [{ label: 'Moves', value: moves.length }, { label: 'Minimum', value: 2 ** n - 1 }] });
      solve(count - 1, via, to, from);
    };
    solve(n, 'A', target, spare);
    trace.finish(`Done in ${moves.length} moves`, `T(n) = 2T(n - 1) + 1 gives 2ⁿ - 1 = ${2 ** n - 1} moves for ${n} disks, which is the minimum possible.`, scene());
    return { frames: trace.frames, answer: { moves: moves.length, pegs } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  'abstract-data-types': abstractDataTypes,
  'asymptotic-notation': asymptoticNotation,
  'best-average-and-worst-case': bestAverageWorst,
  'big-o-growth-comparison': bigOGrowth,
  'bit-manipulation': bitManipulation,
  gcd: gcdSimulator,
  'iteration-vs-recursion': iterationVsRecursion,
  'master-theorem': masterTheorem,
  'np-complete-problems': npComplete,
  'p-vs-np': pVsNp,
  recurrences,
  'recursion-and-the-call-stack': recursionCallStack,
  'space-complexity': spaceComplexity,
  'time-space-tradeoff': timeSpaceTradeoff,
  'tower-of-hanoi': towerOfHanoi,
};
