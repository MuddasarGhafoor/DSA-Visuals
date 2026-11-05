import { counted, cells, choiceField, integer, logPanel, numberField, numbers, row, stackPanel, tablePanel, textField, Trace, words, type Panel, type SimulatorDef, type Tone } from './kit.ts';

// ---------- Binary Search ----------

const binarySearch: SimulatorDef = {
  fields: [
    textField('values', 'Sorted values', '2, 5, 8, 12, 16, 23, 38, 56, 72', { wide: true }),
    numberField('target', 'Target', 23, -9999, 9999),
    choiceField('goal', 'Find', [['exact', 'Any match'], ['first', 'First match'], ['last', 'Last match'], ['lower', 'First value ≥ target']]),
    choiceField('style', 'Written', [['loop', 'With a loop'], ['recursive', 'With recursion']]),
  ],
  examples: [
    { title: 'A hit', about: '23 is found in three comparisons.', values: { values: '2, 5, 8, 12, 16, 23, 38, 56, 72', target: '23', goal: 'exact', style: 'loop' } },
    { title: 'A miss', about: 'The range closes in on nothing.', values: { values: '2, 5, 8, 12, 16, 23, 38, 56, 72', target: '10', goal: 'exact', style: 'loop' } },
    { title: 'First of many', about: 'Keep searching left after a match.', values: { values: '1, 3, 3, 3, 3, 7, 9', target: '3', goal: 'first', style: 'loop' } },
    { title: 'Insert position', about: 'Where 10 would go to keep the order.', values: { values: '2, 5, 8, 12, 16', target: '10', goal: 'lower', style: 'loop' } },
    { title: 'Recursion', about: 'The same search, with a call stack.', values: { values: '2, 5, 8, 12, 16, 23, 38, 56, 72', target: '72', goal: 'exact', style: 'recursive' } },
  ],
  run(input) {
    const items = numbers(input.values, { minCount: 1, maxCount: 20 });
    for (let i = 1; i < items.length; i++) if (items[i] < items[i - 1]) throw new Error(`Binary search needs sorted values, but ${items[i]} comes after ${items[i - 1]}.`);
    const target = integer(input.target, 'Target', -9999, 9999);
    const goal = input.goal;
    const recursive = input.style === 'recursive';
    const trace = new Trace();
    let comparisons = 0;
    let answer = -1;
    const calls: string[] = [];
    const view = (low: number, high: number, mid?: number, tone: Tone = 'active'): Panel[] => {
      const pointers: Record<number, string> = {};
      if (low < items.length && low <= high) pointers[low] = 'low';
      if (high >= 0 && low <= high) pointers[high] = pointers[high] ? `${pointers[high]}, high` : 'high';
      if (mid !== undefined) pointers[mid] = pointers[mid] ? `${pointers[mid]}, mid` : 'mid';
      return [
        cells('Values', row(items, { pointers, tone: i => (i === mid ? tone : i === answer ? 'done' : i < low || i > high ? 'muted' : undefined) })),
        ...(recursive ? [stackPanel('Call stack', calls, { tone: i => (i === calls.length - 1 ? 'active' : undefined) })] : []),
      ];
    };
    const metrics = (low: number, high: number) => [{ label: 'Comparisons', value: comparisons }, { label: 'Values left', value: Math.max(0, high - low + 1) }, ...(answer >= 0 ? [{ label: 'Best so far', value: `index ${answer}` }] : [])];
    const step = (low: number, high: number): boolean => {
      if (low > high) return false;
      const mid = (low + high) >> 1;
      comparisons++;
      const value = items[mid];
      let next: [number, number];
      let detail: string;
      let tone: Tone = 'active';
      if (goal === 'lower') {
        if (value >= target) {
          answer = mid;
          next = [low, mid - 1];
          detail = `${value} is at least ${target}, so index ${mid} is a candidate. An earlier one may exist, so look left.`;
          tone = 'new';
        } else {
          next = [mid + 1, high];
          detail = `${value} is below ${target}, so everything up to here can go.`;
        }
      } else if (value === target) {
        answer = mid;
        tone = 'done';
        if (goal === 'exact') {
          trace.add(`Found at index ${mid}`, `The middle value is ${value}, which is the target.`, view(low, high, mid, 'done'), { tone: 'done', metrics: metrics(low, high) });
          return true;
        }
        next = goal === 'first' ? [low, mid - 1] : [mid + 1, high];
        detail = `${value} matches, so remember index ${mid}. ${goal === 'first' ? 'An earlier match may exist, so look left.' : 'A later match may exist, so look right.'}`;
      } else if (value < target) {
        next = [mid + 1, high];
        detail = `${value} is below ${target}, and the list is sorted, so the whole left half can go.`;
      } else {
        next = [low, mid - 1];
        detail = `${value} is above ${target}, and the list is sorted, so the whole right half can go.`;
      }
      trace.add(`mid = ${mid}: value ${value}`, `(${low} + ${high}) ÷ 2 = ${mid}. ${detail}`, view(low, high, mid, tone), { tone, metrics: metrics(low, high) });
      return run(next[0], next[1]);
    };
    const run = (low: number, high: number): boolean => {
      if (!recursive) return step(low, high);
      calls.push(`search(${low}, ${high})`);
      const found = step(low, high);
      if (low > high) trace.add(`search(${low}, ${high}) stops`, 'The range is empty, which is the base case.', view(low, high), { tone: 'muted', metrics: metrics(low, high) });
      calls.pop();
      return found;
    };
    run(0, items.length - 1);
    const insertPoint = goal === 'lower' && answer < 0 ? items.length : answer;
    const found = goal === 'lower' ? insertPoint : answer;
    const missing = goal !== 'lower' && answer < 0;
    const text = goal === 'lower' ? (found === items.length ? `Every value is below ${target}, so it would go at the end, at index ${found}.` : `Index ${found} holds the first value that is at least ${target}.`) : missing ? `${target} isn't in the list.` : `${target} is at index ${answer}.`;
    trace.finish(missing ? 'Not found' : `Answer: index ${found}`, `${text} That took ${comparisons} comparison${comparisons === 1 ? '' : 's'}, out of at most ${Math.floor(Math.log2(items.length)) + 1} for ${items.length} values.`, [cells('Values', row(items, { tone: i => (i === found && !missing ? 'done' : undefined) }))], { tone: missing ? 'danger' : 'done', metrics: [{ label: 'Index', value: missing ? 'None' : found, tone: missing ? 'danger' : 'done' }, { label: 'Comparisons', value: comparisons }] });
    return { frames: trace.frames, answer: missing ? -1 : found };
  },
};

// ---------- KMP ----------

function failureTable(pattern: string, trace?: Trace) {
  const chars = [...pattern];
  const fail = new Array<number>(chars.length).fill(0);
  const scene = (i: number, k: number, tone: Tone): Panel[] => [
    cells('Pattern', [row(chars, { pointers: i < chars.length ? (i === k ? { [i]: 'i, k' } : { [i]: 'i', [k]: 'k' }) : undefined, tone: at => (at === i ? tone : at === k ? 'path' : undefined) }), row(fail, { label: 'Failure', hideIndex: true, tone: at => (at === i ? 'new' : undefined) })]),
  ];
  let k = 0;
  for (let i = 1; i < chars.length; i++) {
    while (k > 0 && chars[i] !== chars[k]) {
      trace?.add(`Fall back: k = ${fail[k - 1]}`, `“${chars[i]}” doesn't match “${chars[k]}”, so try the next shorter border, failure[${k - 1}] = ${fail[k - 1]}.`, scene(i, k, 'danger'), { tone: 'danger' });
      k = fail[k - 1];
    }
    const same = chars[i] === chars[k];
    if (same) k++;
    fail[i] = k;
    trace?.add(`failure[${i}] = ${k}`, same ? `“${chars[i]}” extends the border, so the longest prefix that is also a suffix here has length ${k}.` : `“${chars[i]}” doesn't extend any border, so this one has length 0.`, scene(i, Math.max(k - 1, 0), same ? 'new' : 'active'), { tone: same ? 'new' : 'active' });
  }
  return fail;
}

const kmp: SimulatorDef = {
  fields: [textField('text', 'Text', 'ABABABCABABC', { wide: true }), textField('pattern', 'Pattern', 'ABABC')],
  examples: [
    { title: 'Reuse what matched', about: 'After a mismatch, the text pointer never moves back.', values: { text: 'ABABABCABABC', pattern: 'ABABC' } },
    { title: 'Repeats', about: 'The naive method does far more work on this text.', values: { text: 'AAAAAAAAAB', pattern: 'AAAAB' } },
    { title: 'No match', about: 'One pass, and it is done.', values: { text: 'ABCABCABC', pattern: 'ABD' } },
  ],
  run(input) {
    const text = words(input.text, { label: 'some text', maxLength: 28 });
    const pattern = words(input.pattern, { label: 'a pattern', maxLength: 12 });
    const trace = new Trace();
    trace.group = 'Build the failure table';
    const fail = failureTable(pattern, trace);
    trace.group = 'Search the text';
    const t = [...text];
    const p = [...pattern];
    const matches: number[] = [];
    let compares = 0;
    let j = 0;
    const scene = (i: number, tone: Tone): Panel[] => [
      cells('Alignment', [
        row(t, { label: 'Text', pointers: i < t.length ? { [i]: 'i' } : undefined, tone: at => (at === i ? tone : matches.some(start => at >= start && at < start + p.length) ? 'done' : undefined) }),
        row(p, { label: 'Pattern', offset: i - j, hideIndex: true, tone: at => (at < j ? 'path' : at === j ? tone : undefined) }),
      ]),
      tablePanel('Failure table', [p, fail], { rowHead: ['Char', 'Fail'], zone: 'side' }),
      logPanel('Matches', matches.map(start => `Match at index ${start}`)),
    ];
    for (let i = 0; i < t.length; i++) {
      while (j > 0 && t[i] !== p[j]) {
        compares++;
        trace.add(`Mismatch: j = ${fail[j - 1]}`, `“${t[i]}” isn't “${p[j]}”. The first ${fail[j - 1]} characters are known to match already, so the pattern slides without moving i backward.`, scene(i, 'danger'), { tone: 'danger', metrics: [{ label: 'Comparisons', value: compares }] });
        j = fail[j - 1];
      }
      compares++;
      if (t[i] === p[j]) {
        trace.add(`“${t[i]}” matches`, `That makes ${j + 1} character${j === 0 ? '' : 's'} matched so far.`, scene(i, 'active'), { tone: 'active', metrics: [{ label: 'Comparisons', value: compares }] });
        j++;
      } else {
        trace.add(`“${t[i]}” doesn't match`, 'No progress to reuse, so move on to the next character in the text.', scene(i, 'muted'), { tone: 'muted', metrics: [{ label: 'Comparisons', value: compares }] });
      }
      if (j === p.length) {
        const start = i - p.length + 1;
        matches.push(start);
        trace.add(`Match at ${start}`, `All of the pattern matched. Keep the border of ${fail[j - 1]} characters, and carry on searching.`, scene(i, 'done'), { tone: 'done', metrics: [{ label: 'Comparisons', value: compares }] });
        j = fail[j - 1];
      }
    }
    trace.group = undefined;
    trace.finish(matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'No match', `${counted(compares, 'comparison')} on a text of ${counted(t.length, 'character')}. KMP never moves backward in the text, so it runs in O(n + m).`, [cells('Text', row(t, { tone: at => (matches.some(start => at >= start && at < start + p.length) ? 'done' : undefined) })), tablePanel('Failure table', [p, fail], { rowHead: ['Char', 'Fail'], zone: 'side' })], { tone: matches.length ? 'done' : 'danger', metrics: [{ label: 'Matches', value: matches.length }, { label: 'Comparisons', value: compares }] });
    return { frames: trace.frames, answer: { fail, matches, compares } };
  },
};

// ---------- Linear Search ----------

const linearSearch: SimulatorDef = {
  fields: [
    textField('values', 'Values', '7, 3, 9, 1, 5, 9', { wide: true }),
    numberField('target', 'Target', 9, -9999, 9999),
    choiceField('mode', 'Find', [['first', 'First match'], ['all', 'All matches'], ['sentinel', 'With a sentinel']]),
  ],
  examples: [
    { title: 'First match', about: 'Stops as soon as it finds it.', values: { values: '7, 3, 9, 1, 5, 9', target: '9', mode: 'first' } },
    { title: 'All matches', about: 'Has to go through the whole list.', values: { values: '7, 3, 9, 1, 5, 9', target: '9', mode: 'all' } },
    { title: 'A sentinel', about: 'A copy of the target at the end removes the bounds check.', values: { values: '7, 3, 9, 1', target: '4', mode: 'sentinel' } },
  ],
  run(input) {
    const items = numbers(input.values, { minCount: 1, maxCount: 20 });
    const target = integer(input.target, 'Target', -9999, 9999);
    const mode = input.mode;
    const trace = new Trace();
    const found: number[] = [];
    let comparisons = 0;
    let boundChecks = 0;
    const list = mode === 'sentinel' ? [...items, target] : items;
    const scene = (at: number, tone: Tone): Panel[] => [
      cells(mode === 'sentinel' ? 'Values, with the sentinel at the end' : 'Values', row(list, { pointers: { [at]: 'i' }, tone: i => (i === at ? tone : found.includes(i) ? 'done' : mode === 'sentinel' && i === items.length ? 'path' : i < at ? 'muted' : undefined) })),
      logPanel('Matches', found.map(i => `Index ${i}`)),
    ];
    const metrics = () => [{ label: 'Comparisons', value: comparisons }, { label: 'Bounds checks', value: boundChecks }];
    for (let i = 0; i < list.length; i++) {
      if (mode !== 'sentinel') boundChecks++;
      comparisons++;
      const hit = list[i] === target;
      if (mode === 'sentinel' && hit && i === items.length) {
        trace.add('Reached the sentinel', 'The loop stopped on the copy we added, so the target isn\'t in the real list.', scene(i, 'danger'), { tone: 'danger', metrics: metrics() });
        break;
      }
      if (hit) found.push(i);
      trace.add(`Index ${i}: ${list[i]}`, hit ? `That is the target.${mode === 'all' ? ' Remember it, and keep going.' : ''}` : `${list[i]} isn't ${target}, so move on.`, scene(i, hit ? 'done' : 'active'), { tone: hit ? 'done' : 'active', metrics: metrics() });
      if (hit && mode !== 'all') break;
    }
    trace.finish(found.length ? (mode === 'all' ? `${found.length} match${found.length === 1 ? '' : 'es'}` : `Found at ${found[0]}`) : 'Not found', `${counted(comparisons, 'comparison')}. ${mode === 'sentinel' ? `The loop needed no check for the end of the list, which saved ${counted(comparisons, 'bounds check')}.` : 'Linear search works on unsorted data, and takes O(n) in the worst case.'}`, [cells('Values', row(items, { tone: i => (found.includes(i) ? 'done' : undefined) }))], { tone: found.length ? 'done' : 'danger', metrics: metrics() });
    return { frames: trace.frames, answer: { found, comparisons } };
  },
};

// ---------- Naive Pattern Matching ----------

const naivePatternMatching: SimulatorDef = {
  fields: [textField('text', 'Text', 'AABAACAADAABAABA', { wide: true }), textField('pattern', 'Pattern', 'AABA')],
  examples: [
    { title: 'Several matches', about: 'Matches can overlap.', values: { text: 'AAAAA', pattern: 'AA' } },
    { title: 'The worst case', about: 'Nearly all of the pattern matches at every position.', values: { text: 'AAAAAAAAAB', pattern: 'AAAB' } },
    { title: 'Early mismatches', about: 'Usually this runs much faster than the worst case.', values: { text: 'THE QUICK FOX'.replaceAll(' ', '_'), pattern: 'FOX' } },
  ],
  run(input) {
    const t = [...words(input.text, { label: 'some text', maxLength: 28 })];
    const p = [...words(input.pattern, { label: 'a pattern', maxLength: 12 })];
    const trace = new Trace();
    const matches: number[] = [];
    let compares = 0;
    const scene = (start: number, j: number, tone: Tone): Panel[] => [
      cells('Alignment', [
        row(t, { label: 'Text', tone: i => (i === start + j ? tone : i >= start && i < start + j ? 'path' : matches.some(m => i >= m && i < m + p.length) ? 'done' : undefined) }),
        row(p, { label: 'Pattern', offset: start, hideIndex: true, tone: i => (i === j ? tone : i < j ? 'path' : undefined) }),
      ]),
      logPanel('Matches', matches.map(m => `Match at index ${m}`)),
    ];
    if (p.length > t.length) {
      trace.finish('No match', 'The pattern is longer than the text, so it can\'t fit anywhere.', [cells('Text', row(t))], { tone: 'danger' });
      return { frames: trace.frames, answer: { matches, compares } };
    }
    for (let start = 0; start + p.length <= t.length; start++) {
      trace.group = `Position ${start}`;
      let j = 0;
      while (j < p.length) {
        compares++;
        const same = t[start + j] === p[j];
        trace.add(same ? `“${p[j]}” matches` : `“${t[start + j]}” isn't “${p[j]}”`, same ? 'Compare the next character.' : 'Slide the pattern one place, and start again from its first character.', scene(start, j, same ? 'active' : 'danger'), { tone: same ? 'active' : 'danger', metrics: [{ label: 'Comparisons', value: compares }, { label: 'Matches', value: matches.length }] });
        if (!same) break;
        j++;
      }
      if (j === p.length) {
        matches.push(start);
        trace.add(`Match at ${start}`, 'All of the pattern matched. Slide by one, as matches can overlap.', scene(start, p.length, 'done'), { tone: 'done', metrics: [{ label: 'Comparisons', value: compares }, { label: 'Matches', value: matches.length }] });
      }
    }
    trace.group = undefined;
    const positions = t.length - p.length + 1;
    trace.finish(matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'No match', `${counted(compares, 'comparison')} over ${counted(positions, 'position')}. The worst case is about ${positions * p.length}, which is O(n × m).`, [cells('Text', row(t, { tone: i => (matches.some(m => i >= m && i < m + p.length) ? 'done' : undefined) }))], { tone: matches.length ? 'done' : 'danger', metrics: [{ label: 'Comparisons', value: compares }, { label: 'Matches', value: matches.length }] });
    return { frames: trace.frames, answer: { matches, compares } };
  },
};

// ---------- Rabin-Karp ----------

const rabinKarp: SimulatorDef = {
  fields: [textField('text', 'Text', 'abcabdcab', { wide: true }), textField('pattern', 'Pattern', 'cab'), numberField('base', 'Base', 256, 2, 300), numberField('modulus', 'Modulus', 101, 3, 997)],
  examples: [
    { title: 'A rolling hash', about: 'Each new hash comes from the last one in one step.', values: { text: 'abcabdcab', pattern: 'cab', base: '256', modulus: '101' } },
    { title: 'False matches', about: 'With modulus 3, hashes often match by accident.', values: { text: 'abcdefghij', pattern: 'cde', base: '256', modulus: '3' } },
  ],
  run(input) {
    const t = [...words(input.text, { label: 'some text', maxLength: 28 })];
    const p = [...words(input.pattern, { label: 'a pattern', maxLength: 10 })];
    const base = integer(input.base, 'Base', 2, 300);
    const modulus = integer(input.modulus, 'Modulus', 3, 997);
    const code = (char: string) => char.charCodeAt(0);
    const trace = new Trace();
    const matches: number[] = [];
    let spurious = 0;
    let checks = 0;
    if (p.length > t.length) {
      trace.finish('No match', 'The pattern is longer than the text.', [cells('Text', row(t))], { tone: 'danger' });
      return { frames: trace.frames, answer: { matches, spurious } };
    }
    let high = 1;
    for (let i = 1; i < p.length; i++) high = (high * base) % modulus;
    const hashOf = (chars: string[]) => chars.reduce((total, char) => (total * base + code(char)) % modulus, 0);
    const patternHash = hashOf(p);
    let hash = hashOf(t.slice(0, p.length));
    const scene = (start: number, tone: Tone): Panel[] => [
      cells('Window', [
        row(t, { label: 'Text', tone: i => (i >= start && i < start + p.length ? tone : matches.some(m => i >= m && i < m + p.length) ? 'done' : undefined) }),
        row(p, { label: 'Pattern', offset: start, hideIndex: true, tone: () => tone }),
      ]),
      logPanel('Matches', matches.map(m => `Match at index ${m}`)),
    ];
    const metrics = () => [{ label: 'Pattern hash', value: patternHash }, { label: 'Window hash', value: hash }, { label: 'Character checks', value: checks }, { label: 'False matches', value: spurious }];
    for (let start = 0; start + p.length <= t.length; start++) {
      if (start === 0) trace.add(`First window: ${hash}`, `Hash the pattern and the first window the same way: pattern = ${patternHash}, window = ${hash}.`, scene(0, hash === patternHash ? 'active' : 'value'), { tone: 'active', metrics: metrics() });
      if (hash === patternHash) {
        let same = true;
        for (let i = 0; i < p.length; i++) {
          checks++;
          if (t[start + i] !== p[i]) {
            same = false;
            break;
          }
        }
        if (same) {
          matches.push(start);
          trace.add(`Match at ${start}`, 'The hashes agree, and checking the characters confirms it.', scene(start, 'done'), { tone: 'done', metrics: metrics() });
        } else {
          spurious++;
          trace.add(`False match at ${start}`, 'The hashes agree, but the characters differ. That is why every hash match must be checked.', scene(start, 'danger'), { tone: 'danger', metrics: metrics() });
        }
      } else if (start > 0) {
        trace.add(`Window ${start}: ${hash}`, `${hash} isn't ${patternHash}, so no characters need checking.`, scene(start, 'value'), { tone: 'muted', metrics: metrics() });
      }
      if (start + p.length < t.length) {
        const previous = hash;
        hash = (((previous - code(t[start]) * high) % modulus + modulus) * base + code(t[start + p.length])) % modulus;
        trace.add(`Roll to ${hash}`, `Remove “${t[start]}”, shift, and add “${t[start + p.length]}”: ((${previous} - ${code(t[start])} × ${high}) × ${base} + ${code(t[start + p.length])}) mod ${modulus} = ${hash}. One step, instead of rehashing ${p.length} characters.`, scene(start + 1, 'active'), { tone: 'active', metrics: metrics() });
      }
    }
    trace.finish(matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'No match', `The text had ${counted(t.length - p.length + 1, 'window')}, and only ${counted(checks, 'character')} had to be compared. Expected time is O(n + m), and many false matches push it toward O(n × m).`, [cells('Text', row(t, { tone: i => (matches.some(m => i >= m && i < m + p.length) ? 'done' : undefined) }))], { tone: matches.length ? 'done' : 'danger', metrics: metrics() });
    return { frames: trace.frames, answer: { matches, spurious } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  'binary-search': binarySearch,
  kmp,
  'linear-search': linearSearch,
  'naive-pattern-matching': naivePatternMatching,
  'rabin-karp': rabinKarp,
};
