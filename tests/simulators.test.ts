import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { notationsOf, parseExpression } from '../src/lib/expressions.ts';
import { allTopics, simulatorHref, topicAt, topicSlug } from '../src/lib/catalog.ts';
import { defaultValues, MAX_FRAMES, type SimFrame, type SimulatorDef, type Values } from '../src/simulators/kit.ts';
import { loadSimulator, simulatorSlugs } from '../src/simulators/registry.ts';

const defs = new Map<string, SimulatorDef>();
before(async () => {
  for (const slug of simulatorSlugs) defs.set(slug, await loadSimulator(slug));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const answer = (slug: string, values: Values = {}): any => {
  const def = defs.get(slug)!;
  return def.run({ ...defaultValues(def), ...values }).answer;
};
const fails = (slug: string, values: Values, pattern: RegExp) => {
  const def = defs.get(slug)!;
  assert.throws(() => def.run({ ...defaultValues(def), ...values }), pattern, `${slug} should refuse ${JSON.stringify(values)}`);
};

function seeded(seed: number) {
  let state = seed;
  return (n: number) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % n;
  };
}
const list = (next: (n: number) => number, size: number, low: number, high: number) => Array.from({ length: size }, () => low + next(high - low + 1));
const subsetsOf = <T,>(items: T[]) => Array.from({ length: 2 ** items.length }, (_, mask) => items.filter((_, i) => mask & (1 << i)));
const sum = (items: number[]) => items.reduce((a, b) => a + b, 0);

function randomEdges(next: (n: number) => number, nodes: number, edges: number, weight: (next: (n: number) => number) => number = n => 1 + n(9)) {
  const pairs = new Set<string>();
  const out: { from: string; to: string; weight: number }[] = [];
  for (let tries = 0; tries < 200 && out.length < edges; tries++) {
    const a = next(nodes);
    const b = next(nodes);
    if (a === b || pairs.has(`${a},${b}`) || pairs.has(`${b},${a}`)) continue;
    pairs.add(`${a},${b}`);
    out.push({ from: `N${a}`, to: `N${b}`, weight: weight(next) });
  }
  return out;
}
const edgeText = (edges: { from: string; to: string; weight: number }[]) => edges.map(edge => `${edge.from}-${edge.to}:${edge.weight}`).join(', ');
const nodesIn = (edges: { from: string; to: string }[]) => [...new Set(edges.flatMap(edge => [edge.from, edge.to]))].sort();

function checkFrame(slug: string, frame: SimFrame) {
  assert.ok(frame.label, `${slug}: every step has a label`);
  assert.ok(frame.detail, `${slug}: "${frame.label}" explains itself`);
  assert.ok(frame.panels.length, `${slug}: "${frame.label}" shows something`);
  const text = JSON.stringify({ label: frame.label, title: frame.title, detail: frame.detail, panels: frame.panels, metrics: frame.metrics });
  for (const bad of ['undefined', 'NaN', 'Infinity', '[object Object]']) assert.ok(!text.includes(bad), `${slug}: "${frame.label}" prints ${bad}: ${text.slice(0, 300)}`);
}

// ---------- Every page ----------

test('every topic has a simulator, and the addresses never clash', () => {
  assert.equal(allTopics.length, 111);
  const shared = allTopics.filter(topic => !topic.simulator).map(topicSlug).sort();
  assert.deepEqual([...simulatorSlugs].sort(), shared, 'the registry lists exactly the topics with no page of their own');
  assert.equal(new Set(simulatorSlugs).size, simulatorSlugs.length);
  assert.equal(new Set(allTopics.map(simulatorHref)).size, allTopics.length);
  for (const topic of allTopics) assert.equal(topicAt(simulatorHref(topic))?.topic.title, topic.title);
  for (const slug of simulatorSlugs) assert.ok(defs.get(slug), `${slug} has a definition`);
});

test('every simulator runs on its starting input and every example, with sound frames', () => {
  for (const [slug, def] of defs) {
    assert.ok(def.fields.length, `${slug} asks for some input`);
    assert.ok(def.examples.length >= 2, `${slug} has at least two examples`);
    assert.equal(new Set(def.fields.map(field => field.key)).size, def.fields.length, `${slug} has unique field keys`);
    assert.equal(new Set(def.examples.map(example => example.title)).size, def.examples.length, `${slug} has unique example titles`);
    const runs: Values[] = [defaultValues(def), ...def.examples.map(example => ({ ...defaultValues(def), ...example.values }))];
    runs.forEach((values, i) => {
      for (const key of Object.keys(values)) assert.ok(def.fields.some(field => field.key === key), `${slug}: an example sets ${key}, which isn't a field`);
      const { frames } = def.run(values);
      assert.ok(frames.length >= 1 && frames.length <= MAX_FRAMES + 1, `${slug} run ${i} has ${frames.length} frames`);
      frames.forEach(frame => checkFrame(slug, frame));
    });
  }
});

test('every choice in every simulator works', () => {
  for (const [slug, def] of defs) {
    for (const field of def.fields) {
      if (field.kind !== 'choice') continue;
      for (const option of field.options) {
        const values = { ...defaultValues(def), [field.key]: option.value };
        if (field.only && !field.only(values)) continue;
        try {
          def.run(values).frames.forEach(frame => checkFrame(slug, frame));
        } catch (error) {
          // A choice may rightly refuse the starting input, but it must say why in plain words.
          assert.match((error as Error).message, /[A-Za-z]{4}/, `${slug} ${field.key}=${option.value}`);
          assert.doesNotMatch((error as Error).message, /undefined|Cannot read|not a function/, `${slug} ${field.key}=${option.value}`);
        }
      }
    }
  }
});

test('frames keep their own copies, so moving back through a run shows what really happened', () => {
  const def = defs.get('tower-of-hanoi')!;
  const { frames } = def.run({ ...defaultValues(def), disks: '2' });
  const pegs = frames.map(frame => frame.panels.find(panel => panel.kind === 'pegs'));
  assert.deepEqual(pegs[0]?.kind === 'pegs' && pegs[0].pegs[0].disks, [2, 1], 'the first frame still has both disks on peg A');
  const last = pegs.at(-1);
  assert.deepEqual(last?.kind === 'pegs' && last.pegs[2].disks, [2, 1], 'the last frame has both on peg C');
});

test('bad input gets a clear message, and not a crash', () => {
  fails('binary-search', { values: '5, 1, 3' }, /sorted/);
  fails('binary-search', { values: 'a, b' }, /whole number/);
  fails('bubble-sort', { values: '' }, /at least one/);
  fails('dijkstra', { edges: 'A-B:-1' }, /negative/);
  fails('dijkstra', { start: 'Z' }, /isn't in the graph/);
  fails('0-1-bfs', { edges: 'A-B:2' }, /only allows weights 0 and 1/);
  fails('gcd', { a: '0', b: '0' }, /above zero/);
  fails('stack', { ops: 'jump 3' }, /isn't an operation/);
  fails('stack', { ops: 'push' }, /takes one value/);
  fails('counting-sort', { values: '1, 900' }, /range/);
  fails('0-1-knapsack', { items: 'A(1)' }, /2 whole numbers/);
  fails('0-1-knapsack', { items: 'nonsense' }, /doesn't fit/);
  fails('activity-selection', { items: 'A(5,1)' }, /finish after/);
  fails('kirchhoffs-theorem', { edges: 'A' }, /two nodes/);
  fails('tree-representations', { tree: 'A-B, A-C, A-D', form: 'array' }, /only allows two/);
  fails('tree-representations', { tree: 'A-B, C-B' }, /two parents/);
  fails('tree-representations', { tree: 'A-B, B-A' }, /cycle/);
  fails('tree-traversals', { tree: 'null' }, /empty/);
  fails('notation-conversion', { conversion: 'infix-postfix', infix: '(1 + 2' }, /closing/);
  fails('notation-conversion', { conversion: 'postfix-infix', postfix: '1 +' }, /needs two operands/);
  fails('notation-conversion', { conversion: 'prefix-infix', prefix: '1 2' }, /too few operators/);
  fails('minimax', { tree: 'not a tree' }, /nested lists/);
  fails('a-search', { grid: '.# / ..', goal: '0,1', start: '0,0' }, /on a wall/);
});

// ---------- Foundations ----------

test('foundations give the known answers', () => {
  assert.deepEqual(answer('abstract-data-types', { adt: 'stack', ops: 'add 1, add 2, remove, peek' }).results, ['pop: 2', 'peek: 1']);
  assert.deepEqual(answer('abstract-data-types', { adt: 'queue', ops: 'add 1, add 2, remove, peek' }).results, ['dequeue: 1', 'front: 2']);
  assert.deepEqual(answer('asymptotic-notation', { a: '3', b: '5', k: '2', g: 'n2', c: '4' }), { bigO: true, omega: true, theta: true, n0: 6 });
  assert.equal(answer('asymptotic-notation', { a: '1', b: '0', k: '0', g: 'n', c: '10' }).bigO, false);
  assert.equal(answer('asymptotic-notation', { a: '0', b: '5', k: '2', g: 'n2', c: '1' }).omega, false);
  assert.deepEqual(answer('best-average-and-worst-case', { algorithm: 'linear', values: '7, 3, 9' }), { best: 1, worst: 3, average: 2 });
  assert.equal(answer('best-average-and-worst-case', { algorithm: 'insertion', values: '4, 2, 6, 1, 5, 3' }).worst, 15);
  assert.equal(answer('best-average-and-worst-case', { algorithm: 'insertion', values: '4, 2, 6, 1, 5, 3' }).best, 5);
  assert.equal(answer('big-o-growth-comparison', { n: '10' })['O(2ⁿ)'], 1024);
  const bit = (a: number, b: number, op: string) => answer('bit-manipulation', { a: String(a), b: String(b), op });
  for (const [a, b] of [[12, 10], [255, 1], [0, 7], [170, 85]]) {
    assert.equal(bit(a, b, 'and'), a & b);
    assert.equal(bit(a, b, 'or'), a | b);
    assert.equal(bit(a, b, 'xor'), a ^ b);
    assert.equal(bit(a, 3, 'set'), a | 8);
    assert.equal(bit(a, 3, 'clear'), a & ~8);
    assert.equal(bit(a, 3, 'toggle'), a ^ 8);
    assert.equal(bit(a, 3, 'check'), (a >> 3) & 1);
    assert.equal(bit(a, 2, 'shl'), (a << 2) & 255);
    assert.equal(bit(a, 2, 'shr'), a >> 2);
    assert.equal(bit(a, 0, 'not'), ~a & 255);
    assert.equal(bit(a, 0, 'count'), a.toString(2).replaceAll('0', '').length);
  }
  assert.equal(bit(64, 0, 'power'), 1);
  assert.equal(bit(65, 0, 'power'), 0);
  assert.equal(bit(0, 0, 'power'), 0);
  for (const method of ['remainder', 'subtract', 'extended']) assert.equal(answer('gcd', { a: '48', b: '18', method }).gcd, 6);
  assert.equal(answer('gcd', { a: '48', b: '18' }).lcm, 144);
  const extended = answer('gcd', { a: '240', b: '46', method: 'extended' });
  assert.equal(240 * extended.x + 46 * extended.y, extended.gcd);
  assert.equal(extended.gcd, 2);
  assert.equal(answer('gcd', { a: '0', b: '5' }).gcd, 5);
  const iteration = answer('iteration-vs-recursion', { fn: 'factorial', n: '5' });
  assert.deepEqual([iteration.loop, iteration.recursive], [120, 120]);
  assert.equal(answer('iteration-vs-recursion', { fn: 'fibonacci', n: '7' }).recursive, 13);
  assert.equal(answer('iteration-vs-recursion', { fn: 'fibonacci', n: '7' }).loop, 13);
  assert.equal(answer('iteration-vs-recursion', { fn: 'sum', n: '10' }).loop, 55);
  assert.equal(answer('iteration-vs-recursion', { fn: 'sum', n: '10' }).recursive, 55);
  assert.equal(answer('iteration-vs-recursion', { fn: 'factorial', n: '0' }).recursive, 1);
  const master = (a: number, b: number, k: number, p = 0) => answer('master-theorem', { a: String(a), b: String(b), k: String(k), p: String(p) });
  assert.deepEqual(master(2, 2, 1), { caseNumber: 2, answer: 'Θ(n log n)' });
  assert.deepEqual(master(1, 2, 0), { caseNumber: 2, answer: 'Θ(log n)' });
  assert.deepEqual(master(8, 2, 2), { caseNumber: 1, answer: 'Θ(n^3)' });
  assert.deepEqual(master(2, 2, 2), { caseNumber: 3, answer: 'Θ(n^2)' });
  assert.deepEqual(master(2, 2, 1, 1), { caseNumber: 2, answer: 'Θ(n log^2 n)' });
  assert.deepEqual(answer('p-vs-np', { values: '3, 34, 4, 12, 5, 2', target: '9' }).reduce((a: number, b: number) => a + b, 0), 9);
  assert.equal(answer('p-vs-np', { values: '2, 4, 6, 8', target: '7' }), null);
  for (const [recurrence, n] of [['r1', '20'], ['r2', '20'], ['r3', '15'], ['r4', '64'], ['r5', '64'], ['r6', '64']]) assert.ok(answer('recurrences', { recurrence, n }).matches, `${recurrence} matches its formula`);
  const calls = answer('recursion-and-the-call-stack', { fn: 'fibonacci', n: '5' });
  assert.deepEqual([calls.result, calls.calls, calls.peak], [5, 15, 5]);
  assert.equal(answer('recursion-and-the-call-stack', { fn: 'factorial', n: '4' }).result, 24);
  assert.equal(answer('recursion-and-the-call-stack', { fn: 'power', n: '10' }).result, 1024);
  assert.equal(answer('recursion-and-the-call-stack', { fn: 'sum', n: '4' }).result, 10);
  assert.deepEqual(answer('space-complexity', { algorithm: 'matrix', n: '5' }), { peak: 25, growth: 'O(n²)' });
  assert.deepEqual(answer('space-complexity', { algorithm: 'loop', n: '8' }), { peak: 2, growth: 'O(1)' });
  assert.deepEqual(answer('space-complexity', { algorithm: 'recursive', n: '6' }), { peak: 7, growth: 'O(n)' });
  const tradeoff = answer('time-space-tradeoff', { values: '5, 2, 9, 1' });
  assert.deepEqual([tradeoff.pairs, tradeoff.lookups, tradeoff.hasDuplicate, tradeoff.agree], [6, 4, false, true]);
  assert.equal(answer('time-space-tradeoff', { values: '3, 8, 1, 6, 2, 8' }).agree, true);
  for (const disks of [1, 3, 5, 7]) {
    const hanoi = answer('tower-of-hanoi', { disks: String(disks) });
    assert.equal(hanoi.moves, 2 ** disks - 1);
    assert.deepEqual(hanoi.pegs.C, Array.from({ length: disks }, (_, i) => disks - i));
  }
  assert.deepEqual(answer('tower-of-hanoi', { disks: '3', target: 'B' }).pegs.B, [3, 2, 1]);
});

test('NP-complete checks agree with brute force, and a cover and an independent set are complements', () => {
  const next = seeded(41);
  for (let run = 0; run < 60; run++) {
    const edges = randomEdges(next, 6, 3 + next(6));
    const nodes = nodesIn(edges);
    const k = 1 + next(nodes.length);
    const text = edges.map(edge => `${edge.from}-${edge.to}`).join(', ');
    const subsets = subsetsOf(nodes).filter(set => set.length === k);
    const joined = (a: string, b: string) => edges.some(edge => (edge.from === a && edge.to === b) || (edge.from === b && edge.to === a));
    const isCover = (set: string[]) => edges.every(edge => set.includes(edge.from) || set.includes(edge.to));
    const isIndependent = (set: string[]) => set.every((a, i) => set.slice(i + 1).every(b => !joined(a, b)));
    const isClique = (set: string[]) => set.every((a, i) => set.slice(i + 1).every(b => joined(a, b)));
    for (const [problem, check] of [['cover', isCover], ['independent', isIndependent], ['clique', isClique]] as const) {
      const found = answer('np-complete-problems', { problem, edges: text, k: String(k) });
      assert.equal(Boolean(found), subsets.some(check), `${problem} on ${text} with k=${k}`);
      if (found) assert.ok(check(found));
    }
  }
});

// ---------- Linear structures ----------

test('linear structures behave like simple models', () => {
  assert.deepEqual(answer('stack', { ops: 'push 1, push 2, peek, pop, pop, pop' }).log, ['peek = 2', 'pop = 2', 'pop = 1', 'pop: empty']);
  assert.deepEqual(answer('queue', { built: 'linked', ops: 'enqueue 1, enqueue 2, front, dequeue, dequeue, dequeue' }).log, ['front = 1', 'dequeue = 1', 'dequeue = 2', 'dequeue: empty']);
  assert.equal(answer('queue', { built: 'array', ops: 'enqueue 1, enqueue 2, enqueue 3, dequeue' }).moves, 2);
  assert.deepEqual(answer('deque', { ops: 'pushback 20, pushback 30, pushfront 10, popback, popfront' }), { items: [20], log: ['back: 30', 'front: 10'] });
  const circular = answer('circular-queue', { capacity: '4', ops: 'enqueue 10, enqueue 20, enqueue 30, dequeue, enqueue 40, enqueue 50, enqueue 60' });
  assert.deepEqual(circular.contents, [20, 30, 40, 50]);
  assert.equal(circular.front, 1);
  assert.deepEqual(circular.log, ['dequeue = 10', 'enqueue 60: full']);
  const arrays = answer('arrays', { values: '12, 45, 7, 30', ops: 'read 2, insert 1 99, delete 0, search 30, search 5, write 0 1, append 8, read 9' });
  assert.deepEqual(arrays.items, [1, 45, 7, 30, 8]);
  assert.deepEqual(arrays.log, ['read 2 = 7', 'search 30: index 3', 'search 5: not found', 'Read: index 9 is out of range']);
  assert.deepEqual(answer('bit-array', { size: '20', ops: 'set 3, set 19, get 19, get 4, clear 19, count, flip 0' }).words, [9, 0, 0]);
  assert.deepEqual(answer('bit-array', { size: '20', ops: 'set 3, set 19, get 19, get 4, clear 19, count, flip 0' }).log, ['get 19 = 1', 'get 4 = 0', 'count = 1']);
  assert.deepEqual(answer('dynamic-arrays', { count: '9', growth: 'double', start: '1' }), { capacity: 16, copies: 15, size: 9 });
  assert.deepEqual(answer('dynamic-arrays', { count: '5', growth: 'fixed', start: '1' }), { capacity: 5, copies: 1, size: 5 });
  const linked = answer('linked-lists', { ops: 'addlast 10, addlast 20, addlast 30, addfirst 5, insert 2 15, delete 20, search 30, reverse' });
  assert.deepEqual(linked.items, [30, 15, 10, 5]);
  assert.deepEqual(linked.log, ['deleted 20', 'search 30: position 3']);
  assert.deepEqual(answer('doubly-and-circular-linked-lists', { kind: 'double', ops: 'addlast 1, addlast 2, backward' }).log, ['backward: 2, 1']);
  assert.deepEqual(answer('doubly-and-circular-linked-lists', { kind: 'circular', ops: 'addlast 1, backward' }).log, ['backward: needs previous links']);
  assert.equal(answer('strings', { text: 'racecar', op: 'palindrome' }), true);
  assert.equal(answer('strings', { text: 'abca', op: 'palindrome' }), false);
  assert.equal(answer('strings', { text: 'abc', op: 'reverse' }), 'cba');
  assert.equal(answer('strings', { text: 'education', op: 'vowels' }), 5);
  assert.equal(answer('strings', { text: 'listen', second: 'silent', op: 'anagram' }), true);
  assert.equal(answer('strings', { text: 'listen', second: 'silenx', op: 'anagram' }), false);
  assert.equal(answer('strings', { text: 'ab', second: 'abc', op: 'anagram' }), false);
  assert.equal(answer('strings', { text: 'apple', second: 'apply', op: 'compare' }), -1);
  assert.equal(answer('strings', { text: 'b', second: 'a', op: 'compare' }), 1);
  assert.equal(answer('strings', { text: 'same', second: 'same', op: 'compare' }), 0);
  assert.equal(answer('strings', { text: 'Zebra', second: 'apple', op: 'compare' }), -1);
  assert.deepEqual(answer('strings', { text: 'Az', op: 'codes' }), [65, 122]);
});

test('linked lists match an array model on random operations', () => {
  const next = seeded(7);
  for (let run = 0; run < 100; run++) {
    const model: number[] = [];
    const ops: string[] = [];
    for (let i = 0; i < 12; i++) {
      const value = next(9);
      const kind = next(5);
      if (kind === 0) {
        ops.push(`addfirst ${value}`);
        model.unshift(value);
      } else if (kind === 1) {
        ops.push(`addlast ${value}`);
        model.push(value);
      } else if (kind === 2) {
        const at = next(model.length + 1);
        ops.push(`insert ${at} ${value}`);
        model.splice(at, 0, value);
      } else if (kind === 3) {
        ops.push(`delete ${value}`);
        if (model.includes(value)) model.splice(model.indexOf(value), 1);
      } else {
        ops.push('reverse');
        model.reverse();
      }
    }
    assert.deepEqual(answer('linked-lists', { ops: ops.join(', ') }).items, model, ops.join(', '));
    for (const kind of ['double', 'circular', 'circular-double']) assert.deepEqual(answer('doubly-and-circular-linked-lists', { kind, ops: ops.join(', ') }).items, model);
  }
});

// ---------- Hashing ----------

test('hashing gives the known answers', () => {
  const chained = answer('chaining', { size: '7', ops: 'insert 10, insert 17, insert 3, insert 24, search 17, delete 3, search 3' });
  assert.deepEqual(chained.table[3], [10, 17, 24].map(String));
  assert.deepEqual(chained.log, ['search 17: found in bucket 3', 'deleted 3', 'search 3: not found']);
  assert.deepEqual(answer('chaining', { size: '7', ops: 'insert cat, insert act' }).table.flat().sort(), ['act', 'cat']);
  assert.deepEqual(answer('hash-functions', { method: 'division', keys: '10, 20, 30', size: '10' }), { slots: [0, 0, 0], collisions: 2 });
  assert.deepEqual(answer('hash-functions', { method: 'folding', keys: '123456', size: '10' }).slots, [2], '12 + 34 + 56 = 102');
  assert.deepEqual(answer('hash-functions', { method: 'midsquare', keys: '12', size: '10' }).slots, [4], '12² = 144, and the middle digits of 0144 are 14');
  assert.deepEqual(answer('hash-functions', { method: 'multiplication', keys: '123', size: '10' }).slots, [Math.floor(10 * ((123 * 0.618034) % 1))]);
  assert.deepEqual(answer('hash-tables', { strategy: 'chain', size: '7', ops: 'put apple 3, put apple 8, get apple, get pear, remove apple, get apple' }), ['get apple = 8', 'get pear: missing', 'removed apple', 'get apple: missing']);
  assert.deepEqual(answer('hash-tables', { strategy: 'linear', size: '5', ops: 'put cat 1, put act 2, put tac 3, get tac, remove cat, get act' }), ['get tac = 3', 'removed cat', 'get act = 2']);
  assert.deepEqual(answer('linear-quadratic-probing-and-double-hashing', { method: 'linear', size: '7', keys: '10, 17, 3, 24' }).slots, [null, null, null, 10, 17, 3, 24]);
  assert.deepEqual(answer('linear-quadratic-probing-and-double-hashing', { method: 'quadratic', size: '7', keys: '10, 17, 3, 24' }).slots, [3, null, null, 10, 17, 24, null]);
  const quadratic = answer('linear-quadratic-probing-and-double-hashing', { method: 'quadratic', size: '8', keys: '0, 8, 16, 24, 32, 40' });
  assert.ok(quadratic.slots.includes(null), 'quadratic probing can leave slots unreachable');
  assert.deepEqual(answer('open-addressing', { size: '7', ops: 'insert 10, insert 17, insert 24, delete 17, search 24' }).log, ['deleted 17', 'search 24: slot 5']);
  assert.deepEqual(answer('open-addressing', { size: '7', ops: 'insert 10, insert 17, delete 10, insert 24' }).slots.slice(3, 5), ['24', '17'], 'a marker gets reused');
  assert.deepEqual(answer('open-addressing', { size: '3', ops: 'insert 1, insert 2, insert 3, insert 4' }).log, ['insert 4: table is full']);
  const rehash = answer('rehashing', { keys: '3, 11, 20, 25', size: '4', threshold: '0.75', growth: '2' });
  assert.deepEqual([rehash.size, rehash.rehashes, rehash.moved], [8, 1, 4]);
  assert.deepEqual(answer('sets-and-maps', { op: 'union', a: '1, 2, 3', b: '3, 4' }), ['1', '2', '3', '4']);
  assert.deepEqual(answer('sets-and-maps', { op: 'intersection', a: '1, 2, 3', b: '3, 2' }), ['2', '3']);
  assert.deepEqual(answer('sets-and-maps', { op: 'difference', a: '1, 2, 3', b: '3' }), ['1', '2']);
  assert.deepEqual(answer('sets-and-maps', { op: 'symmetric', a: '1, 2', b: '2, 3' }), ['1', '3']);
  assert.deepEqual(answer('sets-and-maps', { op: 'count', a: 'to be or not to be' }), { to: 2, be: 2, or: 1, not: 1 });
  assert.deepEqual(answer('sets-and-maps', { op: 'dedupe', a: '4, 1, 4, 2, 1, 4' }), ['4', '1', '2']);
  const hashed = answer('string-hashing', { text: 'abracadabra', from: '7', to: '11' });
  assert.equal(hashed.value, hashed.direct);
  assert.equal(hashed.value, answer('string-hashing', { text: 'abracadabra', from: '0', to: '4' }).value, 'abra hashes the same in both places');
});

test('hash tables store every key, however collisions are handled', () => {
  const next = seeded(11);
  for (let run = 0; run < 80; run++) {
    const size = 7 + next(7);
    const keys = [...new Set(list(next, 6, 0, 60))];
    for (const method of ['linear', 'double']) {
      const { slots } = answer('linear-quadratic-probing-and-double-hashing', { method, size: String(size), keys: keys.join(', ') });
      if (method === 'linear') assert.deepEqual(slots.filter((value: number | null) => value !== null).sort((a: number, b: number) => a - b), [...keys].sort((a, b) => a - b), `${method} ${size} ${keys}`);
      else for (const key of slots.filter((value: number | null) => value !== null)) assert.ok(keys.includes(key));
    }
    const ops = [...keys.map(key => `insert ${key}`), `delete ${keys[0]}`, ...keys.map(key => `search ${key}`)].slice(0, 16);
    const { log } = answer('open-addressing', { size: String(size), ops: ops.join(', ') });
    const searches = log.filter((line: string) => line.startsWith('search'));
    for (const line of searches) {
      const key = Number(line.match(/search (\d+)/)![1]);
      assert.equal(line.includes('not found'), key === keys[0], line);
    }
  }
});

// ---------- Searching ----------

const allMatches = (text: string, pattern: string) => {
  const found: number[] = [];
  for (let i = 0; i + pattern.length <= text.length; i++) if (text.slice(i, i + pattern.length) === pattern) found.push(i);
  return found;
};

test('searching gives the known answers', () => {
  assert.equal(answer('binary-search', { values: '2, 5, 8, 12, 16, 23, 38, 56, 72', target: '23' }), 5);
  assert.equal(answer('binary-search', { values: '2, 5, 8', target: '7' }), -1);
  assert.equal(answer('binary-search', { values: '1, 3, 3, 3, 3, 7', target: '3', goal: 'first' }), 1);
  assert.equal(answer('binary-search', { values: '1, 3, 3, 3, 3, 7', target: '3', goal: 'last' }), 4);
  assert.equal(answer('binary-search', { values: '2, 5, 8, 12, 16', target: '10', goal: 'lower' }), 3);
  assert.equal(answer('binary-search', { values: '2, 5', target: '9', goal: 'lower' }), 2);
  assert.deepEqual(answer('kmp', { text: 'ABABABC', pattern: 'ABABC' }).fail, [0, 0, 1, 2, 0]);
  assert.deepEqual(answer('kmp', { text: 'ABABABC', pattern: 'ABABC' }).matches, [2]);
  assert.deepEqual(answer('kmp', { text: 'AAAA', pattern: 'AAAA' }).fail, [0, 1, 2, 3]);
  assert.deepEqual(answer('linear-search', { values: '7, 3, 9, 1, 5, 9', target: '9', mode: 'all' }).found, [2, 5]);
  assert.deepEqual(answer('linear-search', { values: '7, 3, 9, 1, 5, 9', target: '9', mode: 'first' }).found, [2]);
  assert.deepEqual(answer('linear-search', { values: '7, 3', target: '4', mode: 'sentinel' }), { found: [], comparisons: 3 });
  assert.deepEqual(answer('naive-pattern-matching', { text: 'AAAAA', pattern: 'AA' }).matches, [0, 1, 2, 3]);
  assert.deepEqual(answer('naive-pattern-matching', { text: 'AB', pattern: 'ABC' }).matches, []);
  assert.deepEqual(answer('rabin-karp', { text: 'abcabdcab', pattern: 'cab', base: '256', modulus: '101' }).matches, [2, 6]);
  assert.deepEqual(answer('rabin-karp', { text: 'AB', pattern: 'ABC' }).matches, []);
});

test('binary search and pattern matching agree with slow methods on random input', () => {
  const next = seeded(19);
  for (let run = 0; run < 300; run++) {
    const items = list(next, 1 + next(14), 0, 20).sort((a, b) => a - b);
    const target = next(21);
    const text = items.join(', ');
    const exact = answer('binary-search', { values: text, target: String(target), goal: 'exact' });
    assert.equal(exact === -1 ? !items.includes(target) : items[exact] === target, true, `${text} ${target}`);
    assert.equal(answer('binary-search', { values: text, target: String(target), goal: 'first' }), items.indexOf(target));
    assert.equal(answer('binary-search', { values: text, target: String(target), goal: 'last' }), items.lastIndexOf(target));
    const lower = items.findIndex(value => value >= target);
    assert.equal(answer('binary-search', { values: text, target: String(target), goal: 'lower' }), lower < 0 ? items.length : lower);
    assert.equal(answer('binary-search', { values: text, target: String(target), goal: 'first', style: 'recursive' }), items.indexOf(target));
    assert.equal(answer('linear-search', { values: text, target: String(target), mode: 'first' }).found[0] ?? -1, items.indexOf(target));
    assert.equal(answer('linear-search', { values: text, target: String(target), mode: 'sentinel' }).found[0] ?? -1, items.indexOf(target));

    const letters = 'ab';
    const string = Array.from({ length: 1 + next(24) }, () => letters[next(2)]).join('');
    const pattern = Array.from({ length: 1 + next(4) }, () => letters[next(2)]).join('');
    const expected = allMatches(string, pattern);
    assert.deepEqual(answer('naive-pattern-matching', { text: string, pattern }).matches, expected, `${string} ${pattern}`);
    assert.deepEqual(answer('kmp', { text: string, pattern }).matches, expected, `${string} ${pattern}`);
    assert.deepEqual(answer('rabin-karp', { text: string, pattern, modulus: String(3 + next(20)), base: '256' }).matches, expected, `${string} ${pattern}`);
  }
});

// ---------- Sorting ----------

test('every sort sorts, in both directions, and keeps the same values', () => {
  const next = seeded(23);
  const fixtures = ['5', '2, 1', '3, 3, 3', '-5, 0, 5, -5', '9, 8, 7, 6, 5, 4, 3, 2, 1'];
  const inputs = [...fixtures.map(text => text.split(', ').map(Number)), ...Array.from({ length: 80 }, () => list(next, 1 + next(14), -20, 40))];
  for (const items of inputs) {
    const text = items.join(', ');
    const asc = [...items].sort((a, b) => a - b);
    const desc = [...asc].reverse();
    for (const order of ['asc', 'desc']) {
      const want = order === 'asc' ? asc : desc;
      for (const slug of ['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'heap-sort', 'counting-sort']) {
        assert.deepEqual(answer(slug, { values: text, order }).items, want, `${slug} ${order} on ${text}`);
      }
      for (const pivot of ['last', 'first', 'median', 'random']) assert.deepEqual(answer('quick-sort', { values: text, order, pivot }).items, want, `quick ${pivot} ${order} on ${text}`);
      for (const buckets of ['1', '3', '5']) assert.deepEqual(answer('bucket-sort', { values: text, order, buckets }).items, want, `bucket ${buckets} ${order} on ${text}`);
      if (items.every(value => value >= 0)) for (const base of ['10', '2']) assert.deepEqual(answer('radix-sort', { values: text, order, base }).items, want, `radix ${base} ${order} on ${text}`);
    }
  }
});

test('sorting counts match the textbook', () => {
  assert.deepEqual(answer('bubble-sort', { values: '1, 2, 3, 4, 5', early: 'yes' }).comparisons, 4, 'one pass on sorted input');
  assert.deepEqual(answer('bubble-sort', { values: '1, 2, 3, 4, 5', early: 'no' }).comparisons, 10);
  assert.deepEqual(answer('bubble-sort', { values: '5, 4, 3, 2, 1' }).moves, 10);
  assert.equal(answer('selection-sort', { values: '1, 2, 3, 4, 5' }).comparisons, 10, 'always every comparison');
  assert.equal(answer('selection-sort', { values: '1, 2, 3, 4, 5' }).moves, 0);
  assert.equal(answer('insertion-sort', { values: '1, 2, 3, 4, 5' }).comparisons, 4);
  assert.equal(answer('insertion-sort', { values: '5, 4, 3, 2, 1' }).comparisons, 10);
  assert.equal(answer('quick-sort', { values: '1, 2, 3, 4, 5, 6, 7', pivot: 'last' }).comparisons, 21, 'the sorted worst case');
  assert.ok(answer('quick-sort', { values: '1, 2, 3, 4, 5, 6, 7', pivot: 'median' }).comparisons < 21);
  assert.equal(answer('radix-sort', { values: '170, 45, 75, 90, 802, 24, 2, 66', base: '10' }).passes, 3);
  assert.equal(answer('radix-sort', { values: '0', base: '10' }).passes, 1);
});

test('stable sorts keep equal keys in order, and every algorithm sorts by key', () => {
  const next = seeded(29);
  for (let run = 0; run < 100; run++) {
    const keys = list(next, 2 + next(8), 1, 3);
    const records = keys.map((key, i) => `R${i}:${key}`).join(', ');
    for (const algorithm of ['insertion', 'merge', 'selection', 'heap']) {
      const result = answer('stable-vs-unstable-sorting', { records, algorithm });
      assert.deepEqual(result.keys, [...keys].sort((a, b) => a - b), `${algorithm} on ${records}`);
      if (algorithm === 'insertion' || algorithm === 'merge') assert.equal(result.stable, true, `${algorithm} must be stable on ${records}`);
    }
  }
  assert.equal(answer('stable-vs-unstable-sorting', { records: 'A:2, B:2, C:1', algorithm: 'selection' }).stable, false);
});

// ---------- Trees ----------

test('tree simulators give the known answers', () => {
  assert.deepEqual(answer('binary-tree-basics', { tree: '1, 2, 3, 4, 5, 6, 7' }), { n: 7, height: 3, leaves: 4, internal: 3, full: true, complete: true, perfect: true, balanced: true });
  assert.deepEqual(answer('binary-tree-basics', { tree: '1' }), { n: 1, height: 1, leaves: 1, internal: 0, full: true, complete: true, perfect: true, balanced: true });
  const chain = answer('binary-tree-basics', { tree: '1, 2, null, 3, null, 4' });
  assert.deepEqual([chain.n, chain.height, chain.full, chain.complete, chain.perfect, chain.balanced], [4, 4, false, false, false, false]);
  const complete = answer('binary-tree-basics', { tree: '1, 2, 3, 4, 5, 6' });
  assert.deepEqual([complete.full, complete.complete, complete.perfect], [false, true, false]);
  const orders = { pre: 'A B D E C F', in: 'D B E A C F', post: 'D E B F C A', level: 'A B C D E F' } as Record<string, string>;
  for (const [order, want] of Object.entries(orders)) {
    for (const method of ['recursive', 'iterative']) assert.equal(answer('tree-traversals', { tree: 'A, B, C, D, E, null, F', order, method }).output.join(' '), want, `${order} ${method}`);
  }
  assert.deepEqual(answer('heaps', { kind: 'min', ops: 'insert 15, insert 10, insert 20, insert 8, peek, extract', build: '' }).results, ['peek = 8', 'extract = 8']);
  assert.deepEqual(answer('heaps', { kind: 'max', ops: 'peek', build: '3, 9, 2, 1, 4, 5' }).results, ['peek = 9']);
  assert.deepEqual(answer('heaps', { kind: 'max', ops: 'peek', build: '3, 9, 2, 1, 4, 5' }).heap, [9, 4, 5, 1, 3, 2]);
  for (const built of ['heap', 'sorted', 'unsorted']) {
    assert.deepEqual(answer('priority-queue', { built, ops: 'add Write 3, add Fix 1, add Test 2, add Tie 1, peek, next, next, next, next, next' }).served, ['peek: Fix', 'next: Fix (1)', 'next: Tie (1)', 'next: Test (2)', 'next: Write (3)', 'next: empty'], built);
  }
  const binomial = answer('binomial-heap', { ops: 'insert 5, insert 3, insert 8, insert 1, insert 9, insert 2' });
  assert.deepEqual(binomial.orders, [1, 2], 'six is 110 in binary');
  assert.equal(Math.min(...binomial.roots), 1);
  assert.deepEqual(answer('binomial-heap', { ops: 'insert 8, insert 7, insert 6, insert 5, insert 4, insert 3, insert 2, insert 1' }).orders, [3]);
  assert.deepEqual(answer('tree-representations', { tree: 'A-B, A-C, B-D', form: 'parent' }).table, [['A', 'None'], ['B', 'A'], ['C', 'A'], ['D', 'B']]);
  assert.deepEqual(answer('tree-representations', { tree: 'A-B, A-C, A-D, B-E', form: 'sibling' }).table, [['A', 'B', 'None'], ['B', 'E', 'C'], ['C', 'None', 'D'], ['D', 'None', 'None'], ['E', 'None', 'None']]);
  assert.deepEqual(answer('tree-representations', { tree: 'A-B, A-C, B-D, B-E, C-F', form: 'array' }), { slots: ['A', 'B', 'C', 'D', 'E', 'F'], gaps: 0 });
  assert.deepEqual(answer('tree-representations', { tree: 'A-B, B-C', form: 'array' }).gaps, 1);
});

test('heaps and binomial heaps always extract in sorted order', () => {
  const next = seeded(31);
  for (let run = 0; run < 100; run++) {
    const values = list(next, 1 + next(7), -9, 30);
    const ops = [...values.map(value => `insert ${value}`), ...values.map(() => 'extract')].join(', ');
    const sorted = [...values].sort((a, b) => a - b);
    assert.deepEqual(answer('heaps', { kind: 'min', ops, build: '' }).results.map((line: string) => Number(line.split(' = ')[1])), sorted, ops);
    assert.deepEqual(answer('heaps', { kind: 'max', ops, build: '' }).results.map((line: string) => Number(line.split(' = ')[1])), [...sorted].reverse(), ops);
    assert.deepEqual(answer('binomial-heap', { ops }).results.map((line: string) => Number(line.split(' = ')[1])), sorted, ops);
    assert.deepEqual(answer('binomial-heap', { ops }).orders, []);
    const { heap } = answer('heaps', { kind: 'min', ops: 'peek', build: values.join(', ') });
    heap.forEach((value: number, i: number) => {
      if (i) assert.ok(heap[(i - 1) >> 1] <= value, `heap property on ${values}`);
    });
  }
});

// ---------- Graphs ----------

test('graph simulators give the known answers', () => {
  const walk = answer('bfs', { edges: 'A-B, A-C, B-D, B-E, C-D, D-F', start: 'A' });
  assert.deepEqual(walk.order, ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.deepEqual(walk.dist.F, 3);
  assert.deepEqual(answer('bfs', { edges: 'A-B, X-Y', start: 'A' }).order, ['A', 'B']);
  assert.deepEqual(answer('dfs', { edges: 'A-B, A-C, B-D, B-E, C-D, D-F', start: 'A', method: 'recursive' }).order, ['A', 'B', 'D', 'C', 'F', 'E']);
  assert.deepEqual(answer('dfs', { edges: 'A-B, A-C, B-D, B-E, C-D, D-F', start: 'A', method: 'iterative' }).order, ['A', 'B', 'D', 'C', 'F', 'E']);
  assert.equal(answer('dfs', { edges: 'A-B, B-C, C-A', kind: 'directed', start: 'A', method: 'recursive' }).cycle, true);
  assert.equal(answer('dfs', { edges: 'A-B, B-C', kind: 'directed', start: 'A', method: 'recursive' }).cycle, false);
  assert.equal(answer('dfs', { edges: 'A-B, B-C', kind: 'undirected', start: 'A', method: 'recursive' }).cycle, false);
  assert.deepEqual(answer('dijkstra', { edges: 'A-B:4, A-C:1, B-C:2, B-D:1, C-D:5', start: 'A', goal: 'D' }).dist, { A: 0, B: 3, C: 1, D: 4 });
  assert.deepEqual(answer('dijkstra', { edges: 'A-B:4, A-C:1, B-C:2, B-D:1, C-D:5', start: 'A', goal: 'D' }).path, ['A', 'C', 'B', 'D']);
  assert.deepEqual(answer('bellman-ford', { edges: 'A-B:4, A-C:5, C-B:-3, B-D:2', start: 'A' }), { dist: { A: 0, B: 2, C: 5, D: 4 }, negativeCycle: false });
  assert.equal(answer('bellman-ford', { edges: 'A-B:1, B-C:-3, C-A:1', start: 'A' }).negativeCycle, true);
  assert.deepEqual(answer('0-1-bfs', { edges: 'A-B:0, B-C:0, C-D:0, A-D:1', kind: 'directed', start: 'A' }).dist, { A: 0, B: 0, C: 0, D: 0 });
  assert.equal(answer('a-search', { grid: '.... / .##. / ....', start: '0,0', goal: '2,3', heuristic: 'manhattan' }).cost, 5);
  assert.equal(answer('a-search', { grid: '.... / .##. / ....', start: '0,0', goal: '2,3', heuristic: 'manhattan' }).expanded, 6, 'the same count as the guide');
  assert.equal(answer('a-search', { grid: '#. / ..', start: '1,0', goal: '0,1', heuristic: 'manhattan' }).cost, 2);
  assert.equal(answer('a-search', { grid: '..#.. / ..#.. / ..#..', start: '0,0', goal: '2,4', heuristic: 'manhattan' }).cost, -1);
  assert.deepEqual(answer('adjacency-list-vs-matrix', { edges: 'A-B, B-C', kind: 'directed', from: 'A', to: 'B' }).matrix, [[0, 1, 0], [0, 0, 1], [0, 0, 0]]);
  assert.deepEqual(answer('adjacency-list-vs-matrix', { edges: 'A-B', kind: 'undirected', from: 'A', to: 'B' }).lists, { A: ['B'], B: ['A'] });
  assert.equal(answer('adjacency-list-vs-matrix', { edges: 'A-B, B-C', kind: 'undirected', from: 'A', to: 'C' }).exists, false);
  const line = 'A-B, B-C, C-D, D-E, E-F, F-G';
  assert.equal(answer('bidirectional-search', { edges: line, start: 'A', goal: 'G' }).hops, 6);
  assert.equal(answer('bidirectional-search', { edges: line, start: 'A', goal: 'G' }).path.length, 7);
  assert.equal(answer('bidirectional-search', { edges: line, start: 'C', goal: 'C' }).hops, 0);
  assert.equal(answer('bidirectional-search', { edges: 'A-B, X-Y', start: 'A', goal: 'Y' }).hops, -1);
  assert.deepEqual(answer('floyd-warshall', { edges: 'A-B:3, B-C:-2, A-C:8, C-D:1, D-A:2', kind: 'directed' }).dist[0], [0, 3, 1, 2]);
  assert.equal(answer('floyd-warshall', { edges: 'A-B:1, B-C:-3, C-A:1', kind: 'directed' }).negative, true);
  const basics = answer('graph-basics', { edges: 'A-B, B-C, C-A, C-D, E-F, G', kind: 'undirected' });
  assert.deepEqual([basics.n, basics.m, basics.pieces, basics.isTree], [7, 5, 3, false]);
  assert.deepEqual(basics.degrees, { A: 2, B: 2, C: 3, D: 1, E: 1, F: 1, G: 0 });
  assert.equal(answer('graph-basics', { edges: 'A-B, A-C, B-D, B-E', kind: 'undirected' }).isTree, true);
  assert.equal(answer('graph-coloring', { edges: 'A-B, B-C, C-A', method: 'two' }).ok, false);
  assert.equal(answer('graph-coloring', { edges: 'A-B, B-C, C-D, D-A', method: 'two' }).ok, true);
  assert.equal(answer('graph-coloring', { edges: 'A-B, B-C, C-A', method: 'backtrack', k: '2' }).ok, false);
  assert.equal(answer('graph-coloring', { edges: 'A-B, B-C, C-A', method: 'backtrack', k: '3' }).ok, true);
  assert.equal(answer('graph-coloring', { edges: 'A-D, A-F, B-C, B-E, C-F, D-E', method: 'greedy' }).used, 3, 'greedy wastes a color on this bipartite graph');
  assert.deepEqual(answer('iterative-deepening-dfs', { edges: 'A-B, A-C, B-D, B-E, C-F, E-G', start: 'A', goal: 'G' }).path, ['A', 'B', 'E', 'G']);
  assert.equal(answer('iterative-deepening-dfs', { edges: 'A-B, X-Y', start: 'A', goal: 'Y' }).depth, -1);
  assert.equal(answer('kirchhoffs-theorem', { edges: 'A-B, B-C, C-A', remove: '0' }), 3);
  assert.equal(answer('kirchhoffs-theorem', { edges: 'A-B, A-C, A-D, B-C, B-D, C-D', remove: '0' }), 16);
  assert.equal(answer('kirchhoffs-theorem', { edges: 'A-B, A-C, A-D, B-C, B-D, C-D', remove: '3' }), 16);
  assert.equal(answer('kirchhoffs-theorem', { edges: 'A-B, C-D', remove: '0' }), 0);
  assert.equal(answer('kruskals-algorithm', { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5' }).total, 7);
  assert.equal(answer('kruskals-algorithm', { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', goal: 'max' }).total, 12);
  assert.equal(answer('prims-algorithm', { edges: 'A-B:1, B-C:2, A-C:3, C-D:4, B-D:5', start: 'D' }).total, 7);
  assert.equal(answer('kruskals-algorithm', { edges: 'A-B:7, A-D:5, B-C:8, B-D:9, B-E:7, C-E:5, D-E:15, D-F:6, E-F:8, E-G:9, F-G:11' }).total, 39);
  assert.equal(answer('kruskals-algorithm', { edges: 'A-B:1, X-Y:2' }).spanning, false);
  assert.equal(answer('min-cut', { edges: 'A-B, B-C, A-C, C-D, D-E, E-F, D-F' }).cut, 1);
  assert.equal(answer('min-cut', { edges: 'A-B, B-C, C-D, D-A' }).cut, 2);
  assert.equal(answer('min-cut', { edges: 'A-B:2, A-E:3, B-C:3, B-E:2, B-F:2, C-D:4, C-G:2, D-G:2, D-H:2, E-F:3, F-G:1, G-H:3' }).cut, 4, 'the classic Stoer-Wagner example');
  assert.equal(answer('min-cut', { edges: 'A-B, C-D' }).cut, 0);
  assert.equal(answer('topological-sort', { edges: 'A-B, B-C, C-A', method: 'kahn' }).hasCycle, true);
  assert.equal(answer('topological-sort', { edges: 'A-B, B-C, C-A', method: 'dfs' }).hasCycle, true);
  assert.deepEqual(answer('union-find', { count: '8', ops: 'union 0 1, union 2 3, union 1 3, connected 0 2, connected 0 4', rule: 'size', compress: 'yes' }).log, ['connected 0 2: yes', 'connected 0 4: no']);
  assert.equal(answer('union-find', { count: '6', ops: 'union 0 1, union 2 3, union 4 5' }).groups, 3);
});

test('shortest path algorithms all agree on random graphs', () => {
  const next = seeded(37);
  for (let run = 0; run < 150; run++) {
    const directed = next(2) === 0;
    const edges = randomEdges(next, 6, 3 + next(10));
    if (!edges.length) continue;
    const text = edgeText(edges);
    const kind = directed ? 'directed' : 'undirected';
    const names = nodesIn(edges);
    const floyd = answer('floyd-warshall', { edges: text, kind });
    for (const start of names) {
      const row = floyd.dist[floyd.names.indexOf(start)];
      const dijkstra = answer('dijkstra', { edges: text, kind, start, goal: start }).dist;
      names.forEach(name => assert.equal(dijkstra[name], row[floyd.names.indexOf(name)], `${text} ${kind} ${start} to ${name}`));
      if (directed) assert.deepEqual(answer('bellman-ford', { edges: text, start }).dist, dijkstra, text);
    }
    const hopText = edges.map(edge => `${edge.from}-${edge.to}`).join(', ');
    const start = names[0];
    const bfs = answer('bfs', { edges: hopText, kind, start }).dist;
    for (const goal of names) {
      const hops = bfs[goal] === Infinity ? -1 : bfs[goal];
      assert.equal(answer('iterative-deepening-dfs', { edges: hopText, kind, start, goal }).depth, hops, `iddfs ${hopText} ${kind} ${start} to ${goal}`);
      if (!directed) {
        const both = answer('bidirectional-search', { edges: hopText, start, goal });
        assert.equal(both.hops, hops, `bidirectional ${hopText} ${start} to ${goal}`);
        if (hops >= 0) {
          assert.equal(both.path.length, hops + 1);
          assert.deepEqual([both.path[0], both.path.at(-1)], [start, goal]);
          both.path.slice(1).forEach((node: string, i: number) => assert.ok(edges.some(edge => (edge.from === node && edge.to === both.path[i]) || (edge.to === node && edge.from === both.path[i])), 'the path uses real edges'));
        }
      }
    }
    const zeroOne = randomEdges(next, 6, 3 + next(10), n => n(2));
    if (zeroOne.length) {
      const first = nodesIn(zeroOne)[0];
      assert.deepEqual(answer('0-1-bfs', { edges: edgeText(zeroOne), kind, start: first }).dist, answer('dijkstra', { edges: edgeText(zeroOne), kind, start: first, goal: first }).dist, edgeText(zeroOne));
    }
  }
});

test('Bellman-Ford finds exactly the negative cycles that Floyd-Warshall finds when everything is reachable', () => {
  const next = seeded(43);
  for (let run = 0; run < 200; run++) {
    const edges = randomEdges(next, 5, 3 + next(7), n => n(9) - 3);
    const names = nodesIn(edges);
    if (!names.length) continue;
    const reach = edges.map(edge => ({ ...edge }));
    names.slice(1).forEach(name => {
      if (!reach.some(edge => (edge.from === 'S' && edge.to === name))) reach.push({ from: 'S', to: name, weight: 0 });
    });
    reach.push({ from: 'S', to: names[0], weight: 0 });
    const text = edgeText(reach);
    assert.equal(answer('bellman-ford', { edges: text, start: 'S' }).negativeCycle, answer('floyd-warshall', { edges: text, kind: 'directed' }).negative, text);
  }
});

test('A* matches a plain search on random grids, and any fair guess stays optimal', () => {
  const next = seeded(47);
  for (let run = 0; run < 120; run++) {
    const rows = 2 + next(5);
    const cols = 2 + next(5);
    const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (next(4) === 0 ? '#' : '.')));
    cells[0][0] = '.';
    cells[rows - 1][cols - 1] = '.';
    const distance = new Map<string, number>([['0,0', 0]]);
    const queue = [[0, 0]];
    while (queue.length) {
      const [r, c] = queue.shift()!;
      for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (a < 0 || b < 0 || a >= rows || b >= cols || cells[a][b] === '#' || distance.has(`${a},${b}`)) continue;
        distance.set(`${a},${b}`, distance.get(`${r},${c}`)! + 1);
        queue.push([a, b]);
      }
    }
    const want = distance.get(`${rows - 1},${cols - 1}`) ?? -1;
    const grid = cells.map(line => line.join('')).join(' / ');
    for (const heuristic of ['manhattan', 'euclid', 'zero']) {
      assert.equal(answer('a-search', { grid, start: '0,0', goal: `${rows - 1},${cols - 1}`, heuristic }).cost, want, `${heuristic} on ${grid}`);
    }
    const over = answer('a-search', { grid, start: '0,0', goal: `${rows - 1},${cols - 1}`, heuristic: 'over' }).cost;
    assert.equal(over === -1, want === -1, 'a high guess never invents or loses a route');
    if (want >= 0) assert.ok(over >= want);
  }
});

test('spanning tree and cut simulators match brute force on random graphs', () => {
  const next = seeded(53);
  for (let run = 0; run < 150; run++) {
    const edges = randomEdges(next, 5, 3 + next(8));
    const names = nodesIn(edges);
    const text = edgeText(edges);
    const isSpanningTree = (subset: typeof edges) => {
      if (subset.length !== names.length - 1) return false;
      const parent = new Map(names.map(name => [name, name]));
      const find = (name: string): string => (parent.get(name) === name ? name : find(parent.get(name)!));
      for (const edge of subset) {
        if (find(edge.from) === find(edge.to)) return false;
        parent.set(find(edge.from), find(edge.to));
      }
      return true;
    };
    const trees = subsetsOf(edges).filter(isSpanningTree);
    const unweighted = edges.map(edge => `${edge.from}-${edge.to}`).join(', ');
    assert.equal(answer('kirchhoffs-theorem', { edges: unweighted, remove: '0' }), trees.length, `Kirchhoff on ${unweighted}`);
    if (trees.length) {
      const best = Math.min(...trees.map(tree => sum(tree.map(edge => edge.weight))));
      const most = Math.max(...trees.map(tree => sum(tree.map(edge => edge.weight))));
      assert.equal(answer('kruskals-algorithm', { edges: text }).total, best, `Kruskal on ${text}`);
      assert.equal(answer('kruskals-algorithm', { edges: text, goal: 'max' }).total, most, `Kruskal max on ${text}`);
      for (const start of names) assert.equal(answer('prims-algorithm', { edges: text, start }).total, best, `Prim from ${start} on ${text}`);
    }
    if (names.length >= 2) {
      let bestCut = Infinity;
      for (const side of subsetsOf(names)) {
        if (!side.length || side.length === names.length) continue;
        bestCut = Math.min(bestCut, sum(edges.filter(edge => side.includes(edge.from) !== side.includes(edge.to)).map(edge => edge.weight)));
      }
      const cut = answer('min-cut', { edges: text });
      assert.equal(cut.cut, bestCut, `min cut on ${text}`);
      assert.equal(cut.crossing, bestCut, 'the reported side really has that cut');
    }
  }
});

test('topological sort, coloring, and union-find hold their promises on random input', () => {
  const next = seeded(59);
  for (let run = 0; run < 150; run++) {
    const edges = randomEdges(next, 6, 2 + next(8));
    const text = edges.map(edge => `${edge.from}-${edge.to}`).join(', ');
    const names = nodesIn(edges);
    const remaining = new Set(names);
    let shrinking = true;
    while (shrinking) {
      shrinking = false;
      for (const name of [...remaining]) {
        if (!edges.some(edge => edge.to === name && remaining.has(edge.from))) {
          remaining.delete(name);
          shrinking = true;
        }
      }
    }
    const cyclic = remaining.size > 0;
    for (const method of ['kahn', 'dfs']) {
      const result = answer('topological-sort', { edges: text, method });
      assert.equal(result.hasCycle, cyclic, `${method} on ${text}`);
      if (!cyclic) {
        assert.deepEqual([...result.order].sort(), names);
        for (const edge of edges) assert.ok(result.order.indexOf(edge.from) < result.order.indexOf(edge.to), `${method} order breaks ${edge.from}-${edge.to}`);
      }
    }
    for (const method of ['greedy', 'largest']) assert.equal(answer('graph-coloring', { edges: text, method }).legal, true);
    const colorable = (k: number) => {
      const assign = (i: number, color: Record<string, number>): boolean => {
        if (i === names.length) return true;
        for (let c = 0; c < k; c++) {
          if (edges.some(edge => (edge.from === names[i] && color[edge.to] === c) || (edge.to === names[i] && color[edge.from] === c))) continue;
          if (assign(i + 1, { ...color, [names[i]]: c })) return true;
        }
        return false;
      };
      return assign(0, {});
    };
    for (const k of [1, 2, 3]) {
      const result = answer('graph-coloring', { edges: text, method: 'backtrack', k: String(k) });
      assert.equal(result.ok, colorable(k), `${k} colors on ${text}`);
      if (result.ok) assert.equal(result.legal, true);
    }
    assert.equal(answer('graph-coloring', { edges: text, method: 'two' }).ok, colorable(2), `two colors on ${text}`);

    const count = 8;
    const ops: string[] = [];
    const label = Array.from({ length: count }, (_, i) => i);
    const expected: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = next(count);
      const b = next(count);
      if (next(2)) {
        ops.push(`union ${a} ${b}`);
        const from = label[a];
        const to = label[b];
        if (from === to) expected.push(`union ${a} ${b}: already joined`);
        label.forEach((value, at) => {
          if (value === from) label[at] = to;
        });
      } else {
        ops.push(`connected ${a} ${b}`);
        expected.push(`connected ${a} ${b}: ${label[a] === label[b] ? 'yes' : 'no'}`);
      }
    }
    for (const rule of ['size', 'rank', 'none']) {
      for (const compress of ['yes', 'no']) {
        const result = answer('union-find', { count: String(count), ops: ops.join(', '), rule, compress });
        assert.deepEqual(result.log, expected, `${rule} ${compress}`);
        assert.equal(result.groups, new Set(label).size);
      }
    }
  }
});

// ---------- Techniques ----------

test('technique simulators give the known answers', () => {
  const activity = answer('activity-selection', { items: 'A(1,4), B(3,5), C(0,6), D(5,7), E(3,9), F(6,10), G(8,11), H(2,14), I(12,16)', rule: 'finish' });
  assert.deepEqual(activity.chosen, ['A', 'D', 'G', 'I']);
  assert.equal(activity.best, 4);
  assert.deepEqual(answer('activity-selection', { items: 'L(0,10), A(1,2), B(3,4), C(5,6)', rule: 'start' }).chosen, ['L']);
  assert.deepEqual(answer('activity-selection', { items: 'A(0,5), B(4,6), C(5,10)', rule: 'shortest' }).chosen, ['B']);
  assert.equal(answer('minimax', { tree: '[[3,5],[2,9]]', first: 'max' }).result, 3);
  const pruned = answer('alpha-beta-pruning', { tree: '[[3,5],[2,9]]', first: 'max' });
  assert.deepEqual([pruned.result, pruned.leaves, pruned.cuts], [3, 3, 1], 'the 9 is never looked at');
  assert.equal(answer('alpha-beta-pruning', { tree: '[[1,2],[3,4],[5,6]]', first: 'max' }).cuts, 0);
  assert.equal(answer('alpha-beta-pruning', { tree: '[[5,6],[3,4],[1,2]]', first: 'max' }).cuts, 2);
  assert.deepEqual(answer('backtracking', { task: 'permutations', items: '1, 2, 3' }), ['{1, 2, 3}', '{1, 3, 2}', '{2, 1, 3}', '{2, 3, 1}', '{3, 1, 2}', '{3, 2, 1}']);
  assert.equal(answer('backtracking', { task: 'subsets', items: 'a, b, c' }).length, 8);
  assert.deepEqual(answer('backtracking', { task: 'combinations', items: 'a, b, c, d', k: '2' }).length, 6);
  assert.deepEqual(answer('backtracking', { task: 'combinations', items: 'a, b', k: '0' }), ['{}']);
  assert.deepEqual(answer('brute-force', { problem: 'twosum', values: '2, 7, 11, 15, 4', target: '15' }), [2, 4]);
  assert.equal(answer('brute-force', { problem: 'twosum', values: '1, 2', target: '100' }), null);
  assert.equal(answer('brute-force', { problem: 'tsp' }).best, 80);
  assert.deepEqual(answer('divide-and-conquer', { problem: 'subarray', values: '-2, 1, -3, 4, -1, 2, 1, -5, 4' }), { sum: 6, from: 3, to: 6 });
  assert.equal(answer('divide-and-conquer', { problem: 'subarray', values: '-5, -2, -8' }).sum, -2);
  assert.equal(answer('divide-and-conquer', { problem: 'max', values: '3, 9, 2' }), 9);
  assert.equal(answer('divide-and-conquer', { problem: 'power', base: '2', exponent: '10' }), 1024);
  assert.equal(answer('divide-and-conquer', { problem: 'power', base: '-3', exponent: '3' }), -27);
  assert.equal(answer('divide-and-conquer', { problem: 'power', base: '5', exponent: '0' }), 1);
  assert.equal(answer('fractional-knapsack', { rule: 'ratio' }).total, 240);
  assert.ok(answer('fractional-knapsack', { rule: 'value' }).total < 240);
  assert.deepEqual(answer('greedy-algorithms', { coins: '1, 3, 4', amount: '6' }), { greedy: 3, best: 2 });
  assert.deepEqual(answer('greedy-algorithms', { coins: '1, 5, 10, 25', amount: '63' }), { greedy: 6, best: 6 });
  assert.deepEqual(answer('greedy-algorithms', { coins: '3, 4', amount: '6' }), { greedy: -1, best: 2 });
  assert.deepEqual(answer('greedy-algorithms', { coins: '2', amount: '3' }), { greedy: -1, best: -1 });
  assert.equal(answer('hill-climbing', { start: '0', restarts: '0' }).reached, 5);
  assert.equal(answer('hill-climbing', { start: '5', restarts: '0' }).reached, 9);
  assert.equal(answer('hill-climbing', { heights: '1, 2, 2, 2, 5', start: '0', restarts: '0' }).reached, 2);
  const huffman = answer('huffman-coding', { source: 'counts', counts: 'a(45), b(13), c(12), d(16), e(9), f(5)' });
  assert.equal(huffman.total, 224);
  assert.equal(huffman.fixed, 300);
  assert.equal(answer('huffman-coding', { source: 'text', text: 'aaaa' }).total, 4, 'one letter still needs one bit each');
  assert.equal(answer('huffman-coding', { source: 'counts', counts: 'a(1), b(1), c(1), d(1)' }).total, 8);
  assert.deepEqual(answer('job-sequencing', { jobs: 'A(2,100), B(1,19), C(2,27), D(1,25), E(3,15)' }), { total: 142, slots: ['C', 'A', 'E'] });
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(n => answer('n-queens', { n: String(n), mode: 'all' }).count), [1, 0, 0, 2, 10, 4, 40, 92]);
  assert.deepEqual(answer('n-queens', { n: '4', mode: 'first' }).first, [1, 3, 0, 2]);
  assert.deepEqual(answer('sum-of-subsets', { values: '2, 3, 4, 5', target: '9' }).results, [[2, 3, 4], [4, 5]]);
  assert.deepEqual(answer('sum-of-subsets', { values: '2, 4, 6, 8', target: '7' }).results, []);
  assert.ok(answer('sum-of-subsets', { values: '2, 3, 4, 5', target: '9', prune: 'yes' }).nodes < answer('sum-of-subsets', { values: '2, 3, 4, 5', target: '9', prune: 'no' }).nodes);
});

test('technique simulators match brute force on random input', () => {
  const next = seeded(61);
  for (let run = 0; run < 150; run++) {
    const count = 1 + next(7);
    const activities = Array.from({ length: count }, (_, i) => {
      const start = next(20);
      return { name: `J${i}`, start, end: start + 1 + next(8) };
    });
    const bestActivities = Math.max(...subsetsOf(activities).filter(set => set.every((a, i) => set.slice(i + 1).every(b => a.end <= b.start || b.end <= a.start))).map(set => set.length));
    assert.equal(answer('activity-selection', { items: activities.map(item => `${item.name}(${item.start},${item.end})`).join(', '), rule: 'finish' }).chosen.length, bestActivities);

    const jobs = Array.from({ length: 1 + next(6) }, (_, i) => ({ name: `J${i}`, deadline: 1 + next(4), profit: 1 + next(30) }));
    const bestJobs = Math.max(...subsetsOf(jobs).filter(set => {
      const sorted = [...set].sort((a, b) => a.deadline - b.deadline);
      return sorted.every((job, i) => job.deadline >= i + 1);
    }).map(set => sum(set.map(job => job.profit))));
    assert.equal(answer('job-sequencing', { jobs: jobs.map(job => `${job.name}(${job.deadline},${job.profit})`).join(', ') }).total, bestJobs);

    const values = list(next, 1 + next(5), 1, 9);
    const target = 1 + next(20);
    const want = subsetsOf([...values].sort((a, b) => a - b)).filter(set => sum(set) === target).map(set => set.join(',')).sort();
    for (const prune of ['yes', 'no']) assert.deepEqual(answer('sum-of-subsets', { values: values.join(', '), target: String(target), prune }).results.map((set: number[]) => set.join(',')).sort(), want, `${values} ${target}`);

    const numbers2 = list(next, 1 + next(10), -9, 9);
    let bestRun = -Infinity;
    for (let i = 0; i < numbers2.length; i++) for (let j = i; j < numbers2.length; j++) bestRun = Math.max(bestRun, sum(numbers2.slice(i, j + 1)));
    assert.equal(answer('divide-and-conquer', { problem: 'subarray', values: numbers2.join(', ') }).sum, bestRun, numbers2.join());
    const { from, to, sum: reported } = answer('divide-and-conquer', { problem: 'subarray', values: numbers2.join(', ') });
    assert.equal(sum(numbers2.slice(from, to + 1)), reported, 'the reported range really has that sum');

    const build = (depth: number): unknown => (depth === 0 || next(4) === 0 ? next(30) - 10 : Array.from({ length: 2 + next(2) }, () => build(depth - 1)));
    const tree = [build(2), build(2)];
    const text = JSON.stringify(tree);
    for (const first of ['max', 'min']) {
      const plain = answer('minimax', { tree: text, first });
      const pruned = answer('alpha-beta-pruning', { tree: text, first });
      assert.equal(pruned.result, plain.result, `alpha-beta must agree with minimax on ${text}`);
      assert.ok(pruned.leaves <= plain.leaves, 'alpha-beta never looks at more leaves');
    }

    const counts = list(next, 2 + next(5), 1, 30);
    const countsText = counts.map((value, i) => `s${i}(${value})`).join(', ');
    const merged = [...counts];
    let cost = 0;
    while (merged.length > 1) {
      merged.sort((a, b) => a - b);
      const joined = merged.shift()! + merged.shift()!;
      cost += joined;
      merged.push(joined);
    }
    const coded = answer('huffman-coding', { source: 'counts', counts: countsText });
    assert.equal(coded.total, cost, 'the total matches the sum of merge weights');
    const codes = Object.values(coded.codes) as string[];
    assert.ok(codes.every((a, i) => codes.every((b, j) => i === j || !b.startsWith(a))), 'no code starts another');

    const items = Array.from({ length: 1 + next(4) }, (_, i) => `I${i}(${1 + next(40)},${1 + next(20)})`).join(', ');
    const capacity = String(1 + next(40));
    const result = answer('fractional-knapsack', { items, capacity, rule: 'ratio' });
    assert.ok(Math.abs(result.total - result.best) < 1e-9);
  }
});

// ---------- Dynamic programming ----------

test('dynamic programming gives the known answers', () => {
  assert.deepEqual(answer('0-1-knapsack', { items: 'A(1,1), B(3,4), C(4,5), D(5,7)', capacity: '7', view: 'table' }), { best: 9, chosen: ['B', 'C'] });
  assert.equal(answer('0-1-knapsack', { items: 'A(1,1), B(3,4), C(4,5), D(5,7)', capacity: '7', view: 'row' }).best, 9);
  assert.deepEqual(answer('assembly-line-scheduling'), { total: 38, route: [1, 2, 1, 2, 2, 1] });
  assert.deepEqual(answer('coin-change', { goal: 'min', coins: '1, 3, 4', amount: '6' }), { count: 2, used: [3, 3] });
  assert.equal(answer('coin-change', { goal: 'min', coins: '2, 4', amount: '7' }).count, -1);
  assert.equal(answer('coin-change', { goal: 'ways', coins: '1, 2, 5', amount: '5' }), 4);
  assert.equal(answer('coin-change', { goal: 'orderings', coins: '1, 2', amount: '4' }), 5);
  assert.equal(answer('coin-change', { goal: 'orderings', coins: '1, 2, 5', amount: '5' }), 9);
  assert.equal(answer('coin-change', { goal: 'ways', coins: '2', amount: '0' }), 1);
  assert.equal(answer('coin-change', { goal: 'min', coins: '2', amount: '0' }).count, 0);
  assert.equal(answer('divide-and-conquer-dp', { values: '1, 3, 2, 6, 4', groups: '2', method: 'dc' }).cost, 136);
  assert.equal(answer('divide-and-conquer-dp', { values: '1, 3, 2, 6, 4', groups: '2', method: 'plain' }).cost, 136);
  assert.equal(answer('edit-distance', { a: 'kitten', b: 'sitting', replace: '1' }).distance, 3);
  assert.equal(answer('edit-distance', { a: 'horse', b: 'ros', replace: '1' }).distance, 3);
  assert.equal(answer('edit-distance', { a: 'kitten', b: 'sitting', replace: '2' }).distance, 5);
  assert.equal(answer('edit-distance', { a: 'abc', b: 'abc' }).distance, 0);
  assert.equal(answer('edit-distance', { a: '', b: 'abc' }).distance, 3);
  for (const method of ['table', 'space']) assert.equal(answer('fibonacci-dp', { method, n: '40' }).value, 102334155);
  assert.deepEqual(answer('fibonacci-dp', { method: 'naive', n: '6' }), { value: 8, calls: 25 });
  assert.deepEqual(answer('fibonacci-dp', { method: 'memo', n: '6' }), { value: 8, calls: 11 });
  assert.equal(answer('fibonacci-dp', { method: 'table', n: '0' }).value, 0);
  assert.equal(answer('fibonacci-dp', { method: 'table', n: '1' }).value, 1);
  assert.deepEqual(answer('longest-common-subsequence', { a: 'ABCB', b: 'BDCB' }), { length: 3, text: 'BCB' });
  assert.equal(answer('longest-common-subsequence', { a: 'ABCBDAB', b: 'BDCABA' }).length, 4);
  assert.deepEqual(answer('longest-common-subsequence', { a: 'ABC', b: 'XYZ' }), { length: 0, text: '' });
  assert.deepEqual(answer('longest-common-substring', { a: 'abcdef', b: 'zcdemf' }), { length: 3, text: 'cde' });
  assert.deepEqual(answer('longest-common-substring', { a: 'abc', b: 'xyz' }), { length: 0, text: '' });
  for (const method of ['n2', 'patience']) {
    assert.equal(answer('longest-increasing-subsequence', { values: '10, 9, 2, 5, 3, 7, 101, 18', method }).length, 4);
    assert.equal(answer('longest-increasing-subsequence', { values: '5, 4, 3', method }).length, 1);
    assert.equal(answer('longest-increasing-subsequence', { values: '2, 2, 2', method }).length, 1);
  }
  assert.deepEqual(answer('longest-palindromic-subsequence', { text: 'bbbab' }).length, 4);
  assert.deepEqual(answer('longest-palindromic-subsequence', { text: 'character' }).length, 5);
  assert.deepEqual(answer('longest-palindromic-subsequence', { text: 'a' }), { length: 1, text: 'a' });
  assert.deepEqual(answer('matrix-chain-multiplication', { dims: '40, 20, 30, 10, 30' }).cost, 26000);
  assert.deepEqual(answer('matrix-chain-multiplication', { dims: '10, 30, 5, 60' }), { cost: 4500, order: '((AB)C)' });
  assert.deepEqual(answer('matrix-chain-multiplication', { dims: '2, 2, 4, 3' }).cost, 36);
  assert.deepEqual(answer('matrix-chain-multiplication', { dims: '3, 4' }), { cost: 0, order: 'A' });
  const grid = answer('memoization-vs-tabulation', { problem: 'grid', rows: '2', cols: '2' });
  assert.deepEqual([grid.memo, grid.table, grid.filledMemo, grid.filled], [6, 6, 9, 9]);
  const stairs = answer('memoization-vs-tabulation', { problem: 'stairs', n: '12', steps: '3, 5' });
  assert.equal(stairs.memo, stairs.table);
  assert.ok(stairs.filledMemo < stairs.filled, 'memoization skips stairs it can never reach');
  assert.equal(answer('min-cost-path', { grid: '1 3 1 / 1 5 1 / 4 2 1', moves: 'two' }).total, 7);
  assert.equal(answer('min-cost-path', { grid: '1 3 1 / 1 5 1 / 4 2 1', moves: 'three' }).total, 5);
  assert.deepEqual(answer('min-cost-path', { grid: '5', moves: 'two' }).total, 5);
  assert.deepEqual(answer('optimal-bst', { keys: '10, 12, 20', freq: '34, 8, 50' }), { cost: 142, root: 20 });
  assert.equal(answer('optimal-bst', { keys: '10, 12', freq: '34, 50' }).cost, 118);
  assert.equal(answer('partition-problem', { values: '1, 5, 11, 5' }).possible, true);
  assert.equal(answer('partition-problem', { values: '1, 2, 3, 5' }).possible, false);
  assert.equal(answer('partition-problem', { values: '1, 1, 10' }).possible, false);
  assert.deepEqual(answer('rod-cutting', { prices: '1, 5, 8, 9, 10, 17, 17, 20', length: '8', cut: '0' }).income, 22);
  assert.deepEqual(answer('rod-cutting', { prices: '1, 5, 8, 9', length: '4', cut: '0' }), { income: 10, pieces: [2, 2] });
  assert.deepEqual(answer('rod-cutting', { prices: '1, 5, 8, 9', length: '4', cut: '2' }).income, 9);
  assert.equal(answer('shortest-common-supersequence', { a: 'abac', b: 'cab' }).length, 5);
  assert.equal(answer('shortest-common-supersequence', { a: 'AGGTAB', b: 'GXTXAYB' }).length, 9);
  assert.equal(answer('subset-sum', { values: '3, 34, 4, 12, 5, 2', target: '9' }).possible, true);
  assert.equal(answer('subset-sum', { values: '3, 34, 4, 12, 5, 2', target: '30' }).possible, false);
  assert.deepEqual(answer('subset-sum', { values: '2, 4', target: '0' }), { possible: true, used: [] });
  assert.equal(answer('unbounded-knapsack', { items: 'A(1,10), B(3,40), C(4,50), D(5,70)', capacity: '8' }).best, 110);
  assert.deepEqual(answer('unbounded-knapsack', { items: 'A(5,10)', capacity: '3' }), { best: 0, used: [] });
  assert.deepEqual(answer('weighted-job-scheduling', { jobs: 'A(3,5,20), B(1,2,50), C(6,19,100), D(2,100,200)' }), { total: 250, jobs: ['B', 'D'] });
  assert.equal(answer('weighted-job-scheduling', { jobs: 'A(1,4,30), B(3,6,50), C(5,8,30)' }).total, 60);
});

test('dynamic programming matches plain recursion on random input', () => {
  const next = seeded(67);
  const isSubsequence = (small: string, big: string) => {
    let at = 0;
    for (const char of big) if (char === small[at]) at++;
    return at === small.length;
  };
  const word = (length: number) => Array.from({ length }, () => 'abc'[next(3)]).join('');
  for (let run = 0; run < 150; run++) {
    const items = Array.from({ length: 1 + next(5) }, (_, i) => ({ name: `I${i}`, weight: 1 + next(8), value: 1 + next(20) }));
    const itemText = items.map(item => `${item.name}(${item.weight},${item.value})`).join(', ');
    const capacity = 1 + next(15);
    const best01 = Math.max(0, ...subsetsOf(items).filter(set => sum(set.map(item => item.weight)) <= capacity).map(set => sum(set.map(item => item.value))));
    const table = answer('0-1-knapsack', { items: itemText, capacity: String(capacity), view: 'table' });
    assert.equal(table.best, best01, itemText);
    assert.equal(answer('0-1-knapsack', { items: itemText, capacity: String(capacity), view: 'row' }).best, best01, itemText);
    const taken = items.filter(item => table.chosen.includes(item.name));
    assert.equal(sum(taken.map(item => item.value)), best01, 'the chosen items add up to the best value');
    assert.ok(sum(taken.map(item => item.weight)) <= capacity);
    const remembered = new Map<number, number>();
    const unbounded = (room: number): number => {
      if (!remembered.has(room)) remembered.set(room, Math.max(0, ...items.filter(item => item.weight <= room).map(item => item.value + unbounded(room - item.weight))));
      return remembered.get(room)!;
    };
    const unboundedResult = answer('unbounded-knapsack', { items: itemText, capacity: String(capacity) });
    assert.equal(unboundedResult.best, unbounded(capacity), itemText);
    assert.equal(sum(unboundedResult.used.map((name: string) => items.find(item => item.name === name)!.value)), unbounded(capacity));

    const coins = [...new Set(list(next, 1 + next(3), 1, 7))];
    const amount = next(16);
    const fewest = (left: number): number => (left === 0 ? 0 : Math.min(Infinity, ...coins.filter(coin => coin <= left).map(coin => 1 + fewest(left - coin))));
    const ways = (left: number, from: number): number => (left === 0 ? 1 : coins.slice(from).reduce((total, coin, i) => total + (coin <= left ? ways(left - coin, from + i) : 0), 0));
    const orderings = (left: number): number => (left === 0 ? 1 : coins.reduce((total, coin) => total + (coin <= left ? orderings(left - coin) : 0), 0));
    const coinText = coins.join(', ');
    const min = answer('coin-change', { goal: 'min', coins: coinText, amount: String(amount) });
    assert.equal(min.count, fewest(amount) === Infinity ? -1 : fewest(amount), `${coinText} ${amount}`);
    if (min.count >= 0) assert.equal(sum(min.used), amount);
    assert.equal(answer('coin-change', { goal: 'ways', coins: coinText, amount: String(amount) }), ways(amount, 0), `${coinText} ${amount}`);
    assert.equal(answer('coin-change', { goal: 'orderings', coins: coinText, amount: String(amount) }), orderings(amount), `${coinText} ${amount}`);

    const a = word(1 + next(6));
    const b = word(1 + next(6));
    const seen = new Map<string, number>();
    const distance = (i: number, j: number): number => {
      if (!i || !j) return i + j;
      const key = `${i},${j}`;
      if (!seen.has(key)) seen.set(key, a[i - 1] === b[j - 1] ? distance(i - 1, j - 1) : 1 + Math.min(distance(i - 1, j), distance(i, j - 1), distance(i - 1, j - 1)));
      return seen.get(key)!;
    };
    assert.equal(answer('edit-distance', { a, b, replace: '1' }).distance, distance(a.length, b.length), `${a} ${b}`);
    const subs = subsetsOf([...a]).map(chars => chars.join(''));
    const common = Math.max(...subs.filter(sub => isSubsequence(sub, b)).map(sub => sub.length));
    const lcs = answer('longest-common-subsequence', { a, b });
    assert.equal(lcs.length, common, `${a} ${b}`);
    assert.ok(isSubsequence(lcs.text, a) && isSubsequence(lcs.text, b));
    let run2 = 0;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j <= a.length; j++) if (b.includes(a.slice(i, j))) run2 = Math.max(run2, j - i);
    const substring = answer('longest-common-substring', { a, b });
    assert.equal(substring.length, run2, `${a} ${b}`);
    assert.ok(a.includes(substring.text) && b.includes(substring.text));
    const scs = answer('shortest-common-supersequence', { a, b });
    assert.equal(scs.length, a.length + b.length - common, `${a} ${b}`);
    assert.ok(isSubsequence(a, scs.text) && isSubsequence(b, scs.text), `${scs.text} holds ${a} and ${b}`);
    const palindromes = subs.filter(sub => sub === [...sub].reverse().join(''));
    const lps = answer('longest-palindromic-subsequence', { text: a });
    assert.equal(lps.length, Math.max(...palindromes.map(sub => sub.length)), a);
    assert.equal(lps.text, [...lps.text].reverse().join(''), 'the result reads the same both ways');
    assert.ok(isSubsequence(lps.text, a));

    const values = list(next, 1 + next(7), 0, 20);
    const increasing = Math.max(...subsetsOf(values.map((value, i) => ({ value, i }))).filter(set => set.every((item, i) => i === 0 || set[i - 1].value < item.value)).map(set => set.length));
    for (const method of ['n2', 'patience']) {
      const lis = answer('longest-increasing-subsequence', { values: values.join(', '), method });
      assert.equal(lis.length, increasing, `${method} ${values}`);
      assert.ok(lis.sequence.every((value: number, i: number) => i === 0 || lis.sequence[i - 1] < value), `${method} ${values}`);
      assert.equal(lis.sequence.length, lis.length);
    }

    const dims = list(next, 2 + next(4), 1, 30);
    const chain = (i: number, j: number): number => {
      if (i === j) return 0;
      let top = Infinity;
      for (let k = i; k < j; k++) top = Math.min(top, chain(i, k) + chain(k + 1, j) + dims[i] * dims[k + 1] * dims[j + 1]);
      return top;
    };
    assert.equal(answer('matrix-chain-multiplication', { dims: dims.join(', ') }).cost, chain(0, dims.length - 2), dims.join());

    const rows = 1 + next(4);
    const cols = 1 + next(4);
    const costs = Array.from({ length: rows }, () => list(next, cols, 0, 9));
    const cheapest = (r: number, c: number): number => (r === 0 && c === 0 ? costs[0][0] : costs[r][c] + Math.min(r ? cheapest(r - 1, c) : Infinity, c ? cheapest(r, c - 1) : Infinity));
    const cheapestDiagonal = (r: number, c: number): number => (r === 0 && c === 0 ? costs[0][0] : costs[r][c] + Math.min(r ? cheapestDiagonal(r - 1, c) : Infinity, c ? cheapestDiagonal(r, c - 1) : Infinity, r && c ? cheapestDiagonal(r - 1, c - 1) : Infinity));
    const gridText = costs.map(line => line.join(' ')).join(' / ');
    const walk = answer('min-cost-path', { grid: gridText, moves: 'two' });
    assert.equal(walk.total, cheapest(rows - 1, cols - 1), gridText);
    assert.equal(sum(walk.path.map(([r, c]: [number, number]) => costs[r][c])), walk.total, 'the path adds up to its cost');
    assert.equal(answer('min-cost-path', { grid: gridText, moves: 'three' }).total, cheapestDiagonal(rows - 1, cols - 1), gridText);

    const freq = list(next, 1 + next(5), 1, 30);
    const keys = freq.map((_, i) => i * 10 + 10);
    const bst = (i: number, j: number): number => {
      if (i > j) return 0;
      let top = Infinity;
      for (let r = i; r <= j; r++) top = Math.min(top, bst(i, r - 1) + bst(r + 1, j));
      return top + sum(freq.slice(i, j + 1));
    };
    assert.equal(answer('optimal-bst', { keys: keys.join(', '), freq: freq.join(', ') }).cost, bst(0, freq.length - 1), freq.join());

    const parts = list(next, 1 + next(6), 1, 12);
    const half = sum(parts) / 2;
    const canSplit = subsetsOf(parts).some(set => sum(set) === half);
    const split = answer('partition-problem', { values: parts.join(', ') });
    assert.equal(split.possible, canSplit, parts.join());
    if (split.possible) assert.equal(sum(split.used), half);
    const target = next(30);
    const made = answer('subset-sum', { values: parts.join(', '), target: String(target) });
    assert.equal(made.possible, subsetsOf(parts).some(set => sum(set) === target), `${parts} ${target}`);
    if (made.possible) assert.equal(sum(made.used), target);

    const prices = list(next, 1 + next(7), 1, 30);
    const length = prices.length;
    const cut = next(4);
    const rod = (left: number): number => {
      let top = -Infinity;
      for (let i = 1; i <= left; i++) top = Math.max(top, prices[i - 1] + (i < left ? rod(left - i) - cut : 0));
      return top;
    };
    const rodResult = answer('rod-cutting', { prices: prices.join(', '), length: String(length), cut: String(cut) });
    assert.equal(rodResult.income, rod(length), `${prices} cut ${cut}`);
    assert.equal(sum(rodResult.pieces), length);
    assert.equal(sum(rodResult.pieces.map((piece: number) => prices[piece - 1])) - cut * (rodResult.pieces.length - 1), rodResult.income, 'the pieces add up to the income');

    const jobs = Array.from({ length: 1 + next(6) }, (_, i) => {
      const start = next(15);
      return { name: `J${i}`, start, end: start + 1 + next(8), profit: 1 + next(40) };
    });
    const bestJobs = Math.max(0, ...subsetsOf(jobs).filter(set => set.every((x, i) => set.slice(i + 1).every(y => x.end <= y.start || y.end <= x.start))).map(set => sum(set.map(job => job.profit))));
    const scheduled = answer('weighted-job-scheduling', { jobs: jobs.map(job => `${job.name}(${job.start},${job.end},${job.profit})`).join(', ') });
    assert.equal(scheduled.total, bestJobs, JSON.stringify(jobs));
    assert.equal(sum(scheduled.jobs.map((name: string) => jobs.find(job => job.name === name)!.profit)), bestJobs, 'the chosen jobs add up to the best profit');

    const dcValues = list(next, 2 + next(9), 1, 20);
    const groups = 1 + next(Math.min(4, dcValues.length));
    const prefix = [0];
    dcValues.forEach(value => prefix.push(prefix.at(-1)! + value));
    const brute = (count: number, k: number): number => {
      if (k === 1) return prefix[count] ** 2;
      let top = Infinity;
      for (let j = k - 1; j < count; j++) top = Math.min(top, brute(j, k - 1) + (prefix[count] - prefix[j]) ** 2);
      return top;
    };
    const fast = answer('divide-and-conquer-dp', { values: dcValues.join(', '), groups: String(groups), method: 'dc' });
    assert.equal(fast.cost, brute(dcValues.length, groups), `${dcValues} into ${groups}`);
    assert.equal(answer('divide-and-conquer-dp', { values: dcValues.join(', '), groups: String(groups), method: 'plain' }).cost, fast.cost);
    assert.equal(sum(fast.parts.map((part: number[]) => sum(part) ** 2)), fast.cost, 'the groups add up to the cost');
    assert.deepEqual(fast.parts.flat(), dcValues, 'the groups keep every value in order');
    assert.ok(fast.checks <= fast.plain, 'the faster method never needs more checks');
  }
});

// ---------- Notation conversion ----------

function randomExpression(next: (n: number) => number, depth: number): string {
  if (depth <= 0 || next(4) === 0) return String(next(90) + 1);
  const left = randomExpression(next, depth - 1);
  const right = randomExpression(next, depth - 1);
  const op = ['+', '-', '*', '/', '^'][next(5)];
  const wrapped = next(3) === 0 ? `(${left} ${op} ${right})` : `${left} ${op} ${right}`;
  return next(7) === 0 ? `-(${wrapped})` : wrapped;
}

test('notation conversion gives the known answers in all six directions', () => {
  const convert = (conversion: string, values: Values) => answer('notation-conversion', { conversion, ...values }).output;
  assert.equal(convert('infix-postfix', { infix: 'A + B * C' }), 'A B C * +');
  assert.equal(convert('infix-postfix', { infix: '(A + B) * C' }), 'A B + C *');
  assert.equal(convert('infix-postfix', { infix: '2 ^ 3 ^ 2' }), '2 3 2 ^ ^');
  assert.equal(convert('infix-postfix', { infix: '10 - 4 - 3' }), '10 4 - 3 -');
  assert.equal(convert('infix-postfix', { infix: '-2 ^ 2 + 10' }), '2 2 ^ ~ 10 +');
  assert.equal(convert('infix-postfix', { infix: '2(3 + 4)(5 - 1)' }), '2 3 4 + * 5 1 - *');
  for (const method of ['stacks', 'reverse']) {
    assert.equal(convert('infix-prefix', { infix: 'A + B * C', method }), '+ A * B C');
    assert.equal(convert('infix-prefix', { infix: '(A - B / C) * (A / K - L)', method }), '* - A / B C - / A K L');
    assert.equal(convert('infix-prefix', { infix: 'A - B - C', method }), '- - A B C');
    assert.equal(convert('infix-prefix', { infix: '2 ^ 3 ^ 2', method }), '^ 2 ^ 3 2');
  }
  assert.equal(convert('infix-prefix', { infix: '-A * B', method: 'stacks' }), '* ~ A B');
  fails('notation-conversion', { conversion: 'infix-prefix', infix: '-A * B', method: 'reverse' }, /unary minus/);
  assert.equal(convert('postfix-infix', { postfix: 'A B + C *', parens: 'minimal' }), '(A + B) * C');
  assert.equal(convert('postfix-infix', { postfix: 'A B + C *', parens: 'full' }), '((A + B) * C)');
  assert.equal(convert('postfix-infix', { postfix: 'A B C - -', parens: 'minimal' }), 'A - (B - C)');
  assert.equal(convert('postfix-infix', { postfix: 'A B - C -', parens: 'minimal' }), 'A - B - C');
  assert.equal(convert('postfix-infix', { postfix: '2 3 2 ^ ^', parens: 'minimal' }), '2 ^ 3 ^ 2');
  assert.equal(convert('postfix-infix', { postfix: '2 3 ^ 2 ^', parens: 'minimal' }), '(2 ^ 3) ^ 2');
  assert.equal(convert('postfix-infix', { postfix: '2 ~ 2 ^', parens: 'minimal' }), '(-2) ^ 2');
  assert.equal(convert('postfix-infix', { postfix: '2 2 ^ ~', parens: 'minimal' }), '-2 ^ 2');
  assert.equal(convert('postfix-prefix', { postfix: 'A B + C *' }), '* + A B C');
  assert.equal(convert('prefix-infix', { prefix: '* + A B C', parens: 'minimal' }), '(A + B) * C');
  assert.equal(convert('prefix-infix', { prefix: '- A B', parens: 'minimal' }), 'A - B', 'the first popped is the left side');
  assert.equal(convert('prefix-postfix', { prefix: '* + A B - C D' }), 'A B + C D - *');
});

test('notation conversion agrees with the expression parser on random input, in every direction', () => {
  const next = seeded(71);
  for (let run = 0; run < 400; run++) {
    const input = randomExpression(next, 3);
    if ((input.match(/\d+|[-()+*/^]/g) ?? []).length > 30) continue;
    const { infix, prefix, postfix } = notationsOf(parseExpression(input, 'infix').root);
    const go = (conversion: string, values: Values) => answer('notation-conversion', { conversion, ...values });
    assert.equal(go('infix-postfix', { infix: input }).output, postfix, input);
    assert.equal(go('infix-prefix', { infix: input, method: 'stacks' }).output, prefix, input);
    if (!prefix.includes('~')) assert.equal(go('infix-prefix', { infix: input, method: 'reverse' }).output, prefix, input);
    assert.equal(go('postfix-prefix', { postfix }).output, prefix, postfix);
    assert.equal(go('prefix-postfix', { prefix }).output, postfix, prefix);
    for (const parens of ['minimal', 'full']) {
      const fromPostfix = go('postfix-infix', { postfix, parens }).output;
      const fromPrefix = go('prefix-infix', { prefix, parens }).output;
      assert.equal(fromPostfix, fromPrefix, `${postfix} and ${prefix} must read the same`);
      assert.deepEqual(notationsOf(parseExpression(fromPostfix, 'infix').root).postfix, postfix, `reading ${fromPostfix} back gives the same structure`);
    }
    assert.equal(infix.length > 0, true);
  }
});
