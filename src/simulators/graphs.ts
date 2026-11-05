import { counted, bars, bucketsPanel, cells, choiceField, whenChoice, factsPanel, graph, graphPanel, logPanel, nodeIn, numberField, operations, opsField, row, stackPanel, tablePanel, textField, Trace, treePanel, visualForest, integer, type BinaryNode, type Graph, type GraphEdgeInput, type Metric, type Panel, type SimulatorDef, type Tone } from './kit.ts';

const directedField = (initial = 'undirected') => choiceField('kind', 'Edges', [['undirected', 'Two-way'], ['directed', 'One-way']], initial);
const INFINITE = '∞';
const show = (value: number) => (value === Infinity ? INFINITE : value);
const sameEdge = (edge: GraphEdgeInput, a: string, b: string, directed: boolean) => (edge.from === a && edge.to === b) || (!directed && edge.from === b && edge.to === a);

/** Walks back along the parent links. */
const pathTo = (parent: Record<string, string | null>, target: string) => {
  const path = [target];
  while (parent[path[0]]) path.unshift(parent[path[0]]!);
  return path;
};
const pathEdges = (path: string[]) => path.slice(1).map((node, i) => [path[i], node] as const);
const onPath = (edge: GraphEdgeInput, path: string[], directed: boolean) => pathEdges(path).some(([a, b]) => sameEdge(edge, a, b, directed));

const distanceTable = (g: Graph, dist: Record<string, number>, parent: Record<string, string | null>, active?: string, zone: 'main' | 'side' = 'side') =>
  tablePanel('Distances', g.nodes.map(node => [node, show(dist[node]), parent[node] ?? '-']), { colHead: ['Node', 'Distance', 'From'], zone, tone: r => (g.nodes[r] === active ? 'new' : undefined) });

// ---------- BFS ----------

const bfs: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B, A-C, B-D, B-E, C-D, D-F', { wide: true }), directedField(), textField('start', 'Start at', 'A')],
  examples: [
    { title: 'Layers', about: 'Nodes are reached in order of distance.', values: { edges: 'A-B, A-C, B-D, B-E, C-D, D-F', kind: 'undirected', start: 'A' } },
    { title: 'Shortest hops', about: 'A short way and a long way to E: BFS finds the short one.', values: { edges: 'A-B, B-C, C-D, D-E, A-E', kind: 'undirected', start: 'A' } },
    { title: 'Unreachable', about: 'X and Y are not connected to A.', values: { edges: 'A-B, B-C, X-Y', kind: 'undirected', start: 'A' } },
    { title: 'One-way edges', about: 'Only edges pointing outward can be followed.', values: { edges: 'A-B, C-A, B-D, D-C', kind: 'directed', start: 'A' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed' });
    const start = nodeIn(g, input.start, 'Start');
    const dist: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, Infinity]));
    const parent: Record<string, string | null> = Object.fromEntries(g.nodes.map(node => [node, null]));
    const queue: string[] = [start];
    const order: string[] = [];
    dist[start] = 0;
    const trace = new Trace();
    const scene = (active?: string, looking?: string): Panel[] => [
      graphPanel('The graph', g, {
        node: id => ({ tone: id === active ? 'active' : id === looking ? 'accent' : order.includes(id) ? 'done' : queue.includes(id) ? 'path' : 'muted', sub: dist[id] === Infinity ? undefined : `d ${dist[id]}` }),
        edge: edge => (parent[edge.to] === edge.from || (!g.directed && parent[edge.from] === edge.to) ? { tone: 'done' } : undefined),
        legend: [{ tone: 'active', label: 'Current' }, { tone: 'path', label: 'In the queue' }, { tone: 'done', label: 'Visited' }],
      }),
      cells('Queue, front on the left', row(queue, { hideIndex: true, tone: i => (i === 0 ? 'active' : undefined) }), { zone: 'side' }),
      logPanel('Visit order', order.map((node, i) => `${i + 1}. ${node} (distance ${dist[node]})`)),
    ];
    trace.add(`Queue ${start}`, 'Start with one node in the queue, at distance 0.', scene(start), { tone: 'muted' });
    while (queue.length) {
      const node = queue.shift()!;
      order.push(node);
      trace.add(`Visit ${node}`, `Take ${node} from the front of the queue. It is ${counted(dist[node], 'hop')} from ${start}.`, scene(node), { tone: 'active' });
      for (const { to } of g.adj[node]) {
        if (dist[to] !== Infinity) {
          trace.add(`${to} is already found`, `${to} was reached earlier, by a path at least as short. Skip it.`, scene(node, to), { tone: 'muted' });
          continue;
        }
        dist[to] = dist[node] + 1;
        parent[to] = node;
        queue.push(to);
        trace.add(`Discover ${to}`, `${to} is new, so it joins the back of the queue at distance ${dist[to]}. Marking it now stops it being queued twice.`, scene(node, to), { tone: 'new' });
      }
    }
    const missing = g.nodes.filter(node => dist[node] === Infinity);
    trace.finish(`Reached ${order.length} of ${g.nodes.length}`, `Order: ${order.join(', ')}.${missing.length ? ` ${missing.join(', ')} can't be reached from ${start}.` : ''} Time: O(V + E).`, scene(), { metrics: [{ label: 'Reached', value: order.length }, { label: 'Farthest', value: Math.max(...order.map(node => dist[node])) }] });
    return { frames: trace.frames, answer: { order, dist } };
  },
};

// ---------- DFS ----------

const dfs: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B, A-C, B-D, B-E, C-D, D-F', { wide: true }), directedField(), textField('start', 'Start at', 'A'), choiceField('method', 'Using', [['recursive', 'Recursion'], ['iterative', 'An explicit stack']])],
  examples: [
    { title: 'Deep first', about: 'Go as far as possible before coming back.', values: { edges: 'A-B, A-C, B-D, B-E, C-D, D-F', kind: 'undirected', start: 'A', method: 'recursive' } },
    { title: 'A stack', about: 'The same idea, with the stack made visible.', values: { edges: 'A-B, A-C, B-D, B-E, C-D, D-F', kind: 'undirected', start: 'A', method: 'iterative' } },
    { title: 'Finding a cycle', about: 'An edge back to a node on the stack means a cycle.', values: { edges: 'A-B, B-C, C-A, C-D', kind: 'directed', start: 'A', method: 'recursive' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed' });
    const start = nodeIn(g, input.start, 'Start');
    const visited: string[] = [];
    const finished: string[] = [];
    const stack: string[] = [];
    const parent: Record<string, string | null> = {};
    let cycle: string | null = null;
    const trace = new Trace();
    const scene = (active?: string, looking?: string): Panel[] => [
      graphPanel('The graph', g, {
        node: id => ({ tone: id === active ? 'active' : id === looking ? 'accent' : finished.includes(id) ? 'done' : visited.includes(id) || stack.includes(id) ? 'path' : 'muted', sub: visited.includes(id) ? `#${visited.indexOf(id) + 1}` : undefined }),
        edge: edge => (parent[edge.to] === edge.from || (!g.directed && parent[edge.from] === edge.to) ? { tone: 'done' } : undefined),
        legend: [{ tone: 'active', label: 'Current' }, { tone: 'path', label: 'On the stack' }, { tone: 'done', label: 'Finished' }],
      }),
      stackPanel(input.method === 'recursive' ? 'Call stack' : 'Stack', stack, { tone: i => (i === stack.length - 1 ? 'active' : undefined), empty: 'Empty' }),
      logPanel('Visit order', visited.map((node, i) => `${i + 1}. ${node}`)),
    ];
    if (input.method === 'recursive') {
      const walk = (node: string, from: string | null) => {
        visited.push(node);
        stack.push(node);
        parent[node] = from;
        trace.add(`Visit ${node}`, from ? `Go deeper from ${from} to ${node}.` : `Start at ${node}.`, scene(node), { tone: 'active' });
        for (const { to } of g.adj[node]) {
          if (!visited.includes(to)) walk(to, node);
          else if (stack.includes(to) && (g.directed || to !== from)) {
            cycle ??= `${node} → ${to}`;
            trace.add(`Cycle: ${node} to ${to}`, `${to} is still on the stack, so this edge closes a loop.`, scene(node, to), { tone: 'danger' });
          } else trace.add(`${to} is already visited`, 'Nothing new that way.', scene(node, to), { tone: 'muted' });
        }
        stack.pop();
        finished.push(node);
        trace.add(`Finish ${node}`, `${node} has no unvisited neighbors left, so go back${stack.length ? ` to ${stack.at(-1)}` : ''}.`, scene(stack.at(-1), undefined), { tone: 'done' });
      };
      walk(start, null);
    } else {
      stack.push(start);
      trace.add(`Push ${start}`, 'Start with one node on the stack.', scene(start), { tone: 'muted' });
      while (stack.length) {
        const node = stack.pop()!;
        if (visited.includes(node)) {
          trace.add(`${node} is already visited`, 'A node can be pushed twice before it is visited. Just skip the extra copy.', scene(undefined, node), { tone: 'muted' });
          continue;
        }
        visited.push(node);
        trace.add(`Visit ${node}`, 'Pop the top of the stack, and visit it.', scene(node), { tone: 'active' });
        for (const { to } of [...g.adj[node]].reverse()) {
          if (visited.includes(to)) continue;
          stack.push(to);
          parent[to] = node;
          trace.add(`Push ${to}`, 'Neighbors go on in reverse, so the earliest name comes off first.', scene(node, to), { tone: 'path' });
        }
        finished.push(node);
      }
    }
    const missing = g.nodes.filter(node => !visited.includes(node));
    trace.finish(`Reached ${visited.length} of ${g.nodes.length}`, `Order: ${visited.join(', ')}.${missing.length ? ` ${missing.join(', ')} can't be reached.` : ''}${cycle ? ` Found a cycle at ${cycle}.` : ''} Time: O(V + E).`, scene(), { metrics: [{ label: 'Visited', value: visited.length }, ...(input.method === 'recursive' ? [{ label: 'Cycle', value: cycle ? 'Yes' : 'No', tone: (cycle ? 'danger' : 'done') as Tone }] : [])] });
    return { frames: trace.frames, answer: { order: visited, cycle: Boolean(cycle) } };
  },
};

// ---------- 0-1 BFS ----------

const zeroOneBfs: SimulatorDef = {
  fields: [textField('edges', 'Edges with weight 0 or 1', 'A-B:0, A-C:1, B-C:1, B-D:1, C-D:0, D-E:1', { wide: true }), directedField(), textField('start', 'Start at', 'A')],
  examples: [
    { title: 'Free edges', about: 'Weight 0 goes to the front of the deque, and 1 to the back.', values: { edges: 'A-B:0, A-C:1, B-C:1, B-D:1, C-D:0, D-E:1', kind: 'undirected', start: 'A' } },
    { title: 'A longer free route', about: 'Three free hops beat one paid hop.', values: { edges: 'A-B:0, B-C:0, C-D:0, A-D:1', kind: 'directed', start: 'A' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed' });
    for (const edge of g.edges) if (edge.weight !== 0 && edge.weight !== 1) throw new Error(`The edge ${edge.from}-${edge.to} has weight ${edge.weight}. 0-1 BFS only allows weights 0 and 1.`);
    const start = nodeIn(g, input.start, 'Start');
    const dist: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, Infinity]));
    const parent: Record<string, string | null> = Object.fromEntries(g.nodes.map(node => [node, null]));
    dist[start] = 0;
    const deque = [start];
    const done = new Set<string>();
    const trace = new Trace();
    const scene = (active?: string, looking?: string): Panel[] => [
      graphPanel('The graph', g, { weights: true, node: id => ({ tone: id === active ? 'active' : id === looking ? 'accent' : done.has(id) ? 'done' : deque.includes(id) ? 'path' : 'muted', sub: dist[id] === Infinity ? undefined : `d ${dist[id]}` }), edge: edge => (parent[edge.to] === edge.from || (!g.directed && parent[edge.from] === edge.to) ? { tone: 'done' } : undefined) }),
      cells('Deque, front on the left', row(deque, { hideIndex: true, tone: i => (i === 0 ? 'active' : undefined) }), { zone: 'side' }),
      distanceTable(g, dist, parent, looking),
    ];
    trace.add('Start', 'A deque works like a priority queue here, since its distances never differ by more than 1.', scene(start), { tone: 'muted' });
    while (deque.length) {
      const node = deque.shift()!;
      if (done.has(node)) {
        trace.add(`Skip ${node}`, `${node} was already finished by a shorter path.`, scene(undefined, node), { tone: 'muted' });
        continue;
      }
      done.add(node);
      trace.add(`Take ${node}`, `The front of the deque has the smallest distance, ${dist[node]}.`, scene(node), { tone: 'active' });
      for (const { to, weight } of g.adj[node]) {
        const cost = dist[node] + weight;
        if (cost < dist[to]) {
          dist[to] = cost;
          parent[to] = node;
          if (weight === 0) deque.unshift(to);
          else deque.push(to);
          trace.add(`${to} improves to ${cost}`, weight === 0 ? 'The edge costs nothing, so its distance is as small as the current one. It goes to the front.' : 'The edge costs 1, so it goes to the back.', scene(node, to), { tone: 'new' });
        } else trace.add(`${to} stays at ${show(dist[to])}`, `Going through ${node} would cost ${cost}, which is no better.`, scene(node, to), { tone: 'muted' });
      }
    }
    trace.finish('Finished', `Each node was finished once, so this took O(V + E), with no heap needed. Distances: ${g.nodes.map(node => `${node} = ${show(dist[node])}`).join(', ')}.`, scene());
    return { frames: trace.frames, answer: { dist } };
  },
};

// ---------- A* ----------

const parseGrid = (text: string) => {
  const rows = text.split(/[/\n]+/).map(part => part.trim()).filter(Boolean);
  if (!rows.length) throw new Error('Draw the grid with rows of . and #, separated by /.');
  if (rows.length > 10 || rows.some(item => item.length > 12)) throw new Error('Keep the grid to 10 rows and 12 columns.');
  if (rows.some(item => item.length !== rows[0].length)) throw new Error('Every row of the grid must have the same length.');
  if (rows.some(item => /[^.#]/.test(item))) throw new Error('Use only . for open cells, and # for walls.');
  return rows;
};
const parseCell = (text: string, label: string, grid: string[]) => {
  const match = text.trim().match(/^(\d+)\s*[, ]\s*(\d+)$/);
  if (!match) throw new Error(`${label} must be a row and column, such as 0,3.`);
  const [r, c] = [Number(match[1]), Number(match[2])];
  if (r >= grid.length || c >= grid[0].length) throw new Error(`${label} is outside the grid.`);
  if (grid[r][c] === '#') throw new Error(`${label} is on a wall.`);
  return [r, c] as const;
};

const aSearch: SimulatorDef = {
  fields: [
    textField('grid', 'Grid (. open, # wall, / new row)', '..... / .###. / ...#. / .#... / .....', { wide: true }),
    textField('start', 'Start (row,col)', '0,0'),
    textField('goal', 'Goal (row,col)', '4,4'),
    choiceField('heuristic', 'Guess h(n)', [['manhattan', 'Manhattan distance'], ['euclid', 'Straight-line distance'], ['zero', 'None (same as Dijkstra)'], ['over', 'Too high (3 × Manhattan)']]),
  ],
  examples: [
    { title: 'Around a wall', about: 'The guess pulls the search toward the goal.', values: { grid: '.... / .##. / ....', start: '0,0', goal: '2,3', heuristic: 'manhattan' } },
    { title: 'No guess', about: 'With h = 0, it expands far more cells.', values: { grid: '..... / .###. / ...#. / .#... / .....', start: '0,0', goal: '4,4', heuristic: 'zero' } },
    { title: 'A guess that is too high', about: 'It can expand fewer cells, but the path is no longer guaranteed to be shortest.', values: { grid: '..... / .###. / ...#. / .#... / .....', start: '0,0', goal: '4,4', heuristic: 'over' } },
    { title: 'No way through', about: 'A wall cuts off the goal.', values: { grid: '..#.. / ..#.. / ..#..', start: '0,0', goal: '2,4', heuristic: 'manhattan' } },
  ],
  run(input) {
    const grid = parseGrid(input.grid);
    const [startR, startC] = parseCell(input.start, 'Start', grid);
    const [goalR, goalC] = parseCell(input.goal, 'Goal', grid);
    const heuristic = input.heuristic;
    const h = (r: number, c: number) => {
      const manhattan = Math.abs(r - goalR) + Math.abs(c - goalC);
      if (heuristic === 'zero') return 0;
      if (heuristic === 'over') return 3 * manhattan;
      if (heuristic === 'euclid') return Math.round(Math.hypot(r - goalR, c - goalC) * 10) / 10;
      return manhattan;
    };
    const key = (r: number, c: number) => `${r},${c}`;
    const best = new Map<string, number>([[key(startR, startC), 0]]);
    const parent = new Map<string, string>();
    const closed = new Set<string>();
    let open: { r: number; c: number; g: number; f: number; h: number }[] = [{ r: startR, c: startC, g: 0, h: h(startR, startC), f: h(startR, startC) }];
    const trace = new Trace();
    let path: string[] = [];
    const scene = (cr?: number, cc?: number): Panel[] => {
      const values = grid.map((line, r) => [...line].map((char, c) => {
        if (char === '#') return '■';
        if (r === startR && c === startC) return 'S';
        if (r === goalR && c === goalC) return 'G';
        const g = best.get(key(r, c));
        return g === undefined ? '' : `${g}+${h(r, c)}`;
      }));
      return [
        tablePanel('The grid: each cell shows g + h', values, {
          rowHead: grid.map((_, r) => r), colHead: [...grid[0]].map((_, c) => c),
          legend: [{ tone: 'active', label: 'Current' }, { tone: 'path', label: 'Waiting' }, { tone: 'muted', label: 'Expanded' }, { tone: 'done', label: 'Path' }],
          tone: (r, c) => {
            const id = key(r, c);
            if (grid[r][c] === '#') return 'op';
            if (path.includes(id)) return 'done';
            if (r === cr && c === cc) return 'active';
            if (closed.has(id)) return 'muted';
            if (open.some(item => item.r === r && item.c === c)) return 'path';
            return undefined;
          },
        }),
        tablePanel('Waiting, best first', [...open].sort(compare).slice(0, 10).map(item => [`${item.r},${item.c}`, item.g, item.h, Math.round(item.f * 10) / 10]), { colHead: ['Cell', 'g', 'h', 'f'], zone: 'side' }),
      ];
    };
    const compare = (a: { f: number; h: number; r: number; c: number }, b: { f: number; h: number; r: number; c: number }) => a.f - b.f || a.h - b.h || a.r - b.r || a.c - b.c;
    const metrics = (): Metric[] => [{ label: 'Expanded', value: closed.size }, { label: 'Waiting', value: open.length }];
    trace.add('Start', 'A* always expands the cell with the smallest f = g + h, where g is the cost so far and h is a guess of the cost left.', scene(startR, startC), { tone: 'muted', metrics: metrics() });
    let found = false;
    while (open.length) {
      open.sort(compare);
      const current = open.shift()!;
      const id = key(current.r, current.c);
      if (closed.has(id) && current.g >= (best.get(id) ?? Infinity)) continue;
      closed.delete(id);
      closed.add(id);
      trace.add(`Expand ${id}`, `f = ${current.g} + ${current.h} = ${Math.round(current.f * 10) / 10}, the smallest waiting. Ties go to the cell closest to the goal.`, scene(current.r, current.c), { tone: 'active', metrics: metrics() });
      if (current.r === goalR && current.c === goalC) {
        found = true;
        break;
      }
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = current.r + dr;
        const c = current.c + dc;
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] === '#') continue;
        const g = current.g + 1;
        if (g < (best.get(key(r, c)) ?? Infinity)) {
          best.set(key(r, c), g);
          parent.set(key(r, c), id);
          open = open.filter(item => !(item.r === r && item.c === c));
          open.push({ r, c, g, h: h(r, c), f: g + h(r, c) });
        }
      }
      trace.add(`Update neighbors of ${id}`, 'Each open neighbor costs one more step. Keep it if this is the cheapest way found so far.', scene(current.r, current.c), { tone: 'new', metrics: metrics() });
    }
    if (found) {
      let id = key(goalR, goalC);
      path = [id];
      while (parent.has(id)) {
        id = parent.get(id)!;
        path.unshift(id);
      }
    }
    const cost = found ? best.get(key(goalR, goalC))! : -1;
    trace.finish(found ? `Path cost ${cost}` : 'No path', found ? `Expanded ${closed.size} cells. ${heuristic === 'over' ? 'This guess can overestimate, so the path may not be the shortest.' : heuristic === 'zero' ? 'With no guess, A* behaves exactly like Dijkstra.' : 'This guess never overestimates, so the path is guaranteed to be shortest.'}` : `All ${closed.size} reachable cells were expanded, and the goal wasn't one of them.`, scene(), { tone: found ? 'done' : 'danger', metrics: [{ label: 'Path cost', value: found ? cost : 'None', tone: found ? 'done' : 'danger' }, { label: 'Expanded', value: closed.size }] });
    return { frames: trace.frames, answer: { cost, expanded: closed.size, path } };
  },
};

// ---------- Adjacency List vs Matrix ----------

const adjacency: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B, A-C, B-D, C-D, D-E', { wide: true }), directedField(), textField('from', 'Check edge from', 'A'), textField('to', 'to', 'D')],
  examples: [
    { title: 'A sparse graph', about: 'The list uses far less memory than the matrix.', values: { edges: 'A-B, B-C, C-D, D-E, E-F, F-G', kind: 'undirected', from: 'A', to: 'G' } },
    { title: 'A dense graph', about: 'Now the memory use is much closer.', values: { edges: 'A-B, A-C, A-D, B-C, B-D, C-D', kind: 'undirected', from: 'A', to: 'D' } },
    { title: 'One-way edges', about: 'The matrix stops being symmetric.', values: { edges: 'A-B, B-C, C-A', kind: 'directed', from: 'B', to: 'A' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed', maxNodes: 9 });
    const from = nodeIn(g, input.from, 'The first node');
    const to = nodeIn(g, input.to, 'The second node');
    const n = g.nodes.length;
    const matrix = g.nodes.map(() => g.nodes.map(() => 0));
    const lists: Record<string, string[]> = Object.fromEntries(g.nodes.map(node => [node, []]));
    const added: GraphEdgeInput[] = [];
    const trace = new Trace();
    const index = (name: string) => g.nodes.indexOf(name);
    const memory = () => [{ label: 'Matrix cells', value: n * n }, { label: 'List entries', value: n + Object.values(lists).reduce((total, items) => total + items.length, 0) }];
    const scene = (edge?: GraphEdgeInput, marks?: { list?: [string, number]; cell?: [number, number] }): Panel[] => [
      graphPanel('The graph', { ...g, edges: added }, { edge: item => (item === edge ? { tone: 'new' } : undefined) }),
      tablePanel('Adjacency matrix', matrix, {
        rowHead: g.nodes, colHead: g.nodes, tone: (r, c) => {
          if (marks?.cell && marks.cell[0] === r && marks.cell[1] === c) return 'active';
          if (edge && ((index(edge.from) === r && index(edge.to) === c) || (!g.directed && index(edge.to) === r && index(edge.from) === c))) return 'new';
          return matrix[r][c] ? 'value' : 'muted';
        },
      }),
      bucketsPanel('Adjacency list', g.nodes.map(node => ({
        label: node,
        tone: edge && (edge.from === node || (!g.directed && edge.to === node)) ? 'new' as Tone : undefined,
        items: lists[node].map((item, i) => ({ value: item, tone: marks?.list?.[0] === node && marks.list[1] === i ? 'active' as Tone : undefined })),
      })), { chained: true, zone: 'side' }),
    ];
    trace.group = 'Add each edge';
    for (const edge of g.edges) {
      added.push(edge);
      matrix[index(edge.from)][index(edge.to)] = 1;
      lists[edge.from].push(edge.to);
      if (!g.directed) {
        matrix[index(edge.to)][index(edge.from)] = 1;
        lists[edge.to].push(edge.from);
      }
      trace.add(`Add ${edge.from}-${edge.to}`, g.directed ? 'One cell, and one list entry.' : 'A two-way edge sets two cells, and adds to two lists.', scene(edge), { tone: 'new', metrics: memory() });
    }
    trace.group = `Is there an edge from ${from} to ${to}?`;
    trace.add('Matrix: one step', `Look at row ${from}, column ${to} directly. It holds ${matrix[index(from)][index(to)]}.`, scene(undefined, { cell: [index(from), index(to)] }), { tone: 'active', metrics: memory() });
    let scans = 0;
    let exists = false;
    for (let i = 0; i < lists[from].length; i++) {
      scans++;
      exists = lists[from][i] === to;
      trace.add(`List: check ${lists[from][i]}`, exists ? 'This is the node we want.' : `${lists[from][i]} isn't ${to}, so keep walking the list.`, scene(undefined, { list: [from, i] }), { tone: exists ? 'done' : 'active', metrics: memory() });
      if (exists) break;
    }
    if (!lists[from].length) trace.add('List: nothing to check', `${from} has no neighbors.`, scene(), { tone: 'muted', metrics: memory() });
    trace.group = undefined;
    trace.finish(exists ? 'The edge exists' : 'No such edge', `The matrix answered in 1 step, and the list took ${scans}. The matrix uses ${n * n} cells, and the list uses ${memory()[1].value} entries. Use a list for sparse graphs, and a matrix when you check edges often on a dense graph.`, scene(), { metrics: [...memory(), { label: 'List scans', value: scans }] });
    return { frames: trace.frames, answer: { matrix, lists, exists } };
  },
};

// ---------- Bellman-Ford ----------

const bellmanFord: SimulatorDef = {
  fields: [textField('edges', 'One-way edges', 'A-B:4, A-C:5, C-B:-3, B-D:2', { wide: true }), textField('start', 'Start at', 'A')],
  examples: [
    { title: 'A negative edge', about: 'Going through C is cheaper, and a greedy method would miss it.', values: { edges: 'A-B:4, A-C:5, C-B:-3, B-D:2', start: 'A' } },
    { title: 'A negative cycle', about: 'The loop A → B → C → A keeps getting cheaper.', values: { edges: 'A-B:1, B-C:-3, C-A:1, C-D:2', start: 'A' } },
    { title: 'Stopping early', about: 'A round with no changes ends the run.', values: { edges: 'A-B:1, B-C:1, C-D:1', start: 'A' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: true, allowNegative: true, maxNodes: 9, maxEdges: 16 });
    const start = nodeIn(g, input.start, 'Start');
    const dist: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, Infinity]));
    const parent: Record<string, string | null> = Object.fromEntries(g.nodes.map(node => [node, null]));
    dist[start] = 0;
    const trace = new Trace();
    let relaxations = 0;
    const scene = (edge?: GraphEdgeInput, tone: Tone = 'active', changed?: string): Panel[] => [
      graphPanel('The graph', g, { weights: true, node: id => ({ tone: id === changed ? 'new' : dist[id] === Infinity ? 'muted' : 'value', sub: `${show(dist[id])}` }), edge: item => (item === edge ? { tone } : parent[item.to] === item.from ? { tone: 'done' } : undefined) }),
      distanceTable(g, dist, parent, changed),
    ];
    const metrics = (round: number): Metric[] => [{ label: 'Round', value: `${round} of ${g.nodes.length - 1}` }, { label: 'Improvements', value: relaxations }];
    let finalRound = 0;
    for (let round = 1; round <= g.nodes.length - 1; round++) {
      trace.group = `Round ${round}`;
      finalRound = round;
      let changed = false;
      for (const edge of g.edges) {
        const through = dist[edge.from] + edge.weight;
        if (dist[edge.from] === Infinity) {
          trace.add(`Skip ${edge.from} → ${edge.to}`, `${edge.from} hasn't been reached yet.`, scene(edge, 'muted'), { tone: 'muted', metrics: metrics(round) });
        } else if (through < dist[edge.to]) {
          dist[edge.to] = through;
          parent[edge.to] = edge.from;
          relaxations++;
          changed = true;
          trace.add(`${edge.to} improves to ${through}`, `${edge.from} (${dist[edge.from]}) + ${edge.weight} = ${through}, which beats the old distance.`, scene(edge, 'new', edge.to), { tone: 'new', metrics: metrics(round) });
        } else {
          trace.add(`${edge.from} → ${edge.to}: no change`, `${dist[edge.from]} + ${edge.weight} = ${through}, which is no better than ${show(dist[edge.to])}.`, scene(edge), { tone: 'muted', metrics: metrics(round) });
        }
      }
      if (!changed) {
        trace.add('Nothing changed', 'A full round with no improvements means every distance is final, so the run can stop early.', scene(), { tone: 'done', metrics: metrics(round) });
        break;
      }
    }
    trace.group = 'Check for a negative cycle';
    let cycle: GraphEdgeInput | null = null;
    for (const edge of g.edges) {
      const better = dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to];
      trace.add(`Test ${edge.from} → ${edge.to}`, better ? 'This edge could still improve a distance after every round, which only a negative cycle can cause.' : 'This edge is settled.', scene(edge, better ? 'danger' : 'done'), { tone: better ? 'danger' : 'muted', metrics: metrics(finalRound) });
      if (better) {
        cycle = edge;
        break;
      }
    }
    trace.group = undefined;
    trace.finish(cycle ? 'Negative cycle found' : 'Finished', cycle ? `A loop reachable from ${start} has a negative total, so distances could fall forever. Shortest distances aren't defined here.` : `Distances: ${g.nodes.map(node => `${node} = ${show(dist[node])}`).join(', ')}. Time: O(V × E).`, scene(), { tone: cycle ? 'danger' : 'done', metrics: [{ label: 'Rounds', value: finalRound }, { label: 'Negative cycle', value: cycle ? 'Yes' : 'No', tone: cycle ? 'danger' : 'done' }] });
    return { frames: trace.frames, answer: { dist, negativeCycle: Boolean(cycle) } };
  },
};

// ---------- Bidirectional Search ----------

const bidirectional: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B, B-C, C-D, D-E, E-F, F-G, B-H, F-I', { wide: true }), textField('start', 'Start at', 'A'), textField('goal', 'Goal', 'G')],
  examples: [
    { title: 'A long line', about: 'The two searches meet in the middle.', values: { edges: 'A-B, B-C, C-D, D-E, E-F, F-G', start: 'A', goal: 'G' } },
    { title: 'Branching', about: 'Less gets explored than one full search would need.', values: { edges: 'A-B, A-C, B-D, B-E, C-F, C-G, D-H, E-H, F-H, H-I', start: 'A', goal: 'I' } },
    { title: 'No route', about: 'One side runs out of nodes, which proves there is no path.', values: { edges: 'A-B, B-C, X-Y', start: 'A', goal: 'Y' } },
  ],
  run(input) {
    const g = graph(input.edges, {});
    const start = nodeIn(g, input.start, 'Start');
    const goal = nodeIn(g, input.goal, 'Goal');
    const sides = {
      a: { dist: { [start]: 0 } as Record<string, number>, front: [start], parent: { [start]: null } as Record<string, string | null>, name: 'the start' },
      b: { dist: { [goal]: 0 } as Record<string, number>, front: [goal], parent: { [goal]: null } as Record<string, string | null>, name: 'the goal' },
    };
    const trace = new Trace();
    let path: string[] = [];
    const scene = (active?: string): Panel[] => [
      graphPanel('The graph', g, {
        node: id => {
          const inA = id in sides.a.dist;
          const inB = id in sides.b.dist;
          return { tone: path.includes(id) ? 'done' : id === active ? 'active' : inA && inB ? 'accent' : inA ? 'value' : inB ? 'path' : 'muted', sub: inA ? `s ${sides.a.dist[id]}` : inB ? `g ${sides.b.dist[id]}` : undefined };
        },
        edge: edge => (onPath(edge, path, false) ? { tone: 'done' } : undefined),
        legend: [{ tone: 'value', label: 'From the start' }, { tone: 'path', label: 'From the goal' }, { tone: 'accent', label: 'Meeting' }],
      }),
      cells('Frontiers', [row(sides.a.front, { label: 'Start', hideIndex: true, tone: () => 'value' }), row(sides.b.front, { label: 'Goal', hideIndex: true, tone: () => 'path' })], { zone: 'side' }),
    ];
    const seen = () => new Set([...Object.keys(sides.a.dist), ...Object.keys(sides.b.dist)]).size;
    const metrics = (): Metric[] => [{ label: 'Nodes explored', value: seen() }];
    trace.add('Start', 'Search from both ends at once. Each side only needs to go about half the distance.', scene(), { tone: 'muted', metrics: metrics() });
    let best = start === goal ? 0 : -1;
    let meet = start === goal ? start : null;
    let current = sides.a;
    let other = sides.b;
    let level = 0;
    while (best < 0 && current.front.length && other.front.length) {
      if (current.front.length >= other.front.length) [current, other] = [other, current];
      level++;
      trace.group = `Level ${level}: from ${current.name}`;
      const next: string[] = [];
      let found = Infinity;
      for (const node of current.front) {
        trace.add(`Expand ${node}`, `The frontier from ${current.name} is the smaller one, so it moves next.`, scene(node), { tone: 'active', metrics: metrics() });
        for (const { to } of g.adj[node]) {
          if (to in other.dist) {
            const total = current.dist[node] + 1 + other.dist[to];
            if (total < found) {
              found = total;
              meet = to;
              if (!(to in current.dist)) current.parent[to] = node;
              else if (current.dist[node] + 1 < current.dist[to]) current.parent[to] = node;
            }
          }
          if (!(to in current.dist)) {
            current.dist[to] = current.dist[node] + 1;
            current.parent[to] = current.parent[to] ?? node;
            next.push(to);
          }
        }
      }
      if (found !== Infinity) {
        best = found;
        trace.add(`The searches meet at ${meet}`, 'This whole level was checked first, so the meeting point on the shortest route was not missed.', scene(meet ?? undefined), { tone: 'accent', metrics: metrics() });
        break;
      }
      current.front = next;
      trace.add(`Frontier: ${next.join(', ') || 'empty'}`, next.length ? 'These nodes form the next layer.' : 'This side has no nodes left, so no route exists.', scene(), { tone: 'path', metrics: metrics() });
    }
    trace.group = undefined;
    if (best >= 0 && meet) {
      const walk = (side: typeof sides.a, node: string) => {
        const steps = [node];
        while (side.parent[steps[0]]) steps.unshift(side.parent[steps[0]]!);
        return steps;
      };
      path = [...walk(sides.a, meet), ...walk(sides.b, meet).reverse().slice(1)];
    }
    trace.finish(best >= 0 ? `Shortest route: ${best}` : 'No route', best >= 0 ? `${path.join(' → ')}. Only ${seen()} of ${g.nodes.length} nodes were explored.` : `One side ran out of nodes, so ${start} and ${goal} aren't connected.`, scene(), { tone: best >= 0 ? 'done' : 'danger', metrics: [{ label: 'Hops', value: best >= 0 ? best : 'None' }, ...metrics()] });
    return { frames: trace.frames, answer: { hops: best, path } };
  },
};

// ---------- Dijkstra ----------

const dijkstra: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B:4, A-C:1, B-C:2, B-D:1, C-D:5', { wide: true }), directedField(), textField('start', 'Start at', 'A'), textField('goal', 'Show the path to', 'D')],
  examples: [
    { title: 'A shortcut', about: 'A → C → B costs 3, which beats the direct edge.', values: { edges: 'A-B:4, A-C:1, B-C:2, B-D:1, C-D:5', kind: 'undirected', start: 'A', goal: 'D' } },
    { title: 'One-way roads', about: 'Some nodes can\'t be reached.', values: { edges: 'A-B:2, B-C:3, D-A:1', kind: 'directed', start: 'A', goal: 'C' } },
    { title: 'A larger map', about: 'Six nodes, and several competing routes.', values: { edges: 'A-B:7, A-C:9, A-F:14, B-C:10, B-D:15, C-D:11, C-F:2, D-E:6, E-F:9', kind: 'undirected', start: 'A', goal: 'E' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed' });
    const start = nodeIn(g, input.start, 'Start');
    const goal = nodeIn(g, input.goal, 'The target');
    const dist: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, Infinity]));
    const parent: Record<string, string | null> = Object.fromEntries(g.nodes.map(node => [node, null]));
    const done = new Set<string>();
    dist[start] = 0;
    const trace = new Trace();
    let path: string[] = [];
    const waiting = () => g.nodes.filter(node => !done.has(node) && dist[node] !== Infinity).sort((a, b) => dist[a] - dist[b] || a.localeCompare(b));
    const scene = (active?: string, looking?: string, edge?: [string, string]): Panel[] => [
      graphPanel('The graph', g, {
        weights: true,
        node: id => ({ tone: path.includes(id) ? 'done' : id === active ? 'active' : id === looking ? 'accent' : done.has(id) ? 'value' : dist[id] !== Infinity ? 'path' : 'muted', sub: `${show(dist[id])}` }),
        edge: item => (path.length && onPath(item, path, g.directed) ? { tone: 'done' } : edge && sameEdge(item, edge[0], edge[1], g.directed) ? { tone: 'active' } : parent[item.to] === item.from || (!g.directed && parent[item.from] === item.to) ? { tone: 'value' } : undefined),
        legend: [{ tone: 'active', label: 'Current' }, { tone: 'path', label: 'Waiting' }, { tone: 'value', label: 'Final distance' }],
      }),
      distanceTable(g, dist, parent, looking),
      cells('Waiting, nearest first', row(waiting().map(node => `${node}:${dist[node]}`), { hideIndex: true }), { zone: 'side' }),
    ];
    const metrics = (): Metric[] => [{ label: 'Finished', value: `${done.size} of ${g.nodes.length}` }];
    trace.add('Start', `Every distance starts at ∞, except ${start}, which is 0.`, scene(start), { tone: 'muted', metrics: metrics() });
    while (true) {
      const [node] = waiting();
      if (!node) break;
      done.add(node);
      trace.group = `Finish ${node}`;
      trace.add(`${node} is final at ${dist[node]}`, 'It has the smallest distance waiting. With no negative edges, no later route can beat it.', scene(node), { tone: 'active', metrics: metrics() });
      for (const { to, weight } of g.adj[node]) {
        if (done.has(to)) continue;
        const through = dist[node] + weight;
        if (through < dist[to]) {
          const old = dist[to];
          dist[to] = through;
          parent[to] = node;
          trace.add(`${to} improves to ${through}`, `${dist[node]} + ${weight} = ${through}, which beats ${show(old)}.`, scene(node, to, [node, to]), { tone: 'new', metrics: metrics() });
        } else trace.add(`${to} stays at ${dist[to]}`, `${dist[node]} + ${weight} = ${through}, which is no better.`, scene(node, to, [node, to]), { tone: 'muted', metrics: metrics() });
      }
    }
    trace.group = undefined;
    const reachable = dist[goal] !== Infinity;
    if (reachable) path = pathTo(parent, goal);
    trace.finish(reachable ? `${goal}: distance ${dist[goal]}` : `${goal} can't be reached`, reachable ? `Route: ${path.join(' → ')}. Time with a heap: O((V + E) log V).` : `No route leads from ${start} to ${goal}.`, scene(), { tone: reachable ? 'done' : 'danger', metrics: [{ label: 'Distance', value: show(dist[goal]), tone: reachable ? 'done' : 'danger' }, { label: 'Route', value: reachable ? path.join(' → ') : 'None' }] });
    return { frames: trace.frames, answer: { dist, path } };
  },
};

// ---------- Floyd-Warshall ----------

const floydWarshall: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B:3, B-C:-2, A-C:8, C-D:1, D-A:2', { wide: true }), directedField('directed')],
  examples: [
    { title: 'All pairs', about: 'Every pair of nodes gets its shortest distance.', values: { edges: 'A-B:3, B-C:-2, A-C:8, C-D:1, D-A:2', kind: 'directed' } },
    { title: 'A negative cycle', about: 'A negative number on the diagonal gives it away.', values: { edges: 'A-B:1, B-C:-3, C-A:1', kind: 'directed' } },
    { title: 'Two-way edges', about: 'The final table is symmetric.', values: { edges: 'A-B:4, B-C:1, A-C:7, C-D:3', kind: 'undirected' } },
  ],
  run(input) {
    const directed = input.kind === 'directed';
    const g = graph(input.edges, { directed, allowNegative: directed, maxNodes: 7, maxEdges: 20 });
    const names = g.nodes;
    const n = names.length;
    const dist = names.map((_, i) => names.map((_, j) => (i === j ? 0 : Infinity)));
    for (const { from, to, weight } of g.edges) {
      dist[names.indexOf(from)][names.indexOf(to)] = weight;
      if (!directed) dist[names.indexOf(to)][names.indexOf(from)] = weight;
    }
    const trace = new Trace();
    let checks = 0;
    let improvements = 0;
    const scene = (k?: number, i?: number, j?: number): Panel[] => [
      tablePanel('Shortest distances so far', dist.map(line => line.map(show)), {
        rowHead: names, colHead: names, corner: 'From \\ To',
        legend: [{ tone: 'new', label: 'Improved' }, { tone: 'path', label: 'Row and column of k' }],
        tone: (r, c) => {
          if (r === i && c === j) return 'new';
          if (r === c && dist[r][c] < 0) return 'danger';
          if (k !== undefined && (r === k || c === k)) return 'path';
          return dist[r][c] === Infinity ? 'muted' : undefined;
        },
      }),
      graphPanel('The graph', g, { weights: true, node: id => (k !== undefined && id === names[k] ? { tone: 'accent' } : { tone: 'value' }) }),
    ];
    const metrics = (): Metric[] => [{ label: 'Pairs checked', value: checks }, { label: 'Improvements', value: improvements }];
    trace.add('Start', 'The table starts with the direct edges only. ∞ means no direct edge.', scene(), { tone: 'muted', metrics: metrics() });
    for (let k = 0; k < n; k++) {
      trace.group = `Allow going through ${names[k]}`;
      trace.add(`Use ${names[k]} as a stop`, `For each pair, is going through ${names[k]} shorter? The row and column of ${names[k]} don't change in this round.`, scene(k), { tone: 'accent', metrics: metrics() });
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          checks++;
          if (dist[i][k] === Infinity || dist[k][j] === Infinity) continue;
          const through = dist[i][k] + dist[k][j];
          if (through < dist[i][j]) {
            const old = dist[i][j];
            dist[i][j] = through;
            improvements++;
            trace.add(`${names[i]} → ${names[j]} is now ${through}`, `Through ${names[k]}: ${dist[i][k]} + ${dist[k][j]} = ${through}, which beats ${show(old)}.`, scene(k, i, j), { tone: 'new', metrics: metrics() });
          }
        }
      }
    }
    trace.group = undefined;
    const negative = names.some((_, i) => dist[i][i] < 0);
    trace.finish(negative ? 'Negative cycle found' : 'Finished', negative ? 'A node has a negative distance to itself, so a negative cycle exists, and the distances that pass through it have no meaning.' : `Checked ${checks} pairs in three nested loops: O(V³). The table now holds the shortest distance for every pair.`, scene(), { tone: negative ? 'danger' : 'done', metrics: metrics() });
    return { frames: trace.frames, answer: { names, dist, negative } };
  },
};

// ---------- Graph Basics ----------

const graphBasics: SimulatorDef = {
  fields: [textField('edges', 'Edges (a name alone adds a lone node)', 'A-B, B-C, C-A, C-D, E-F, G', { wide: true }), directedField()],
  examples: [
    { title: 'Several pieces', about: 'Three connected components, one of which is a lone node.', values: { edges: 'A-B, B-C, C-A, C-D, E-F, G', kind: 'undirected' } },
    { title: 'A tree', about: 'Connected with no cycles: exactly n - 1 edges.', values: { edges: 'A-B, A-C, B-D, B-E', kind: 'undirected' } },
    { title: 'A one-way cycle', about: 'Each node has both an in-degree and an out-degree.', values: { edges: 'A-B, B-C, C-A', kind: 'directed' } },
    { title: 'A complete graph', about: 'Every pair is joined.', values: { edges: 'A-B, A-C, A-D, B-C, B-D, C-D', kind: 'undirected' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed' });
    const trace = new Trace();
    const outDegree: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, 0]));
    const inDegree: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, 0]));
    const added: GraphEdgeInput[] = [];
    const table = () => g.nodes.map(node => (g.directed ? [node, inDegree[node], outDegree[node]] : [node, outDegree[node]]));
    const head = g.directed ? ['Node', 'In', 'Out'] : ['Node', 'Degree'];
    const scene = (edge?: GraphEdgeInput): Panel[] => [
      graphPanel('The graph', { ...g, edges: added }, { node: id => (edge && (edge.from === id || edge.to === id) ? { tone: 'active' } : { tone: 'value' }), edge: item => (item === edge ? { tone: 'new' } : undefined) }),
      tablePanel('Degrees', table(), { colHead: head, zone: 'side', tone: r => (edge && (g.nodes[r] === edge.from || g.nodes[r] === edge.to) ? 'new' : undefined) }),
    ];
    trace.group = 'Add each edge';
    for (const edge of g.edges) {
      added.push(edge);
      outDegree[edge.from]++;
      if (g.directed) inDegree[edge.to]++;
      else outDegree[edge.to]++;
      trace.add(`Add ${edge.from}${g.directed ? ' → ' : '-'}${edge.to}`, g.directed ? `This adds 1 to the out-degree of ${edge.from}, and 1 to the in-degree of ${edge.to}.` : `This adds 1 to the degree of both ${edge.from} and ${edge.to}.`, scene(edge), { tone: 'new', metrics: [{ label: 'Nodes', value: g.nodes.length }, { label: 'Edges', value: added.length }] });
    }
    trace.group = 'Find the connected pieces';
    const links: Record<string, string[]> = Object.fromEntries(g.nodes.map(node => [node, []]));
    for (const { from, to } of g.edges) {
      links[from].push(to);
      links[to].push(from);
    }
    const parts: string[][] = [];
    const seen = new Set<string>();
    const tones: Tone[] = ['value', 'done', 'accent', 'path', 'active', 'danger'];
    for (const node of g.nodes) {
      if (seen.has(node)) continue;
      const part: string[] = [];
      const queue = [node];
      seen.add(node);
      while (queue.length) {
        const current = queue.shift()!;
        part.push(current);
        for (const next of links[current]) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      parts.push(part);
      trace.add(`Piece ${parts.length}: ${part.join(', ')}`, `Start from ${node}, and follow edges as far as they go.${g.directed ? ' Direction is ignored here, which gives weakly connected pieces.' : ''}`, [
        graphPanel('The graph', g, { node: id => { const at = parts.findIndex(item => item.includes(id)); return { tone: at < 0 ? 'muted' : tones[at % tones.length] }; } }),
        tablePanel('Degrees', table(), { colHead: head, zone: 'side' }),
      ], { tone: 'path' });
    }
    trace.group = undefined;
    const n = g.nodes.length;
    const m = g.edges.length;
    const most = g.directed ? n * (n - 1) : (n * (n - 1)) / 2;
    const density = most ? Math.round((m / most) * 100) / 100 : 0;
    const total = Object.values(outDegree).reduce((a, b) => a + b, 0) + Object.values(inDegree).reduce((a, b) => a + b, 0);
    const isTree = !g.directed && parts.length === 1 && m === n - 1;
    trace.finish(`${n} nodes, ${m} edges`, `The degrees add up to ${total}, which is exactly 2 × ${m}, as every edge has two ends. ${parts.length === 1 ? 'The graph is connected.' : `The graph has ${parts.length} separate pieces.`}${isTree ? ' It is connected with n - 1 edges, so it is a tree.' : ''}`, [
      graphPanel('The graph', g, { node: id => ({ tone: tones[parts.findIndex(item => item.includes(id)) % tones.length] }) }),
      factsPanel('Properties', [{ label: 'Nodes', value: n }, { label: 'Edges', value: m }, { label: 'Density', value: density }, { label: 'Pieces', value: parts.length }, { label: 'A tree', value: isTree ? 'Yes' : 'No' }]),
      tablePanel('Degrees', table(), { colHead: head, zone: 'side' }),
    ]);
    return { frames: trace.frames, answer: { n, m, degrees: outDegree, inDegree, pieces: parts.length, isTree, density } };
  },
};

// ---------- Graph Coloring ----------

const COLOR_TONES: Tone[] = ['value', 'done', 'accent', 'active', 'danger', 'path', 'muted'];

const graphColoring: SimulatorDef = {
  fields: [
    textField('edges', 'Edges', 'A-B, A-C, B-C, B-D, C-E, D-E, D-F, E-F', { wide: true }),
    choiceField('method', 'Method', [['greedy', 'Greedy, in name order'], ['largest', 'Greedy, most edges first'], ['backtrack', 'Backtracking, with k colors'], ['two', 'Two-coloring check']]),
    whenChoice(numberField('k', 'Colors k', 3, 1, 6), 'method', 'backtrack'),
  ],
  examples: [
    { title: 'Greedy', about: 'Each node takes the smallest color its neighbors don\'t use.', values: { edges: 'A-B, A-C, B-C, B-D, C-E, D-E, D-F, E-F', method: 'greedy', k: '3' } },
    { title: 'Greedy can waste colors', about: 'A bad order uses 3 colors on a graph that needs only 2.', values: { edges: 'A-D, A-F, B-C, B-E, C-F, D-E', method: 'greedy', k: '2' } },
    { title: 'Backtracking', about: 'Undoes a choice when it runs out of colors.', values: { edges: 'A-B, B-C, C-D, D-A, A-C', method: 'backtrack', k: '3' } },
    { title: 'Bipartite or not', about: 'An odd cycle can\'t use two colors.', values: { edges: 'A-B, B-C, C-A', method: 'two', k: '2' } },
  ],
  run(input) {
    const g = graph(input.edges, { maxNodes: 10 });
    const method = input.method;
    const k = integer(input.k, 'k', 1, 6);
    const color: Record<string, number> = {};
    const trace = new Trace();
    const scene = (active?: string, conflict?: string): Panel[] => [
      graphPanel('The graph', g, {
        node: id => (id === conflict ? { tone: 'danger', sub: color[id] === undefined ? undefined : `c${color[id] + 1}` } : id === active && color[id] === undefined ? { tone: 'active' } : color[id] === undefined ? { tone: 'muted' } : { tone: COLOR_TONES[color[id] % COLOR_TONES.length], sub: `c${color[id] + 1}` }),
        edge: edge => (color[edge.from] !== undefined && color[edge.from] === color[edge.to] ? { tone: 'danger' } : undefined),
      }),
      tablePanel('Colors', g.nodes.map(node => [node, color[node] === undefined ? '-' : color[node] + 1]), { colHead: ['Node', 'Color'], zone: 'side', tone: (r, c) => (c === 1 && color[g.nodes[r]] !== undefined ? COLOR_TONES[color[g.nodes[r]] % COLOR_TONES.length] : undefined) }),
    ];
    const used = () => new Set(Object.values(color)).size;
    const metrics = (extra: Metric[] = []): Metric[] => [{ label: 'Colors used', value: used() }, ...extra];
    let ok = true;
    let backs = 0;
    if (method === 'greedy' || method === 'largest') {
      const order = method === 'largest' ? [...g.nodes].sort((a, b) => g.adj[b].length - g.adj[a].length || a.localeCompare(b)) : g.nodes;
      trace.add('Start', `Color in this order: ${order.join(', ')}.`, scene(), { tone: 'muted', metrics: metrics() });
      for (const node of order) {
        const taken = new Set(g.adj[node].map(({ to }) => color[to]).filter(value => value !== undefined));
        let pick = 0;
        while (taken.has(pick)) pick++;
        color[node] = pick;
        trace.add(`${node} gets color ${pick + 1}`, taken.size ? `Its neighbors use color${taken.size === 1 ? '' : 's'} ${[...taken].map(value => value + 1).sort((a, b) => a - b).join(', ')}, so color ${pick + 1} is the smallest free one.` : 'None of its neighbors have a color yet, so it takes color 1.', scene(node), { tone: 'new', metrics: metrics() });
      }
    } else if (method === 'two') {
      trace.add('Start', 'Walk the graph with BFS, giving each neighbor the opposite color. A conflict means an odd cycle.', scene(), { tone: 'muted', metrics: metrics() });
      for (const first of g.nodes) {
        if (color[first] !== undefined) continue;
        color[first] = 0;
        trace.add(`${first} gets color 1`, 'Start a new piece of the graph.', scene(first), { tone: 'new', metrics: metrics() });
        const queue = [first];
        while (queue.length && ok) {
          const node = queue.shift()!;
          for (const { to } of g.adj[node]) {
            if (color[to] === undefined) {
              color[to] = 1 - color[node];
              queue.push(to);
              trace.add(`${to} gets color ${color[to] + 1}`, `It must differ from ${node}.`, scene(to), { tone: 'new', metrics: metrics() });
            } else if (color[to] === color[node]) {
              ok = false;
              trace.add(`Conflict: ${node} and ${to}`, 'Both must have the same color, which can\'t work, so the graph isn\'t bipartite.', scene(node, to), { tone: 'danger', metrics: metrics() });
              break;
            }
          }
        }
        if (!ok) break;
      }
    } else {
      trace.add('Start', `Try to color every node with at most ${k} colors. If a node has no legal color, go back and change an earlier one.`, scene(), { tone: 'muted', metrics: metrics() });
      const place = (index: number): boolean => {
        if (index === g.nodes.length) return true;
        const node = g.nodes[index];
        for (let pick = 0; pick < k; pick++) {
          const clash = g.adj[node].find(({ to }) => color[to] === pick);
          if (clash) {
            trace.add(`${node} can't use color ${pick + 1}`, `Its neighbor ${clash.to} has that color.`, scene(node), { tone: 'muted', metrics: metrics([{ label: 'Backtracks', value: backs }]) });
            continue;
          }
          color[node] = pick;
          trace.add(`Try ${node} with color ${pick + 1}`, 'This is legal so far, so move on to the next node.', scene(node), { tone: 'new', metrics: metrics([{ label: 'Backtracks', value: backs }]) });
          if (place(index + 1)) return true;
          delete color[node];
          backs++;
          trace.add(`Undo ${node}`, 'That choice led to a dead end, so try its next color.', scene(node), { tone: 'danger', metrics: metrics([{ label: 'Backtracks', value: backs }]) });
        }
        return false;
      };
      ok = place(0);
    }
    const legal = g.edges.every(edge => color[edge.from] === undefined || color[edge.from] !== color[edge.to]);
    const title = method === 'two' ? (ok ? 'Bipartite' : 'Not bipartite') : method === 'backtrack' ? (ok ? `Colored with ${used()} colors` : `Not possible with ${k} colors`) : `Used ${used()} colors`;
    const detail = method === 'two' ? (ok ? 'Two colors are enough, so the nodes split into two groups with edges only between them.' : 'An odd cycle exists, so two colors aren\'t enough.') : method === 'backtrack' ? (ok ? `A legal coloring with at most ${k} colors was found, after ${backs} backtrack${backs === 1 ? '' : 's'}.` : `Every choice was tried, and ${k} color${k === 1 ? ' isn\'t' : 's aren\'t'} enough.`) : 'No two joined nodes share a color. Greedy is fast, but it may not use the fewest colors. Finding the true minimum is NP-hard.';
    trace.finish(title, detail, scene(), { tone: ok ? 'done' : 'danger', metrics: metrics() });
    return { frames: trace.frames, answer: { color, ok, used: used(), legal } };
  },
};

// ---------- Iterative Deepening DFS ----------

const iddfs: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B, A-C, B-D, B-E, C-F, E-G', { wide: true }), directedField(), textField('start', 'Start at', 'A'), textField('goal', 'Goal', 'G')],
  examples: [
    { title: 'Growing limits', about: 'Each round restarts, and goes one level deeper.', values: { edges: 'A-B, A-C, B-D, B-E, C-F, E-G', kind: 'undirected', start: 'A', goal: 'G' } },
    { title: 'A shallow goal', about: 'Finds it quickly, and never explores the deep branch.', values: { edges: 'A-B, B-C, C-D, D-E, E-F, A-G', kind: 'undirected', start: 'A', goal: 'G' } },
    { title: 'No path', about: 'The limit stops growing once nothing deeper exists.', values: { edges: 'A-B, B-C, X-Y', kind: 'undirected', start: 'A', goal: 'Y' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: input.kind === 'directed', maxNodes: 10 });
    const start = nodeIn(g, input.start, 'Start');
    const goal = nodeIn(g, input.goal, 'Goal');
    const trace = new Trace();
    const perLimit: number[] = [];
    let found: string[] | null = null;
    let total = 0;
    const stack: string[] = [];
    let seenThisRound: string[] = [];
    const scene = (limit: number, active?: string, tone: Tone = 'active'): Panel[] => [
      graphPanel(`Depth limit ${limit}`, g, {
        node: id => ({ tone: found?.includes(id) ? 'done' : id === active ? tone : stack.includes(id) ? 'path' : seenThisRound.includes(id) ? 'value' : 'muted' }),
        edge: edge => (found && onPath(edge, found, g.directed) ? { tone: 'done' } : undefined),
        legend: [{ tone: 'active', label: 'Current' }, { tone: 'path', label: 'On the path' }, { tone: 'value', label: 'Visited this round' }],
      }),
      stackPanel('Current path', stack, { tone: i => (i === stack.length - 1 ? 'active' : undefined), empty: 'Empty' }),
      { ...bars('Nodes visited in each round', perLimit, undefined, perLimit.map((_, i) => String(i))), zone: 'side' },
    ];
    const metrics = (limit: number): Metric[] => [{ label: 'Limit', value: limit }, { label: 'Visits in total', value: total }];
    for (let limit = 0; limit < g.nodes.length && !found; limit++) {
      trace.group = `Depth limit ${limit}`;
      seenThisRound = [];
      perLimit[limit] = 0;
      let cut = false;
      const walk = (node: string, depth: number): boolean => {
        stack.push(node);
        total++;
        perLimit[limit]++;
        if (!seenThisRound.includes(node)) seenThisRound.push(node);
        if (node === goal) {
          found = [...stack];
          trace.add(`Found ${goal}`, `It is at depth ${depth}. Since all shallower limits failed, no shorter path exists.`, scene(limit, node, 'done'), { tone: 'done', metrics: metrics(limit) });
          return true;
        }
        trace.add(`Visit ${node}`, depth === limit ? `Depth ${depth} is the limit, so don't go deeper in this round.` : `Depth ${depth}, with room to go deeper.`, scene(limit, node), { tone: depth === limit ? 'accent' : 'active', metrics: metrics(limit) });
        if (depth === limit) {
          if (g.adj[node].some(({ to }) => !stack.includes(to))) cut = true;
        } else {
          for (const { to } of g.adj[node]) {
            if (stack.includes(to)) continue;
            if (walk(to, depth + 1)) return true;
          }
        }
        stack.pop();
        return false;
      };
      walk(start, 0);
      if (!found && !cut) {
        trace.add('Nothing deeper exists', 'This round was never cut off by the limit, so a larger limit can\'t find anything new.', scene(limit), { tone: 'danger', metrics: metrics(limit) });
        break;
      }
      if (!found) stack.length = 0;
    }
    trace.group = undefined;
    const route = found as string[] | null;
    trace.finish(route ? `Depth ${route.length - 1}` : 'No path', route ? `Path: ${route.join(' → ')}. It uses DFS memory, and finds the shallowest goal like BFS. The repeated rounds cost little, since most nodes are in the deepest level.` : `${goal} can't be reached from ${start}.`, scene(perLimit.length - 1), { tone: route ? 'done' : 'danger', metrics: [{ label: 'Rounds', value: perLimit.length }, { label: 'Visits in total', value: total }] });
    return { frames: trace.frames, answer: { path: route, depth: route ? route.length - 1 : -1, perLimit } };
  },
};

// ---------- Kirchhoff's Theorem ----------

const kirchhoff: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B, A-C, A-D, B-C, B-D, C-D', { wide: true }), numberField('remove', 'Remove row and column', 0, 0, 7)],
  examples: [
    { title: 'A triangle', about: 'Removing any one of the 3 edges leaves a tree.', values: { edges: 'A-B, B-C, C-A', remove: '0' } },
    { title: 'A complete graph on 4', about: 'Cayley\'s formula says 4² = 16.', values: { edges: 'A-B, A-C, A-D, B-C, B-D, C-D', remove: '0' } },
    { title: 'Any row works', about: 'Removing a different row gives the same answer.', values: { edges: 'A-B, A-C, A-D, B-C, B-D, C-D', remove: '3' } },
    { title: 'Not connected', about: 'Zero spanning trees.', values: { edges: 'A-B, C-D', remove: '0' } },
  ],
  run(input) {
    const g = graph(input.edges, { maxNodes: 8, maxEdges: 28 });
    const names = g.nodes;
    const n = names.length;
    if (n < 2) throw new Error('Enter a graph with at least two nodes.');
    const drop = integer(input.remove, 'The row to remove', 0, n - 1);
    const trace = new Trace();
    const degree = names.map(node => g.adj[node].reduce((total, { weight }) => total + weight, 0));
    const adjacency = names.map(a => names.map(b => g.adj[a].find(({ to }) => to === b)?.weight ?? 0));
    const laplacian = names.map((_, i) => names.map((_, j) => (i === j ? degree[i] : -adjacency[i][j])));
    const picture = graphPanel('The graph', g, { node: () => ({ tone: 'value' }) });
    trace.group = 'Build the Laplacian';
    trace.add('Degrees', 'Put each node\'s degree on the diagonal.', [tablePanel('Degree matrix D', names.map((_, i) => names.map((_, j) => (i === j ? degree[i] : 0))), { rowHead: names, colHead: names, tone: (r, c) => (r === c ? 'new' : 'muted') }), picture], { tone: 'new' });
    trace.add('Adjacency', 'A 1 means the two nodes are joined.', [tablePanel('Adjacency matrix A', adjacency, { rowHead: names, colHead: names, tone: (r, c) => (adjacency[r][c] ? 'value' : 'muted') }), picture], { tone: 'value' });
    trace.add('L = D - A', 'Subtract. Every row of the Laplacian adds up to 0.', [tablePanel('Laplacian L', laplacian, { rowHead: names, colHead: names, tone: (r, c) => (r === c ? 'accent' : laplacian[r][c] ? 'value' : 'muted') }), picture], { tone: 'accent' });
    const keep = names.map((_, i) => i).filter(i => i !== drop);
    trace.add(`Remove row and column ${names[drop]}`, 'The theorem works with any one row and matching column removed.', [tablePanel('Laplacian L', laplacian, { rowHead: names, colHead: names, tone: (r, c) => (r === drop || c === drop ? 'danger' : undefined) }), picture], { tone: 'danger' });
    trace.group = 'Work out the determinant';
    const matrix = keep.map(i => keep.map(j => laplacian[i][j]));
    const size = matrix.length;
    const heads = keep.map(i => names[i]);
    let sign = 1;
    let previous = 1;
    let determinant: number;
    const view = (pivot?: number): Panel[] => [tablePanel('The reduced matrix', matrix.map(line => [...line]), { rowHead: heads, colHead: heads, tone: (r, c) => (r === pivot && c === pivot ? 'accent' : pivot !== undefined && r > pivot && c > pivot ? 'new' : undefined) }), picture];
    if (size === 0) determinant = 1;
    else {
      trace.add('Start', 'Eliminate below the diagonal with exact whole-number steps (Bareiss elimination), so nothing is rounded.', view(), { tone: 'muted' });
      let zero = false;
      for (let k = 0; k < size - 1 && !zero; k++) {
        if (matrix[k][k] === 0) {
          const swap = matrix.findIndex((line, r) => r > k && line[k] !== 0);
          if (swap < 0) {
            zero = true;
            trace.add('A zero column', 'No row can supply a pivot, so the determinant is 0.', view(k), { tone: 'danger' });
            break;
          }
          [matrix[k], matrix[swap]] = [matrix[swap], matrix[k]];
          sign = -sign;
          trace.add(`Swap rows ${k} and ${swap}`, 'A zero on the diagonal can\'t be a pivot. Swapping two rows flips the sign.', view(k), { tone: 'path' });
        }
        for (let i = k + 1; i < size; i++) {
          for (let j = k + 1; j < size; j++) matrix[i][j] = Math.round((matrix[i][j] * matrix[k][k] - matrix[i][k] * matrix[k][j]) / previous);
          matrix[i][k] = 0;
        }
        previous = matrix[k][k];
        trace.add(`Pivot ${k + 1}: ${previous}`, 'Each entry below and to the right becomes (entry × pivot - left × above) ÷ previous pivot, which always comes out whole.', view(k), { tone: 'new' });
      }
      determinant = zero ? 0 : sign * matrix[size - 1][size - 1] + 0;
    }
    trace.group = undefined;
    const special = n >= 2 && g.edges.length === (n * (n - 1)) / 2 && g.edges.every(edge => edge.weight === 1) ? ` This is the complete graph on ${n} nodes, and Cayley's formula gives ${n}^${n - 2} = ${n ** (n - 2)} too.` : '';
    trace.finish(`${determinant} spanning tree${determinant === 1 ? '' : 's'}`, `The determinant is ${determinant}, which counts the spanning trees of this graph.${determinant === 0 ? ' Zero means the graph isn\'t connected.' : ''}${special}`, [tablePanel('Laplacian L', laplacian, { rowHead: names, colHead: names, tone: (r, c) => (r === c ? 'accent' : undefined) }), picture], { metrics: [{ label: 'Spanning trees', value: determinant, tone: 'done' }] });
    return { frames: trace.frames, answer: determinant };
  },
};

// ---------- Union-Find helpers, Kruskal, and Prim ----------

const makeUnionFind = (names: string[]) => {
  const parent: Record<string, string> = Object.fromEntries(names.map(name => [name, name]));
  const find = (name: string): string => {
    let root = name;
    while (parent[root] !== root) root = parent[root];
    return root;
  };
  return { parent, find };
};

const kruskal: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', { wide: true }), choiceField('goal', 'Build', [['min', 'Minimum spanning tree'], ['max', 'Maximum spanning tree']])],
  examples: [
    { title: 'A small graph', about: 'A-C is skipped, as it would close a loop.', values: { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', goal: 'min' } },
    { title: 'Maximum instead', about: 'Sorting from largest to smallest flips the goal.', values: { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', goal: 'max' } },
    { title: 'Two pieces', about: 'A forest of two trees, since the graph isn\'t connected.', values: { edges: 'A-B:1, B-C:2, X-Y:3', goal: 'min' } },
    { title: 'A larger graph', about: 'Seven nodes and eleven edges.', values: { edges: 'A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11', goal: 'min' } },
  ],
  run(input) {
    const g = graph(input.edges, { allowNegative: true });
    const max = input.goal === 'max';
    const sorted = [...g.edges].sort((a, b) => (max ? b.weight - a.weight : a.weight - b.weight));
    const { parent, find } = makeUnionFind(g.nodes);
    const chosen: GraphEdgeInput[] = [];
    const rejected: GraphEdgeInput[] = [];
    let total = 0;
    const trace = new Trace();
    const scene = (active?: GraphEdgeInput, tone: Tone = 'active'): Panel[] => [
      graphPanel('The graph', g, { weights: true, node: () => ({ tone: 'value' }), edge: edge => (edge === active ? { tone } : chosen.includes(edge) ? { tone: 'done' } : rejected.includes(edge) ? { tone: 'danger', dashed: true } : undefined), legend: [{ tone: 'active', label: 'Checking' }, { tone: 'done', label: 'In the tree' }, { tone: 'danger', label: 'Would make a loop' }] }),
      tablePanel('Edges, in order', sorted.map(edge => [`${edge.from}-${edge.to}`, edge.weight]), { colHead: ['Edge', 'Weight'], zone: 'side', tone: r => (sorted[r] === active ? tone : chosen.includes(sorted[r]) ? 'done' : rejected.includes(sorted[r]) ? 'danger' : undefined) }),
      bucketsPanel('Groups of connected nodes', [...new Set(g.nodes.map(find))].map(root => ({ label: root, items: g.nodes.filter(node => find(node) === root) })), { zone: 'side' }),
    ];
    const metrics = (): Metric[] => [{ label: 'Edges chosen', value: chosen.length }, { label: 'Total weight', value: total }];
    trace.add('Sort the edges', `Go through the edges from ${max ? 'largest' : 'smallest'} to ${max ? 'smallest' : 'largest'}. Every node starts in its own group.`, scene(), { tone: 'muted', metrics: metrics() });
    for (const edge of sorted) {
      const a = find(edge.from);
      const b = find(edge.to);
      trace.add(`Check ${edge.from}-${edge.to} (${edge.weight})`, `${edge.from} is in group ${a}, and ${edge.to} is in group ${b}.`, scene(edge), { tone: 'active', metrics: metrics() });
      if (a === b) {
        rejected.push(edge);
        trace.add(`Skip ${edge.from}-${edge.to}`, 'Both ends are already connected, so this edge would close a loop.', scene(edge, 'danger'), { tone: 'danger', metrics: metrics() });
      } else {
        chosen.push(edge);
        parent[a] = b;
        total += edge.weight;
        trace.add(`Take ${edge.from}-${edge.to}`, `It joins two separate groups. The total is now ${total}.`, scene(edge, 'done'), { tone: 'done', metrics: metrics() });
      }
      if (chosen.length === g.nodes.length - 1) {
        trace.add('The tree is complete', `${g.nodes.length} nodes need exactly ${g.nodes.length - 1} edges, so the rest can be ignored.`, scene(), { tone: 'done', metrics: metrics() });
        break;
      }
    }
    const spanning = chosen.length === g.nodes.length - 1;
    trace.finish(`Total weight ${total}`, spanning ? `Edges: ${chosen.map(edge => `${edge.from}-${edge.to}`).join(', ')}. Sorting dominates the time: O(E log E).` : `The graph isn't connected, so this is a spanning forest, with ${counted(chosen.length, 'edge')}.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { total, edges: chosen.map(edge => `${edge.from}-${edge.to}`), spanning } };
  },
};

const prims: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', { wide: true }), textField('start', 'Start at', 'A')],
  examples: [
    { title: 'A small graph', about: 'The tree grows from one node.', values: { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', start: 'A' } },
    { title: 'Any start works', about: 'Starting elsewhere gives the same total weight.', values: { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', start: 'D' } },
    { title: 'A larger graph', about: 'Seven nodes and eleven edges.', values: { edges: 'A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11', start: 'A' } },
    { title: 'Not connected', about: 'The tree can\'t reach X and Y.', values: { edges: 'A-B:1, B-C:2, X-Y:3', start: 'A' } },
  ],
  run(input) {
    const g = graph(input.edges, { allowNegative: true });
    const start = nodeIn(g, input.start, 'Start');
    const key: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, Infinity]));
    const link: Record<string, string | null> = Object.fromEntries(g.nodes.map(node => [node, null]));
    const inTree = new Set<string>();
    key[start] = 0;
    let total = 0;
    const trace = new Trace();
    const chosen = (edge: GraphEdgeInput) => (inTree.has(edge.from) && link[edge.from] === edge.to) || (inTree.has(edge.to) && link[edge.to] === edge.from);
    const scene = (active?: string, looking?: string): Panel[] => [
      graphPanel('The graph', g, {
        weights: true,
        node: id => ({ tone: id === active ? 'active' : id === looking ? 'accent' : inTree.has(id) ? 'done' : key[id] !== Infinity ? 'path' : 'muted', sub: inTree.has(id) ? undefined : `${show(key[id])}` }),
        edge: edge => (chosen(edge) ? { tone: 'done' } : (link[edge.to] === edge.from || link[edge.from] === edge.to) ? { tone: 'path', dashed: true } : undefined),
        legend: [{ tone: 'done', label: 'In the tree' }, { tone: 'path', label: 'Cheapest link so far' }],
      }),
      tablePanel('Cheapest link to the tree', g.nodes.map(node => [node, show(key[node]), link[node] ?? '-', inTree.has(node) ? 'Yes' : 'No']), { colHead: ['Node', 'Cost', 'From', 'In tree'], zone: 'side', tone: r => (g.nodes[r] === looking ? 'new' : inTree.has(g.nodes[r]) ? 'done' : undefined) }),
    ];
    const metrics = (): Metric[] => [{ label: 'In the tree', value: inTree.size }, { label: 'Total weight', value: total }];
    trace.add('Start', `The tree starts with just ${start}.`, scene(start), { tone: 'muted', metrics: metrics() });
    while (true) {
      const next = g.nodes.filter(node => !inTree.has(node) && key[node] !== Infinity).sort((a, b) => key[a] - key[b] || a.localeCompare(b))[0];
      if (!next) break;
      inTree.add(next);
      total += key[next];
      trace.group = `Add ${next}`;
      trace.add(`Add ${next}${link[next] ? ` by ${link[next]}-${next}` : ''}`, link[next] ? `Costing ${key[next]}, it is the cheapest edge leaving the tree. Any cheaper edge would be better, and none exists.` : 'It is the first node, so it costs nothing.', scene(next), { tone: 'done', metrics: metrics() });
      for (const { to, weight } of g.adj[next]) {
        if (inTree.has(to)) continue;
        if (weight < key[to]) {
          const old = key[to];
          key[to] = weight;
          link[to] = next;
          trace.add(`${to}'s best link is now ${weight}`, `${next}-${to} costs ${weight}, which beats ${show(old)}.`, scene(next, to), { tone: 'new', metrics: metrics() });
        } else trace.add(`${to} keeps ${key[to]}`, `${next}-${to} costs ${weight}, which is no better.`, scene(next, to), { tone: 'muted', metrics: metrics() });
      }
    }
    trace.group = undefined;
    const spanning = inTree.size === g.nodes.length;
    const links = g.nodes.filter(node => link[node] && inTree.has(node)).map(node => `${link[node]}-${node}`);
    trace.finish(`Total weight ${total}`, spanning ? `Edges: ${links.join(', ')}. With a heap this takes O(E log V).` : `Only ${inTree.size} of ${g.nodes.length} nodes can be reached from ${start}, so the graph isn't connected.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { total, edges: links, spanning } };
  },
};

// ---------- Min Cut ----------

const minCut: SimulatorDef = {
  fields: [textField('edges', 'Edges', 'A-B:3, B-C:3, A-C:3, C-D:1, D-E:3, E-F:3, D-F:3', { wide: true })],
  examples: [
    { title: 'Two triangles', about: 'One thin bridge joins them.', values: { edges: 'A-B, B-C, A-C, C-D, D-E, E-F, D-F' } },
    { title: 'A cycle', about: 'Cutting a cycle takes two edges.', values: { edges: 'A-B, B-C, C-D, D-A' } },
    { title: 'With weights', about: 'The cheapest cut is the smallest total weight.', values: { edges: 'A-B:2, A-E:3, B-C:3, B-E:2, B-F:2, C-D:4, C-G:2, D-G:2, D-H:2, E-F:3, F-G:1, G-H:3' } },
    { title: 'Not connected', about: 'The cut is zero, with nothing to remove.', values: { edges: 'A-B, C-D' } },
  ],
  run(input) {
    const g = graph(input.edges, { maxNodes: 8 });
    if (g.nodes.length < 2) throw new Error('Enter a graph with at least two nodes.');
    // Stoer-Wagner: repeat a "most tightly connected" ordering, keep the best cut, and merge the last two.
    const members = new Map(g.nodes.map(name => [name, [name]]));
    const weight = new Map<string, Map<string, number>>(g.nodes.map(name => [name, new Map()]));
    for (const edge of g.edges) {
      weight.get(edge.from)!.set(edge.to, edge.weight);
      weight.get(edge.to)!.set(edge.from, edge.weight);
    }
    const trace = new Trace();
    let best = Infinity;
    let bestSide: string[] = [];
    let alive = [...g.nodes];
    let phase = 0;
    const sideTone = (id: string, side: string[]) => (side.includes(id) ? 'accent' as Tone : 'value' as Tone);
    const scene = (order: string[], current?: string, wanted?: Map<string, number>): Panel[] => [
      graphPanel('The original graph', g, {
        weights: true,
        node: id => {
          const group = alive.find(name => members.get(name)!.includes(id))!;
          return { tone: group === current ? 'active' : order.includes(group) ? 'done' : 'muted', sub: members.get(group)!.length > 1 ? `in ${group}` : undefined };
        },
        legend: [{ tone: 'active', label: 'Just added' }, { tone: 'done', label: 'Added this phase' }],
      }),
      tablePanel('How strongly each group connects to those added', alive.map(name => [members.get(name)!.join(''), order.includes(name) ? 'Added' : wanted?.get(name) ?? 0]), { colHead: ['Group', 'Connection'], zone: 'side', tone: r => (alive[r] === current ? 'active' : undefined) }),
      factsPanel('Best cut so far', [{ label: 'Weight', value: show(best), tone: 'done' }, { label: 'One side', value: bestSide.join(', ') || 'None yet' }]),
    ];
    while (alive.length > 1) {
      phase++;
      trace.group = `Phase ${phase}`;
      const order = [alive[0]];
      const wanted = new Map<string, number>(alive.map(name => [name, 0]));
      const addTo = (name: string) => {
        for (const other of alive) if (!order.includes(other)) wanted.set(other, (wanted.get(other) ?? 0) + (weight.get(name)!.get(other) ?? 0));
      };
      addTo(alive[0]);
      trace.add(`Start from ${members.get(alive[0])!.join('')}`, 'Grow a set by repeatedly adding the group most strongly connected to it.', scene(order, alive[0], wanted), { tone: 'path', metrics: [{ label: 'Groups left', value: alive.length }] });
      while (order.length < alive.length) {
        const next = alive.filter(name => !order.includes(name)).sort((a, b) => wanted.get(b)! - wanted.get(a)!)[0];
        const strength = wanted.get(next)!;
        order.push(next);
        addTo(next);
        trace.add(`Add ${members.get(next)!.join('')}`, `Its connection of ${strength} is the strongest left.`, scene(order, next, wanted), { tone: 'new', metrics: [{ label: 'Groups left', value: alive.length }] });
      }
      const last = order.at(-1)!;
      const beforeLast = order.at(-2)!;
      const cut = wanted.get(last)!;
      const better = cut < best;
      if (better) {
        best = cut;
        bestSide = [...members.get(last)!];
      }
      trace.add(`The cut of this phase: ${cut}`, `The last group added, ${members.get(last)!.join('')}, is cut off from everything else at a cost of ${cut}.${better ? ' That is the best so far.' : ` The best is still ${best}.`}`, scene(order, last, wanted), { tone: better ? 'done' : 'muted', metrics: [{ label: 'Groups left', value: alive.length }] });
      members.get(beforeLast)!.push(...members.get(last)!);
      for (const [other, value] of weight.get(last)!) {
        if (other === beforeLast) continue;
        const sum = (weight.get(beforeLast)!.get(other) ?? 0) + value;
        weight.get(beforeLast)!.set(other, sum);
        weight.get(other)!.set(beforeLast, sum);
        weight.get(other)!.delete(last);
      }
      weight.get(beforeLast)!.delete(last);
      alive = alive.filter(name => name !== last);
      trace.add(`Merge ${members.get(beforeLast)!.join('')}`, 'Any better cut must keep these two together, so they can be treated as one group from here on.', scene([]), { tone: 'accent', metrics: [{ label: 'Groups left', value: alive.length }] });
    }
    trace.group = undefined;
    const other = g.nodes.filter(name => !bestSide.includes(name));
    const crossing = g.edges.filter(edge => bestSide.includes(edge.from) !== bestSide.includes(edge.to));
    trace.finish(`Minimum cut: ${best}`, `Splitting into {${bestSide.join(', ')}} and {${other.join(', ')}} removes ${crossing.length ? crossing.map(edge => `${edge.from}-${edge.to}`).join(', ') : 'no edges'}. Time: O(V³) with this method.`, [
      graphPanel('The two sides', g, { weights: true, node: id => ({ tone: sideTone(id, bestSide) }), edge: edge => (crossing.includes(edge) ? { tone: 'danger', dashed: true } : undefined), legend: [{ tone: 'accent', label: 'One side' }, { tone: 'value', label: 'Other side' }, { tone: 'danger', label: 'Cut edge' }] }),
    ], { metrics: [{ label: 'Cut weight', value: best, tone: 'done' }, { label: 'Edges cut', value: crossing.length }] });
    return { frames: trace.frames, answer: { cut: best, side: bestSide, crossing: crossing.reduce((total, edge) => total + edge.weight, 0) } };
  },
};

// ---------- Topological Sort ----------

const topologicalSort: SimulatorDef = {
  fields: [textField('edges', 'One-way edges', '5-2, 5-0, 4-0, 4-1, 2-3, 3-1', { wide: true }), choiceField('method', 'Method', [['kahn', 'Kahn: remove zero in-degree'], ['dfs', 'DFS: reverse finish order']])],
  examples: [
    { title: 'Course plan', about: 'Each course must come after what it depends on.', values: { edges: 'Math-Physics, Math-CS, CS-Algo, Physics-Algo, Algo-AI', method: 'kahn' } },
    { title: 'The same with DFS', about: 'A different order, and just as valid.', values: { edges: 'Math-Physics, Math-CS, CS-Algo, Physics-Algo, Algo-AI', method: 'dfs' } },
    { title: 'A cycle', about: 'No order can exist.', values: { edges: 'A-B, B-C, C-A, C-D', method: 'kahn' } },
    { title: 'A cycle, with DFS', about: 'An edge back to the current path reveals it.', values: { edges: 'A-B, B-C, C-A, C-D', method: 'dfs' } },
  ],
  run(input) {
    const g = graph(input.edges, { directed: true });
    const trace = new Trace();
    const output: string[] = [];
    let hasCycle = false;
    if (input.method === 'kahn') {
      const degree: Record<string, number> = Object.fromEntries(g.nodes.map(node => [node, 0]));
      for (const { to } of g.edges) degree[to]++;
      const queue = g.nodes.filter(node => degree[node] === 0);
      const scene = (active?: string, looking?: string): Panel[] => [
        graphPanel('The graph', g, { node: id => ({ tone: id === active ? 'active' : id === looking ? 'accent' : output.includes(id) ? 'done' : queue.includes(id) ? 'path' : 'muted', sub: `in ${degree[id]}` }), edge: edge => (output.includes(edge.from) ? { tone: 'muted', dashed: true } : undefined), legend: [{ tone: 'path', label: 'Ready' }, { tone: 'done', label: 'Placed' }] }),
        cells('Output', row(output, { tone: () => 'done', hideIndex: true })),
        cells('Ready, front on the left', row(queue, { hideIndex: true }), { zone: 'side' }),
        tablePanel('In-degrees', g.nodes.map(node => [node, degree[node]]), { colHead: ['Node', 'In'], zone: 'side', tone: r => (g.nodes[r] === looking ? 'new' : undefined) }),
      ];
      trace.add('Count in-degrees', `A node with in-degree 0 has nothing waiting before it. Ready now: ${queue.join(', ') || 'none'}.`, scene(), { tone: 'muted' });
      while (queue.length) {
        const node = queue.shift()!;
        output.push(node);
        trace.add(`Place ${node}`, 'Nothing is left before it, so it goes next. Now remove its outgoing edges.', scene(node), { tone: 'active' });
        for (const { to } of g.adj[node]) {
          degree[to]--;
          if (degree[to] === 0) queue.push(to);
          trace.add(`${to}'s in-degree is ${degree[to]}`, degree[to] === 0 ? `Nothing is left before ${to}, so it is ready.` : `${to} still has ${degree[to]} to wait for.`, scene(node, to), { tone: degree[to] === 0 ? 'new' : 'muted' });
        }
      }
      hasCycle = output.length < g.nodes.length;
      trace.finish(hasCycle ? 'A cycle blocks the rest' : output.join(', '), hasCycle ? `${g.nodes.filter(node => !output.includes(node)).join(', ')} never reached in-degree 0, because they wait on each other. No valid order exists.` : `Every edge goes from earlier to later in this order. Time: O(V + E).`, scene(), { tone: hasCycle ? 'danger' : 'done' });
    } else {
      const state: Record<string, 'new' | 'open' | 'done'> = Object.fromEntries(g.nodes.map(node => [node, 'new']));
      const stack: string[] = [];
      const finished: string[] = [];
      const scene = (active?: string, looking?: string): Panel[] => [
        graphPanel('The graph', g, { node: id => ({ tone: id === active ? 'active' : id === looking ? 'accent' : state[id] === 'done' ? 'done' : state[id] === 'open' ? 'path' : 'muted' }), legend: [{ tone: 'path', label: 'On the path' }, { tone: 'done', label: 'Finished' }] }),
        cells('Order: newest finish goes first', row([...finished].reverse(), { tone: i => (i === 0 ? 'new' : 'done'), hideIndex: true })),
        stackPanel('Call stack', stack, { tone: i => (i === stack.length - 1 ? 'active' : undefined), empty: 'Empty' }),
      ];
      const walk = (node: string) => {
        state[node] = 'open';
        stack.push(node);
        trace.add(`Enter ${node}`, 'Follow its edges first, since those nodes must come later than it.', scene(node), { tone: 'active' });
        for (const { to } of g.adj[node]) {
          if (state[to] === 'open') {
            hasCycle = true;
            trace.add(`Cycle: ${node} to ${to}`, `${to} is still on the current path, so this edge closes a loop.`, scene(node, to), { tone: 'danger' });
          } else if (state[to] === 'new') walk(to);
          else trace.add(`${to} is finished`, 'It has already taken its place later in the order.', scene(node, to), { tone: 'muted' });
        }
        state[node] = 'done';
        stack.pop();
        finished.push(node);
        trace.add(`Finish ${node}`, 'Everything after it is placed, so it goes in front of them.', scene(stack.at(-1)), { tone: 'done' });
      };
      for (const node of g.nodes) if (state[node] === 'new') walk(node);
      output.push(...finished.reverse());
      trace.finish(hasCycle ? 'A cycle was found' : output.join(', '), hasCycle ? 'A cycle means no valid order exists.' : 'Reversing the finish order makes every edge go from earlier to later. Time: O(V + E).', [cells('Order', row(output, { tone: () => (hasCycle ? 'danger' : 'done'), hideIndex: true })), graphPanel('The graph', g, { node: () => ({ tone: hasCycle ? 'danger' : 'done' }) })], { tone: hasCycle ? 'danger' : 'done' });
    }
    return { frames: trace.frames, answer: { order: hasCycle ? null : output, hasCycle } };
  },
};

// ---------- Union-Find ----------

const unionFind: SimulatorDef = {
  fields: [
    numberField('count', 'Items, 0 to n - 1', 8, 2, 16),
    opsField('ops', 'Operations', 'union 0 1, union 2 3, union 1 3, find 3, union 4 5, connected 0 2, connected 0 4', [{ label: 'Union', op: 'union', takesValue: true }, { label: 'Find', op: 'find', takesValue: true }, { label: 'Connected', op: 'connected', takesValue: true }]),
    choiceField('rule', 'Union by', [['size', 'Size'], ['rank', 'Rank'], ['none', 'Nothing']]),
    choiceField('compress', 'Path compression', [['yes', 'On'], ['no', 'Off']]),
  ],
  examples: [
    { title: 'Both tricks', about: 'Trees stay almost flat.', values: { count: '8', ops: 'union 0 1, union 2 3, union 1 3, find 3, union 4 5, connected 0 2, connected 0 4', rule: 'size', compress: 'yes' } },
    { title: 'Neither trick', about: 'A long chain forms, and find gets slow.', values: { count: '6', ops: 'union 0 1, union 1 2, union 2 3, union 3 4, union 4 5, find 0', rule: 'none', compress: 'no' } },
    { title: 'Compression', about: 'Find flattens the path it walks.', values: { count: '6', ops: 'union 0 1, union 1 2, union 2 3, union 3 4, find 0, find 0', rule: 'none', compress: 'yes' } },
  ],
  run(input) {
    const count = integer(input.count, 'Items', 2, 16);
    const list = operations(input.ops, { union: 2, find: 1, connected: 2 });
    const rule = input.rule;
    const compress = input.compress === 'yes';
    const parent = Array.from({ length: count }, (_, i) => i);
    const size = new Array<number>(count).fill(1);
    const rank = new Array<number>(count).fill(0);
    const log: { text: string; tone?: Tone }[] = [];
    let hops = 0;
    const trace = new Trace();
    const draw = (node: number, marks: Record<number, Tone>): BinaryNode => ({ id: `u${node}`, label: String(node), tone: marks[node] ?? 'value', children: parent.map((value, i) => (value === node && i !== node ? i : -1)).filter(i => i >= 0).map(child => draw(child, marks)) });
    const scene = (marks: Record<number, Tone> = {}): Panel[] => [
      treePanel('The forest', visualForest(parent.map((value, i) => (value === i ? i : -1)).filter(i => i >= 0).map(root => draw(root, marks))), 'Union-Find forest'),
      cells('The parent array', [row(parent, { tone: i => marks[i] }), ...(rule === 'none' ? [] : [row(rule === 'size' ? size : rank, { label: rule === 'size' ? 'Size' : 'Rank', hideIndex: true })])]),
      logPanel('Results', log),
    ];
    const metrics = (): Metric[] => [{ label: 'Groups', value: parent.filter((value, i) => value === i).length }, { label: 'Parent hops', value: hops }];
    const checkItem = (text: string | undefined) => {
      const value = Number(text);
      if (!Number.isInteger(value) || value < 0 || value >= count) throw new Error(`“${text}” isn't an item. Items run from 0 to ${count - 1}.`);
      return value;
    };
    const find = (start: number) => {
      const path = [start];
      while (parent[path.at(-1)!] !== path.at(-1)!) {
        path.push(parent[path.at(-1)!]);
        hops++;
        trace.add(`Follow up to ${path.at(-1)}`, 'Keep following parents until you reach a node that is its own parent: the root.', scene({ [path.at(-1)!]: 'active', [path.at(-2)!]: 'path' }), { tone: 'active', metrics: metrics() });
      }
      const root = path.at(-1)!;
      if (compress && path.length > 2) {
        for (const node of path) if (node !== root) parent[node] = root;
        trace.add(`Compress the path to ${root}`, 'Every node on the path now points straight at the root, so later finds are faster.', scene(Object.fromEntries(path.map(node => [node, 'new' as Tone]))), { tone: 'new', metrics: metrics() });
      }
      return root;
    };
    trace.add('Start', `Each of the ${count} items is its own group.`, scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value, second } of list) {
      trace.group = `${op} ${value}${second ? ` ${second}` : ''}`;
      if (op === 'find') {
        const item = checkItem(value);
        const root = find(item);
        log.push({ text: `find ${item} = ${root}` });
        trace.add(`The root of ${item} is ${root}`, 'The root names the group.', scene({ [root]: 'done' }), { tone: 'done', metrics: metrics() });
      } else if (op === 'connected') {
        const a = checkItem(value);
        const b = checkItem(second);
        const same = find(a) === find(b);
        log.push({ text: `connected ${a} ${b}: ${same ? 'yes' : 'no'}`, tone: same ? 'done' : 'danger' });
        trace.add(same ? 'Connected' : 'Not connected', same ? `${a} and ${b} share a root.` : `${a} and ${b} have different roots.`, scene({ [a]: same ? 'done' : 'danger', [b]: same ? 'done' : 'danger' }), { tone: same ? 'done' : 'danger', metrics: metrics() });
      } else {
        const a = find(checkItem(value));
        const b = find(checkItem(second));
        if (a === b) {
          log.push({ text: `union ${value} ${second}: already joined` });
          trace.add('Already joined', `Both have root ${a}, so nothing changes.`, scene({ [a]: 'done' }), { tone: 'muted', metrics: metrics() });
          continue;
        }
        let top = a;
        let under = b;
        if (rule === 'size' && size[a] < size[b]) [top, under] = [b, a];
        if (rule === 'rank' && rank[a] < rank[b]) [top, under] = [b, a];
        parent[under] = top;
        size[top] += size[under];
        if (rule === 'rank' && rank[top] === rank[under]) rank[top]++;
        const why = rule === 'size' ? 'The smaller tree goes under the larger one, which keeps trees short.' : rule === 'rank' ? 'The lower-ranked tree goes under the higher one, which keeps trees short.' : 'The first root simply goes on top. Without a rule, chains can form.';
        trace.add(`${under} goes under ${top}`, why, scene({ [top]: 'accent', [under]: 'new' }), { tone: 'new', metrics: metrics() });
      }
    }
    trace.group = undefined;
    trace.finish('Finished', `${counted(hops, 'parent hop')} in total. With both union by size and path compression, operations are almost O(1) on average.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { parent, log: log.map(line => line.text), hops, groups: parent.filter((value, i) => value === i).length } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  '0-1-bfs': zeroOneBfs,
  'a-search': aSearch,
  'adjacency-list-vs-matrix': adjacency,
  'bellman-ford': bellmanFord,
  bfs,
  'bidirectional-search': bidirectional,
  dfs,
  dijkstra,
  'floyd-warshall': floydWarshall,
  'graph-basics': graphBasics,
  'graph-coloring': graphColoring,
  'iterative-deepening-dfs': iddfs,
  'kirchhoffs-theorem': kirchhoff,
  'kruskals-algorithm': kruskal,
  'min-cut': minCut,
  'prims-algorithm': prims,
  'topological-sort': topologicalSort,
  'union-find': unionFind,
};
