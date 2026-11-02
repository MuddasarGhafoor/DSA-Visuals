import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeExpression } from '../src/lib/expressions.ts';
import { buildExpressionFrames } from '../src/lib/expression-frames.ts';
import { operateTree, parseValues, traversalSteps, values, balance, type TreeMode, type TreeNode } from '../src/lib/trees.ts';
import { expressionExamples, treeExamples } from '../src/content/examples.ts';
import { allTopics, catalog, liveTopics, topicAt, topicHref } from '../src/lib/catalog.ts';
import { topicNotes } from '../src/content/topic-notes.ts';
import { searchEntries, searchSnippet, toHeadingId, type SearchEntry } from '../src/lib/search.ts';

test('converted forms always evaluate to the same value, including negative literals', () => {
  const cases = [['-3 2 ^', 'postfix'], ['^ -3 2', 'prefix'], ['-.5 2 ^', 'postfix'], ['2 -3 ^', 'postfix'], ['- 3 -2', 'prefix'], ['5 ~ 2 ^', 'postfix'], ['+5 2 ^', 'postfix']] as const;
  for (const [input, notation] of cases) {
    const a = analyzeExpression(input, notation);
    for (const form of ['infix', 'prefix', 'postfix'] as const) assert.equal(analyzeExpression(a[form], form).result, a.result, `${input} via ${form}: ${a[form]}`);
  }
  assert.equal(analyzeExpression('-3 2 ^', 'postfix').result, 9);
  assert.equal(analyzeExpression('-3 2 ^', 'postfix').infix, '((-3) ^ 2)');
});

test('auto-detect picks the notation that parses', () => {
  for (const [input, notation, result] of [
    ['(2 + 3) * 4', 'infix', 20], ['- 2', 'infix', -2], ['* + 2 3 4', 'prefix', 20], ['2 3 + 4 *', 'postfix', 20], ['~ 5', 'prefix', -5], ['5 ~', 'postfix', -5], ['7', 'infix', 7],
  ] as const) {
    const a = analyzeExpression(input);
    assert.equal(a.notation, notation, input);
    assert.equal(a.result, result, input);
  }
});

test('auto-detect reports the error for the notation the input resembles', () => {
  assert.throws(() => analyzeExpression('1 2 3 +'), /Too many operands/);
  assert.throws(() => analyzeExpression('+ 1 2 3'), /Too many operands/);
  assert.throws(() => analyzeExpression('1 2 + 3'), /Missing operator/);
  assert.throws(() => analyzeExpression('2 +'), /Expected a number/);
  assert.throws(() => analyzeExpression('1 2 + +'), /needs 2 operands/);
  assert.throws(() => analyzeExpression('(2 + 3'), /closing parenthesis/);
  assert.throws(() => analyzeExpression('2 + 3)'), /Unmatched closing/);
});

test('specific errors name what went wrong', () => {
  assert.throws(() => analyzeExpression('1 / (2 - 2)'), /Division by zero: 1 ÷ 0/);
  assert.throws(() => analyzeExpression('0 ^ -1'), /divides by zero/);
  assert.throws(() => analyzeExpression('(-8) ^ (1 / 3)'), /no real result/);
  assert.throws(() => analyzeExpression('10 ^ 1000'), /too large/);
  assert.throws(() => analyzeExpression('9'.repeat(400)), /too large/);
  assert.throws(() => analyzeExpression('1.2.3'), /one decimal point/);
  assert.throws(() => analyzeExpression('2x'), /Unexpected character/);
});

test('typed math symbols are accepted', () => {
  assert.equal(analyzeExpression('2×3').result, 6);
  assert.equal(analyzeExpression('8÷4').result, 2);
  assert.equal(analyzeExpression('5−3').result, 2);
  assert.equal(analyzeExpression('× 2 3', 'prefix').result, 6);
});

test('evaluation steps line up with the postfix tokens and record their operands', () => {
  const a = analyzeExpression('(8 + 4) * 3');
  assert.deepEqual(a.steps.map(s => s.token), a.postfix.split(' '));
  const add = a.steps[2];
  assert.equal(add.kind, 'apply');
  assert.deepEqual(add.operands, [8, 4]);
  assert.equal(add.value, 12);
  assert.deepEqual(add.stack, [12]);
  assert.equal(add.message, '8 + 4 = 12');
  assert.deepEqual(a.steps[0].operands, []);
  const unary = analyzeExpression('-5').steps[1];
  assert.deepEqual(unary.operands, [5]);
  assert.equal(unary.value, -5);
});

test('expression frames collapse the tree down to one value', () => {
  const a = analyzeExpression('(8 + 4) * 3 - 6 / 2');
  const frames = buildExpressionFrames(a);
  const pushes = a.steps.filter(s => s.kind === 'push').length;
  const applies = a.steps.length - pushes;
  assert.equal(frames.length, 2 + pushes + applies * 3);
  assert.equal(frames[0].phase, 'start');
  assert.equal(frames[0].stack.length, 0);
  assert.ok(Object.values(frames[0].nodes).every(n => n.state === 'waiting' || n.state === 'pending-op'));

  for (const [i, step] of a.steps.entries()) {
    const own = frames.filter(f => f.step === i && f.phase !== 'done');
    assert.equal(own.length, step.kind === 'push' ? 1 : 3);
    const last = own.at(-1)!;
    assert.deepEqual(last.stack.map(item => item.value), step.stack, `stack after step ${i}`);
    if (step.kind === 'apply') {
      assert.deepEqual(own.map(f => f.phase), ['pick', 'compute', 'merge']);
      assert.equal(own[0].stack.length, step.stack.length - 1, 'operands are off the stack while being used');
      assert.equal(own[1].tray?.result, step.value);
      for (const id of step.operandIds) {
        assert.equal(own[0].nodes[id].state, 'operand');
        assert.equal(last.nodes[id].state, 'absorbed');
        assert.equal(last.nodes[id].absorbedInto, step.nodeId);
      }
      assert.equal(last.nodes[step.nodeId].state, 'computed');
      assert.equal(last.nodes[step.nodeId].label, String(step.value));
    }
  }

  const end = frames.at(-1)!;
  assert.equal(end.phase, 'done');
  assert.deepEqual(end.stack.map(item => item.value), [33]);
  assert.equal(Object.values(end.nodes).filter(n => n.state !== 'absorbed').length, 1);
  assert.equal(end.nodes[a.root.id].label, '33');
  // Earlier frames must stay as they were when later frames are built.
  assert.equal(frames[0].nodes[a.root.id].state, 'pending-op');
});

function verify(n: TreeNode | null, low = -Infinity, high = Infinity): number {
  if (!n) return 0;
  assert.ok(n.value > low && n.value < high, `ordering at ${n.value}`);
  const h = 1 + Math.max(verify(n.left, low, n.value), verify(n.right, n.value, high));
  assert.equal(n.height, h, `stored height at ${n.value}`);
  return h;
}

test('every intermediate tree frame is a valid tree with correct heights', () => {
  let seed = 99;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0);
  for (const mode of ['bst', 'avl'] as TreeMode[]) {
    let root: TreeNode | null = null;
    for (let i = 0; i < 1500; i++) {
      const value = random() % 60;
      const steps = operateTree(root, String(value), random() % 5 < 2 ? 'delete' : 'insert', mode);
      for (const step of steps) {
        verify(step.root);
        const seen = values(step.root);
        assert.equal(new Set(seen).size, seen.length, 'no value appears twice');
        for (const v of [...step.active, ...step.danger]) assert.ok(seen.includes(v), `highlighted ${v} exists in "${step.message}"`);
        if (step.badge) assert.ok(seen.includes(step.badge.on), `badge target exists in "${step.message}"`);
      }
      root = steps.at(-1)!.root;
    }
  }
});

test('no-op operations say nothing changed instead of claiming success', () => {
  const root = operateTree(null, '40, 20, 60', 'insert', 'bst').at(-1)!.root;
  const duplicate = operateTree(root, '20', 'insert', 'bst');
  assert.equal(duplicate.at(-1)!.kind, 'duplicate');
  assert.match(duplicate.at(-1)!.message, /Nothing changed/);
  const missing = operateTree(root, '99', 'delete', 'bst');
  assert.equal(missing.at(-1)!.kind, 'missing');
  assert.match(missing.at(-1)!.message, /Nothing changed/);
  assert.ok(!missing.some(s => s.kind === 'done'));
  assert.equal(JSON.stringify(missing.at(-1)!.root), JSON.stringify(root));
  const empty = operateTree(null, '5', 'delete', 'avl');
  assert.equal(empty.at(-1)!.root, null);
});

test('AVL shows the imbalance before fixing it, and names the right case', () => {
  for (const [input, caseName, rotations] of [['30,20,10', 'Left-Left', 1], ['10,20,30', 'Right-Right', 1], ['30,10,20', 'Left-Right', 2], ['10,30,20', 'Right-Left', 2]] as const) {
    const steps = operateTree(null, input, 'insert', 'avl');
    const at = steps.findIndex(s => s.kind === 'imbalance');
    assert.ok(at > 0, input);
    assert.match(steps[at].message, new RegExp(caseName));
    assert.ok(Math.abs(balance(steps[at].root)) === 2, 'the frame shows the tree while it is still unbalanced');
    assert.equal(steps.filter(s => s.kind === 'rotate').length, rotations, input);
    assert.equal(steps.at(-1)!.root!.value, 20, input);
  }
});

test('BST mode never rotates or runs balance checks', () => {
  const steps = operateTree(null, '10, 20, 30, 40', 'insert', 'bst');
  assert.ok(!steps.some(s => ['rotate', 'imbalance', 'check'].includes(s.kind)));
});

test('batch steps are grouped by value', () => {
  const steps = operateTree(null, '5, 3', 'insert', 'bst');
  assert.deepEqual([...new Set(steps.map(s => s.groupLabel))], ['Insert 5', 'Insert 3']);
  assert.deepEqual(parseValues('1 2, 3'), [1, 2, 3]);
  assert.ok(Object.is(parseValues('-0')[0], 0));
  assert.throws(() => parseValues('1,,2'));
});

test('traversals visit every node once in the right order', () => {
  const root = operateTree(null, '40, 20, 60, 10, 30', 'insert', 'bst').at(-1)!.root;
  assert.deepEqual(values(root, 'in'), [10, 20, 30, 40, 60]);
  assert.deepEqual(values(root, 'pre'), [40, 20, 10, 30, 60]);
  assert.deepEqual(values(root, 'post'), [10, 30, 20, 60, 40]);
  const steps = traversalSteps(root, 'post');
  assert.deepEqual(steps.map(s => s.active[0]), values(root, 'post'));
  assert.deepEqual(steps.at(-1)!.path, values(root, 'post'));
  assert.equal(steps[0].path.length, 1, 'each frame keeps its own copy of the visited list');
  assert.deepEqual(traversalSteps(null, 'in'), []);
});

test('the topic catalog has no duplicates, and every ready topic has a page', () => {
  const titles = allTopics.map(topic => topic.title);
  assert.equal(new Set(titles).size, titles.length, 'topic titles are unique');
  assert.equal(new Set(catalog.map(group => group.id)).size, catalog.length, 'category ids are unique');
  assert.ok(catalog.every(group => group.topics.length > 0));
  assert.deepEqual(liveTopics.map(topic => topic.href).sort(), ['/expressions', '/trees/avl', '/trees/bst']);
  assert.equal(topicAt('/trees/avl')?.topic.title, 'AVL Tree');
  assert.equal(topicAt('/trees/avl')?.group.id, 'trees');
  assert.equal(topicAt('/topics'), undefined, 'only tool pages count as an opened topic');
});

test('every expression example gives its documented result', () => {
  for (const { level, items } of expressionExamples) {
    for (const example of items) {
      if (example.error) {
        assert.throws(() => analyzeExpression(example.input, example.notation), `${level}: ${example.input}`);
      } else {
        const a = analyzeExpression(example.input, example.notation);
        assert.ok(Math.abs(a.result - example.result!) < 1e-9, `${level}: ${example.input} gave ${a.result}`);
        assert.equal(analyzeExpression(example.input).notation, example.notation, `auto-detects ${example.input}`);
      }
    }
  }
});

test('every tree example runs, and AVL examples rotate as documented', () => {
  for (const mode of ['bst', 'avl'] as TreeMode[]) {
    for (const { level, items } of treeExamples[mode]) {
      for (const example of items) {
        const base = example.seed ? operateTree(null, example.seed, 'insert', mode).at(-1)!.root : null;
        const steps = operateTree(base, example.values, example.operation, mode);
        verify(steps.at(-1)!.root);
        assert.ok(steps.some(s => s.kind === 'done'), `${level}: ${example.title} changed the tree`);
        if (mode === 'avl') assert.equal(steps.filter(s => s.kind === 'rotate').length, example.rotations ?? 0, `${level}: ${example.title} rotations`);
      }
    }
  }
});

test('search needs every word, puts title matches first, and finds nothing for nonsense', () => {
  const entry = (title: string, text = '', kind: SearchEntry['kind'] = 'Guide', soon = false): SearchEntry => ({ title, context: 'Guide', href: '/' + title, text, kind, soon });
  const entries = [entry('Rotations', 'A child moves up.'), entry('Balance', 'Fixed with a rotation.'), entry('AVL Tree', '', 'Tool'), entry('Red-Black Tree', '', 'Topic', true)];
  assert.deepEqual(searchEntries(entries, 'rotation').map(e => e.title), ['Rotations', 'Balance']);
  assert.deepEqual(searchEntries(entries, 'TREE').map(e => e.title), ['AVL Tree', 'Red-Black Tree'], 'ignores case, and ready tools come first');
  assert.deepEqual(searchEntries(entries, 'rotation child').map(e => e.title), ['Rotations'], 'every word must match');
  assert.deepEqual(searchEntries(entries, 'zzz'), []);
  assert.deepEqual(searchEntries(entries, '   '), []);
  assert.deepEqual(searchEntries(entries, '(.*'), [], 'symbols are plain text');
});

test('search snippets show the match, and heading ids stay simple', () => {
  const long = `${'word '.repeat(40)}target ${'word '.repeat(40)}`.trim();
  const piece = searchSnippet(long, 'target');
  assert.ok(piece.includes('target') && piece.startsWith('…') && piece.endsWith('…'));
  assert.equal(searchSnippet('short text', 'text'), 'short text');
  assert.equal(toHeadingId('Worked Example: (8 + 4) * 3'), 'worked-example-8-4-3');
});

test('every unbuilt topic has its own Coming Soon address and a note', () => {
  const soon = allTopics.filter(topic => !topic.href);
  assert.equal(new Set(soon.map(topicHref)).size, soon.length, 'addresses are unique');
  for (const topic of soon) {
    assert.match(topicHref(topic), /^\/topics\/[a-z0-9-]+$/);
    assert.equal(topicAt(topicHref(topic))?.topic, topic);
    assert.ok(topicNotes[topic.title], `note for ${topic.title}`);
  }
  assert.deepEqual(Object.keys(topicNotes).sort(), soon.map(topic => topic.title).sort(), 'no notes for topics that are gone or built');
  assert.equal(topicHref(liveTopics[0]), liveTopics[0].href);
  assert.equal(topicAt("/topics/prims-algorithm")?.topic.title, "Prim's Algorithm");
});
