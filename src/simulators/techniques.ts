import { counted, bars, cells, choiceField, factsPanel, graph, integer, logPanel, nodeIn, numberField, numbers, records, row, seededRandom, stackPanel, tablePanel, textField, Trace, treePanel, visualForest, visualTree, whenChoice, type BinaryNode, type Metric, type Panel, type SimulatorDef, type Tone } from './kit.ts';

// ---------- Activity Selection ----------

const ACTIVITY_RULES: Record<string, { label: string; key: (a: { start: number; end: number }) => number; why: string }> = {
  finish: { label: 'Earliest finish', key: a => a.end, why: 'Finishing early leaves the most room for everything else. This rule is proven optimal.' },
  start: { label: 'Earliest start', key: a => a.start, why: 'Starting early sounds sensible, but one long activity can block many short ones.' },
  shortest: { label: 'Shortest first', key: a => a.end - a.start, why: 'Short activities sound cheap, but one can overlap two others that would fit together.' },
};

const activitySelection: SimulatorDef = {
  fields: [
    textField('items', 'Activities, as name(start, finish)', 'A(1,4), B(3,5), C(0,6), D(5,7), E(3,9), F(6,10), G(8,11), H(2,14), I(12,16)', { wide: true }),
    choiceField('rule', 'Greedy rule', Object.entries(ACTIVITY_RULES).map(([key, item]) => [key, item.label])),
  ],
  examples: [
    { title: 'Earliest finish', about: 'The rule that always gives the most activities.', values: { rule: 'finish' } },
    { title: 'Earliest start fails', about: 'One long activity blocks all the others.', values: { items: 'L(0,10), A(1,2), B(3,4), C(5,6)', rule: 'start' } },
    { title: 'Shortest first fails', about: 'The short one overlaps both long ones.', values: { items: 'A(0,5), B(4,6), C(5,10)', rule: 'shortest' } },
  ],
  run(input) {
    const list = records(input.items, { label: 'the activities', parts: 2, example: 'A(1,4), B(3,5)', maxCount: 14, min: 0, max: 200 }).map(item => ({ name: item.name, start: item.values[0], end: item.values[1] }));
    for (const item of list) if (item.end <= item.start) throw new Error(`${item.name} must finish after it starts.`);
    const rule = ACTIVITY_RULES[input.rule];
    const sorted = [...list].sort((a, b) => rule.key(a) - rule.key(b) || a.start - b.start);
    const chosen: typeof list = [];
    const skipped: typeof list = [];
    const trace = new Trace();
    const from = Math.min(...list.map(item => item.start));
    const to = Math.max(...list.map(item => item.end));
    const scene = (active?: (typeof list)[number], tone: Tone = 'active'): Panel[] => [
      { kind: 'timeline', title: 'Activities over time', from, to, legend: [{ tone: 'active', label: 'Checking' }, { tone: 'done', label: 'Chosen' }, { tone: 'danger', label: 'Overlaps' }], rows: sorted.map(item => ({ label: item.name, start: item.start, end: item.end, sub: `${item.start} to ${item.end}`, tone: item === active ? tone : chosen.includes(item) ? 'done' : skipped.includes(item) ? 'danger' : 'muted' })) },
      logPanel('Chosen', chosen.map(item => `${item.name} (${item.start} to ${item.end})`)),
    ];
    const metrics = (): Metric[] => [{ label: 'Chosen', value: chosen.length }, { label: 'Skipped', value: skipped.length }];
    trace.add(`Sort by ${rule.label.toLowerCase()}`, rule.why, scene(), { tone: 'muted', metrics: metrics() });
    for (const item of sorted) {
      const clash = chosen.find(other => item.start < other.end && other.start < item.end);
      if (clash) {
        skipped.push(item);
        trace.add(`Skip ${item.name}`, `It overlaps ${clash.name}, which is already chosen.`, scene(item, 'danger'), { tone: 'danger', metrics: metrics() });
      } else {
        chosen.push(item);
        trace.add(`Take ${item.name}`, 'It doesn\'t overlap anything chosen so far.', scene(item, 'done'), { tone: 'done', metrics: metrics() });
      }
    }
    // Earliest finish is optimal, so it serves as the yardstick for the other rules.
    let best = 0;
    let lastEnd = -Infinity;
    for (const item of [...list].sort((a, b) => a.end - b.end)) {
      if (item.start >= lastEnd) {
        best++;
        lastEnd = item.end;
      }
    }
    const optimal = chosen.length === best;
    trace.finish(counted(chosen.length, 'activity', 'activities'), optimal ? `${chosen.map(item => item.name).join(', ')}. That is the most possible. Sorting takes the most time: O(n log n).` : `${chosen.map(item => item.name).join(', ')}. The best possible is ${best}, so this rule gave a worse answer.`, scene(), { tone: optimal ? 'done' : 'danger', metrics: [...metrics(), { label: 'Best possible', value: best }] });
    return { frames: trace.frames, answer: { chosen: chosen.map(item => item.name), best } };
  },
};

// ---------- Game trees: Minimax and Alpha-Beta ----------

type GameNode = { id: string; leaf?: number; children: GameNode[]; value?: number | null; tone?: Tone; note?: string; cut?: boolean };

function parseGameTree(text: string): GameNode {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Write the game tree as nested lists, such as [[3,5],[2,9]].');
  }
  let leaves = 0;
  let serial = 0;
  const build = (item: unknown, depth: number): GameNode => {
    const id = `g${serial++}`;
    if (typeof item === 'number' && Number.isInteger(item)) {
      leaves++;
      return { id, leaf: item, children: [] };
    }
    if (!Array.isArray(item) || !item.length) throw new Error('Every part of the tree must be a whole number or a non-empty list.');
    if (depth >= 5) throw new Error('Keep the tree to 5 levels, so it stays readable.');
    return { id, children: item.map(child => build(child, depth + 1)) };
  };
  const root = build(parsed, 0);
  if (!root.children.length) throw new Error('The tree needs at least one move, such as [3,5].');
  if (leaves > 20) throw new Error('Use at most 20 leaves, so the tree stays readable.');
  return root;
}

const gameExamples = {
  small: '[[3,5],[2,9]]',
  classic: '[[[3,5],[6,9]],[[1,2],[0,-1]]]',
  wide: '[[3,12,8],[2,4,6],[14,5,2]]',
};

function runGame(input: Record<string, string>, pruning: boolean) {
  const root = parseGameTree(input.tree);
  const rootMax = input.first === 'max';
  const trace = new Trace();
  let visited = 0;
  let cuts = 0;
  let leafCount = 0;
  const countLeaves = (node: GameNode): number => (node.children.length ? node.children.reduce((total, child) => total + countLeaves(child), 0) : 1);
  const totalLeaves = countLeaves(root);
  const draw = (node: GameNode, isMax: boolean): BinaryNode => {
    const isLeaf = node.leaf !== undefined;
    return {
      id: node.id,
      label: isLeaf ? String(node.leaf) : node.value === undefined || node.value === null ? (isMax ? 'MAX' : 'MIN') : String(node.value),
      sub: node.note ?? (isLeaf ? undefined : isMax ? 'max' : 'min'),
      square: isMax && !isLeaf,
      tone: node.tone ?? 'muted',
      children: node.children.map(child => draw(child, !isMax)),
    };
  };
  const seenLeaves: number[] = [];
  const scene = (): Panel[] => [
    treePanel('The game tree', visualTree(draw(root, rootMax)), 'Game tree', { legend: [{ tone: 'active', label: 'Current' }, { tone: 'done', label: 'Worked out' }, { tone: 'danger', label: 'Skipped' }] }),
    logPanel('Leaves looked at', seenLeaves.map(String)),
  ];
  const metrics = (alpha?: number, beta?: number): Metric[] => [
    { label: 'Leaves looked at', value: `${leafCount} of ${totalLeaves}` },
    ...(pruning ? [{ label: 'Branches skipped', value: cuts }, { label: 'Alpha', value: alpha === undefined || alpha === -Infinity ? '-∞' : alpha }, { label: 'Beta', value: beta === undefined || beta === Infinity ? '∞' : beta }] : []),
  ];
  const markSkipped = (node: GameNode) => {
    node.tone = 'danger';
    node.note = 'skipped';
    node.children.forEach(markSkipped);
  };
  const search = (node: GameNode, isMax: boolean, alpha: number, beta: number): number => {
    visited++;
    if (node.leaf !== undefined) {
      leafCount++;
      seenLeaves.push(node.leaf);
      node.tone = 'done';
      node.value = node.leaf;
      trace.add(`Leaf: ${node.leaf}`, 'A finished game has a known score.', scene(), { tone: 'new', metrics: metrics(alpha, beta) });
      return node.leaf;
    }
    node.tone = 'active';
    trace.add(`${isMax ? 'MAX' : 'MIN'} thinks`, isMax ? 'MAX wants the highest score.' : 'MIN wants the lowest score.', scene(), { tone: 'active', metrics: metrics(alpha, beta) });
    let best = isMax ? -Infinity : Infinity;
    let low = alpha;
    let high = beta;
    for (let i = 0; i < node.children.length; i++) {
      node.tone = 'path';
      const score = search(node.children[i], !isMax, low, high);
      node.tone = 'active';
      const improved = isMax ? score > best : score < best;
      if (improved) best = score;
      node.value = best;
      if (isMax) low = Math.max(low, best);
      else high = Math.min(high, best);
      trace.add(`${isMax ? 'MAX' : 'MIN'} now has ${best}`, improved ? `${score} is ${isMax ? 'better for MAX' : 'better for MIN'} than anything found here so far.${pruning ? ` So ${isMax ? 'alpha' : 'beta'} is ${best}.` : ''}` : `${score} doesn't beat ${best}.`, scene(), { tone: improved ? 'new' : 'muted', metrics: metrics(low, high) });
      if (pruning && low >= high && i < node.children.length - 1) {
        const remaining = node.children.slice(i + 1);
        remaining.forEach(markSkipped);
        cuts += remaining.length;
        trace.add(`Skip ${remaining.length} branch${remaining.length === 1 ? '' : 'es'}`, isMax ? `MAX can already get ${best} here, and MIN has a better choice elsewhere, at ${high}. MIN would never let the game come this way.` : `MIN can already hold this to ${best}, and MAX has a better choice elsewhere, at ${low}. MAX would never let the game come this way.`, scene(), { tone: 'danger', metrics: metrics(low, high) });
        break;
      }
    }
    node.tone = 'done';
    return best;
  };
  const result = search(root, rootMax, -Infinity, Infinity);
  const chosen = root.children.findIndex(child => child.value === result);
  const detail = pruning
    ? `The best score is ${result}. Looking at only ${leafCount} of ${totalLeaves} leaves gave the same answer minimax would give.`
    : `With both players playing their best, the score is ${result}. Move ${chosen + 1} from the top gets there. Minimax looked at all ${totalLeaves} leaves.`;
  trace.finish(`Best score: ${result}`, detail, scene(), { metrics: metrics() });
  return { frames: trace.frames, answer: { result, leaves: leafCount, totalLeaves, cuts, visited } };
}

const gameFields = [
  textField('tree', 'Game tree, as nested lists', gameExamples.classic, { wide: true }),
  choiceField('first', 'First to move', [['max', 'MAX'], ['min', 'MIN']]),
];

const minimax: SimulatorDef = {
  fields: gameFields,
  examples: [
    { title: 'Two choices', about: 'MIN answers each move with the lowest score.', values: { tree: gameExamples.small, first: 'max' } },
    { title: 'Three levels', about: 'Scores rise from the leaves to the root.', values: { tree: gameExamples.classic, first: 'max' } },
    { title: 'Wider choices', about: 'Each player has three options.', values: { tree: gameExamples.wide, first: 'max' } },
    { title: 'MIN goes first', about: 'The same tree can give a different result.', values: { tree: gameExamples.wide, first: 'min' } },
  ],
  run: input => runGame(input, false),
};

const alphaBeta: SimulatorDef = {
  fields: gameFields,
  examples: [
    { title: 'A skipped leaf', about: 'After seeing 2, the 9 can\'t matter.', values: { tree: gameExamples.small, first: 'max' } },
    { title: 'Three levels', about: 'A whole branch can be skipped.', values: { tree: gameExamples.classic, first: 'max' } },
    { title: 'Move order matters', about: 'The same leaves, in a worse order, skip nothing.', values: { tree: '[[1,2],[3,4],[5,6]]', first: 'max' } },
    { title: 'A good order', about: 'The best move comes first, so more can be skipped.', values: { tree: '[[5,6],[3,4],[1,2]]', first: 'max' } },
  ],
  run: input => runGame(input, true),
};

// ---------- Backtracking ----------

const backtracking: SimulatorDef = {
  fields: [
    choiceField('task', 'Generate', [['permutations', 'All orderings'], ['subsets', 'All subsets'], ['combinations', 'All groups of size k']]),
    textField('items', 'Items', '1, 2, 3'),
    whenChoice(numberField('k', 'Size k', 2, 0, 6), 'task', 'combinations'),
  ],
  examples: [
    { title: 'Orderings', about: 'Three items make 6 orderings.', values: { task: 'permutations', items: '1, 2, 3' } },
    { title: 'Subsets', about: 'Each item is either in or out, so 3 items make 8.', values: { task: 'subsets', items: 'a, b, c' } },
    { title: 'Groups', about: 'Choosing 2 from 4 gives 6 groups.', values: { task: 'combinations', items: 'a, b, c, d', k: '2' } },
  ],
  run(input) {
    const items = input.items.split(/[\s,]+/).filter(Boolean);
    const task = input.task;
    if (!items.length) throw new Error('Enter at least one item.');
    if (new Set(items).size !== items.length) throw new Error('Use different items, so each result can be told apart.');
    const limit = task === 'permutations' ? 4 : task === 'subsets' ? 4 : 5;
    if (items.length > limit) throw new Error(`Use at most ${limit} items here, so the tree stays readable.`);
    const k = task === 'combinations' ? integer(input.k, 'k', 0, items.length) : 0;
    const trace = new Trace();
    const results: string[] = [];
    const chosen: string[] = [];
    let serial = 0;
    let undos = 0;
    type Tree = BinaryNode & { children: Tree[] };
    const root: Tree = { id: 'r', label: '{ }', tone: 'muted', square: true, children: [] };
    const scene = (): Panel[] => [
      treePanel('Choices tried so far', visualTree(root), 'Choice tree'),
      stackPanel('Current choices', chosen, { tone: i => (i === chosen.length - 1 ? 'active' : undefined), empty: 'Nothing chosen' }),
      logPanel(`Results (${results.length})`, results),
    ];
    const metrics = (): Metric[] => [{ label: 'Results', value: results.length }, { label: 'Undos', value: undos }, { label: 'Tree nodes', value: serial + 1 }];
    const enter = (parent: Tree, item: string) => {
      const node: Tree = { id: `n${serial++}`, label: item, tone: 'active', square: true, children: [] };
      parent.children.push(node);
      chosen.push(item);
      parent.tone = 'path';
      trace.add(`Choose ${item}`, `The choices so far are ${chosen.join(', ')}.`, scene(), { tone: 'active', metrics: metrics() });
      return node;
    };
    const leave = (node: Tree, parent: Tree) => {
      node.tone = node.tone === 'done' ? 'done' : 'value';
      const item = chosen.pop();
      undos++;
      parent.tone = 'active';
      trace.add(`Undo ${item}`, 'Go back, so the next option can be tried from the same place.', scene(), { tone: 'muted', metrics: metrics() });
    };
    const record = (node: Tree) => {
      node.tone = 'done';
      results.push(`{${chosen.join(', ')}}`);
      trace.add(`Result: {${chosen.join(', ')}}`, 'This is a complete answer, so write it down.', scene(), { tone: 'done', metrics: metrics() });
    };
    if (task === 'permutations') {
      const walk = (node: Tree) => {
        if (chosen.length === items.length) {
          record(node);
          return;
        }
        for (const item of items) {
          if (chosen.includes(item)) continue;
          const child = enter(node, item);
          walk(child);
          leave(child, node);
        }
      };
      walk(root);
    } else if (task === 'subsets') {
      const walk = (node: Tree, from: number) => {
        record(node);
        for (let i = from; i < items.length; i++) {
          const child = enter(node, items[i]);
          walk(child, i + 1);
          leave(child, node);
        }
      };
      walk(root, 0);
    } else {
      const walk = (node: Tree, from: number) => {
        if (chosen.length === k) {
          record(node);
          return;
        }
        for (let i = from; i < items.length; i++) {
          if (items.length - i < k - chosen.length) {
            trace.add('Stop this branch', `There ${items.length - i === 1 ? 'is' : 'are'} only ${counted(items.length - i, 'item')} left, and ${k - chosen.length} more ${k - chosen.length === 1 ? 'is' : 'are'} needed, so this branch can't finish.`, scene(), { tone: 'danger', metrics: metrics() });
            break;
          }
          const child = enter(node, items[i]);
          walk(child, i + 1);
          leave(child, node);
        }
      };
      walk(root, 0);
    }
    root.tone = 'done';
    trace.finish(`${results.length} results`, 'Backtracking is one pattern each time: choose, go deeper, undo.', scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: results };
  },
};

// ---------- Brute Force ----------

const bruteForce: SimulatorDef = {
  fields: [
    choiceField('problem', 'Problem', [['twosum', 'Find two values with a given sum'], ['tsp', 'Shortest round trip']]),
    whenChoice(textField('values', 'Values', '2, 7, 11, 15, 4'), 'problem', 'twosum'),
    whenChoice(numberField('target', 'Target sum', 15, -9999, 9999), 'problem', 'twosum'),
    whenChoice(textField('edges', 'Distances', 'A-B:10, A-C:15, A-D:20, B-C:35, B-D:25, C-D:30', { wide: true }), 'problem', 'tsp'),
    whenChoice(textField('start', 'Start at', 'A'), 'problem', 'tsp'),
  ],
  examples: [
    { title: 'Two values', about: 'Every pair is tried until one works.', values: { problem: 'twosum', values: '2, 7, 11, 15, 4', target: '15' } },
    { title: 'No answer', about: 'Every one of the 10 pairs has to be tried.', values: { problem: 'twosum', values: '1, 2, 3, 4, 5', target: '100' } },
    { title: 'A round trip', about: 'All 6 routes through 4 cities are tried.', values: { problem: 'tsp' } },
  ],
  run(input) {
    const trace = new Trace();
    if (input.problem === 'twosum') {
      const items = numbers(input.values, { minCount: 2, maxCount: 12 });
      const target = integer(input.target, 'Target', -9999, 9999);
      let tries = 0;
      let answer: [number, number] | null = null;
      const total = (items.length * (items.length - 1)) / 2;
      outer: for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          tries++;
          const hit = items[i] + items[j] === target;
          trace.add(`${items[i]} + ${items[j]} = ${items[i] + items[j]}`, hit ? `That is the target, after ${tries} tries.` : `That isn't ${target}, so try the next pair.`, [cells('Values', row(items, { pointers: { [i]: 'i', [j]: 'j' }, tone: at => (at === i || at === j ? (hit ? 'done' : 'active') : undefined) }))], { tone: hit ? 'done' : 'muted', metrics: [{ label: 'Tries', value: tries }, { label: 'Worst case', value: total }] });
          if (hit) {
            answer = [i, j];
            break outer;
          }
        }
      }
      trace.finish(answer ? `Indexes ${answer[0]} and ${answer[1]}` : 'No pair works', `Brute force tried ${tries} of ${counted(total, 'pair')}. It is simple and always right, at a cost of O(n²).`, [cells('Values', row(items, { tone: at => (answer?.includes(at) ? 'done' : undefined) }))], { tone: answer ? 'done' : 'danger', metrics: [{ label: 'Tries', value: tries }] });
      return { frames: trace.frames, answer };
    }
    const g = graph(input.edges, { maxNodes: 6, maxEdges: 15 });
    const start = nodeIn(g, input.start, 'Start');
    const cost = (a: string, b: string) => g.adj[a].find(({ to }) => to === b)?.weight ?? Infinity;
    const others = g.nodes.filter(node => node !== start);
    const routes: string[][] = [];
    const build = (route: string[], left: string[]) => {
      if (!left.length) {
        routes.push(route);
        return;
      }
      left.forEach((node, i) => build([...route, node], [...left.slice(0, i), ...left.slice(i + 1)]));
    };
    build([start], others);
    let best = Infinity;
    let bestRoute: string[] = [];
    const rows: (string | number)[][] = [];
    const picture = (route: string[], tone: Tone) => {
      const trip = [...route, start];
      const used = (from: string, to: string) => trip.some((node, i) => i + 1 < trip.length && ((node === from && trip[i + 1] === to) || (node === to && trip[i + 1] === from)));
      const panel: Panel = { kind: 'graph', title: 'This route', nodes: [], edges: [] };
      const places = Object.fromEntries(g.nodes.map((id, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / g.nodes.length;
        return [id, { x: 320 + 250 * Math.cos(angle), y: 210 + 165 * Math.sin(angle) }];
      }));
      if (panel.kind === 'graph') {
        panel.nodes = g.nodes.map(id => ({ id, ...places[id], tone: id === start ? 'accent' : tone }));
        panel.edges = g.edges.map(edge => ({ from: edge.from, to: edge.to, label: String(edge.weight), tone: used(edge.from, edge.to) ? tone : undefined, dashed: !used(edge.from, edge.to) }));
      }
      return panel;
    };
    routes.forEach(route => {
      const trip = [...route, start];
      const length = trip.slice(1).reduce((total, node, i) => total + cost(trip[i], node), 0);
      const better = length < best;
      if (better) {
        best = length;
        bestRoute = trip;
      }
      rows.push([trip.join(' '), length === Infinity ? 'No road' : length]);
      trace.add(`${trip.join(' → ')}: ${length === Infinity ? 'no road' : length}`, length === Infinity ? 'A leg of this route has no road, so it can\'t be used.' : better ? 'This is the shortest route so far.' : `This doesn't beat ${best}.`, [picture(route, better ? 'done' : 'active'), tablePanel('Routes tried', rows, { colHead: ['Route', 'Length'], zone: 'side', tone: r => (rows[r][1] === best ? 'done' : undefined) })], { tone: better ? 'done' : 'muted', metrics: [{ label: 'Routes tried', value: rows.length }, { label: 'Total routes', value: routes.length }, { label: 'Best', value: best === Infinity ? 'None' : best }] });
    });
    const found = best !== Infinity;
    trace.finish(found ? `Shortest trip: ${best}` : 'No round trip exists', found ? `${bestRoute.join(' → ')}. With n cities there are (n - 1)! routes, which grows far too fast for large inputs.` : 'Every route has a missing road.', [tablePanel('Routes tried', rows, { colHead: ['Route', 'Length'], tone: r => (rows[r][1] === best ? 'done' : undefined) })], { tone: found ? 'done' : 'danger', metrics: [{ label: 'Routes tried', value: rows.length }, { label: 'Best', value: found ? best : 'None', tone: found ? 'done' : 'danger' }] });
    return { frames: trace.frames, answer: { best, route: bestRoute } };
  },
};

// ---------- Divide and Conquer ----------

const divideAndConquer: SimulatorDef = {
  fields: [
    choiceField('problem', 'Problem', [['subarray', 'Largest sum of a run'], ['max', 'Largest value'], ['power', 'Fast power']]),
    whenChoice(textField('values', 'Values', '-2, 1, -3, 4, -1, 2, 1, -5, 4', { wide: true }), 'problem', 'subarray', 'max'),
    whenChoice(numberField('base', 'Base', 2, -9, 9), 'problem', 'power'),
    whenChoice(numberField('exponent', 'Exponent', 10, 0, 40), 'problem', 'power'),
  ],
  examples: [
    { title: 'Largest run', about: 'The best run may cross the middle.', values: { problem: 'subarray', values: '-2, 1, -3, 4, -1, 2, 1, -5, 4' } },
    { title: 'All negative', about: 'The best run is the single largest value.', values: { problem: 'subarray', values: '-5, -2, -8' } },
    { title: 'Largest value', about: 'Split, solve, and compare.', values: { problem: 'max', values: '3, 9, 2, 7, 5, 1' } },
    { title: 'Fast power', about: '2 to the 10th takes 4 squarings, not 10 multiplications.', values: { problem: 'power', base: '2', exponent: '10' } },
  ],
  run(input) {
    const trace = new Trace();
    const stack: string[] = [];
    let calls = 0;
    if (input.problem === 'power') {
      const base = integer(input.base, 'Base', -9, 9);
      const exponent = integer(input.exponent, 'Exponent', 0, 40);
      let multiplications = 0;
      const log: string[] = [];
      const scene = (): Panel[] => [stackPanel('Call stack', stack, { zone: 'main', tone: i => (i === stack.length - 1 ? 'active' : undefined), empty: 'Empty' }), logPanel('Worked out', log)];
      const metrics = (): Metric[] => [{ label: 'Calls', value: calls }, { label: 'Multiplications', value: multiplications }, { label: 'Simple loop would use', value: Math.max(0, exponent - 1) }];
      const power = (b: number, e: number): number => {
        calls++;
        stack.push(`power(${b}, ${e})`);
        trace.add(`Call power(${b}, ${e})`, e === 0 ? 'Anything to the power of 0 is 1.' : e % 2 ? `${e} is odd, so work out power(${b}, ${(e - 1) / 2}), square it, then multiply by ${b}.` : `${e} is even, so work out power(${b}, ${e / 2}), and square it.`, scene(), { tone: 'active', metrics: metrics() });
        let result = 1;
        if (e > 0) {
          const half = power(b, Math.floor(e / 2));
          result = half * half;
          multiplications++;
          if (e % 2) {
            result *= b;
            multiplications++;
          }
          log.push(`${b}^${e} = ${result}`);
          trace.add(`${b}^${e} = ${result}`, e % 2 ? `${half} × ${half} × ${b}.` : `${half} × ${half}.`, scene(), { tone: 'new', metrics: metrics() });
        }
        stack.pop();
        return result;
      };
      const result = power(base, exponent);
      trace.finish(`Result: ${result}`, `The exponent halves on each call, so this takes O(log n) multiplications: ${multiplications} here, compared with ${Math.max(0, exponent - 1)} in a simple loop.`, scene(), { metrics: metrics() });
      return { frames: trace.frames, answer: result };
    }
    const items = numbers(input.values, { minCount: 1, maxCount: 14 });
    const scene = (low: number, high: number, tone: (i: number) => Tone | undefined): Panel[] => [
      cells('Values', row(items, { tone: i => tone(i) ?? (i < low || i > high ? 'muted' : undefined) })),
      stackPanel('Call stack', stack, { tone: i => (i === stack.length - 1 ? 'active' : undefined), empty: 'Empty' }),
    ];
    const metrics = (): Metric[] => [{ label: 'Calls', value: calls }, { label: 'Stack depth', value: stack.length }];
    if (input.problem === 'max') {
      const walk = (low: number, high: number): number => {
        calls++;
        stack.push(`max(${low}, ${high})`);
        let result: number;
        if (low === high) {
          result = items[low];
          trace.add(`One value: ${result}`, 'A single value is the largest of itself.', scene(low, high, i => (i === low ? 'active' : undefined)), { tone: 'active', metrics: metrics() });
        } else {
          const mid = (low + high) >> 1;
          trace.add(`Split ${low} to ${high}`, `Into ${low} to ${mid}, and ${mid + 1} to ${high}.`, scene(low, high, i => (i >= low && i <= mid ? 'path' : i > mid && i <= high ? 'value' : undefined)), { tone: 'path', metrics: metrics() });
          const a = walk(low, mid);
          const b = walk(mid + 1, high);
          result = Math.max(a, b);
          trace.add(`Larger of ${a} and ${b}: ${result}`, 'Combine the two answers.', scene(low, high, i => (i >= low && i <= high && items[i] === result ? 'done' : undefined)), { tone: 'new', metrics: metrics() });
        }
        stack.pop();
        return result;
      };
      const result = walk(0, items.length - 1);
      trace.finish(`Largest: ${result}`, `T(n) = 2T(n/2) + 1 gives O(n), so this takes ${counted(calls, 'call')}. Splitting doesn't always beat a simple loop.`, [cells('Values', row(items, { tone: i => (items[i] === result ? 'done' : undefined) }))], { metrics: [{ label: 'Calls', value: calls }] });
      return { frames: trace.frames, answer: result };
    }
    let bestRange: [number, number] = [0, 0];
    const walk = (low: number, high: number): { sum: number; from: number; to: number } => {
      calls++;
      stack.push(`best(${low}, ${high})`);
      let result: { sum: number; from: number; to: number };
      if (low === high) {
        result = { sum: items[low], from: low, to: low };
        trace.add(`One value: ${items[low]}`, 'The best run in one value is that value.', scene(low, high, i => (i === low ? 'active' : undefined)), { tone: 'active', metrics: metrics() });
      } else {
        const mid = (low + high) >> 1;
        trace.add(`Split ${low} to ${high}`, 'The best run is in the left half, in the right half, or crossing the middle.', scene(low, high, i => (i >= low && i <= mid ? 'path' : i > mid && i <= high ? 'value' : undefined)), { tone: 'path', metrics: metrics() });
        const left = walk(low, mid);
        const right = walk(mid + 1, high);
        let sum = 0;
        let bestLeft = -Infinity;
        let from = mid;
        for (let i = mid; i >= low; i--) {
          sum += items[i];
          if (sum > bestLeft) {
            bestLeft = sum;
            from = i;
          }
        }
        sum = 0;
        let bestRight = -Infinity;
        let to = mid + 1;
        for (let i = mid + 1; i <= high; i++) {
          sum += items[i];
          if (sum > bestRight) {
            bestRight = sum;
            to = i;
          }
        }
        const cross = { sum: bestLeft + bestRight, from, to };
        trace.add(`Crossing the middle: ${cross.sum}`, `Grow outward from the middle: ${bestLeft} on the left, plus ${bestRight} on the right. The left half's best is ${left.sum}, and the right half's best is ${right.sum}.`, scene(low, high, i => (i >= from && i <= to ? 'accent' : undefined)), { tone: 'accent', metrics: metrics() });
        result = left.sum >= right.sum && left.sum >= cross.sum ? left : right.sum >= cross.sum ? right : cross;
        trace.add(`Best of ${low} to ${high}: ${result.sum}`, 'Keep the largest of the three.', scene(low, high, i => (i >= result.from && i <= result.to ? 'done' : undefined)), { tone: 'new', metrics: metrics() });
      }
      stack.pop();
      return result;
    };
    const result = walk(0, items.length - 1);
    bestRange = [result.from, result.to];
    trace.finish(`Largest sum: ${result.sum}`, `Indexes ${bestRange[0]} to ${bestRange[1]}. T(n) = 2T(n/2) + n gives O(n log n).`, [cells('Values', row(items, { tone: i => (i >= bestRange[0] && i <= bestRange[1] ? 'done' : undefined) }))], { metrics: [{ label: 'Sum', value: result.sum, tone: 'done' }, { label: 'Calls', value: calls }] });
    return { frames: trace.frames, answer: { sum: result.sum, from: result.from, to: result.to } };
  },
};

// ---------- Fractional Knapsack ----------

const fractionalKnapsack: SimulatorDef = {
  fields: [
    textField('items', 'Items, as name(value, weight)', 'A(60,10), B(100,20), C(120,30)', { wide: true }),
    numberField('capacity', 'Capacity', 50, 1, 9999),
    choiceField('rule', 'Take first', [['ratio', 'Best value per weight'], ['value', 'Highest value'], ['weight', 'Lightest']]),
  ],
  examples: [
    { title: 'Best ratio', about: 'The classic: part of the last item fills the bag.', values: { rule: 'ratio' } },
    { title: 'Highest value', about: 'This rule gives less here.', values: { rule: 'value' } },
    { title: 'A perfect fit', about: 'Every item fits whole.', values: { items: 'A(10,2), B(20,3), C(5,1)', capacity: '6', rule: 'ratio' } },
  ],
  run(input) {
    const list = records(input.items, { label: 'the items', parts: 2, example: 'A(60,10), B(100,20)', maxCount: 12, min: 1, max: 9999 }).map(item => ({ name: item.name, value: item.values[0], weight: item.values[1], ratio: item.values[0] / item.values[1] }));
    const capacity = integer(input.capacity, 'Capacity', 1, 9999);
    const sorters: Record<string, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      ratio: (a, b) => b.ratio - a.ratio,
      value: (a, b) => b.value - a.value,
      weight: (a, b) => a.weight - b.weight,
    };
    const sorted = [...list].sort(sorters[input.rule]);
    const round = (value: number) => Math.round(value * 100) / 100;
    const trace = new Trace();
    let room = capacity;
    let total = 0;
    const taken = new Map<string, number>();
    const scene = (active?: string): Panel[] => [
      tablePanel('Items, in the order they are considered', sorted.map(item => [item.name, item.value, item.weight, round(item.ratio), taken.has(item.name) ? `${round(taken.get(item.name)! * 100)}%` : '-']), { colHead: ['Item', 'Value', 'Weight', 'Value per weight', 'Taken'], tone: r => (sorted[r].name === active ? 'active' : taken.has(sorted[r].name) ? 'done' : undefined) }),
      bars('How full the bag is', [capacity - room, room], i => (i === 0 ? 'done' : 'muted'), ['Used', 'Free']),
    ];
    const metrics = (): Metric[] => [{ label: 'Room left', value: round(room) }, { label: 'Total value', value: round(total) }];
    trace.add('Sort the items', { ratio: 'Value per weight says how much each unit of bag space earns.', value: 'Taking the most valuable item first ignores how much room it uses.', weight: 'Taking light items first ignores how much they are worth.' }[input.rule]!, scene(), { tone: 'muted', metrics: metrics() });
    for (const item of sorted) {
      if (room <= 0) break;
      const fraction = Math.min(1, room / item.weight);
      taken.set(item.name, fraction);
      room -= fraction * item.weight;
      total += fraction * item.value;
      trace.add(fraction === 1 ? `Take all of ${item.name}` : `Take ${round(fraction * 100)}% of ${item.name}`, fraction === 1 ? `It fits whole, and adds ${item.value}.` : `Only ${round(fraction * item.weight)} of its weight fits, which is worth ${round(fraction * item.value)}.`, scene(item.name), { tone: fraction === 1 ? 'done' : 'accent', metrics: metrics() });
    }
    let best = 0;
    let space = capacity;
    for (const item of [...list].sort(sorters.ratio)) {
      const fraction = Math.min(1, space / item.weight);
      best += fraction * item.value;
      space -= fraction * item.weight;
    }
    const optimal = Math.abs(best - total) < 1e-9;
    trace.finish(`Total value: ${round(total)}`, optimal ? 'Since items can be split, always taking the best ratio is optimal. Sorting takes the most time: O(n log n).' : `The best ratio rule would give ${round(best)}, so this rule did worse.`, scene(), { tone: optimal ? 'done' : 'danger', metrics: [...metrics(), { label: 'Best possible', value: round(best) }] });
    return { frames: trace.frames, answer: { total, best } };
  },
};

// ---------- Greedy Algorithms ----------

const greedyAlgorithms: SimulatorDef = {
  fields: [textField('coins', 'Coins', '1, 3, 4'), numberField('amount', 'Amount', 6, 1, 500)],
  examples: [
    { title: 'Greedy loses', about: 'Greedy uses 3 coins for 6, and the best is 2.', values: { coins: '1, 3, 4', amount: '6' } },
    { title: 'Greedy wins', about: 'For usual currency coins, greedy is always right.', values: { coins: '1, 5, 10, 25', amount: '63' } },
    { title: 'Greedy gets stuck', about: 'It takes 4, and can\'t make the remaining 2.', values: { coins: '3, 4', amount: '6' } },
  ],
  run(input) {
    const coins = [...new Set(numbers(input.coins, { label: 'coins', min: 1, max: 500, maxCount: 8 }))].sort((a, b) => b - a);
    const amount = integer(input.amount, 'Amount', 1, 500);
    const trace = new Trace();
    const taken: number[] = [];
    let left = amount;
    const scene = (active?: number): Panel[] => [
      cells('Coins, largest first', row(coins, { hideIndex: true, tone: i => (coins[i] === active ? 'active' : undefined) })),
      cells('Coins taken', row(taken, { hideIndex: true, tone: i => (i === taken.length - 1 ? 'new' : 'value') })),
    ];
    const metrics = (): Metric[] => [{ label: 'Left to make', value: left }, { label: 'Coins taken', value: taken.length }];
    trace.add('Start', 'At every step, take the largest coin that fits. Never look back.', scene(), { tone: 'muted', metrics: metrics() });
    for (const coin of coins) {
      while (left >= coin) {
        left -= coin;
        taken.push(coin);
        trace.add(`Take ${coin}`, `It is the largest that fits, and ${left} ${left === 1 ? 'is' : 'are'} left to make.`, scene(coin), { tone: 'new', metrics: metrics() });
      }
    }
    const dp = new Array<number>(amount + 1).fill(Infinity);
    const via = new Array<number>(amount + 1).fill(0);
    dp[0] = 0;
    for (let value = 1; value <= amount; value++) {
      for (const coin of coins) {
        if (coin <= value && dp[value - coin] + 1 < dp[value]) {
          dp[value] = dp[value - coin] + 1;
          via[value] = coin;
        }
      }
    }
    const best: number[] = [];
    for (let value = amount; value > 0 && dp[amount] !== Infinity; value -= via[value]) best.push(via[value]);
    const greedyWorked = left === 0;
    const optimal = greedyWorked && taken.length === dp[amount];
    const bestText = dp[amount] === Infinity ? 'no way to make it' : `${dp[amount]} coin${dp[amount] === 1 ? '' : 's'}: ${best.join(' + ')}`;
    trace.finish(optimal ? 'Greedy was right' : greedyWorked ? 'Greedy was not the best' : 'Greedy got stuck', `${greedyWorked ? `Greedy used ${counted(taken.length, 'coin')}: ${taken.join(' + ')}.` : `Greedy stopped with ${left} left to make.`} The true best is ${bestText}. A greedy choice looks only at the current step, so it needs proof that it works for the problem.`, [
      ...scene(),
      factsPanel('The comparison', [{ label: 'Greedy', value: greedyWorked ? taken.length : 'Failed', tone: optimal ? 'done' : 'danger' }, { label: 'Best', value: dp[amount] === Infinity ? 'None' : dp[amount], tone: 'done' }]),
    ], { tone: optimal ? 'done' : 'danger', metrics: metrics() });
    return { frames: trace.frames, answer: { greedy: greedyWorked ? taken.length : -1, best: dp[amount] === Infinity ? -1 : dp[amount] } };
  },
};

// ---------- Hill Climbing ----------

const hillClimbing: SimulatorDef = {
  fields: [
    textField('heights', 'Heights', '1, 3, 5, 4, 2, 6, 9, 7', { wide: true }),
    numberField('start', 'Start at index', 0, 0, 23),
    numberField('restarts', 'Random restarts', 0, 0, 8),
  ],
  examples: [
    { title: 'Stuck on a local peak', about: 'Starting on the left, it stops at 5 and never sees 9.', values: { heights: '1, 3, 5, 4, 2, 6, 9, 7', start: '0', restarts: '0' } },
    { title: 'A lucky start', about: 'Starting on the right reaches the top.', values: { heights: '1, 3, 5, 4, 2, 6, 9, 7', start: '5', restarts: '0' } },
    { title: 'Random restarts', about: 'More tries give a better chance of finding the top.', values: { heights: '1, 3, 5, 4, 2, 6, 9, 7', start: '0', restarts: '4' } },
    { title: 'A plateau', about: 'Equal neighbors don\'t count as better, so it stops.', values: { heights: '1, 2, 2, 2, 5', start: '0', restarts: '0' } },
  ],
  run(input) {
    const heights = numbers(input.heights, { label: 'heights', minCount: 2, maxCount: 24, min: 0, max: 999 });
    const first = integer(input.start, 'Start', 0, heights.length - 1);
    const restarts = integer(input.restarts, 'Restarts', 0, 8);
    const random = seededRandom(heights.length * 31 + first * 7 + restarts + 1);
    const top = Math.max(...heights);
    const trace = new Trace();
    const peaks: { text: string; tone?: Tone }[] = [];
    let moves = 0;
    let bestIndex = first;
    const scene = (at: number, path: number[], tone: Tone = 'active'): Panel[] => [
      bars('The landscape', heights, i => (i === at ? tone : path.includes(i) ? 'path' : heights[i] === top ? 'done' : undefined), heights.map((_, i) => String(i)), [{ tone: 'active', label: 'Current' }, { tone: 'path', label: 'Climbed' }, { tone: 'done', label: 'True top' }]),
      logPanel('Peaks reached', peaks),
    ];
    const metrics = (attempt: number): Metric[] => [{ label: 'Attempt', value: `${attempt} of ${restarts + 1}` }, { label: 'Moves', value: moves }, { label: 'Best so far', value: heights[bestIndex] }];
    for (let attempt = 1; attempt <= restarts + 1; attempt++) {
      let at = attempt === 1 ? first : random(heights.length);
      trace.group = `Attempt ${attempt}: start at ${at}`;
      const path = [at];
      trace.add(`Start at index ${at}`, `The height here is ${heights[at]}.`, scene(at, path), { tone: 'accent', metrics: metrics(attempt) });
      while (true) {
        const options = [at - 1, at + 1].filter(i => i >= 0 && i < heights.length);
        const next = options.reduce((best, i) => (heights[i] > heights[best] ? i : best), at);
        if (next === at) break;
        moves++;
        trace.add(`Move to index ${next}`, `Height ${heights[next]} is the best neighbor, and it beats ${heights[at]}.`, scene(next, path), { tone: 'new', metrics: metrics(attempt) });
        at = next;
        path.push(at);
      }
      if (heights[at] > heights[bestIndex]) bestIndex = at;
      const isTop = heights[at] === top;
      peaks.push({ text: `Attempt ${attempt}: height ${heights[at]}`, tone: isTop ? 'done' : 'danger' });
      trace.add(`Stop at height ${heights[at]}`, isTop ? 'No neighbor is higher, and this is the true top.' : 'No neighbor is higher, but a taller peak exists elsewhere. This is a local peak.', scene(at, path, isTop ? 'done' : 'danger'), { tone: isTop ? 'done' : 'danger', metrics: metrics(attempt) });
    }
    trace.group = undefined;
    const reached = heights[bestIndex];
    trace.finish(`Best height: ${reached}`, reached === top ? 'The search found the true top. Hill climbing is fast and uses little memory, but gives no guarantee.' : `The true top is ${top}, and the search never found it. Hill climbing can't see past its neighbors.`, scene(bestIndex, []), { tone: reached === top ? 'done' : 'danger', metrics: [{ label: 'Best found', value: reached, tone: reached === top ? 'done' : 'danger' }, { label: 'True top', value: top }, { label: 'Moves', value: moves }] });
    return { frames: trace.frames, answer: { reached, top, moves } };
  },
};

// ---------- Huffman Coding ----------

const huffmanCoding: SimulatorDef = {
  fields: [
    choiceField('source', 'Start from', [['counts', 'Letter counts'], ['text', 'Some text']]),
    whenChoice(textField('counts', 'Counts, as letter(count)', 'a(45), b(13), c(12), d(16), e(9), f(5)', { wide: true }), 'source', 'counts'),
    whenChoice(textField('text', 'Text', 'abracadabra', { wide: true }), 'source', 'text'),
  ],
  examples: [
    { title: 'The classic', about: 'A million-letter textbook example: 224 thousand bits.', values: { source: 'counts' } },
    { title: 'From text', about: 'Common letters get short codes.', values: { source: 'text', text: 'abracadabra' } },
    { title: 'Equal counts', about: 'With no favorites, all codes end up nearly the same length.', values: { source: 'counts', counts: 'a(1), b(1), c(1), d(1)' } },
  ],
  run(input) {
    let entries: { symbol: string; count: number }[];
    if (input.source === 'text') {
      const text = input.text.trim();
      if (!text) throw new Error('Enter some text.');
      if (text.length > 60) throw new Error('Keep the text to 60 characters, so every step stays readable.');
      const counts = new Map<string, number>();
      for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
      if (counts.size > 10) throw new Error('Use at most 10 different characters, so the tree stays readable.');
      entries = [...counts.entries()].map(([symbol, count]) => ({ symbol, count }));
    } else {
      entries = records(input.counts, { label: 'the counts', parts: 1, example: 'a(45), b(13)', maxCount: 10, min: 1, max: 99999 }).map(item => ({ symbol: item.name, count: item.values[0] }));
    }
    type HuffNode = { id: string; count: number; symbol?: string; left?: HuffNode; right?: HuffNode; order: number };
    let serial = 0;
    let waiting: HuffNode[] = entries.map(entry => ({ id: `h${serial}`, count: entry.count, symbol: entry.symbol, order: serial++ }));
    const trace = new Trace();
    const draw = (node: HuffNode, marks: HuffNode[]): BinaryNode => ({ id: node.id, label: node.symbol ?? String(node.count), sub: node.symbol ? String(node.count) : undefined, square: !node.symbol, tone: marks.includes(node) ? 'active' : node.symbol ? 'value' : 'path', ...(node.left ? { children: [draw(node.left, marks), draw(node.right!, marks)] } : { children: [] }) });
    const sort = () => waiting.sort((a, b) => a.count - b.count || a.order - b.order);
    const scene = (marks: HuffNode[] = []): Panel[] => [
      treePanel('The trees so far', visualForest(waiting.map(node => draw(node, marks))), 'Huffman forest'),
      cells('Waiting, smallest first', row(waiting.map(node => node.count), { hideIndex: true, tone: i => (marks.includes(waiting[i]) ? 'active' : undefined), sub: i => waiting[i].symbol ?? 'tree' }), { zone: 'side' }),
    ];
    sort();
    trace.add('Start', 'Each letter starts as its own small tree, weighted by how often it appears.', scene(), { tone: 'muted' });
    if (entries.length === 1) trace.add('Only one letter', 'With one letter, a code of a single bit is enough.', scene(), { tone: 'accent' });
    while (waiting.length > 1) {
      const [a, b] = waiting;
      trace.add(`Pick ${a.count} and ${b.count}`, 'These two are the smallest, so they will sit deepest, with the longest codes.', scene([a, b]), { tone: 'active' });
      const merged: HuffNode = { id: `h${serial}`, count: a.count + b.count, left: a, right: b, order: serial++ };
      waiting = [merged, ...waiting.slice(2)];
      sort();
      trace.add(`Merge into ${merged.count}`, `${a.count} + ${b.count} = ${merged.count}. The new tree goes back into the waiting list.`, scene([merged]), { tone: 'new' });
    }
    const codes: Record<string, string> = {};
    const assign = (node: HuffNode, prefix: string) => {
      if (node.symbol !== undefined) {
        codes[node.symbol] = prefix || '0';
        return;
      }
      assign(node.left!, `${prefix}0`);
      assign(node.right!, `${prefix}1`);
    };
    assign(waiting[0], '');
    const table = entries.map(entry => [entry.symbol === ' ' ? 'space' : entry.symbol, entry.count, codes[entry.symbol], entry.count * codes[entry.symbol].length]);
    const total = entries.reduce((sum, entry) => sum + entry.count * codes[entry.symbol].length, 0);
    const letters = entries.reduce((sum, entry) => sum + entry.count, 0);
    const fixedLength = Math.max(1, Math.ceil(Math.log2(entries.length)));
    const fixed = letters * fixedLength;
    const finalPanels: Panel[] = [
      treePanel('The finished tree: left is 0, right is 1', visualTree(draw(waiting[0], [])), 'Huffman tree'),
      tablePanel('Codes', table, { colHead: ['Letter', 'Count', 'Code', 'Bits'], zone: 'side' }),
    ];
    trace.finish(`${total} bits`, `A fixed code would use ${fixedLength} bits per letter, for ${fixed} bits. Huffman saves ${fixed - total} bits. No code is the start of another, so decoding is never ambiguous.`, finalPanels, { metrics: [{ label: 'Huffman', value: total, tone: 'done' }, { label: 'Fixed length', value: fixed }, { label: 'Saved', value: `${fixed ? Math.round(((fixed - total) / fixed) * 100) : 0}%` }] });
    return { frames: trace.frames, answer: { total, codes, fixed } };
  },
};

// ---------- Job Sequencing ----------

const jobSequencing: SimulatorDef = {
  fields: [textField('jobs', 'Jobs, as name(deadline, profit)', 'A(2,100), B(1,19), C(2,27), D(1,25), E(3,15)', { wide: true })],
  examples: [
    { title: 'Five jobs', about: 'Each job goes in the latest free slot before its deadline.', values: { jobs: 'A(2,100), B(1,19), C(2,27), D(1,25), E(3,15)' } },
    { title: 'Tight deadlines', about: 'Three jobs all want the first slot, so only one can have it.', values: { jobs: 'A(1,20), B(1,10), C(1,40)' } },
    { title: 'Room for all', about: 'Each job gets a slot.', values: { jobs: 'A(3,5), B(2,10), C(1,20)' } },
  ],
  run(input) {
    const list = records(input.jobs, { label: 'the jobs', parts: 2, example: 'A(2,100), B(1,19)', maxCount: 12, min: 1, max: 9999 }).map(item => ({ name: item.name, deadline: item.values[0], profit: item.values[1] }));
    const last = Math.max(...list.map(job => job.deadline));
    if (last > 12) throw new Error('Keep deadlines to 12 or below, so all the slots stay readable.');
    const sorted = [...list].sort((a, b) => b.profit - a.profit);
    const slots: string[] = new Array(last).fill('');
    const decided = new Map<string, boolean>();
    const trace = new Trace();
    let total = 0;
    const scene = (active?: string, slot?: number, tone: Tone = 'new'): Panel[] => [
      cells('Time slots', row(slots, { firstIndex: 1, tone: i => (i === slot ? tone : slots[i] ? 'done' : undefined) })),
      tablePanel('Jobs, highest profit first', sorted.map(job => [job.name, job.deadline, job.profit, decided.has(job.name) ? (decided.get(job.name) ? 'Scheduled' : 'Skipped') : '-']), { colHead: ['Job', 'Deadline', 'Profit', 'Result'], zone: 'side', tone: r => (sorted[r].name === active ? 'active' : decided.get(sorted[r].name) ? 'done' : decided.has(sorted[r].name) ? 'danger' : undefined) }),
    ];
    const metrics = (): Metric[] => [{ label: 'Profit', value: total }, { label: 'Scheduled', value: slots.filter(Boolean).length }];
    trace.add('Sort by profit', `Each job takes one time slot. Consider the most profitable jobs first. Slots run up to the last deadline, ${last}.`, scene(), { tone: 'muted', metrics: metrics() });
    for (const job of sorted) {
      let placed = -1;
      for (let slot = job.deadline - 1; slot >= 0; slot--) {
        const free = !slots[slot];
        trace.add(`${job.name}: try slot ${slot + 1}`, free ? 'It is free.' : `${slots[slot]} already has this slot, so look earlier.`, scene(job.name, slot, free ? 'new' : 'danger'), { tone: free ? 'new' : 'danger', metrics: metrics() });
        if (free) {
          placed = slot;
          break;
        }
      }
      decided.set(job.name, placed >= 0);
      if (placed >= 0) {
        slots[placed] = job.name;
        total += job.profit;
        trace.add(`Schedule ${job.name}`, `The latest free slot by its deadline keeps the earlier slots open for other jobs. Profit is now ${total}.`, scene(job.name, placed, 'done'), { tone: 'done', metrics: metrics() });
      } else trace.add(`Skip ${job.name}`, `No slot is free at or before deadline ${job.deadline}.`, scene(job.name), { tone: 'danger', metrics: metrics() });
    }
    trace.finish(`Total profit: ${total}`, `Order: ${slots.filter(Boolean).join(', ')}. With a simple slot search, this takes O(n × d).`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { total, slots } };
  },
};

// ---------- N-Queens ----------

const nQueens: SimulatorDef = {
  fields: [numberField('n', 'Board size', 4, 1, 8), choiceField('mode', 'Find', [['first', 'The first solution'], ['all', 'All solutions']])],
  examples: [
    { title: 'Four queens', about: 'The smallest interesting board has 2 solutions.', values: { n: '4', mode: 'all' } },
    { title: 'Eight queens, first', about: 'The classic puzzle.', values: { n: '8', mode: 'first' } },
    { title: 'Eight queens, all', about: 'There are 92 in total. Only the solutions are shown.', values: { n: '8', mode: 'all' } },
    { title: 'No solution', about: 'A board of size 3 can\'t work.', values: { n: '3', mode: 'all' } },
  ],
  run(input) {
    const n = integer(input.n, 'Board size', 1, 8);
    const all = input.mode === 'all';
    const quiet = all && n >= 7;
    const queens: number[] = [];
    const solutions: number[][] = [];
    const trace = new Trace();
    let placed = 0;
    let undone = 0;
    const heads = Array.from({ length: n }, (_, i) => i);
    const attacks = (row1: number, col: number) => queens.findIndex((other, at) => other === col || Math.abs(other - col) === row1 - at);
    const scene = (r?: number, c?: number, tone: Tone = 'active', clash?: number): Panel[] => [
      tablePanel('The board', heads.map(y => heads.map(x => (queens[y] === x ? '♛' : y === r && x === c ? '?' : ''))), {
        rowHead: heads, colHead: heads,
        tone: (y, x) => {
          if (y === r && x === c) return tone;
          if (clash !== undefined && y === clash && queens[y] === x) return 'danger';
          if (queens[y] === x) return 'done';
          return (x + y) % 2 ? 'muted' : undefined;
        },
      }),
      logPanel(`Solutions (${solutions.length})`, solutions.slice(-20).map((item, i) => `${solutions.length > 20 ? solutions.length - 20 + i + 1 : i + 1}. ${item.join(', ')}`)),
    ];
    const metrics = (): Metric[] => [{ label: 'Queens on board', value: queens.length }, { label: 'Placements', value: placed }, { label: 'Undone', value: undone }, { label: 'Solutions', value: solutions.length }];
    if (!quiet) trace.add('Start', 'Place one queen in each row. A queen attacks along its column and both diagonals, so check those only.', scene(), { tone: 'muted', metrics: metrics() });
    let stop = false;
    const place = (y: number) => {
      if (y === n) {
        solutions.push([...queens]);
        trace.add(`Solution ${solutions.length}`, `Every row has a queen, and none attack each other. Columns by row: ${queens.join(', ')}.`, scene(), { tone: 'done', metrics: metrics() });
        if (!all) stop = true;
        return;
      }
      for (let x = 0; x < n && !stop; x++) {
        const clash = attacks(y, x);
        if (clash >= 0) {
          if (!quiet) trace.add(`Row ${y}, column ${x}: no`, `The queen in row ${clash} attacks this square.`, scene(y, x, 'danger', clash), { tone: 'danger', metrics: metrics() });
          continue;
        }
        queens.push(x);
        placed++;
        if (!quiet) trace.add(`Place in row ${y}, column ${x}`, 'This square is safe, so move on to the next row.', scene(), { tone: 'new', metrics: metrics() });
        place(y + 1);
        if (stop) return;
        queens.pop();
        undone++;
        if (!quiet) trace.add(`Remove from row ${y}`, 'That led to a dead end or a finished answer, so try the next column.', scene(), { tone: 'muted', metrics: metrics() });
      }
    };
    place(0);
    const lastSolution = solutions.at(-1);
    if (lastSolution && quiet) queens.splice(0, queens.length, ...lastSolution);
    trace.finish(solutions.length ? `${solutions.length} solution${solutions.length === 1 ? '' : 's'}` : 'No solution', solutions.length ? `The search placed ${counted(placed, 'queen')}, and undid ${undone}. Backtracking skipped most of the ${n}^${n} ways to arrange them.` : `Every placement was tried, and a ${n} × ${n} board has no solution.`, scene(), { tone: solutions.length ? 'done' : 'danger', metrics: metrics() });
    return { frames: trace.frames, answer: { count: solutions.length, first: solutions[0] ?? null } };
  },
};

// ---------- Sum of Subsets ----------

const sumOfSubsets: SimulatorDef = {
  fields: [textField('values', 'Positive values', '2, 3, 4, 5'), numberField('target', 'Target sum', 9, 1, 9999), choiceField('prune', 'Skip dead ends', [['yes', 'Yes'], ['no', 'No']])],
  examples: [
    { title: 'Two answers', about: '{2, 3, 4} and {4, 5} both make 9.', values: { values: '2, 3, 4, 5', target: '9', prune: 'yes' } },
    { title: 'Without skipping', about: 'The tree has every branch, and takes far more steps.', values: { values: '2, 3, 4, 5', target: '9', prune: 'no' } },
    { title: 'No answer', about: 'Every value is even, and the target is odd.', values: { values: '2, 4, 6, 8', target: '7', prune: 'yes' } },
  ],
  run(input) {
    const items = numbers(input.values, { label: 'values', min: 1, max: 999, maxCount: 6 }).sort((a, b) => a - b);
    const target = integer(input.target, 'Target', 1, 9999);
    const prune = input.prune === 'yes';
    const trace = new Trace();
    const results: number[][] = [];
    const chosen: number[] = [];
    let nodes = 0;
    let skipped = 0;
    type Tree = BinaryNode & { children: Tree[] };
    const root: Tree = { id: 'r', label: '0', tone: 'active', square: true, children: [] };
    const scene = (at?: number): Panel[] => [
      treePanel('Decisions: take or leave each value', visualTree(root), 'Subset tree'),
      cells('Values, sorted', row(items, { hideIndex: true, tone: i => (i === at ? 'active' : undefined) }), { zone: 'side' }),
      cells('Chosen', row(chosen, { hideIndex: true, tone: () => 'value' }), { zone: 'side' }),
      logPanel('Answers', results.map(item => `{${item.join(', ')}}`)),
    ];
    const metrics = (sum: number): Metric[] => [{ label: 'Sum', value: sum }, { label: 'Tree nodes', value: nodes + 1 }, { label: 'Branches skipped', value: skipped }, { label: 'Answers', value: results.length }];
    const totalFrom = (i: number) => items.slice(i).reduce((a, b) => a + b, 0);
    const walk = (i: number, sum: number, node: Tree) => {
      if (sum === target) {
        node.tone = 'done';
        results.push([...chosen]);
        trace.add(`Answer: {${chosen.join(', ')}}`, `These add up to exactly ${target}.`, scene(), { tone: 'done', metrics: metrics(sum) });
        return;
      }
      if (i === items.length) {
        node.tone = 'danger';
        trace.add('Out of values', `The sum is ${sum}, and nothing is left to add.`, scene(), { tone: 'danger', metrics: metrics(sum) });
        return;
      }
      if (prune && sum + items[i] > target) {
        node.tone = 'danger';
        skipped++;
        trace.add('Too big from here', `The values are sorted, so adding even the smallest one left (${items[i]}) gives ${sum + items[i]}, which goes past ${target}.`, scene(i), { tone: 'danger', metrics: metrics(sum) });
        return;
      }
      if (prune && sum + totalFrom(i) < target) {
        node.tone = 'danger';
        skipped++;
        trace.add('Too small from here', `Even adding everything left only reaches ${sum + totalFrom(i)}, which is short of ${target}.`, scene(i), { tone: 'danger', metrics: metrics(sum) });
        return;
      }
      node.tone = 'path';
      const take: Tree = { id: `n${nodes++}`, label: String(sum + items[i]), sub: `+${items[i]}`, tone: 'active', square: true, children: [] };
      node.children.push(take);
      chosen.push(items[i]);
      trace.add(`Take ${items[i]}`, `The sum becomes ${sum + items[i]}.`, scene(i), { tone: 'active', metrics: metrics(sum + items[i]) });
      walk(i + 1, sum + items[i], take);
      if (take.tone === 'active' || take.tone === 'path') take.tone = 'value';
      chosen.pop();
      const leave: Tree = { id: `n${nodes++}`, label: String(sum), sub: `skip ${items[i]}`, tone: 'active', square: true, children: [] };
      node.children.push(leave);
      trace.add(`Leave ${items[i]}`, `Go back, and try without it. The sum stays at ${sum}.`, scene(i), { tone: 'muted', metrics: metrics(sum) });
      walk(i + 1, sum, leave);
      if (leave.tone === 'active' || leave.tone === 'path') leave.tone = 'value';
    };
    if (totalFrom(0) < target) trace.add('Check the total', `All the values together only make ${totalFrom(0)}, so ${target} can't be reached.`, scene(), { tone: 'danger', metrics: metrics(0) });
    walk(0, 0, root);
    root.tone = results.length ? 'done' : 'danger';
    trace.finish(results.length ? `${results.length} answer${results.length === 1 ? '' : 's'}` : 'No answer', results.length ? `${results.map(item => `{${item.join(', ')}}`).join(' and ')}. The search built ${nodes + 1} tree nodes, out of ${2 ** (items.length + 1) - 1} possible.` : `No subset adds up to ${target}. The search built ${nodes + 1} tree nodes, out of ${2 ** (items.length + 1) - 1} possible.`, scene(), { tone: results.length ? 'done' : 'danger', metrics: metrics(0) });
    return { frames: trace.frames, answer: { results, nodes: nodes + 1 } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  'activity-selection': activitySelection,
  'alpha-beta-pruning': alphaBeta,
  backtracking,
  'brute-force': bruteForce,
  'divide-and-conquer': divideAndConquer,
  'fractional-knapsack': fractionalKnapsack,
  'greedy-algorithms': greedyAlgorithms,
  'hill-climbing': hillClimbing,
  'huffman-coding': huffmanCoding,
  'job-sequencing': jobSequencing,
  minimax,
  'n-queens': nQueens,
  'sum-of-subsets': sumOfSubsets,
};
