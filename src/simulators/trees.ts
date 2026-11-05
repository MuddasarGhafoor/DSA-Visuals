import { counted, cells, choiceField, factsPanel, logPanel, operations, opsField, row, stackPanel, tablePanel, textField, Trace, treePanel, visualForest, visualTree, type BinaryNode, type Metric, type Panel, type SimulatorDef, type Tone } from './kit.ts';

type TreeNode = { id: string; value: string; left: TreeNode | null; right: TreeNode | null };

/** Reads a tree in level order, where "null" or "-" marks a missing child, as in "1, 2, 3, null, 5". */
function parseLevelOrder(text: string): TreeNode | null {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (!parts.length) throw new Error('Enter the tree level by level, such as 1, 2, 3, null, 5.');
  if (parts.length > 31) throw new Error('Use at most 31 entries, so the tree stays readable.');
  const isGap = (part: string) => /^(null|none|-|x)$/i.test(part);
  if (isGap(parts[0])) return null;
  const root: TreeNode = { id: 't0', value: parts[0], left: null, right: null };
  const waiting = [root];
  let at = 1;
  while (at < parts.length) {
    const parent = waiting.shift();
    if (!parent) throw new Error('There are more entries than the tree has places for. Check the positions of the nulls.');
    for (const side of ['left', 'right'] as const) {
      if (at >= parts.length) break;
      const part = parts[at];
      if (!isGap(part)) {
        const node: TreeNode = { id: `t${at}`, value: part, left: null, right: null };
        parent[side] = node;
        waiting.push(node);
      }
      at++;
    }
  }
  return root;
}

const drawTree = (node: TreeNode | null, tone: (node: TreeNode) => Tone | undefined, sub?: (node: TreeNode) => string | undefined): BinaryNode | null => (node ? { id: node.id, label: node.value, tone: tone(node), sub: sub?.(node), left: drawTree(node.left, tone, sub), right: drawTree(node.right, tone, sub) } : null);

// ---------- Binary Tree Basics ----------

const binaryTreeBasics: SimulatorDef = {
  fields: [textField('tree', 'Tree, level by level', '1, 2, 3, 4, 5, null, 6', { wide: true, placeholder: 'Use null for a missing child' })],
  examples: [
    { title: 'Perfect', about: 'Every level is completely full.', values: { tree: '1, 2, 3, 4, 5, 6, 7' } },
    { title: 'Complete', about: 'Full except the last level, which fills from the left.', values: { tree: '1, 2, 3, 4, 5, 6' } },
    { title: 'Full', about: 'Every node has zero or two children.', values: { tree: '1, 2, 3, 4, 5' } },
    { title: 'A chain', about: 'The tallest shape possible: height equals the node count.', values: { tree: '1, 2, null, 3, null, 4' } },
  ],
  run(input) {
    const root = parseLevelOrder(input.tree);
    if (!root) throw new Error('The tree is empty. Give the root a value.');
    const heights = new Map<string, number>();
    const depths = new Map<string, number>();
    const order: TreeNode[] = [];
    const trace = new Trace();
    let leaves = 0;
    let internal = 0;
    const log: string[] = [];
    const counts = () => [{ label: 'Nodes', value: order.length }, { label: 'Leaves', value: leaves }, { label: 'Internal', value: internal }];
    const scene = (active?: TreeNode): Panel[] => [
      treePanel('The tree', visualTree(drawTree(root, node => (node === active ? 'active' : heights.has(node.id) ? 'done' : 'muted'), node => (heights.has(node.id) ? `h ${heights.get(node.id)}` : undefined))), 'Binary tree'),
      logPanel('Worked out so far', log),
    ];
    const visit = (node: TreeNode | null, depth: number): number => {
      if (!node) return 0;
      depths.set(node.id, depth);
      const left = visit(node.left, depth + 1);
      const right = visit(node.right, depth + 1);
      const height = 1 + Math.max(left, right);
      heights.set(node.id, height);
      order.push(node);
      const leaf = !node.left && !node.right;
      if (leaf) leaves++;
      else internal++;
      log.push(`${node.value}: height ${height}, depth ${depth}`);
      trace.add(`${node.value}: height ${height}`, `Depth ${depth}. ${leaf ? 'It has no children, so it is a leaf, with height 1.' : `Its children have heights ${left} and ${right}, so its height is 1 + ${Math.max(left, right)} = ${height}.`}`, scene(node), { tone: leaf ? 'done' : 'active', metrics: counts() });
      return height;
    };
    const height = visit(root, 0);
    const n = order.length;
    const full = order.every(node => Boolean(node.left) === Boolean(node.right));
    const perfect = n === 2 ** height - 1;
    const complete = (() => {
      const queue: (TreeNode | null)[] = [root];
      let gap = false;
      while (queue.length) {
        const node = queue.shift()!;
        if (!node) gap = true;
        else {
          if (gap) return false;
          queue.push(node.left, node.right);
        }
      }
      return true;
    })();
    const balanced = order.every(node => Math.abs((node.left ? heights.get(node.left.id)! : 0) - (node.right ? heights.get(node.right.id)! : 0)) <= 1);
    const shapes = [{ label: 'Full', value: full }, { label: 'Complete', value: complete }, { label: 'Perfect', value: perfect }, { label: 'Balanced', value: balanced }];
    const tall = [...depths.values()].filter(depth => depth === height - 1).length;
    trace.finish(`Height ${height}, ${n} nodes`, `A tree of height ${height} can hold at most ${2 ** height - 1} nodes, and this one has ${n}. Its deepest level has ${tall} node${tall === 1 ? '' : 's'}.`, [
      treePanel('The tree', visualTree(drawTree(root, () => 'done', node => `h ${heights.get(node.id)}`)), 'Binary tree'),
      factsPanel('Its shape', shapes.map(item => ({ label: item.label, value: item.value ? 'Yes' : 'No', tone: (item.value ? 'done' : 'danger') as Tone }))),
    ], { metrics: [...counts(), { label: 'Height', value: height, tone: 'done' }] });
    return { frames: trace.frames, answer: { n, height, leaves, internal, full, complete, perfect, balanced } };
  },
};

// ---------- Binomial Heap ----------

type BinomialTree = { id: string; key: number; order: number; children: BinomialTree[] };

const binomialHeap: SimulatorDef = {
  fields: [opsField('ops', 'Operations', 'insert 5, insert 3, insert 8, insert 1, insert 9, insert 2, min, extract, extract', [{ label: 'Insert', op: 'insert', takesValue: true }, { label: 'Min', op: 'min' }, { label: 'Extract', op: 'extract' }])],
  examples: [
    { title: 'Like binary addition', about: 'Six values is 110 in binary: one B2 and one B1.', values: { ops: 'insert 5, insert 3, insert 8, insert 1, insert 9, insert 2' } },
    { title: 'A chain of links', about: 'The eighth value links all the way up to one B3.', values: { ops: 'insert 8, insert 7, insert 6, insert 5, insert 4, insert 3, insert 2, insert 1' } },
    { title: 'Extract the minimum', about: 'The children of the removed root become a heap of their own.', values: { ops: 'insert 4, insert 2, insert 7, insert 1, extract' } },
  ],
  run(input) {
    const list = operations(input.ops, { insert: 1, min: 0, extract: 0 });
    let heap: BinomialTree[] = [];
    let serial = 0;
    let links = 0;
    const out: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const draw = (tree: BinomialTree, marks: Set<string>, isRoot = true): BinaryNode => ({ id: tree.id, label: String(tree.key), sub: isRoot ? `B${tree.order}` : undefined, tone: marks.has(tree.id) ? 'active' : 'value', children: tree.children.map(child => draw(child, marks, false)) });
    const scene = (trees: BinomialTree[], marks: string[] = []): Panel[] => [
      treePanel('The heap: a forest of binomial trees', trees.length ? visualForest(trees.map(tree => draw(tree, new Set(marks)))) : null, 'Binomial heap', { empty: 'The heap is empty' }),
      logPanel('Results', out),
    ];
    const metrics = (trees: BinomialTree[]): Metric[] => {
      const count = trees.reduce((total, tree) => total + 2 ** tree.order, 0);
      return [{ label: 'Values', value: count }, { label: 'Size in binary', value: count.toString(2) }, { label: 'Trees', value: trees.map(tree => `B${tree.order}`).join(', ') || 'None' }, { label: 'Links', value: links }];
    };
    const merge = (left: BinomialTree[], right: BinomialTree[]) => {
      const trees = [...left, ...right].sort((a, b) => a.order - b.order);
      const result: BinomialTree[] = [];
      trees.forEach((incoming, at) => {
        let tree = incoming;
        while (result.length && result.at(-1)!.order === tree.order) {
          const other = result.pop()!;
          const [top, under] = other.key <= tree.key ? [other, tree] : [tree, other];
          const before = [...result, top, under, ...trees.slice(at + 1)];
          trace.add(`Link two B${top.order} trees`, `${top.key} is smaller than or equal to ${under.key}, so ${under.key} becomes its child. Two trees of the same order make one tree of the next order, like a carry in binary addition.`, scene(before, [top.id, under.id]), { tone: 'accent', metrics: metrics(before) });
          top.children.unshift(under);
          top.order++;
          links++;
          tree = top;
        }
        result.push(tree);
      });
      return result;
    };
    trace.add('Start', 'A binomial heap is a list of trees, with at most one tree of each order. Tree Bk has exactly 2^k nodes.', scene(heap), { tone: 'muted', metrics: metrics(heap) });
    for (const { op, value } of list) {
      trace.group = `${op}${value ? ` ${value}` : ''}`;
      if (op === 'insert') {
        const key = Number(value);
        if (!Number.isInteger(key)) throw new Error(`“${value}” isn't a whole number.`);
        const fresh: BinomialTree = { id: `b${serial++}`, key, order: 0, children: [] };
        heap = merge(heap, [fresh]);
        trace.add(`${key} is in`, 'A new value starts as a tree of order 0, and joins the list.', scene(heap, [fresh.id]), { tone: 'new', metrics: metrics(heap) });
      } else if (!heap.length) {
        out.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'The heap has no values.', scene(heap), { tone: 'danger', metrics: metrics(heap) });
      } else {
        const smallest = heap.reduce((best, tree) => (tree.key < best.key ? tree : best));
        trace.add(`The minimum is ${smallest.key}`, 'The minimum is always one of the roots, so only the roots need checking: O(log n).', scene(heap, [smallest.id]), { tone: 'active', metrics: metrics(heap) });
        if (op === 'min') out.push({ text: `min = ${smallest.key}` });
        else {
          out.push({ text: `extract = ${smallest.key}` });
          const rest = heap.filter(tree => tree !== smallest);
          const children = [...smallest.children].reverse();
          trace.add(`Remove ${smallest.key}`, 'Its children, put in order of increasing size, form a heap of their own. Merge the two heaps.', scene([...rest, ...children], children.map(child => child.id)), { tone: 'accent', metrics: metrics([...rest, ...children]) });
          heap = merge(rest, children);
          trace.add('Merged', 'Each order appears at most once again.', scene(heap), { tone: 'new', metrics: metrics(heap) });
        }
      }
    }
    trace.group = undefined;
    trace.finish('Finished', 'Insert, extract, and merge all take O(log n). Merging two whole heaps quickly is what binomial heaps are for.', scene(heap), { metrics: metrics(heap) });
    return { frames: trace.frames, answer: { orders: heap.map(tree => tree.order), roots: heap.map(tree => tree.key), results: out.map(line => line.text) } };
  },
};

// ---------- Heaps ----------

const heaps: SimulatorDef = {
  fields: [
    choiceField('kind', 'Kind', [['min', 'Min-heap'], ['max', 'Max-heap']]),
    opsField('ops', 'Operations', 'insert 15, insert 10, insert 20, insert 8, insert 25, peek, extract, extract', [{ label: 'Insert', op: 'insert', takesValue: true }, { label: 'Peek', op: 'peek' }, { label: 'Extract', op: 'extract' }]),
    textField('build', 'Or build from', '', { placeholder: 'Optional, such as 9, 4, 7, 1' }),
  ],
  examples: [
    { title: 'Min-heap', about: 'New values sift up to their place.', values: { kind: 'min', ops: 'insert 15, insert 10, insert 20, insert 8, peek', build: '' } },
    { title: 'Build in one go', about: 'Sifting down from the last parent takes only O(n).', values: { kind: 'max', ops: 'peek', build: '3, 9, 2, 1, 4, 5' } },
    { title: 'Extract', about: 'The last value moves to the top, then sifts down.', values: { kind: 'max', ops: 'extract, extract', build: '10, 8, 9, 2, 4' } },
  ],
  run(input) {
    const isMin = input.kind === 'min';
    const list = operations(input.ops, { insert: 1, peek: 0, extract: 0 });
    const start = input.build.split(/[\s,]+/).filter(Boolean).map(part => {
      const value = Number(part);
      if (!Number.isInteger(value)) throw new Error(`“${part}” isn't a whole number.`);
      return value;
    });
    if (start.length > 15) throw new Error('Build from at most 15 values, so the tree stays readable.');
    const heap = [...start];
    const higher = (a: number, b: number) => (isMin ? a < b : a > b);
    let swaps = 0;
    const out: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const tree = (at: number, marks: Record<number, Tone>): BinaryNode | null => (at < heap.length ? { id: `h${at}`, label: String(heap[at]), sub: String(at), tone: marks[at] ?? 'value', left: tree(2 * at + 1, marks), right: tree(2 * at + 2, marks) } : null);
    const scene = (marks: Record<number, Tone> = {}): Panel[] => [
      treePanel('As a tree', visualTree(tree(0, marks)), 'Heap as a tree', { empty: 'The heap is empty' }),
      cells('As an array', row(heap, { tone: i => marks[i] })),
      logPanel('Results', out),
    ];
    const metrics = (): Metric[] => [{ label: 'Size', value: heap.length }, { label: 'Top', value: heap[0] ?? 'None' }, { label: 'Swaps', value: swaps }];
    const siftDown = (first: number) => {
      let at = first;
      while (true) {
        const left = 2 * at + 1;
        const right = left + 1;
        let top = at;
        if (left < heap.length && higher(heap[left], heap[top])) top = left;
        if (right < heap.length && higher(heap[right], heap[top])) top = right;
        if (top === at) return;
        trace.add(`Swap ${heap[at]} and ${heap[top]}`, `${heap[top]} should be above ${heap[at]}, so ${heap[at]} sifts down.`, scene({ [at]: 'active', [top]: 'active' }), { tone: 'active', metrics: metrics() });
        [heap[at], heap[top]] = [heap[top], heap[at]];
        swaps++;
        at = top;
      }
    };
    if (start.length) {
      trace.group = 'Build the heap';
      trace.add('Start from the array', 'Every leaf is already a tiny heap, so fix the parents from the bottom up.', scene(), { tone: 'muted', metrics: metrics() });
      for (let i = (heap.length >> 1) - 1; i >= 0; i--) {
        trace.add(`Fix node ${i}`, `Sift ${heap[i]} down if it needs to move.`, scene({ [i]: 'accent' }), { tone: 'accent', metrics: metrics() });
        siftDown(i);
      }
      trace.add('Built', `Building took ${swaps} swaps. Sifting from the bottom up costs O(n), which beats n separate inserts.`, scene(), { tone: 'done', metrics: metrics() });
    } else trace.add('Start', `A ${isMin ? 'min' : 'max'}-heap keeps every parent ${isMin ? 'smaller' : 'larger'} than or equal to its children. The children of index i are at 2i + 1 and 2i + 2.`, scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      trace.group = `${op}${value ? ` ${value}` : ''}`;
      if (op === 'insert') {
        const key = Number(value);
        if (!Number.isInteger(key)) throw new Error(`“${value}” isn't a whole number.`);
        heap.push(key);
        let at = heap.length - 1;
        trace.add(`Add ${key} at the end`, 'A new value takes the next free spot, which keeps the tree complete.', scene({ [at]: 'new' }), { tone: 'new', metrics: metrics() });
        while (at > 0) {
          const parent = (at - 1) >> 1;
          if (!higher(heap[at], heap[parent])) {
            trace.add(`${heap[at]} stays`, `Its parent ${heap[parent]} is already in the right order.`, scene({ [at]: 'done', [parent]: 'path' }), { tone: 'muted', metrics: metrics() });
            break;
          }
          trace.add(`Swap ${heap[at]} and ${heap[parent]}`, `${heap[at]} should be above its parent, so it sifts up.`, scene({ [at]: 'active', [parent]: 'active' }), { tone: 'active', metrics: metrics() });
          [heap[at], heap[parent]] = [heap[parent], heap[at]];
          swaps++;
          at = parent;
        }
      } else if (!heap.length) {
        out.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'The heap has no values.', scene(), { tone: 'danger', metrics: metrics() });
      } else if (op === 'peek') {
        out.push({ text: `peek = ${heap[0]}` });
        trace.add(`Top is ${heap[0]}`, `The ${isMin ? 'smallest' : 'largest'} value is always at the root, so reading it takes O(1).`, scene({ 0: 'done' }), { tone: 'done', metrics: metrics() });
      } else {
        const top = heap[0];
        out.push({ text: `extract = ${top}` });
        const last = heap.pop()!;
        if (heap.length) heap[0] = last;
        trace.add(`Remove ${top}`, heap.length ? `The last value, ${last}, moves to the root, which keeps the tree complete. It probably doesn't belong there.` : 'That was the last value.', scene({ 0: 'accent' }), { tone: 'accent', metrics: metrics() });
        siftDown(0);
      }
    }
    trace.group = undefined;
    trace.finish('Finished', 'Insert and extract take O(log n), since a value moves along one path at most.', scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { heap, results: out.map(line => line.text) } };
  },
};

// ---------- Priority Queue ----------

const priorityQueue: SimulatorDef = {
  fields: [
    choiceField('built', 'Built on', [['heap', 'A min-heap'], ['sorted', 'A sorted list'], ['unsorted', 'An unsorted list']]),
    opsField('ops', 'Operations', 'add Write 3, add Fix 1, add Test 2, add Ship 4, peek, next, next', [{ label: 'Add', op: 'add', takesValue: true }, { label: 'Peek', op: 'peek' }, { label: 'Next', op: 'next' }]),
  ],
  examples: [
    { title: 'A heap', about: 'Both add and next stay cheap.', values: { built: 'heap', ops: 'add Write 3, add Fix 1, add Test 2, next, next' } },
    { title: 'A sorted list', about: 'Next is instant, while add has to shift.', values: { built: 'sorted', ops: 'add Write 3, add Fix 1, add Test 2, next, next' } },
    { title: 'An unsorted list', about: 'Add is instant, while next must scan them all.', values: { built: 'unsorted', ops: 'add Write 3, add Fix 1, add Test 2, next, next' } },
  ],
  run(input) {
    const built = input.built;
    const list = operations(input.ops, { add: 2, peek: 0, next: 0 });
    type Task = { name: string; priority: number; order: number };
    const tasks: Task[] = [];
    const out: { text: string; tone?: Tone }[] = [];
    let steps = 0;
    let serial = 0;
    const trace = new Trace();
    const first = (a: Task, b: Task) => a.priority < b.priority || (a.priority === b.priority && a.order < b.order);
    const label = (task: Task) => `${task.name} (${task.priority})`;
    const tree = (at: number, marks: Record<number, Tone>): BinaryNode | null => (at < tasks.length ? { id: `q${at}`, label: tasks[at].name, sub: String(tasks[at].priority), square: true, tone: marks[at] ?? 'value', left: tree(2 * at + 1, marks), right: tree(2 * at + 2, marks) } : null);
    const scene = (marks: Record<number, Tone> = {}): Panel[] => [
      ...(built === 'heap' ? [treePanel('The heap', visualTree(tree(0, marks)), 'Priority heap', { empty: 'The queue is empty' })] : []),
      cells(built === 'heap' ? 'As an array' : 'The list', row(tasks.map(label), { tone: i => marks[i] })),
      logPanel('Served', out),
    ];
    const metrics = (): Metric[] => [{ label: 'Waiting', value: tasks.length }, { label: 'Steps', value: steps }];
    const front = () => {
      if (built === 'heap' || built === 'sorted') return 0;
      let best = 0;
      for (let i = 1; i < tasks.length; i++) {
        steps++;
        if (first(tasks[i], tasks[best])) best = i;
        trace.add(`Scan ${tasks[i].name}`, `The best so far is ${tasks[best].name}, with priority ${tasks[best].priority}.`, scene({ [i]: 'active', [best]: 'accent' }), { tone: 'active', metrics: metrics() });
      }
      return best;
    };
    trace.add('Start', 'The lowest number goes first. On a tie, the older task goes first.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value, second } of list) {
      trace.group = `${op}${value ? ` ${value} ${second}` : ''}`;
      if (op === 'add') {
        const priority = Number(second);
        if (!Number.isInteger(priority)) throw new Error(`“${second}” isn't a whole number. Write tasks like: add Fix 1.`);
        const task = { name: value!, priority, order: serial++ };
        if (built === 'unsorted') {
          tasks.push(task);
          steps++;
          trace.add(`Add ${value}`, 'It goes on the end, in one step.', scene({ [tasks.length - 1]: 'new' }), { tone: 'new', metrics: metrics() });
        } else if (built === 'sorted') {
          let at = tasks.length;
          while (at > 0 && first(task, tasks[at - 1])) at--;
          steps += tasks.length - at + 1;
          tasks.splice(at, 0, task);
          trace.add(`Add ${value} at ${at}`, tasks.length - at - 1 ? `The ${counted(tasks.length - at - 1, 'task')} after it had to shift.` : 'Nothing after it had to shift.', scene({ [at]: 'new' }), { tone: 'new', metrics: metrics() });
        } else {
          tasks.push(task);
          let at = tasks.length - 1;
          steps++;
          trace.add(`Add ${value}`, 'It takes the next free spot in the heap.', scene({ [at]: 'new' }), { tone: 'new', metrics: metrics() });
          while (at > 0) {
            const parent = (at - 1) >> 1;
            if (!first(tasks[at], tasks[parent])) break;
            [tasks[at], tasks[parent]] = [tasks[parent], tasks[at]];
            steps++;
            trace.add(`${value} moves up`, 'Its priority beats its parent\'s.', scene({ [parent]: 'active', [at]: 'active' }), { tone: 'active', metrics: metrics() });
            at = parent;
          }
        }
      } else if (!tasks.length) {
        out.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'No tasks are waiting.', scene(), { tone: 'danger', metrics: metrics() });
      } else {
        const at = front();
        if (op === 'peek') {
          out.push({ text: `peek: ${tasks[at].name}` });
          trace.add(`Next up: ${tasks[at].name}`, 'It stays in the queue.', scene({ [at]: 'done' }), { tone: 'done', metrics: metrics() });
        } else {
          const task = tasks[at];
          out.push({ text: `next: ${task.name} (${task.priority})`, tone: 'done' });
          if (built === 'heap') {
            const last = tasks.pop()!;
            if (tasks.length) tasks[0] = last;
            let spot = 0;
            steps++;
            trace.add(`Serve ${task.name}`, 'The last task moves to the top, then sifts down.', scene({ 0: 'accent' }), { tone: 'accent', metrics: metrics() });
            while (true) {
              const left = 2 * spot + 1;
              const right = left + 1;
              let top = spot;
              if (left < tasks.length && first(tasks[left], tasks[top])) top = left;
              if (right < tasks.length && first(tasks[right], tasks[top])) top = right;
              if (top === spot) break;
              [tasks[spot], tasks[top]] = [tasks[top], tasks[spot]];
              steps++;
              trace.add('Sift down', `${tasks[top].name} moves down a level.`, scene({ [spot]: 'active', [top]: 'active' }), { tone: 'active', metrics: metrics() });
              spot = top;
            }
          } else {
            tasks.splice(at, 1);
            steps++;
            trace.add(`Serve ${task.name}`, built === 'sorted' ? 'It is at the front, so this takes one step.' : 'It was found by scanning everything.', scene(), { tone: 'accent', metrics: metrics() });
          }
        }
      }
    }
    trace.group = undefined;
    const costs = { heap: 'Add O(log n), next O(log n)', sorted: 'Add O(n), next O(1)', unsorted: 'Add O(1), next O(n)' }[built]!;
    trace.finish('Finished', `This took ${steps} steps. ${costs}.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { served: out.map(line => line.text) } };
  },
};

// ---------- Tree Representations ----------

type GeneralNode = { name: string; children: GeneralNode[]; parent: GeneralNode | null };

function parseGeneralTree(text: string) {
  const nodes = new Map<string, GeneralNode>();
  const get = (name: string) => {
    if (!nodes.has(name)) nodes.set(name, { name, children: [], parent: null });
    return nodes.get(name)!;
  };
  const parts = text.split(/[,;\n]+/).map(part => part.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Enter parent-child pairs, such as A-B, A-C.');
  if (parts.length > 15) throw new Error('Use at most 15 edges, so the tree stays readable.');
  for (const part of parts) {
    const match = part.match(/^(\w+)\s*-\s*(\w+)$/);
    if (!match) throw new Error(`“${part}” isn't a parent-child pair. Write them like A-B.`);
    const parent = get(match[1]);
    const child = get(match[2]);
    if (child.parent) throw new Error(`${child.name} has two parents, so this isn't a tree.`);
    if (parent === child) throw new Error(`${child.name} can't be its own parent.`);
    child.parent = parent;
    parent.children.push(child);
  }
  const roots = [...nodes.values()].filter(node => !node.parent);
  if (roots.length !== 1) throw new Error(roots.length ? `A tree has one root, but this has ${roots.length}: ${roots.map(node => node.name).join(', ')}.` : 'This has a cycle, so it isn\'t a tree.');
  const order: GeneralNode[] = [];
  const queue = [roots[0]];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    queue.push(...node.children);
  }
  if (order.length !== nodes.size) throw new Error('Some nodes aren\'t reachable from the root, because they form a cycle.');
  return { root: roots[0], order };
}

const treeRepresentations: SimulatorDef = {
  fields: [
    textField('tree', 'Parent-child pairs', 'A-B, A-C, A-D, B-E, B-F, D-G', { wide: true }),
    choiceField('form', 'Store it as', [['parent', 'Parent array'], ['children', 'Child lists'], ['sibling', 'First child, next sibling'], ['linked', 'Left and right links (binary)'], ['array', 'Array by position (binary)']]),
  ],
  examples: [
    { title: 'Parent array', about: 'Each node remembers only its parent.', values: { tree: 'A-B, A-C, A-D, B-E, B-F, D-G', form: 'parent' } },
    { title: 'First child, next sibling', about: 'Any tree can use just two links per node.', values: { tree: 'A-B, A-C, A-D, B-E, B-F, D-G', form: 'sibling' } },
    { title: 'Array by position', about: 'Children of index i sit at 2i + 1 and 2i + 2.', values: { tree: 'A-B, A-C, B-D, B-E, C-F', form: 'array' } },
    { title: 'A lopsided tree', about: 'An array leaves many gaps in a chain.', values: { tree: 'A-B, B-C, C-D', form: 'array' } },
  ],
  run(input) {
    const { root, order } = parseGeneralTree(input.tree);
    const form = input.form;
    const trace = new Trace();
    if ((form === 'linked' || form === 'array') && order.some(node => node.children.length > 2)) {
      const wide = order.find(node => node.children.length > 2)!;
      throw new Error(`${wide.name} has ${wide.children.length} children, but this form only allows two. Choose child lists or first child, next sibling.`);
    }
    const draw = (node: GeneralNode, active?: GeneralNode, seen?: Set<GeneralNode>): BinaryNode => ({ id: node.name, label: node.name, tone: node === active ? 'active' : seen?.has(node) ? 'done' : 'muted', children: node.children.map(child => draw(child, active, seen)) });
    const picture = (active?: GeneralNode, seen?: Set<GeneralNode>) => treePanel('The tree', visualTree(draw(root, active, seen)), 'Tree');
    const seen = new Set<GeneralNode>();
    let memory = 0;
    const metricsOf = () => [{ label: 'Nodes', value: order.length }, { label: 'Slots used', value: memory }];
    if (form === 'array') {
      let length = 0;
      const measure = (node: GeneralNode, at: number) => {
        length = Math.max(length, at + 1);
        node.children.forEach((child, i) => measure(child, 2 * at + 1 + i));
      };
      measure(root, 0);
      if (length > 40) throw new Error(`This tree would need ${length} array slots, which is too many to show. Try a less lopsided tree.`);
      const filled: string[] = Array.from({ length }, () => '');
      memory = length;
      const placeStep = (node: GeneralNode, at: number) => {
        filled[at] = node.name;
        seen.add(node);
        trace.add(`${node.name} at index ${at}`, at === 0 ? 'The root goes at index 0.' : `Its parent is at index ${(at - 1) >> 1}, which is (${at} - 1) ÷ 2, rounded down.`, [picture(node, seen), cells('The array', row(filled, { tone: i => (i === at ? 'new' : filled[i] ? 'value' : 'muted') }))], { tone: 'new', metrics: metricsOf() });
        node.children.forEach((child, i) => placeStep(child, 2 * at + 1 + i));
      };
      placeStep(root, 0);
      const gaps = filled.filter(name => !name).length;
      trace.finish('Stored', `${order.length} nodes used ${length} slots, with ${gaps} gap${gaps === 1 ? '' : 's'}. No links are needed. This suits complete trees, and wastes space on lopsided ones.`, [picture(undefined, seen), cells('The array', row(filled, { tone: i => (filled[i] ? 'done' : 'muted') }))], { metrics: [...metricsOf(), { label: 'Gaps', value: gaps }] });
      return { frames: trace.frames, answer: { slots: filled, gaps } };
    }
    const table: (string | number)[][] = [];
    const head = form === 'parent' ? ['Node', 'Parent'] : form === 'children' ? ['Node', 'Children'] : form === 'sibling' ? ['Node', 'First child', 'Next sibling'] : ['Node', 'Left', 'Right'];
    const costs = { parent: 'Finding a parent takes one step, while finding children means scanning everything.', children: 'Finding children is direct, while finding a parent needs a search.', sibling: 'Any tree fits in two links per node, but reaching the third child means walking along the siblings.', linked: 'Moving down is direct, and moving up needs an extra parent link.' }[form as 'parent'];
    for (const node of order) {
      seen.add(node);
      if (form === 'parent') {
        table.push([node.name, node.parent?.name ?? 'None']);
        memory += 1;
      } else if (form === 'children') {
        table.push([node.name, node.children.map(child => child.name).join(', ') || 'None']);
        memory += 1 + node.children.length;
      } else if (form === 'sibling') {
        const siblings = node.parent?.children ?? [];
        table.push([node.name, node.children[0]?.name ?? 'None', siblings[siblings.indexOf(node) + 1]?.name ?? 'None']);
        memory += 2;
      } else {
        table.push([node.name, node.children[0]?.name ?? 'None', node.children[1]?.name ?? 'None']);
        memory += 2;
      }
      const at = table.length - 1;
      trace.add(`Store ${node.name}`, costs, [picture(node, seen), tablePanel('What gets stored', [...table], { colHead: head, zone: 'side', tone: r => (r === at ? 'new' : undefined) })], { tone: 'new', metrics: metricsOf() });
    }
    trace.finish('Stored', costs, [picture(undefined, seen), tablePanel('What gets stored', table, { colHead: head, zone: 'side' })], { metrics: metricsOf() });
    return { frames: trace.frames, answer: { table } };
  },
};

// ---------- Tree Traversals ----------

const treeTraversals: SimulatorDef = {
  fields: [
    textField('tree', 'Tree, level by level', 'A, B, C, D, E, null, F', { wide: true, placeholder: 'Use null for a missing child' }),
    choiceField('order', 'Traversal', [['pre', 'Preorder'], ['in', 'Inorder'], ['post', 'Postorder'], ['level', 'Level order']]),
    choiceField('method', 'Using', [['recursive', 'Recursion'], ['iterative', 'A stack or queue']]),
  ],
  examples: [
    { title: 'Inorder on a search tree', about: 'It gives the values in sorted order.', values: { tree: '4, 2, 6, 1, 3, 5, 7', order: 'in', method: 'recursive' } },
    { title: 'Preorder', about: 'Visit a node before its children: good for copying a tree.', values: { tree: 'A, B, C, D, E, null, F', order: 'pre', method: 'iterative' } },
    { title: 'Postorder', about: 'Children come first: good for deleting a tree.', values: { tree: 'A, B, C, D, E, null, F', order: 'post', method: 'recursive' } },
    { title: 'Level order', about: 'A queue gives one level at a time.', values: { tree: 'A, B, C, D, E, null, F', order: 'level', method: 'iterative' } },
  ],
  run(input) {
    const root = parseLevelOrder(input.tree);
    if (!root) throw new Error('The tree is empty. Give the root a value.');
    const order = input.order;
    const iterative = input.method === 'iterative' || order === 'level';
    const trace = new Trace();
    const output: string[] = [];
    const visited: string[] = [];
    const memoryName = order === 'level' ? 'Queue' : iterative ? 'Stack' : 'Call stack';
    const memory: { label: string; node: TreeNode }[] = [];
    let peak = 0;
    const scene = (active?: TreeNode): Panel[] => [
      treePanel('The tree', visualTree(drawTree(root, node => (node === active ? 'active' : visited.includes(node.id) ? 'done' : memory.some(item => item.node === node) ? 'path' : 'muted'), node => (visited.includes(node.id) ? `#${visited.indexOf(node.id) + 1}` : undefined))), 'Traversal tree'),
      cells('Output', row(output, { hideIndex: true, tone: i => (i === output.length - 1 ? 'new' : 'done') })),
      stackPanel(memoryName, memory.map(item => item.label), { tone: i => (i === memory.length - 1 ? 'active' : undefined), empty: 'Empty' }),
    ];
    const metrics = (): Metric[] => [{ label: 'Visited', value: visited.length }, { label: `${memoryName} now`, value: memory.length }, { label: 'Peak', value: peak }];
    const push = (node: TreeNode, label = node.value) => {
      memory.push({ label, node });
      peak = Math.max(peak, memory.length);
    };
    const visit = (node: TreeNode, why: string) => {
      output.push(node.value);
      visited.push(node.id);
      trace.add(`Visit ${node.value}`, why, scene(node), { tone: 'new', metrics: metrics() });
    };
    const names = { pre: 'node, then left, then right', in: 'left, then node, then right', post: 'left, then right, then node', level: 'level by level, left to right' } as Record<string, string>;
    if (order === 'level') {
      push(root);
      trace.add(`Queue ${root.value}`, `The order is ${names.level}. Start with the root.`, scene(root), { tone: 'path', metrics: metrics() });
      while (memory.length) {
        const { node } = memory.shift()!;
        visit(node, 'Take the node at the front of the queue. Its children will wait behind everything already queued.');
        for (const child of [node.left, node.right]) {
          if (child) {
            push(child);
            trace.add(`Queue ${child.value}`, `A child of ${node.value} joins the back of the queue.`, scene(node), { tone: 'path', metrics: metrics() });
          }
        }
      }
    } else if (!iterative) {
      const walk = (node: TreeNode | null) => {
        if (!node) return;
        push(node, `visit(${node.value})`);
        trace.add(`Call visit(${node.value})`, `The order is ${names[order]}.`, scene(node), { tone: 'path', metrics: metrics() });
        if (order === 'pre') visit(node, 'Preorder visits a node before its children.');
        walk(node.left);
        if (order === 'in') visit(node, 'Inorder visits a node after its left side.');
        walk(node.right);
        if (order === 'post') visit(node, 'Postorder visits a node after both of its children.');
        memory.pop();
        trace.add(`Return from ${node.value}`, 'This call is finished, so its frame leaves the stack.', scene(), { tone: 'muted', metrics: metrics() });
      };
      walk(root);
    } else if (order === 'pre') {
      push(root);
      trace.add(`Push ${root.value}`, 'Start with the root on the stack.', scene(root), { tone: 'path', metrics: metrics() });
      while (memory.length) {
        const { node } = memory.pop()!;
        visit(node, 'Pop a node, and visit it straight away.');
        for (const child of [node.right, node.left]) {
          if (child) {
            push(child);
            trace.add(`Push ${child.value}`, node.right === child ? 'Push the right child first, so the left comes off first.' : 'The left child is now on top.', scene(node), { tone: 'path', metrics: metrics() });
          }
        }
      }
    } else if (order === 'in') {
      let current: TreeNode | null = root;
      while (current || memory.length) {
        while (current) {
          push(current);
          trace.add(`Push ${current.value}`, 'Keep going left, saving each node to come back to.', scene(current), { tone: 'path', metrics: metrics() });
          current = current.left;
        }
        const { node } = memory.pop()!;
        visit(node, 'There is nothing further left, so visit this node, then go right.');
        current = node.right;
      }
    } else {
      let current: TreeNode | null = root;
      let last: TreeNode | null = null;
      while (current || memory.length) {
        while (current) {
          push(current);
          trace.add(`Push ${current.value}`, 'Keep going left, saving each node to come back to.', scene(current), { tone: 'path', metrics: metrics() });
          current = current.left;
        }
        const top: TreeNode = memory.at(-1)!.node;
        if (top.right && last !== top.right) {
          trace.add(`Go right from ${top.value}`, 'Its right side isn\'t done, so it stays on the stack for now.', scene(top), { tone: 'active', metrics: metrics() });
          current = top.right;
        } else {
          memory.pop();
          visit(top, 'Both sides are finished, so visit it now.');
          last = top;
        }
      }
    }
    trace.finish(output.join(' '), `Every node was visited exactly once, so this took O(n) time. ${memoryName} peaked at ${peak} ${peak === 1 ? 'entry' : 'entries'}.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { output, peak } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  'binary-tree-basics': binaryTreeBasics,
  'binomial-heap': binomialHeap,
  heaps,
  'priority-queue': priorityQueue,
  'tree-representations': treeRepresentations,
  'tree-traversals': treeTraversals,
};
