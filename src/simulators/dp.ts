import { counted, cells, choiceField, factsPanel, integer, logPanel, matrix, numberField, numbers, records, row, tablePanel, textField, Trace, treePanel, visualTree, whenChoice, words, type BinaryNode, type Legend, type Metric, type Panel, type SimulatorDef, type Tone } from './kit.ts';

type Spot = [number, number];
const legend: Legend = [{ tone: 'active', label: 'This cell' }, { tone: 'path', label: 'Depends on' }, { tone: 'done', label: 'The answer' }];
const has = (spots: Spot[] | undefined, r: number, c: number) => Boolean(spots?.some(spot => spot[0] === r && spot[1] === c));

/** The table most DP topics share: one cell being filled, the cells it depends on, and the path back from the answer. */
function dpTable(title: string, values: (string | number | null)[][], options: { rowHead?: (string | number)[]; colHead?: (string | number)[]; corner?: string; active?: Spot; deps?: Spot[]; path?: Spot[]; zone?: 'main' | 'side' }): Panel {
  return tablePanel(title, values, {
    rowHead: options.rowHead, colHead: options.colHead, corner: options.corner, zone: options.zone, legend,
    tone: (r, c) => {
      if (options.active && options.active[0] === r && options.active[1] === c) return 'active';
      if (has(options.path, r, c)) return 'done';
      if (has(options.deps, r, c)) return 'path';
      return values[r][c] === null ? 'muted' : undefined;
    },
  });
}

const grid = <T,>(rows: number, cols: number, fill: T): T[][] => Array.from({ length: rows }, () => new Array<T>(cols).fill(fill));
const finish = (value: number) => (value === Infinity ? '∞' : value);

// ---------- 0/1 Knapsack ----------

const zeroOneKnapsack: SimulatorDef = {
  fields: [
    textField('items', 'Items, as name(weight, value)', 'A(1,1), B(3,4), C(4,5), D(5,7)', { wide: true }),
    numberField('capacity', 'Capacity', 7, 1, 20),
    choiceField('view', 'Store', [['table', 'The whole table'], ['row', 'Just one row']]),
  ],
  examples: [
    { title: 'Four items', about: 'B and C together beat D plus A.', values: { items: 'A(1,1), B(3,4), C(4,5), D(5,7)', capacity: '7', view: 'table' } },
    { title: 'Greedy would fail', about: 'The best ratio is A, but B and C are better together.', values: { items: 'A(10,60), B(20,100), C(30,120)', capacity: '20', view: 'table' } },
    { title: 'One row', about: 'Going right to left stops an item being used twice.', values: { items: 'A(1,1), B(3,4), C(4,5), D(5,7)', capacity: '7', view: 'row' } },
  ],
  run(input) {
    const list = records(input.items, { label: 'the items', parts: 2, example: 'A(1,1), B(3,4)', maxCount: 8, min: 1, max: 999 }).map(item => ({ name: item.name, weight: item.values[0], value: item.values[1] }));
    const capacity = integer(input.capacity, 'Capacity', 1, 20);
    const trace = new Trace();
    const caps = Array.from({ length: capacity + 1 }, (_, i) => i);
    if (input.view === 'row') {
      const best = new Array<number>(capacity + 1).fill(0);
      const scene = (at?: number, from?: number): Panel[] => [cells('Best value for each capacity', row(best, { tone: i => (i === at ? 'active' : i === from ? 'path' : undefined), firstIndex: 0 }))];
      list.forEach(item => {
        trace.group = `Item ${item.name}: weight ${item.weight}, value ${item.value}`;
        for (let c = capacity; c >= item.weight; c--) {
          const take = best[c - item.weight] + item.value;
          const better = take > best[c];
          trace.add(`Capacity ${c}: ${better ? take : best[c]}`, `Taking it gives ${best[c - item.weight]} + ${item.value} = ${take}, and leaving it gives ${best[c]}. Going right to left means index ${c - item.weight} still holds the value from before this item, so it can't be used twice.`, scene(c, c - item.weight), { tone: better ? 'new' : 'muted' });
          if (better) best[c] = take;
        }
      });
      trace.group = undefined;
      trace.finish(`Best value: ${best[capacity]}`, 'One row uses O(W) memory instead of O(n × W), but it can no longer tell you which items were picked.', [cells('Best value for each capacity', row(best, { tone: i => (i === capacity ? 'done' : undefined) }))], { metrics: [{ label: 'Best value', value: best[capacity], tone: 'done' }] });
      return { frames: trace.frames, answer: { best: best[capacity] } };
    }
    const table: (number | null)[][] = [new Array<number>(capacity + 1).fill(0), ...grid<number | null>(list.length, capacity + 1, null)];
    const rowHead = ['None', ...list.map(item => item.name)];
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [dpTable('Best value: item (rows) by capacity (columns)', table, { rowHead, colHead: caps, active, deps, path })];
    trace.add('Start', 'With no items, every capacity is worth 0.', scene(), { tone: 'muted' });
    list.forEach((item, i) => {
      const r = i + 1;
      trace.group = `Item ${item.name}: weight ${item.weight}, value ${item.value}`;
      for (let c = 0; c <= capacity; c++) {
        const leave = table[r - 1][c]!;
        if (item.weight > c) {
          table[r][c] = leave;
          trace.add(`Capacity ${c}: ${leave}`, `${item.name} weighs ${item.weight}, so it doesn't fit. Keep the value above.`, scene([r, c], [[r - 1, c]]), { tone: 'muted' });
        } else {
          const take = table[r - 1][c - item.weight]! + item.value;
          table[r][c] = Math.max(leave, take);
          trace.add(`Capacity ${c}: ${table[r][c]}`, `Leave it: ${leave}. Take it: ${table[r - 1][c - item.weight]} + ${item.value} = ${take}. The larger one wins.`, scene([r, c], [[r - 1, c], [r - 1, c - item.weight]]), { tone: take > leave ? 'new' : 'value' });
        }
      }
    });
    trace.group = 'Find which items were taken';
    const chosen: string[] = [];
    const path: Spot[] = [];
    let c = capacity;
    for (let r = list.length; r > 0; r--) {
      path.push([r, c]);
      const took = table[r][c] !== table[r - 1][c];
      trace.add(took ? `Take ${list[r - 1].name}` : `Skip ${list[r - 1].name}`, took ? `This cell differs from the one above, so ${list[r - 1].name} was taken.` : 'This cell is the same as the one above, so the item wasn\'t needed.', scene(undefined, undefined, path), { tone: took ? 'done' : 'muted' });
      if (took) {
        chosen.unshift(list[r - 1].name);
        c -= list[r - 1].weight;
      }
    }
    trace.group = undefined;
    const best = table[list.length][capacity]!;
    trace.finish(`Best value: ${best}`, `Take ${chosen.join(', ') || 'nothing'}. Filling (n + 1) × (W + 1) cells takes O(n × W).`, scene(undefined, undefined, path), { metrics: [{ label: 'Best value', value: best, tone: 'done' }, { label: 'Items', value: chosen.join(', ') || 'None' }] });
    return { frames: trace.frames, answer: { best, chosen } };
  },
};

// ---------- Assembly Line Scheduling ----------

const assemblyLine: SimulatorDef = {
  fields: [
    textField('a1', 'Line 1 stations', '7, 9, 3, 4, 8, 4'),
    textField('a2', 'Line 2 stations', '8, 5, 6, 4, 5, 7'),
    textField('t1', 'Move from line 1', '2, 3, 1, 3, 4'),
    textField('t2', 'Move from line 2', '2, 1, 2, 2, 1'),
    textField('entry', 'Entry times', '2, 4'),
    textField('exit', 'Exit times', '3, 2'),
  ],
  examples: [
    { title: 'The classic', about: 'The best route switches lines four times, for a total of 38.', values: {} },
    { title: 'Staying put', about: 'Switching costs too much, so one line wins.', values: { a1: '1, 1, 1', a2: '2, 2, 2', t1: '9, 9', t2: '9, 9', entry: '1, 1', exit: '1, 1' } },
    { title: 'Worth a switch', about: 'A cheap switch avoids an expensive station.', values: { a1: '1, 50, 1', a2: '9, 1, 9', t1: '1, 1', t2: '1, 1', entry: '1, 1', exit: '1, 1' } },
  ],
  run(input) {
    const a1 = numbers(input.a1, { label: 'line 1', min: 0, max: 999, maxCount: 10 });
    const a2 = numbers(input.a2, { label: 'line 2', min: 0, max: 999, maxCount: 10 });
    const n = a1.length;
    if (a2.length !== n) throw new Error('Both lines must have the same number of stations.');
    const t1 = input.t1.trim() ? numbers(input.t1, { label: 'move times from line 1', min: 0, max: 999, maxCount: 10 }) : [];
    const t2 = input.t2.trim() ? numbers(input.t2, { label: 'move times from line 2', min: 0, max: 999, maxCount: 10 }) : [];
    if (t1.length !== n - 1 || t2.length !== n - 1) throw new Error(`With ${n} stations, each line needs ${n - 1} move times.`);
    const entry = numbers(input.entry, { label: 'entry times', min: 0, max: 999, minCount: 2, maxCount: 2 });
    const exit = numbers(input.exit, { label: 'exit times', min: 0, max: 999, minCount: 2, maxCount: 2 });
    const a = [a1, a2];
    const t = [t1, t2];
    const best = grid<number | null>(2, n, null);
    const came = grid<number>(2, n, 0);
    const trace = new Trace();
    const heads = a1.map((_, i) => i + 1);
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [
      tablePanel('Station times', a, { rowHead: ['Line 1', 'Line 2'], colHead: heads, tone: (r, c) => (active && active[0] === r && active[1] === c ? 'active' : has(path, r, c) ? 'done' : undefined) }),
      dpTable('Fastest time to finish each station', best, { rowHead: ['Line 1', 'Line 2'], colHead: heads, active, deps, path }),
    ];
    [0, 1].forEach(line => {
      best[line][0] = entry[line] + a[line][0];
      trace.add(`Line ${line + 1}, station 1: ${best[line][0]}`, `Entry time ${entry[line]} + station time ${a[line][0]}.`, scene([line, 0]), { tone: 'new' });
    });
    for (let s = 1; s < n; s++) {
      for (const line of [0, 1]) {
        const other = 1 - line;
        const stay = best[line][s - 1]! + a[line][s];
        const move = best[other][s - 1]! + t[other][s - 1] + a[line][s];
        const stays = stay <= move;
        best[line][s] = stays ? stay : move;
        came[line][s] = stays ? line : other;
        trace.add(`Line ${line + 1}, station ${s + 1}: ${best[line][s]}`, `Staying: ${best[line][s - 1]} + ${a[line][s]} = ${stay}. Switching: ${best[other][s - 1]} + ${t[other][s - 1]} + ${a[line][s]} = ${move}. ${stays ? 'Staying' : 'Switching'} wins.`, scene([line, s], [[line, s - 1], [other, s - 1]]), { tone: stays ? 'value' : 'accent' });
      }
    }
    const end1 = best[0][n - 1]! + exit[0];
    const end2 = best[1][n - 1]! + exit[1];
    let line = end1 <= end2 ? 0 : 1;
    const total = Math.min(end1, end2);
    const route: number[] = [];
    const path: Spot[] = [];
    for (let s = n - 1; s >= 0; s--) {
      route.unshift(line + 1);
      path.push([line, s]);
      line = came[line][s];
    }
    trace.finish(`Fastest time: ${total}`, `Finishing on line 1 takes ${best[0][n - 1]} + ${exit[0]} = ${end1}, and on line 2 takes ${best[1][n - 1]} + ${exit[1]} = ${end2}. Route by station: ${route.join(', ')}. Time: O(n), where trying every route would take O(2ⁿ).`, scene(undefined, undefined, path), { metrics: [{ label: 'Fastest time', value: total, tone: 'done' }, { label: 'Route', value: route.join(' ') }] });
    return { frames: trace.frames, answer: { total, route } };
  },
};

// ---------- Coin Change ----------

const coinChange: SimulatorDef = {
  fields: [
    choiceField('goal', 'Find', [['min', 'Fewest coins'], ['ways', 'Number of combinations'], ['orderings', 'Number of orderings']]),
    textField('coins', 'Coins', '1, 3, 4'),
    numberField('amount', 'Amount', 6, 0, 30),
  ],
  examples: [
    { title: 'Fewest coins', about: '3 + 3 beats what a greedy choice would pick.', values: { goal: 'min', coins: '1, 3, 4', amount: '6' } },
    { title: 'Combinations', about: 'Order doesn\'t matter: 1 + 2 + 2 counts once.', values: { goal: 'ways', coins: '1, 2, 5', amount: '5' } },
    { title: 'Orderings', about: 'Order matters: 1 + 2 and 2 + 1 count separately.', values: { goal: 'orderings', coins: '1, 2', amount: '4' } },
    { title: 'Impossible', about: 'Even coins can\'t make an odd amount.', values: { goal: 'min', coins: '2, 4', amount: '7' } },
  ],
  run(input) {
    const coins = [...new Set(numbers(input.coins, { label: 'coins', min: 1, max: 100, maxCount: 7 }))].sort((a, b) => a - b);
    const amount = integer(input.amount, 'Amount', 0, 30);
    const goal = input.goal;
    const trace = new Trace();
    const heads = Array.from({ length: amount + 1 }, (_, i) => i);
    if (goal === 'ways') {
      const table: (number | null)[][] = [[1, ...new Array<number>(amount).fill(0)], ...grid<number | null>(coins.length, amount + 1, null)];
      const rowHead = ['None', ...coins];
      const scene = (active?: Spot, deps?: Spot[]): Panel[] => [dpTable('Ways: coins used so far (rows) by amount (columns)', table, { rowHead, colHead: heads, corner: 'Coin', active, deps })];
      trace.add('Start', 'There is exactly one way to make 0: use no coins.', scene(), { tone: 'muted' });
      coins.forEach((coin, i) => {
        const r = i + 1;
        trace.group = `Allow coin ${coin}`;
        for (let a = 0; a <= amount; a++) {
          const without = table[r - 1][a]!;
          const using = a >= coin ? table[r][a - coin]! : 0;
          table[r][a] = without + using;
          trace.add(`Amount ${a}: ${table[r][a]}`, a >= coin ? `Without coin ${coin}: ${without}. With at least one: ${using}. Allowing coins one at a time means each combination is counted once.` : `${coin} is too big for ${a}, so keep the ${without} above.`, scene([r, a], a >= coin ? [[r - 1, a], [r, a - coin]] : [[r - 1, a]]), { tone: using ? 'new' : 'muted' });
        }
      });
      trace.group = undefined;
      const result = table[coins.length][amount]!;
      trace.finish(`${result} combination${result === 1 ? '' : 's'}`, 'Each combination is counted once, because a coin can only follow coins allowed earlier.', scene(undefined, [[coins.length, amount]]), { metrics: [{ label: 'Combinations', value: result, tone: 'done' }] });
      return { frames: trace.frames, answer: result };
    }
    const isMin = goal === 'min';
    const dp = new Array<number>(amount + 1).fill(isMin ? Infinity : 0);
    const via = new Array<number>(amount + 1).fill(0);
    dp[0] = isMin ? 0 : 1;
    const shown = () => dp.map(finish);
    const scene = (at?: number, from?: number, path: number[] = []): Panel[] => [cells(isMin ? 'Fewest coins for each amount' : 'Orderings for each amount', row(shown(), { tone: i => (i === at ? 'active' : i === from ? 'path' : path.includes(i) ? 'done' : undefined) }))];
    trace.add('Start', isMin ? 'Making 0 takes 0 coins. Everything else starts at ∞.' : 'There is one way to make 0: use nothing.', scene(0), { tone: 'muted' });
    for (let a = 1; a <= amount; a++) {
      trace.group = `Amount ${a}`;
      for (const coin of coins) {
        if (coin > a) continue;
        if (isMin) {
          const through = dp[a - coin] + 1;
          const better = through < dp[a];
          if (better) {
            dp[a] = through;
            via[a] = coin;
          }
          trace.add(`Try coin ${coin}`, dp[a - coin] === Infinity ? `${a - coin} can't be made, so neither can ${a} this way.` : `${finish(dp[a - coin])} + 1 = ${through}${better ? ', which is the best so far.' : `, which doesn't beat ${finish(dp[a])}.`}`, scene(a, a - coin), { tone: better ? 'new' : 'muted' });
        } else {
          dp[a] += dp[a - coin];
          trace.add(`Coin ${coin} last: +${dp[a - coin]}`, `Any ordering of ${a - coin}, followed by ${coin}, makes ${a}. The total is now ${dp[a]}.`, scene(a, a - coin), { tone: 'new' });
        }
      }
    }
    trace.group = undefined;
    if (!isMin) {
      trace.finish(`${dp[amount]} ordering${dp[amount] === 1 ? '' : 's'}`, 'Looping over amounts first lets any coin follow any other, so different orders count separately.', scene(amount), { metrics: [{ label: 'Orderings', value: dp[amount], tone: 'done' }] });
      return { frames: trace.frames, answer: dp[amount] };
    }
    if (dp[amount] === Infinity) {
      trace.finish('Impossible', `No mix of these coins makes ${amount}.`, scene(), { tone: 'danger', metrics: [{ label: 'Fewest coins', value: 'None', tone: 'danger' }] });
      return { frames: trace.frames, answer: { count: -1, used: [] } };
    }
    const used: number[] = [];
    const path = [amount];
    for (let a = amount; a > 0; a -= via[a]) {
      used.push(via[a]);
      path.push(a - via[a]);
    }
    trace.finish(counted(dp[amount], 'coin'), `${used.join(' + ') || 'None needed'}. Time: O(amount × coins).`, scene(undefined, undefined, path), { metrics: [{ label: 'Fewest coins', value: dp[amount], tone: 'done' }, { label: 'Coins', value: used.join(' + ') || 'None' }] });
    return { frames: trace.frames, answer: { count: dp[amount], used } };
  },
};

// ---------- Divide and Conquer DP ----------

const divideAndConquerDp: SimulatorDef = {
  fields: [textField('values', 'Positive values', '1, 3, 2, 6, 4'), numberField('groups', 'Groups', 2, 1, 6), choiceField('method', 'Method', [['dc', 'Divide and conquer'], ['plain', 'Try every split']])],
  examples: [
    { title: 'Two groups', about: 'Split the values to make the sum of squared totals as small as possible.', values: { values: '1, 3, 2, 6, 4', groups: '2', method: 'dc' } },
    { title: 'Fewer checks', about: 'Twelve values, with far fewer checks than trying every split.', values: { values: '4, 2, 7, 1, 8, 3, 9, 5, 2, 6, 4, 1', groups: '4', method: 'dc' } },
    { title: 'The plain way', about: 'The same answer, after many more checks.', values: { values: '4, 2, 7, 1, 8, 3, 9, 5, 2, 6, 4, 1', groups: '4', method: 'plain' } },
  ],
  run(input) {
    const items = numbers(input.values, { min: 1, max: 99, minCount: 1, maxCount: 12 });
    const n = items.length;
    const groups = integer(input.groups, 'Groups', 1, 6);
    if (groups > n) throw new Error(`${groups} groups need at least ${groups} values.`);
    const prefix = [0];
    items.forEach(value => prefix.push(prefix.at(-1)! + value));
    const cost = (from: number, to: number) => (prefix[to] - prefix[from]) ** 2;
    const dp = grid<number | null>(groups + 1, n + 1, null);
    const best = grid<number>(groups + 1, n + 1, 0);
    const trace = new Trace();
    let checks = 0;
    const heads = Array.from({ length: n + 1 }, (_, i) => i);
    const rowHead = Array.from({ length: groups + 1 }, (_, i) => i);
    const scene = (active?: Spot, deps?: Spot[], range?: [number, number], path?: Spot[]): Panel[] => [
      cells('Values', row(items, { hideIndex: true, tone: i => (range && i >= range[0] && i < range[1] ? 'accent' : undefined) })),
      dpTable('Smallest cost: groups (rows) by values used (columns)', dp, { rowHead, colHead: heads, corner: 'Groups', active, deps, path }),
    ];
    const metrics = (): Metric[] => [{ label: 'Checks', value: checks }];
    dp[0][0] = 0;
    for (let i = 1; i <= n; i++) dp[1][i] = cost(0, i);
    trace.add('One group', 'With one group, the cost is the square of the total. Everything after this builds on these values.', scene(), { tone: 'muted', metrics: metrics() });
    const tryPoint = (g: number, mid: number, from: number, to: number) => {
      let value = Infinity;
      let pick = -1;
      for (let j = from; j <= Math.min(mid - 1, to); j++) {
        const before = dp[g - 1][j];
        if (before === null) continue;
        checks++;
        const candidate = before + cost(j, mid);
        if (candidate < value) {
          value = candidate;
          pick = j;
        }
      }
      return { value, pick };
    };
    for (let g = 2; g <= groups; g++) {
      trace.group = `${g} groups`;
      if (input.method === 'plain') {
        for (let i = g; i <= n; i++) {
          const { value, pick } = tryPoint(g, i, 0, n - 1);
          dp[g][i] = value;
          best[g][i] = pick;
          trace.add(`First ${i} values: ${value}`, `Every split point was tried. The last group starts at index ${pick}.`, scene([g, i], [[g - 1, pick]], [pick, i]), { tone: 'new', metrics: metrics() });
        }
      } else {
        const solve = (low: number, high: number, optLow: number, optHigh: number) => {
          if (low > high) return;
          const mid = (low + high) >> 1;
          const { value, pick } = tryPoint(g, mid, optLow, optHigh);
          dp[g][mid] = value === Infinity ? null : value;
          best[g][mid] = pick;
          trace.add(`First ${mid} values: ${finish(value)}`, `Only split points ${optLow} to ${Math.min(mid - 1, optHigh)} needed checking, and ${pick} was best. Smaller prefixes split at or before ${pick}, and larger ones at or after it. That is what saves the work.`, scene([g, mid], pick >= 0 ? [[g - 1, pick]] : [], pick >= 0 ? [pick, mid] : undefined), { tone: 'new', metrics: metrics() });
          solve(low, mid - 1, optLow, pick < 0 ? optHigh : pick);
          solve(mid + 1, high, pick < 0 ? optLow : pick, optHigh);
        };
        solve(g, n, g - 1, n - 1);
      }
    }
    trace.group = undefined;
    const parts: number[][] = [];
    const path: Spot[] = [];
    let end = n;
    for (let g = groups; g >= 1; g--) {
      path.push([g, end]);
      const start = g === 1 ? 0 : best[g][end];
      parts.unshift(items.slice(start, end));
      end = start;
    }
    const plain = (() => {
      let count = 0;
      for (let g = 2; g <= groups; g++) for (let i = g; i <= n; i++) count += i - g + 1;
      return count;
    })();
    const answer = dp[groups][n]!;
    trace.finish(`Smallest cost: ${answer}`, `Groups: ${parts.map(part => `[${part.join(', ')}]`).join(', ')}. This took ${checks} checks, where trying every split takes ${plain}. D&C optimization turns O(k × n²) into O(k × n log n), when best split points never move backward.`, scene(undefined, undefined, undefined, path), { metrics: [{ label: 'Cost', value: answer, tone: 'done' }, { label: 'Checks', value: checks }, { label: 'Every split', value: plain }] });
    return { frames: trace.frames, answer: { cost: answer, checks, plain, parts } };
  },
};

// ---------- Edit Distance ----------

const editDistance: SimulatorDef = {
  fields: [textField('a', 'From', 'kitten'), textField('b', 'To', 'sitting'), choiceField('replace', 'Replace costs', [['1', '1 step'], ['2', '2 steps (delete + insert)']])],
  examples: [
    { title: 'kitten to sitting', about: 'Two replacements and one insert.', values: { a: 'kitten', b: 'sitting', replace: '1' } },
    { title: 'horse to ros', about: 'A mix of all three operations.', values: { a: 'horse', b: 'ros', replace: '1' } },
    { title: 'No replacing', about: 'At 2 steps, a replacement costs the same as a delete plus an insert.', values: { a: 'kitten', b: 'sitting', replace: '2' } },
  ],
  run(input) {
    const a = words(input.a, { label: 'the first word', minLength: 0, maxLength: 12 });
    const b = words(input.b, { label: 'the second word', minLength: 0, maxLength: 12 });
    const swapCost = Number(input.replace);
    const table = grid<number | null>(a.length + 1, b.length + 1, null);
    const trace = new Trace();
    const rowHead = ['∅', ...a];
    const colHead = ['∅', ...b];
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[], ops: { text: string; tone?: Tone }[] = []): Panel[] => [dpTable('Steps to turn the start of “From” into the start of “To”', table, { rowHead, colHead, active, deps, path }), logPanel('Operations', ops)];
    for (let i = 0; i <= a.length; i++) table[i][0] = i;
    for (let j = 0; j <= b.length; j++) table[0][j] = j;
    trace.add('Start', 'Turning a word into nothing takes one delete per letter. Turning nothing into a word takes one insert per letter.', scene(), { tone: 'muted' });
    for (let i = 1; i <= a.length; i++) {
      trace.group = `Letter “${a[i - 1]}”`;
      for (let j = 1; j <= b.length; j++) {
        const same = a[i - 1] === b[j - 1];
        if (same) {
          table[i][j] = table[i - 1][j - 1];
          trace.add(`${a[i - 1]} = ${b[j - 1]}: ${table[i][j]}`, 'The letters match, so nothing needs doing. Copy the diagonal.', scene([i, j], [[i - 1, j - 1]]), { tone: 'done' });
        } else {
          const del = table[i - 1][j]! + 1;
          const ins = table[i][j - 1]! + 1;
          const rep = table[i - 1][j - 1]! + swapCost;
          table[i][j] = Math.min(del, ins, rep);
          trace.add(`${a[i - 1]} ≠ ${b[j - 1]}: ${table[i][j]}`, `Delete: ${del}. Insert: ${ins}. Replace: ${rep}. Take the smallest.`, scene([i, j], [[i - 1, j], [i, j - 1], [i - 1, j - 1]]), { tone: 'new' });
        }
      }
    }
    trace.group = undefined;
    const ops: { text: string; tone?: Tone }[] = [];
    const path: Spot[] = [[a.length, b.length]];
    let i = a.length;
    let j = b.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        ops.unshift({ text: `Keep ${a[i - 1]}`, tone: 'muted' });
        i--;
        j--;
      } else if (i > 0 && j > 0 && table[i][j] === table[i - 1][j - 1]! + swapCost) {
        ops.unshift({ text: `Replace ${a[i - 1]} with ${b[j - 1]}`, tone: 'new' });
        i--;
        j--;
      } else if (i > 0 && table[i][j] === table[i - 1][j]! + 1) {
        ops.unshift({ text: `Delete ${a[i - 1]}`, tone: 'danger' });
        i--;
      } else {
        ops.unshift({ text: `Insert ${b[j - 1]}`, tone: 'done' });
        j--;
      }
      path.push([i, j]);
    }
    const distance = table[a.length][b.length]!;
    trace.finish(`Distance: ${distance}`, `Following the path back from the corner gives the operations. Time and memory: O(n × m).`, scene(undefined, undefined, path, ops), { metrics: [{ label: 'Distance', value: distance, tone: 'done' }] });
    return { frames: trace.frames, answer: { distance, ops: ops.map(op => op.text) } };
  },
};

// ---------- Fibonacci ----------

const fibonacciDp: SimulatorDef = {
  fields: [choiceField('method', 'Method', [['table', 'Tabulation'], ['memo', 'Memoization'], ['naive', 'Plain recursion'], ['space', 'Two variables']]), numberField('n', 'n', 7, 0, 40)],
  examples: [
    { title: 'Plain recursion', about: 'The same values get worked out again and again.', values: { method: 'naive', n: '6' } },
    { title: 'Memoization', about: 'Each value is worked out once, and then read back.', values: { method: 'memo', n: '6' } },
    { title: 'Tabulation', about: 'Fill from the bottom up, with no recursion.', values: { method: 'table', n: '12' } },
    { title: 'Two variables', about: 'Only the last two values are ever needed.', values: { method: 'space', n: '12' } },
  ],
  run(input) {
    const n = integer(input.n, 'n', 0, 40);
    const method = input.method;
    if (method === 'naive' && n > 8) throw new Error('Plain recursion makes too many calls to draw beyond n = 8. Choose memoization to go higher.');
    if (method === 'memo' && n > 14) throw new Error('Keep n to 14 or below, so the call tree stays readable. Choose tabulation to go higher.');
    const trace = new Trace();
    if (method === 'table' || method === 'space') {
      const values: number[] = [0, 1];
      const show = () => Array.from({ length: n + 1 }, (_, i) => (i < values.length && i <= n ? values[i] : ''));
      let steps = 0;
      const scene = (at?: number): Panel[] => [cells(method === 'space' ? 'Values, with only the last two kept' : 'The table', row(show(), { tone: i => (i === at ? 'new' : at !== undefined && (i === at - 1 || i === at - 2) ? 'path' : method === 'space' && at !== undefined && i < at - 2 ? 'muted' : undefined) }))];
      trace.add('Base cases', 'fib(0) = 0, and fib(1) = 1.', scene(), { tone: 'muted', metrics: [{ label: 'Additions', value: 0 }] });
      for (let i = 2; i <= n; i++) {
        values[i] = values[i - 1] + values[i - 2];
        steps++;
        trace.add(`fib(${i}) = ${values[i]}`, `${values[i - 1]} + ${values[i - 2]} = ${values[i]}.${method === 'space' ? ' Anything older can be forgotten.' : ''}`, scene(i), { tone: 'new', metrics: [{ label: 'Additions', value: steps }, { label: 'Memory', value: method === 'space' ? 2 : i + 1 }] });
      }
      trace.finish(`fib(${n}) = ${values[n]}`, `${counted(steps, 'addition')}: O(n) time, and ${method === 'space' ? 'O(1)' : 'O(n)'} memory.`, scene(n), { metrics: [{ label: 'Result', value: values[n], tone: 'done' }, { label: 'Additions', value: steps }] });
      return { frames: trace.frames, answer: { value: values[n], steps } };
    }
    type Call = BinaryNode & { children: Call[] };
    const root: Call = { id: 'r', label: `fib(${n})`, tone: 'muted', square: true, children: [] };
    const memo = new Map<number, number>();
    const counts = new Map<number, number>();
    let calls = 0;
    let serial = 0;
    let hits = 0;
    const scene = (): Panel[] => [
      treePanel('Calls made', visualTree(root), 'Fibonacci calls'),
      tablePanel(method === 'memo' ? 'Saved values' : 'Times each value was worked out', Array.from({ length: n + 1 }, (_, i) => [i, method === 'memo' ? memo.get(i) ?? '-' : counts.get(i) ?? 0]), { colHead: method === 'memo' ? ['n', 'fib(n)'] : ['n', 'Times'], zone: 'side', tone: (r, c) => (c === 1 && method === 'naive' && (counts.get(r) ?? 0) > 1 ? 'danger' : undefined) }),
    ];
    const metrics = (): Metric[] => [{ label: 'Calls', value: calls }, ...(method === 'memo' ? [{ label: 'Saved answers used', value: hits }] : [])];
    const visit = (k: number, node: Call): number => {
      calls++;
      counts.set(k, (counts.get(k) ?? 0) + 1);
      if (method === 'memo' && memo.has(k)) {
        hits++;
        node.tone = 'path';
        node.sub = `saved ${memo.get(k)}`;
        trace.add(`fib(${k}) is saved`, `It was already worked out as ${memo.get(k)}, so no more calls are needed.`, scene(), { tone: 'path', metrics: metrics() });
        return memo.get(k)!;
      }
      node.tone = 'active';
      trace.add(`Call fib(${k})`, k < 2 ? 'This is a base case.' : `This needs fib(${k - 1}) and fib(${k - 2}).`, scene(), { tone: 'active', metrics: metrics() });
      let value = k;
      if (k >= 2) {
        const left: Call = { id: `c${serial++}`, label: `fib(${k - 1})`, tone: 'muted', square: true, children: [] };
        node.children.push(left);
        const a = visit(k - 1, left);
        const right: Call = { id: `c${serial++}`, label: `fib(${k - 2})`, tone: 'muted', square: true, children: [] };
        node.children.push(right);
        const b = visit(k - 2, right);
        value = a + b;
      }
      memo.set(k, value);
      node.tone = 'done';
      node.sub = `= ${value}`;
      trace.add(`fib(${k}) = ${value}`, method === 'memo' ? 'Save this, so it never has to be worked out again.' : 'Return it to the caller. It isn\'t saved, so it may be worked out again later.', scene(), { tone: 'done', metrics: metrics() });
      return value;
    };
    const value = visit(n, root);
    trace.finish(`fib(${n}) = ${value}`, method === 'memo' ? `Each value was worked out once, which makes this O(n). ${counted(hits, 'call')} used a saved answer.` : `${counted(calls, 'call')} for n = ${n}. This grows about 1.6 times with each step of n: O(2ⁿ), which is what DP avoids.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { value, calls } };
  },
};

// ---------- Longest Common Subsequence ----------

const lcsTable = (a: string, b: string) => {
  const table = grid<number>(a.length + 1, b.length + 1, 0);
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) table[i][j] = a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
  return table;
};

const longestCommonSubsequence: SimulatorDef = {
  fields: [textField('a', 'First', 'ABCBDAB'), textField('b', 'Second', 'BDCABA')],
  examples: [
    { title: 'A short pair', about: 'BCB appears in both, in order.', values: { a: 'ABCB', b: 'BDCB' } },
    { title: 'The textbook pair', about: 'The answer has length 4.', values: { a: 'ABCBDAB', b: 'BDCABA' } },
    { title: 'Nothing in common', about: 'The answer is empty.', values: { a: 'ABC', b: 'XYZ' } },
  ],
  run(input) {
    const a = words(input.a, { label: 'the first text', maxLength: 12 });
    const b = words(input.b, { label: 'the second text', maxLength: 12 });
    const table = grid<number | null>(a.length + 1, b.length + 1, null);
    for (let i = 0; i <= a.length; i++) table[i][0] = 0;
    for (let j = 0; j <= b.length; j++) table[0][j] = 0;
    const trace = new Trace();
    const rowHead = ['∅', ...a];
    const colHead = ['∅', ...b];
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [dpTable('Length of the best common subsequence', table, { rowHead, colHead, active, deps, path })];
    trace.add('Start', 'An empty text has nothing in common with anything, so the first row and column are 0.', scene(), { tone: 'muted' });
    for (let i = 1; i <= a.length; i++) {
      trace.group = `Letter “${a[i - 1]}” of the first text`;
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          table[i][j] = table[i - 1][j - 1]! + 1;
          trace.add(`${a[i - 1]} = ${b[j - 1]}: ${table[i][j]}`, `They match, so extend the diagonal: ${table[i - 1][j - 1]} + 1.`, scene([i, j], [[i - 1, j - 1]]), { tone: 'new' });
        } else {
          table[i][j] = Math.max(table[i - 1][j]!, table[i][j - 1]!);
          trace.add(`${a[i - 1]} ≠ ${b[j - 1]}: ${table[i][j]}`, `They differ, so drop one of them, and keep the better result: the larger of ${table[i - 1][j]} and ${table[i][j - 1]}.`, scene([i, j], [[i - 1, j], [i, j - 1]]), { tone: 'muted' });
        }
      }
    }
    trace.group = 'Walk back to find the letters';
    const letters: string[] = [];
    const path: Spot[] = [];
    let i = a.length;
    let j = b.length;
    while (i > 0 && j > 0) {
      path.push([i, j]);
      if (a[i - 1] === b[j - 1]) {
        letters.unshift(a[i - 1]);
        trace.add(`Keep ${a[i - 1]}`, 'A match means this letter is part of the answer. Move diagonally.', scene(undefined, undefined, path), { tone: 'done' });
        i--;
        j--;
      } else if (table[i - 1][j]! >= table[i][j - 1]!) i--;
      else j--;
    }
    trace.group = undefined;
    const result = letters.join('');
    trace.finish(result ? `“${result}”, length ${result.length}` : 'Nothing in common', `A subsequence keeps its order, but its letters needn't be next to each other. Time and memory: O(n × m).`, scene(undefined, undefined, path), { metrics: [{ label: 'Length', value: result.length, tone: 'done' }, { label: 'Letters', value: result || 'None' }] });
    return { frames: trace.frames, answer: { length: result.length, text: result } };
  },
};

// ---------- Longest Common Substring ----------

const longestCommonSubstring: SimulatorDef = {
  fields: [textField('a', 'First', 'abcdef'), textField('b', 'Second', 'zcdemf')],
  examples: [
    { title: 'A shared run', about: 'cde appears in both, with nothing between the letters.', values: { a: 'abcdef', b: 'zcdemf' } },
    { title: 'Different from LCS', about: 'Here, the longest subsequence would be longer.', values: { a: 'ABCBDAB', b: 'BDCABA' } },
    { title: 'Nothing in common', about: 'Every cell stays at 0.', values: { a: 'abc', b: 'xyz' } },
  ],
  run(input) {
    const a = words(input.a, { label: 'the first text', maxLength: 12 });
    const b = words(input.b, { label: 'the second text', maxLength: 12 });
    const table = grid<number | null>(a.length + 1, b.length + 1, null);
    for (let i = 0; i <= a.length; i++) table[i][0] = 0;
    for (let j = 0; j <= b.length; j++) table[0][j] = 0;
    const trace = new Trace();
    const rowHead = ['∅', ...a];
    const colHead = ['∅', ...b];
    let best = 0;
    let end = 0;
    let bestCell: Spot | undefined;
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [dpTable('Length of the common run ending here', table, { rowHead, colHead, active, deps, path })];
    const metrics = (): Metric[] => [{ label: 'Best length', value: best }, { label: 'Best so far', value: a.slice(end - best, end) || 'None' }];
    trace.add('Start', 'Each cell asks: how long is the matching run that ends exactly at these two letters?', scene(), { tone: 'muted', metrics: metrics() });
    for (let i = 1; i <= a.length; i++) {
      trace.group = `Letter “${a[i - 1]}” of the first text`;
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          table[i][j] = table[i - 1][j - 1]! + 1;
          const better = table[i][j]! > best;
          if (better) {
            best = table[i][j]!;
            end = i;
            bestCell = [i, j];
          }
          trace.add(`${a[i - 1]} = ${b[j - 1]}: ${table[i][j]}`, `The run from the diagonal grows.${better ? ' This is the longest so far.' : ''}`, scene([i, j], [[i - 1, j - 1]]), { tone: better ? 'new' : 'value', metrics: metrics() });
        } else {
          table[i][j] = 0;
          trace.add(`${a[i - 1]} ≠ ${b[j - 1]}: 0`, 'A run must be unbroken, so a mismatch resets to 0. This is where it differs from a subsequence.', scene([i, j]), { tone: 'muted', metrics: metrics() });
        }
      }
    }
    trace.group = undefined;
    const path: Spot[] = bestCell ? Array.from({ length: best }, (_, k) => [bestCell![0] - k, bestCell![1] - k] as Spot) : [];
    const text = a.slice(end - best, end);
    trace.finish(best ? `“${text}”, length ${best}` : 'Nothing in common', 'Unlike the longest common subsequence, the answer here can be anywhere in the table, so the code tracks the best cell. Time: O(n × m).', scene(undefined, undefined, path), { metrics: metrics() });
    return { frames: trace.frames, answer: { length: best, text } };
  },
};

// ---------- Longest Increasing Subsequence ----------

const longestIncreasingSubsequence: SimulatorDef = {
  fields: [textField('values', 'Values', '10, 9, 2, 5, 3, 7, 101, 18', { wide: true }), choiceField('method', 'Method', [['n2', 'DP table: O(n²)'], ['patience', 'Binary search: O(n log n)']])],
  examples: [
    { title: 'The DP table', about: 'Each value looks back at everything before it.', values: { values: '10, 9, 2, 5, 3, 7, 101, 18', method: 'n2' } },
    { title: 'Binary search', about: 'A smaller list of tails gives the same length, faster.', values: { values: '10, 9, 2, 5, 3, 7, 101, 18', method: 'patience' } },
    { title: 'Falling values', about: 'Nothing increases, so the answer is 1.', values: { values: '5, 4, 3, 2, 1', method: 'n2' } },
    { title: 'Equal values', about: 'Strictly increasing means equal values can\'t both count.', values: { values: '2, 2, 2', method: 'patience' } },
  ],
  run(input) {
    const items = numbers(input.values, { minCount: 1, maxCount: 14 });
    const trace = new Trace();
    const n = items.length;
    const previous = new Array<number>(n).fill(-1);
    if (input.method === 'n2') {
      const dp = new Array<number | ''>(n).fill('');
      const scene = (i?: number, j?: number, path: number[] = []): Panel[] => [
        cells('Values', [row(items, { tone: at => (at === i ? 'active' : at === j ? 'path' : path.includes(at) ? 'done' : undefined) }), row(dp, { label: 'Best', hideIndex: true, tone: at => (at === i ? 'new' : path.includes(at) ? 'done' : undefined) })]),
      ];
      for (let i = 0; i < n; i++) {
        trace.group = `Value ${items[i]}`;
        dp[i] = 1;
        trace.add('Start at 1', 'A value alone is an increasing run of length 1.', scene(i), { tone: 'muted' });
        for (let j = 0; j < i; j++) {
          const can = items[j] < items[i];
          const through = (dp[j] as number) + 1;
          const better = can && through > (dp[i] as number);
          if (better) {
            dp[i] = through;
            previous[i] = j;
          }
          trace.add(`Look back at ${items[j]}`, can ? `${items[j]} is smaller, so ${items[i]} can follow it, for a length of ${through}.${better ? ' That is the best so far.' : ''}` : `${items[j]} isn't smaller, so ${items[i]} can't follow it.`, scene(i, j), { tone: better ? 'new' : 'muted' });
        }
      }
      trace.group = undefined;
      const best = Math.max(...(dp as number[]));
      const path: number[] = [];
      for (let at = (dp as number[]).indexOf(best); at >= 0; at = previous[at]) path.unshift(at);
      trace.finish(`Length ${best}`, `One answer: ${path.map(at => items[at]).join(', ')}. Time: O(n²).`, scene(undefined, undefined, path), { metrics: [{ label: 'Length', value: best, tone: 'done' }, { label: 'Values', value: path.map(at => items[at]).join(', ') }] });
      return { frames: trace.frames, answer: { length: best, sequence: path.map(at => items[at]) } };
    }
    const tails: number[] = [];
    const tailIndex: number[] = [];
    let checks = 0;
    const scene = (i?: number, spot?: number, path: number[] = []): Panel[] => [
      cells('Values', row(items, { tone: at => (at === i ? 'active' : path.includes(at) ? 'done' : undefined) })),
      cells('Smallest tail for each length', row(tails, { firstIndex: 1, tone: at => (at === spot ? 'new' : undefined) })),
    ];
    items.forEach((value, i) => {
      let low = 0;
      let high = tails.length;
      while (low < high) {
        const mid = (low + high) >> 1;
        checks++;
        if (tails[mid] < value) low = mid + 1;
        else high = mid;
      }
      const extending = low === tails.length;
      previous[i] = low > 0 ? tailIndex[low - 1] : -1;
      const old = tails[low];
      tails[low] = value;
      tailIndex[low] = i;
      trace.add(extending ? `${value} extends to ${low + 1}` : `${value} replaces ${old}`, extending ? `${value} is larger than every tail, so a longer run now exists.` : `Binary search finds ${old} as the first tail that isn't smaller. A smaller tail is never worse, so ${value} takes its place at length ${low + 1}.`, scene(i, low), { tone: extending ? 'new' : 'accent', metrics: [{ label: 'Length', value: tails.length }, { label: 'Binary search checks', value: checks }] });
    });
    const path: number[] = [];
    for (let at = tailIndex[tails.length - 1]; at >= 0; at = previous[at]) path.unshift(at);
    trace.finish(`Length ${tails.length}`, `One answer: ${path.map(at => items[at]).join(', ')}. The tails list isn't itself the answer, but its length always is. Time: O(n log n).`, scene(undefined, undefined, path), { metrics: [{ label: 'Length', value: tails.length, tone: 'done' }, { label: 'Values', value: path.map(at => items[at]).join(', ') }] });
    return { frames: trace.frames, answer: { length: tails.length, sequence: path.map(at => items[at]) } };
  },
};

// ---------- Longest Palindromic Subsequence ----------

const longestPalindromicSubsequence: SimulatorDef = {
  fields: [textField('text', 'Text', 'character')],
  examples: [
    { title: 'character', about: 'carac reads the same in both directions.', values: { text: 'character' } },
    { title: 'bbbab', about: 'Skipping the a leaves bbbb.', values: { text: 'bbbab' } },
    { title: 'All different', about: 'A single letter is the best possible.', values: { text: 'abcd' } },
  ],
  run(input) {
    const text = words(input.text, { label: 'some text', maxLength: 12 });
    const n = text.length;
    const table = grid<number | null>(n, n, null);
    const trace = new Trace();
    const heads = [...text];
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [dpTable('Longest palindrome inside each range: start (rows) to end (columns)', table, { rowHead: heads, colHead: heads, active, deps, path })];
    trace.group = 'Length 1';
    for (let i = 0; i < n; i++) table[i][i] = 1;
    trace.add('Single letters', 'Every letter alone is a palindrome of length 1.', scene(), { tone: 'muted' });
    for (let length = 2; length <= n; length++) {
      trace.group = `Length ${length}`;
      for (let i = 0; i + length <= n; i++) {
        const j = i + length - 1;
        if (text[i] === text[j]) {
          const inner = length === 2 ? 0 : table[i + 1][j - 1]!;
          table[i][j] = inner + 2;
          trace.add(`${text[i]}…${text[j]}: ${table[i][j]}`, `The ends match, so they wrap whatever is inside: ${inner} + 2.`, scene([i, j], length === 2 ? [] : [[i + 1, j - 1]]), { tone: 'new' });
        } else {
          table[i][j] = Math.max(table[i + 1][j]!, table[i][j - 1]!);
          trace.add(`${text[i]}…${text[j]}: ${table[i][j]}`, `The ends differ, so at least one must go. Keep the better of ${table[i + 1][j]} and ${table[i][j - 1]}.`, scene([i, j], [[i + 1, j], [i, j - 1]]), { tone: 'muted' });
        }
      }
    }
    trace.group = undefined;
    const front: string[] = [];
    const back: string[] = [];
    const path: Spot[] = [];
    let i = 0;
    let j = n - 1;
    while (i <= j) {
      path.push([i, j]);
      if (i === j) {
        front.push(text[i]);
        break;
      }
      if (text[i] === text[j]) {
        front.push(text[i]);
        back.unshift(text[j]);
        i++;
        j--;
      } else if (table[i + 1][j]! >= table[i][j - 1]!) i++;
      else j--;
    }
    const result = [...front, ...back].join('');
    trace.finish(`“${result}”, length ${result.length}`, 'The table fills by range length, because each range depends only on shorter ones. Time and memory: O(n²).', scene(undefined, undefined, path), { metrics: [{ label: 'Length', value: result.length, tone: 'done' }, { label: 'Palindrome', value: result }] });
    return { frames: trace.frames, answer: { length: result.length, text: result } };
  },
};

// ---------- Matrix Chain Multiplication ----------

const matrixChain: SimulatorDef = {
  fields: [textField('dims', 'Dimensions', '40, 20, 30, 10, 30', { wide: true })],
  examples: [
    { title: 'Four matrices', about: 'The grouping changes the cost a lot.', values: { dims: '40, 20, 30, 10, 30' } },
    { title: 'Three matrices', about: 'One grouping costs 4,500, and the other costs 27,000.', values: { dims: '10, 30, 5, 60' } },
    { title: 'Greedy loses', about: 'The cheapest first step doesn\'t give the cheapest total.', values: { dims: '2, 2, 4, 3' } },
  ],
  run(input) {
    const dims = numbers(input.dims, { label: 'dimensions', min: 1, max: 999, minCount: 2, maxCount: 8 });
    const n = dims.length - 1;
    const names = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
    const cost = grid<number | null>(n, n, null);
    const split = grid<number | null>(n, n, null);
    const trace = new Trace();
    const sizes = names.map((name, i) => `${name}: ${dims[i]} × ${dims[i + 1]}`);
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [
      dpTable('Smallest cost for each range', cost, { rowHead: names, colHead: names, active, deps, path }),
      tablePanel('Where to split', split.map(line => line.map(value => (value === null ? null : names[value]))), { rowHead: names, colHead: names, zone: 'side', tone: (r, c) => (active && active[0] === r && active[1] === c ? 'new' : undefined) }),
      logPanel('The matrices', sizes),
    ];
    for (let i = 0; i < n; i++) cost[i][i] = 0;
    trace.group = 'One matrix';
    trace.add('Single matrices', 'A single matrix needs no multiplying, so the diagonal is 0.', scene(), { tone: 'muted' });
    for (let length = 2; length <= n; length++) {
      trace.group = `${length} matrices`;
      for (let i = 0; i + length <= n; i++) {
        const j = i + length - 1;
        let best = Infinity;
        for (let k = i; k < j; k++) {
          const left = cost[i][k]!;
          const right = cost[k + 1][j]!;
          const join = dims[i] * dims[k + 1] * dims[j + 1];
          const total = left + right + join;
          const better = total < best;
          if (better) {
            best = total;
            cost[i][j] = total;
            split[i][j] = k;
          }
          trace.add(`${names[i]}..${names[j]}, split after ${names[k]}: ${total}`, `Left ${left} + right ${right} + joining them ${dims[i]} × ${dims[k + 1]} × ${dims[j + 1]} = ${total}.${better ? ' The best so far.' : ` It doesn't beat ${best}.`}`, scene([i, j], [[i, k], [k + 1, j]]), { tone: better ? 'new' : 'muted' });
        }
      }
    }
    trace.group = undefined;
    const path: Spot[] = [];
    const write = (i: number, j: number): string => {
      path.push([i, j]);
      return i === j ? names[i] : `(${write(i, split[i][j]!)}${write(split[i][j]! + 1, j)})`;
    };
    const order = n > 0 ? write(0, n - 1) : '';
    const best = n > 0 ? cost[0][n - 1]! : 0;
    trace.finish(`Smallest cost: ${best}`, `Multiply as ${order}. It tries each split of each range: O(n³).`, scene(undefined, undefined, path), { metrics: [{ label: 'Multiplications', value: best.toLocaleString('en-US'), tone: 'done' }, { label: 'Order', value: order }] });
    return { frames: trace.frames, answer: { cost: best, order } };
  },
};

// ---------- Memoization vs Tabulation ----------

const memoVsTabulation: SimulatorDef = {
  fields: [
    choiceField('problem', 'Problem', [['grid', 'Paths through a grid'], ['stairs', 'Climb stairs in big steps']]),
    whenChoice(numberField('rows', 'Moves down', 2, 0, 6), 'problem', 'grid'),
    whenChoice(numberField('cols', 'Moves right', 2, 0, 6), 'problem', 'grid'),
    whenChoice(numberField('n', 'Stairs', 12, 0, 20), 'problem', 'stairs'),
    whenChoice(textField('steps', 'Step sizes', '3, 5'), 'problem', 'stairs'),
  ],
  examples: [
    { title: 'A grid', about: 'Both methods fill the same cells, in a different order.', values: { problem: 'grid', rows: '2', cols: '2' } },
    { title: 'Big steps', about: 'Memoization skips stairs that can never be reached.', values: { problem: 'stairs', n: '12', steps: '3, 5' } },
    { title: 'A larger grid', about: 'Tabulation has a simple loop, while memoization has a recursion overhead.', values: { problem: 'grid', rows: '4', cols: '5' } },
  ],
  run(input) {
    const trace = new Trace();
    const isGrid = input.problem === 'grid';
    const rows = isGrid ? integer(input.rows, 'Moves down', 0, 6) + 1 : 1;
    const cols = isGrid ? integer(input.cols, 'Moves right', 0, 6) + 1 : integer(input.n, 'Stairs', 0, 20) + 1;
    const stepSizes = isGrid ? [] : [...new Set(numbers(input.steps, { label: 'step sizes', min: 1, max: 20, maxCount: 4 }))];
    const depends = (r: number, c: number): Spot[] => (isGrid ? [[r - 1, c] as Spot, [r, c - 1] as Spot].filter(([a, b]) => a >= 0 && b >= 0) : stepSizes.map(step => [0, c - step] as Spot).filter(([, b]) => b >= 0));
    const isBase = (r: number, c: number) => (isGrid ? r === 0 && c === 0 : c === 0);
    const heads = Array.from({ length: cols }, (_, i) => i);
    const rowHeads = Array.from({ length: rows }, (_, i) => i);
    const metricsFor = (work: number, memory: number, label: string): Metric[] => [{ label, value: work }, { label: 'Cells filled', value: memory }];
    const view = (table: (number | null)[][], active: Spot | undefined, deps: Spot[] | undefined, title: string, stack?: string[]): Panel[] => [
      dpTable(title, table, { rowHead: isGrid ? rowHeads : ['Ways'], colHead: heads, active, deps }),
      ...(stack ? [logPanel('Waiting calls', stack.length ? [...stack].reverse() : [])] : []),
    ];
    const name = (r: number, c: number) => (isGrid ? `paths(${r}, ${c})` : `ways(${c})`);

    trace.group = 'Top down: memoization';
    const memo = grid<number | null>(rows, cols, null);
    const stack: string[] = [];
    let calls = 0;
    let filledMemo = 0;
    let peak = 0;
    const solve = (r: number, c: number): number => {
      calls++;
      if (memo[r][c] !== null) {
        trace.add(`${name(r, c)} is saved`, `Read the saved value, ${memo[r][c]}.`, view(memo, [r, c], undefined, 'Saved answers', stack), { tone: 'path', metrics: metricsFor(calls, filledMemo, 'Calls') });
        return memo[r][c]!;
      }
      stack.push(name(r, c));
      peak = Math.max(peak, stack.length);
      trace.add(`Call ${name(r, c)}`, isBase(r, c) ? 'This is the base case.' : 'Start from the answer you want, and ask for what it needs.', view(memo, [r, c], depends(r, c), 'Saved answers', stack), { tone: 'active', metrics: metricsFor(calls, filledMemo, 'Calls') });
      const value = isBase(r, c) ? 1 : depends(r, c).reduce((total, [a, b]) => total + solve(a, b), 0);
      memo[r][c] = value;
      filledMemo++;
      stack.pop();
      trace.add(`${name(r, c)} = ${value}`, 'Save it before returning.', view(memo, [r, c], undefined, 'Saved answers', stack), { tone: 'new', metrics: metricsFor(calls, filledMemo, 'Calls') });
      return value;
    };
    const fromMemo = solve(rows - 1, cols - 1);

    trace.group = 'Bottom up: tabulation';
    const table = grid<number | null>(rows, cols, null);
    let filled = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const deps = depends(r, c);
        table[r][c] = isBase(r, c) ? 1 : deps.reduce((total, [a, b]) => total + table[a][b]!, 0);
        filled++;
        trace.add(`${name(r, c)} = ${table[r][c]}`, isBase(r, c) ? 'Start with the base case.' : 'Everything this cell needs is already filled, because of the loop order.', view(table, [r, c], deps, 'The table'), { tone: 'new', metrics: metricsFor(filled, filled, 'Loop steps') });
      }
    }
    trace.group = undefined;
    const fromTable = table[rows - 1][cols - 1]!;
    const total = rows * cols;
    trace.finish(`Both give ${fromMemo}`, `Memoization made ${calls} calls, and filled ${filledMemo} of ${total} cells, with up to ${peak} calls waiting. Tabulation ran ${filled} loop steps, with no recursion. ${filledMemo < filled ? 'Memoization only touched what it needed, so it skipped some cells.' : 'Here they fill the same cells, and tabulation avoids the recursion overhead.'}`, [
      factsPanel('Side by side', [{ label: 'Memoization: calls', value: calls }, { label: 'Memoization: cells', value: filledMemo }, { label: 'Deepest recursion', value: peak }, { label: 'Tabulation: steps', value: filled }, { label: 'Tabulation: cells', value: filled }], 'main'),
      dpTable('The table', table, { rowHead: isGrid ? rowHeads : ['Ways'], colHead: heads, path: [[rows - 1, cols - 1]] }),
    ], { metrics: [{ label: 'Answer', value: fromMemo, tone: 'done' }] });
    return { frames: trace.frames, answer: { memo: fromMemo, table: fromTable, calls, filledMemo, filled } };
  },
};

// ---------- Min Cost Path ----------

const minCostPath: SimulatorDef = {
  fields: [textField('grid', 'Grid (/ starts a new row)', '1 3 1 / 1 5 1 / 4 2 1', { wide: true }), choiceField('moves', 'Allowed moves', [['two', 'Right and down'], ['three', 'Right, down, and diagonal']])],
  examples: [
    { title: 'The classic', about: 'Going around the 5 costs 7.', values: { grid: '1 3 1 / 1 5 1 / 4 2 1', moves: 'two' } },
    { title: 'With diagonals', about: 'An extra move makes the path cheaper.', values: { grid: '1 3 1 / 1 5 1 / 4 2 1', moves: 'three' } },
    { title: 'A larger grid', about: 'Four rows and four columns.', values: { grid: '1 2 3 4 / 8 7 6 5 / 9 1 1 1 / 9 9 9 1', moves: 'two' } },
  ],
  run(input) {
    const costs = matrix(input.grid, { label: 'the grid', maxRows: 7, maxCols: 7, min: 0 });
    const rows = costs.length;
    const cols = costs[0].length;
    const diagonal = input.moves === 'three';
    const best = grid<number | null>(rows, cols, null);
    const came = grid<Spot | null>(rows, cols, null);
    const trace = new Trace();
    const heads = Array.from({ length: cols }, (_, i) => i);
    const rowHead = Array.from({ length: rows }, (_, i) => i);
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [
      tablePanel('Cost of each cell', costs, { rowHead, colHead: heads, zone: 'side', tone: (r, c) => (active && active[0] === r && active[1] === c ? 'active' : has(path, r, c) ? 'done' : undefined) }),
      dpTable('Cheapest way to reach each cell', best, { rowHead, colHead: heads, active, deps, path }),
    ];
    for (let r = 0; r < rows; r++) {
      trace.group = `Row ${r}`;
      for (let c = 0; c < cols; c++) {
        const options: Spot[] = ([[r - 1, c], [r, c - 1], ...(diagonal ? [[r - 1, c - 1]] : [])] as Spot[]).filter(([a, b]) => a >= 0 && b >= 0);
        if (!options.length) {
          best[r][c] = costs[r][c];
          trace.add(`Start: ${best[r][c]}`, 'The path has to begin here, so it pays this cell\'s cost.', scene([r, c]), { tone: 'new' });
          continue;
        }
        const from = options.reduce((choice, spot) => (best[spot[0]][spot[1]]! < best[choice[0]][choice[1]]! ? spot : choice));
        best[r][c] = best[from[0]][from[1]]! + costs[r][c];
        came[r][c] = from;
        trace.add(`(${r}, ${c}): ${best[r][c]}`, options.length > 1 ? `The cheapest way in costs ${best[from[0]][from[1]]}, plus this cell's ${costs[r][c]}.` : `There is only one way in, costing ${best[from[0]][from[1]]}, plus this cell's ${costs[r][c]}.`, scene([r, c], options), { tone: 'new' });
      }
    }
    trace.group = undefined;
    const path: Spot[] = [];
    for (let spot: Spot | null = [rows - 1, cols - 1]; spot; spot = came[spot[0]][spot[1]]) path.unshift(spot);
    const total = best[rows - 1][cols - 1]!;
    trace.finish(`Cheapest path: ${total}`, `The path has ${counted(path.length, 'cell')}. Time: O(rows × columns).`, scene(undefined, undefined, path), { metrics: [{ label: 'Total cost', value: total, tone: 'done' }, { label: 'Path', value: path.map(([r, c]) => costs[r][c]).join(' + ') }] });
    return { frames: trace.frames, answer: { total, path } };
  },
};

// ---------- Optimal BST ----------

const optimalBst: SimulatorDef = {
  fields: [textField('keys', 'Sorted keys', '10, 12, 20'), textField('freq', 'How often each is searched', '34, 8, 50')],
  examples: [
    { title: 'Three keys', about: 'The most searched key goes on top, for a cost of 142.', values: { keys: '10, 12, 20', freq: '34, 8, 50' } },
    { title: 'Two keys', about: 'The more common key becomes the root.', values: { keys: '10, 12', freq: '34, 50' } },
    { title: 'Four keys', about: 'The result isn\'t always balanced.', values: { keys: '10, 20, 30, 40', freq: '4, 2, 6, 3' } },
    { title: 'Even searches', about: 'With equal counts, the best tree is balanced.', values: { keys: '1, 2, 3, 4, 5, 6, 7', freq: '1, 1, 1, 1, 1, 1, 1' } },
  ],
  run(input) {
    const keys = numbers(input.keys, { label: 'keys', maxCount: 8 });
    const freq = numbers(input.freq, { label: 'search counts', min: 0, max: 999, maxCount: 8 });
    if (keys.length !== freq.length) throw new Error('Give one search count for each key.');
    for (let i = 1; i < keys.length; i++) if (keys[i] <= keys[i - 1]) throw new Error('The keys must be sorted, with no repeats.');
    const n = keys.length;
    const cost = grid<number | null>(n, n, null);
    const root = grid<number | null>(n, n, null);
    const trace = new Trace();
    const sum = (i: number, j: number) => freq.slice(i, j + 1).reduce((a, b) => a + b, 0);
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [
      dpTable('Smallest search cost for each range of keys', cost, { rowHead: keys, colHead: keys, active, deps, path }),
      tablePanel('Best root for each range', root.map(line => line.map(value => (value === null ? null : keys[value]))), { rowHead: keys, colHead: keys, zone: 'side', tone: (r, c) => (active && active[0] === r && active[1] === c ? 'new' : undefined) }),
    ];
    trace.group = 'One key';
    for (let i = 0; i < n; i++) {
      cost[i][i] = freq[i];
      root[i][i] = i;
    }
    trace.add('Single keys', 'A tree with one key costs its search count, since it is found at depth 1.', scene(), { tone: 'muted' });
    for (let length = 2; length <= n; length++) {
      trace.group = `${length} keys`;
      for (let i = 0; i + length <= n; i++) {
        const j = i + length - 1;
        const weight = sum(i, j);
        let best = Infinity;
        for (let r = i; r <= j; r++) {
          const left = r > i ? cost[i][r - 1]! : 0;
          const right = r < j ? cost[r + 1][j]! : 0;
          const total = left + right + weight;
          const better = total < best;
          if (better) {
            best = total;
            cost[i][j] = total;
            root[i][j] = r;
          }
          const deps: Spot[] = [...(r > i ? [[i, r - 1] as Spot] : []), ...(r < j ? [[r + 1, j] as Spot] : [])];
          trace.add(`${keys[i]}..${keys[j]}, root ${keys[r]}: ${total}`, `Left ${left} + right ${right} + ${weight}. Every key in this range sits one level lower under a new root, so its whole search count is added once more.${better ? ' The best so far.' : ''}`, scene([i, j], deps), { tone: better ? 'new' : 'muted' });
        }
      }
    }
    trace.group = undefined;
    const path: Spot[] = [];
    const build = (i: number, j: number): BinaryNode | null => {
      if (i > j) return null;
      path.push([i, j]);
      const r = root[i][j]!;
      return { id: `k${r}`, label: String(keys[r]), sub: `×${freq[r]}`, tone: 'done', left: build(i, r - 1), right: build(r + 1, j) };
    };
    const tree = build(0, n - 1);
    const total = cost[0][n - 1]!;
    trace.finish(`Smallest cost: ${total}`, 'Each key costs its search count times its depth, and this tree makes that total as small as possible. Time: O(n³).', [treePanel('The best tree', visualTree(tree), 'Optimal search tree'), ...scene(undefined, undefined, path)], { metrics: [{ label: 'Cost', value: total, tone: 'done' }, { label: 'Root', value: keys[root[0][n - 1]!] }] });
    return { frames: trace.frames, answer: { cost: total, root: keys[root[0][n - 1]!] } };
  },
};

// ---------- Subset sum, shared by two topics ----------

function subsetSumRun(items: number[], target: number, intro: string, doneYes: (used: number[]) => string, doneNo: string) {
  const table = [[true, ...new Array<boolean>(target).fill(false)] as (boolean | null)[], ...grid<boolean | null>(items.length, target + 1, null)];
  const trace = new Trace();
  const rowHead = ['None', ...items];
  const colHead = Array.from({ length: target + 1 }, (_, i) => i);
  const show = () => table.map(line => line.map(value => (value === null ? null : value ? 'T' : 'F')));
  const scene = (active?: Spot, deps?: Spot[], path?: Spot[]): Panel[] => [
    tablePanel('Can this sum be made? Values allowed (rows) by sum (columns)', show(), {
      rowHead, colHead, legend,
      tone: (r, c) => {
        if (active && active[0] === r && active[1] === c) return 'active';
        if (has(path, r, c)) return 'done';
        if (has(deps, r, c)) return 'path';
        return table[r][c] === null ? 'muted' : table[r][c] ? 'value' : undefined;
      },
    }),
  ];
  trace.add('Start', intro, scene(), { tone: 'muted' });
  items.forEach((value, i) => {
    const r = i + 1;
    trace.group = `Allow ${value}`;
    for (let s = 0; s <= target; s++) {
      const without = table[r - 1][s]!;
      const using = s >= value ? table[r - 1][s - value]! : false;
      table[r][s] = without || using;
      trace.add(`Sum ${s}: ${table[r][s] ? 'yes' : 'no'}`, s < value ? `${value} is larger than ${s}, so copy the answer above.` : without ? 'It could already be made without this value.' : using ? `Taking ${value} leaves ${s - value}, which could be made.` : `Neither leaving ${value} nor taking it works.`, scene([r, s], s >= value ? [[r - 1, s], [r - 1, s - value]] : [[r - 1, s]]), { tone: table[r][s] ? 'new' : 'muted' });
    }
  });
  trace.group = undefined;
  const possible = table[items.length][target]!;
  const used: number[] = [];
  const path: Spot[] = [];
  if (possible) {
    let s = target;
    for (let r = items.length; r > 0; r--) {
      path.push([r, s]);
      if (!table[r - 1][s]) {
        used.unshift(items[r - 1]);
        s -= items[r - 1];
      }
    }
    path.push([0, s]);
  }
  trace.finish(possible ? 'Yes' : 'No', possible ? doneYes(used) : doneNo, scene(undefined, undefined, path), { tone: possible ? 'done' : 'danger', metrics: [{ label: 'Possible', value: possible ? 'Yes' : 'No', tone: possible ? 'done' : 'danger' }, ...(possible ? [{ label: 'Values used', value: used.join(' + ') || 'None' }] : [])] });
  return { frames: trace.frames, answer: { possible, used } };
}

const partitionProblem: SimulatorDef = {
  fields: [textField('values', 'Values', '1, 5, 11, 5')],
  examples: [
    { title: 'It can be split', about: '{1, 5, 5} and {11} both add up to 11.', values: { values: '1, 5, 11, 5' } },
    { title: 'It can\'t', about: 'The total is odd, so no equal split exists.', values: { values: '1, 2, 3, 5' } },
    { title: 'An even total that fails', about: 'The total is 12, but no subset makes 6.', values: { values: '1, 1, 10' } },
  ],
  run(input) {
    const items = numbers(input.values, { min: 1, max: 99, minCount: 1, maxCount: 8 });
    const total = items.reduce((a, b) => a + b, 0);
    if (total % 2) {
      const trace = new Trace();
      trace.finish('No', `The total is ${total}, which is odd, so it can't split into two equal halves. No table is needed.`, [cells('Values', row(items, { hideIndex: true }))], { tone: 'danger', metrics: [{ label: 'Total', value: total }, { label: 'Possible', value: 'No', tone: 'danger' }] });
      return { frames: trace.frames, answer: { possible: false, used: [] } };
    }
    const half = total / 2;
    if (half > 40) throw new Error(`The total is ${total}, so half of it is ${half}, which is too wide for the table. Keep the total to 80 or below.`);
    return subsetSumRun(items, half, `The total is ${total}. If some values add up to ${half}, the rest must too. So this is subset sum, with a target of ${half}.`, used => {
      const rest = [...items];
      used.forEach(value => rest.splice(rest.indexOf(value), 1));
      return `{${used.join(', ')}} and {${rest.join(', ')}} each add up to ${half}. Time: O(n × sum).`;
    }, `No subset adds up to ${half}, so no equal split exists.`);
  },
};

const subsetSum: SimulatorDef = {
  fields: [textField('values', 'Positive values', '3, 34, 4, 12, 5, 2'), numberField('target', 'Target', 9, 0, 40)],
  examples: [
    { title: 'It can be made', about: '4 and 5 add up to 9.', values: { values: '3, 34, 4, 12, 5, 2', target: '9' } },
    { title: 'It can\'t', about: 'Every value is needed for 26, and 34 is too big.', values: { values: '3, 34, 4, 12, 5, 2', target: '30' } },
    { title: 'A target of zero', about: 'The empty set always works.', values: { values: '2, 4', target: '0' } },
  ],
  run(input) {
    const items = numbers(input.values, { min: 1, max: 999, minCount: 1, maxCount: 8 });
    const target = integer(input.target, 'Target', 0, 40);
    return subsetSumRun(items, target, 'A sum of 0 can always be made, by taking nothing. With no values, nothing else can.', used => `${used.join(' + ') || 'Taking nothing'} makes ${target}. Time: O(n × target), which depends on how large the target is.`, `No subset adds up to ${target}.`);
  },
};

// ---------- Rod Cutting ----------

const rodCutting: SimulatorDef = {
  fields: [textField('prices', 'Prices for lengths 1, 2, 3…', '1, 5, 8, 9, 10, 17, 17, 20', { wide: true }), numberField('length', 'Rod length', 8, 1, 16), numberField('cut', 'Cost per cut', 0, 0, 99)],
  examples: [
    { title: 'The classic', about: 'Lengths 2 and 6 earn 22.', values: { prices: '1, 5, 8, 9, 10, 17, 17, 20', length: '8', cut: '0' } },
    { title: 'Short rod', about: 'Two pieces of length 2 beat one of length 4.', values: { prices: '1, 5, 8, 9', length: '4', cut: '0' } },
    { title: 'Costly cuts', about: 'A cost per cut makes fewer pieces better.', values: { prices: '1, 5, 8, 9', length: '4', cut: '2' } },
  ],
  run(input) {
    const prices = numbers(input.prices, { label: 'prices', min: 0, max: 999, maxCount: 16 });
    const length = integer(input.length, 'Rod length', 1, 16);
    const cutCost = integer(input.cut, 'Cost per cut', 0, 99);
    if (prices.length < length) throw new Error(`A rod of length ${length} needs prices for lengths up to ${length}.`);
    const best = new Array<number | ''>(length + 1).fill('');
    const first = new Array<number>(length + 1).fill(0);
    best[0] = 0;
    const trace = new Trace();
    const scene = (at?: number, from?: number, piece?: number, path: number[] = []): Panel[] => [
      tablePanel('Prices', [prices.slice(0, length)], { rowHead: ['Price'], colHead: Array.from({ length }, (_, i) => i + 1), tone: (_, c) => (c + 1 === piece ? 'accent' : undefined) }),
      cells('Best income for each length', row(best, { tone: i => (i === at ? 'active' : i === from ? 'path' : path.includes(i) ? 'done' : undefined) })),
    ];
    trace.add('Start', 'A rod of length 0 earns nothing.', scene(0), { tone: 'muted' });
    for (let j = 1; j <= length; j++) {
      trace.group = `Length ${j}`;
      let top = -Infinity;
      for (let i = 1; i <= j; i++) {
        const rest = best[j - i] as number;
        const total = prices[i - 1] + rest - (i < j ? cutCost : 0);
        const better = total > top;
        if (better) {
          top = total;
          best[j] = total;
          first[j] = i;
        }
        trace.add(`First piece ${i}: ${total}`, `Sell ${i} for ${prices[i - 1]}, plus the best for the remaining ${j - i}, which is ${rest}${i < j && cutCost ? `, minus ${cutCost} for the cut` : ''}.${better ? ' The best so far.' : ''}`, scene(j, j - i, i), { tone: better ? 'new' : 'muted' });
      }
    }
    trace.group = undefined;
    const pieces: number[] = [];
    const path: number[] = [length];
    for (let j = length; j > 0; j -= first[j]) {
      pieces.push(first[j]);
      path.push(j - first[j]);
    }
    const income = best[length] as number;
    trace.finish(`Best income: ${income}`, `Cut into pieces of ${pieces.join(', ')}. Each length tries each first piece: O(n²).`, scene(undefined, undefined, undefined, path), { metrics: [{ label: 'Income', value: income, tone: 'done' }, { label: 'Pieces', value: pieces.join(', ') }] });
    return { frames: trace.frames, answer: { income, pieces } };
  },
};

// ---------- Shortest Common Supersequence ----------

const shortestCommonSupersequence: SimulatorDef = {
  fields: [textField('a', 'First', 'abac'), textField('b', 'Second', 'cab')],
  examples: [
    { title: 'A short pair', about: 'cabac contains both, and has length 5.', values: { a: 'abac', b: 'cab' } },
    { title: 'Overlapping', about: 'Letters in common are only written once.', values: { a: 'AGGTAB', b: 'GXTXAYB' } },
    { title: 'Nothing shared', about: 'With no shared letters, the answer is both in full.', values: { a: 'abc', b: 'xyz' } },
  ],
  run(input) {
    const a = words(input.a, { label: 'the first text', maxLength: 12 });
    const b = words(input.b, { label: 'the second text', maxLength: 12 });
    const table = grid<number | null>(a.length + 1, b.length + 1, null);
    for (let i = 0; i <= a.length; i++) table[i][0] = i;
    for (let j = 0; j <= b.length; j++) table[0][j] = j;
    const trace = new Trace();
    const rowHead = ['∅', ...a];
    const colHead = ['∅', ...b];
    const scene = (active?: Spot, deps?: Spot[], path?: Spot[], built: string[] = []): Panel[] => [
      dpTable('Length of the shortest text containing both', table, { rowHead, colHead, active, deps, path }),
      cells('The answer, built from the end', row(built, { hideIndex: true, tone: () => 'done' })),
    ];
    trace.add('Start', 'If one text is empty, the answer is just the other text, so the first row and column count up.', scene(), { tone: 'muted' });
    for (let i = 1; i <= a.length; i++) {
      trace.group = `Letter “${a[i - 1]}” of the first text`;
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          table[i][j] = table[i - 1][j - 1]! + 1;
          trace.add(`${a[i - 1]} = ${b[j - 1]}: ${table[i][j]}`, 'A shared letter only needs writing once.', scene([i, j], [[i - 1, j - 1]]), { tone: 'new' });
        } else {
          table[i][j] = Math.min(table[i - 1][j]!, table[i][j - 1]!) + 1;
          trace.add(`${a[i - 1]} ≠ ${b[j - 1]}: ${table[i][j]}`, `Both letters must appear, so write one, and solve the rest: the smaller of ${table[i - 1][j]} and ${table[i][j - 1]}, plus 1.`, scene([i, j], [[i - 1, j], [i, j - 1]]), { tone: 'muted' });
        }
      }
    }
    trace.group = 'Walk back to write the answer';
    const built: string[] = [];
    const path: Spot[] = [[a.length, b.length]];
    let i = a.length;
    let j = b.length;
    while (i > 0 || j > 0) {
      let letter: string;
      let why: string;
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        letter = a[i - 1];
        why = 'Both texts share this letter, so move diagonally.';
        i--;
        j--;
      } else if (j === 0 || (i > 0 && table[i - 1][j]! <= table[i][j - 1]!)) {
        letter = a[i - 1];
        why = 'This letter comes from the first text.';
        i--;
      } else {
        letter = b[j - 1];
        why = 'This letter comes from the second text.';
        j--;
      }
      built.unshift(letter);
      path.push([i, j]);
      trace.add(`Write ${letter}`, why, scene(undefined, undefined, path, built), { tone: 'done' });
    }
    trace.group = undefined;
    const text = built.join('');
    const lcs = lcsTable(a, b)[a.length][b.length];
    trace.finish(`“${text}”, length ${text.length}`, `Its length is n + m - LCS = ${a.length} + ${b.length} - ${lcs} = ${a.length + b.length - lcs}. Time and memory: O(n × m).`, scene(undefined, undefined, path, built), { metrics: [{ label: 'Length', value: text.length, tone: 'done' }, { label: 'Text', value: text }] });
    return { frames: trace.frames, answer: { length: text.length, text } };
  },
};

// ---------- Unbounded Knapsack ----------

const unboundedKnapsack: SimulatorDef = {
  fields: [textField('items', 'Items, as name(weight, value)', 'A(1,10), B(3,40), C(4,50), D(5,70)', { wide: true }), numberField('capacity', 'Capacity', 8, 1, 30)],
  examples: [
    { title: 'Four items', about: 'B and D together give 110.', values: { items: 'A(1,10), B(3,40), C(4,50), D(5,70)', capacity: '8' } },
    { title: 'Repeating one item', about: 'Two copies of the same item is allowed here.', values: { items: 'A(2,3), B(3,4)', capacity: '6' } },
    { title: 'Nothing fits', about: 'Every item is too heavy.', values: { items: 'A(5,10)', capacity: '3' } },
  ],
  run(input) {
    const list = records(input.items, { label: 'the items', parts: 2, example: 'A(1,10), B(3,40)', maxCount: 8, min: 1, max: 999 }).map(item => ({ name: item.name, weight: item.values[0], value: item.values[1] }));
    const capacity = integer(input.capacity, 'Capacity', 1, 30);
    const best = new Array<number>(capacity + 1).fill(0);
    const pick = new Array<number>(capacity + 1).fill(-1);
    const trace = new Trace();
    const scene = (at?: number, from?: number, path: number[] = []): Panel[] => [
      cells('Best value for each capacity', row(best, { tone: i => (i === at ? 'active' : i === from ? 'path' : path.includes(i) ? 'done' : undefined) })),
      tablePanel('Items', list.map(item => [item.name, item.weight, item.value]), { colHead: ['Item', 'Weight', 'Value'], zone: 'side' }),
    ];
    trace.add('Start', 'A capacity of 0 holds nothing.', scene(0), { tone: 'muted' });
    for (let c = 1; c <= capacity; c++) {
      trace.group = `Capacity ${c}`;
      list.forEach((item, i) => {
        if (item.weight > c) return;
        const through = best[c - item.weight] + item.value;
        const better = through > best[c];
        if (better) {
          best[c] = through;
          pick[c] = i;
        }
        trace.add(`Try ${item.name}: ${through}`, `${best[c - item.weight]} + ${item.value} = ${through}. Index ${c - item.weight} may already include ${item.name}, which is fine here, since items can repeat.${better ? ' The best so far.' : ''}`, scene(c, c - item.weight), { tone: better ? 'new' : 'muted' });
      });
    }
    trace.group = undefined;
    const used: string[] = [];
    const path = [capacity];
    let c = capacity;
    while (c > 0) {
      if (pick[c] < 0) {
        c--;
        path.push(c);
      } else {
        used.push(list[pick[c]].name);
        c -= list[pick[c]].weight;
        path.push(c);
      }
    }
    trace.finish(`Best value: ${best[capacity]}`, `Take ${used.join(', ') || 'nothing'}. Going left to right lets an item repeat, which is the only difference from the 0/1 version. Time: O(n × W).`, scene(undefined, undefined, path), { metrics: [{ label: 'Best value', value: best[capacity], tone: 'done' }, { label: 'Items', value: used.join(', ') || 'None' }] });
    return { frames: trace.frames, answer: { best: best[capacity], used } };
  },
};

// ---------- Weighted Job Scheduling ----------

const weightedJobScheduling: SimulatorDef = {
  fields: [textField('jobs', 'Jobs, as name(start, finish, profit)', 'A(3,5,20), B(1,2,50), C(6,19,100), D(2,100,200)', { wide: true })],
  examples: [
    { title: 'A long, valuable job', about: 'B and D together beat the three shorter jobs.', values: { jobs: 'A(3,5,20), B(1,2,50), C(6,19,100), D(2,100,200)' } },
    { title: 'Greedy would fail', about: 'The most profitable job isn\'t part of the best plan.', values: { jobs: 'A(1,4,30), B(3,6,50), C(5,8,30)' } },
    { title: 'No overlaps', about: 'Every job fits, so take them all.', values: { jobs: 'A(1,2,5), B(2,3,6), C(3,4,7)' } },
  ],
  run(input) {
    const list = records(input.jobs, { label: 'the jobs', parts: 3, example: 'A(3,5,20), B(1,2,50)', maxCount: 10, min: 0, max: 999 }).map(job => ({ name: job.name, start: job.values[0], end: job.values[1], profit: job.values[2] }));
    for (const job of list) if (job.end <= job.start) throw new Error(`${job.name} must finish after it starts.`);
    const sorted = [...list].sort((a, b) => a.end - b.end || a.start - b.start);
    const n = sorted.length;
    const from = Math.min(...list.map(job => job.start));
    const to = Math.max(...list.map(job => job.end));
    const dp = new Array<number | ''>(n + 1).fill('');
    dp[0] = 0;
    const lastFit = new Array<number>(n + 1).fill(0);
    const takes = new Array<boolean>(n + 1).fill(false);
    const trace = new Trace();
    const scene = (at?: number, fit?: number, chosen: number[] = []): Panel[] => [
      { kind: 'timeline', title: 'Jobs, sorted by finish time', from, to, rows: sorted.map((job, i) => ({ label: job.name, start: job.start, end: job.end, sub: String(job.profit), tone: i + 1 === at ? 'active' : i + 1 === fit ? 'path' : chosen.includes(i) ? 'done' : 'muted' })), legend: [{ tone: 'active', label: 'This job' }, { tone: 'path', label: 'Last job that fits' }, { tone: 'done', label: 'Chosen' }] },
      cells('Best profit using the first j jobs', row(dp, { tone: i => (i === at ? 'new' : i === fit ? 'path' : undefined) })),
    ];
    trace.add('Sort by finish time', 'Then each job only has to look back at jobs that finish before it starts.', scene(), { tone: 'muted' });
    for (let j = 1; j <= n; j++) {
      const job = sorted[j - 1];
      let low = 0;
      let high = j - 1;
      while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (sorted[mid - 1].end <= job.start) low = mid;
        else high = mid - 1;
      }
      lastFit[j] = low;
      const take = job.profit + (dp[low] as number);
      const leave = dp[j - 1] as number;
      takes[j] = take > leave;
      dp[j] = Math.max(take, leave);
      trace.add(`${job.name}: ${dp[j]}`, `Binary search finds that ${low ? `${sorted[low - 1].name} is the last job finishing by ${job.start}` : 'no earlier job fits'}. Take it: ${job.profit} + ${dp[low]} = ${take}. Leave it: ${leave}.`, scene(j, low), { tone: takes[j] ? 'new' : 'muted' });
    }
    const chosen: number[] = [];
    for (let j = n; j > 0;) {
      if (takes[j]) {
        chosen.unshift(j - 1);
        j = lastFit[j];
      } else j--;
    }
    const total = dp[n] as number;
    trace.finish(`Best profit: ${total}`, `Do ${chosen.map(i => sorted[i].name).join(', ')}. Sorting and binary search make this O(n log n).`, scene(undefined, undefined, chosen), { metrics: [{ label: 'Profit', value: total, tone: 'done' }, { label: 'Jobs', value: chosen.map(i => sorted[i].name).join(', ') }] });
    return { frames: trace.frames, answer: { total, jobs: chosen.map(i => sorted[i].name) } };
  },
};


export const simulators: Record<string, SimulatorDef> = {
  '0-1-knapsack': zeroOneKnapsack,
  'assembly-line-scheduling': assemblyLine,
  'coin-change': coinChange,
  'divide-and-conquer-dp': divideAndConquerDp,
  'edit-distance': editDistance,
  'fibonacci-dp': fibonacciDp,
  'longest-common-subsequence': longestCommonSubsequence,
  'longest-common-substring': longestCommonSubstring,
  'longest-increasing-subsequence': longestIncreasingSubsequence,
  'longest-palindromic-subsequence': longestPalindromicSubsequence,
  'matrix-chain-multiplication': matrixChain,
  'memoization-vs-tabulation': memoVsTabulation,
  'min-cost-path': minCostPath,
  'optimal-bst': optimalBst,
  'partition-problem': partitionProblem,
  'rod-cutting': rodCutting,
  'shortest-common-supersequence': shortestCommonSupersequence,
  'subset-sum': subsetSum,
  'unbounded-knapsack': unboundedKnapsack,
  'weighted-job-scheduling': weightedJobScheduling,
};
