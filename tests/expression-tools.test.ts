import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeExpression, notationsOf, parseExpression } from '../src/lib/expressions.ts';
import { traceShuntingYard, shouldPop } from '../src/lib/shunting-yard.ts';
import { analyzeExpressionTree, buildTreeFrames, traversalFrames } from '../src/lib/expression-tree.ts';
import { traceBrackets } from '../src/lib/balanced-brackets.ts';

/** A small seeded generator, so a failure can be reproduced. */
function random(seed: number) {
  let state = seed;
  return (n: number) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % n;
  };
}

function randomExpression(next: (n: number) => number, depth: number): string {
  const leaf = () => String(next(90) + 1);
  if (depth <= 0 || next(4) === 0) return leaf();
  const left = randomExpression(next, depth - 1);
  const right = randomExpression(next, depth - 1);
  const op = ['+', '-', '*', '/', '^'][next(5)];
  const wrapped = next(3) === 0 ? `(${left} ${op} ${right})` : `${left} ${op} ${right}`;
  return next(6) === 0 ? `-${wrapped.startsWith('(') ? wrapped : `(${wrapped})`}` : wrapped;
}

// Shunting Yard

test('shunting yard gives the textbook postfix', () => {
  for (const [input, postfix] of [
    ['3 + 4 * 2', '3 4 2 * +'],
    ['(3 + 4) * 2', '3 4 + 2 *'],
    ['10 - 4 - 3', '10 4 - 3 -'],
    ['2 ^ 3 ^ 2', '2 3 2 ^ ^'],
    ['-2 ^ 2', '2 2 ^ ~'],
    ['2 ^ -2 * 8', '2 2 ~ ^ 8 *'],
    ['2(3 + 4)', '2 3 4 + *'],
    ['+5 - +3', '5 3 -'],
  ]) assert.equal(traceShuntingYard(input).postfix, postfix, input);
});

test('shunting yard agrees with the expression parser on random input', () => {
  const next = random(20261105);
  for (let i = 0; i < 400; i++) {
    const input = randomExpression(next, 4);
    const { root } = parseExpression(input, 'infix');
    assert.equal(traceShuntingYard(input).postfix, notationsOf(root).postfix, input);
  }
});

test('shunting yard reports the same errors as the evaluator', () => {
  for (const input of ['2 +', '(2 + 3', '2 + 3)', '1 2', '* 3', '()', '2 + * 3']) {
    const { error, frames } = traceShuntingYard(input);
    assert.ok(error, `${input} should fail`);
    assert.equal(frames.at(-1)!.phase, 'error');
    assert.throws(() => analyzeExpression(input, 'infix'), { message: error }, input);
  }
});

test('shunting yard pop rule follows precedence and associativity', () => {
  assert.equal(shouldPop('*', '+'), true);
  assert.equal(shouldPop('+', '*'), false);
  assert.equal(shouldPop('+', '-'), true);
  assert.equal(shouldPop('^', '^'), false);
  assert.equal(shouldPop('~', '^'), false);
  assert.equal(shouldPop('~', '*'), true);
  assert.equal(shouldPop('(', '+'), false);
});

test('shunting yard frames: the stack and output only change by one token, and every number is output in order', () => {
  const { frames, postfix } = traceShuntingYard('(1 + 2) * 3 - 4 / 5 ^ 6');
  for (let i = 1; i < frames.length; i++) {
    assert.ok(frames[i].output.length - frames[i - 1].output.length <= 1);
    assert.ok(Math.abs(frames[i].stack.length - frames[i - 1].stack.length) <= 1);
  }
  assert.equal(frames.at(-1)!.stack.length, 0);
  assert.equal(frames.at(-1)!.output.join(' '), postfix);
  assert.deepEqual(postfix.split(' ').filter(t => /\d/.test(t)), ['1', '2', '3', '4', '5', '6']);
});

// Expression Tree

test('expression tree build: one frame per step, ending as a single tree', () => {
  const data = analyzeExpressionTree('(8 + 4) * 3 - -6');
  const frames = buildTreeFrames(data.root);
  assert.equal(frames.at(-1)!.forest.length, 1);
  assert.equal(frames.at(-1)!.forest[0].id, data.root.id);
  assert.equal(new Set(frames.filter(f => f.phase === 'leaf' || f.phase === 'link').map(f => f.activeId)).size, data.tokens.length);
  for (const frame of frames.filter(f => f.phase === 'pick')) {
    const top = frame.forest.slice(-frame.childIds.length).map(node => node.id);
    assert.deepEqual(top, frame.childIds, 'an operator takes the subtrees on top of the stack');
  }
});

test('expression tree traversals produce the three notations', () => {
  const data = analyzeExpressionTree('(8 + 4) * -3 ^ 2');
  const post = traversalFrames(data.root, 'post', data.infix).at(-1)!.output.join(' ');
  const pre = traversalFrames(data.root, 'pre', data.infix).at(-1)!.output.join(' ');
  const inorder = traversalFrames(data.root, 'in', data.infix).at(-1)!.output.join(' ');
  assert.equal(post, data.postfix);
  assert.equal(pre, data.prefix);
  assert.equal(inorder, data.infix.replace(/[()]/g, '').replace(/-/g, '~ ').replace(/\s+/g, ' ').trim());
});

test('expression tree accepts all three notations and can draw what would not evaluate', () => {
  assert.equal(analyzeExpressionTree('* + 2 3 4').postfix, '2 3 + 4 *');
  assert.equal(analyzeExpressionTree('2 3 + 4 *').notation, 'postfix');
  assert.equal(analyzeExpressionTree('1 / 0').postfix, '1 0 /');
  assert.throws(() => analyzeExpression('1 / 0'), /Division by zero/);
});

// Balanced brackets

test('balanced brackets accepts what is balanced, and counts pairs and depth', () => {
  const good = traceBrackets('f(a[0], {b: (1 + 2)})');
  assert.equal(good.balanced, true);
  assert.equal(good.pairCount, 4);
  assert.equal(good.maxDepth, 3);
  assert.equal(traceBrackets('no brackets here').balanced, true);
  assert.equal(traceBrackets('()[]{}').maxDepth, 1);
});

test('balanced brackets reports the exact problem and position', () => {
  assert.match(traceBrackets('(]').verdict, /“\]” at position 2 can't close “\(” from position 1/);
  assert.match(traceBrackets('a)').verdict, /Unmatched “\)” at position 2/);
  assert.match(traceBrackets('((a)').verdict, /“\(” at position 1 was never closed/);
  assert.deepEqual(traceBrackets('((a)').frames.at(-1)!.bad, [0]);
  assert.deepEqual(traceBrackets('([)]').frames.at(-1)!.bad, [2, 1]);
  assert.equal(traceBrackets('([)]').balanced, false);
  assert.throws(() => traceBrackets('  '), /Enter some text/);
  assert.throws(() => traceBrackets('('.repeat(201)), /200 characters/);
});

test('balanced brackets agrees with a simple counter on random single-type input', () => {
  const next = random(7);
  for (let i = 0; i < 300; i++) {
    const text = Array.from({ length: next(14) + 1 }, () => '()'[next(2)]).join('');
    let depth = 0;
    let ok = true;
    for (const c of text) {
      depth += c === '(' ? 1 : -1;
      if (depth < 0) ok = false;
    }
    assert.equal(traceBrackets(text).balanced, ok && depth === 0, text);
  }
});

test('balanced bracket pairs are nested properly', () => {
  const { pairCount, frames } = traceBrackets('{[()()]()}');
  const pairs = frames.at(-1)!.pairs;
  assert.equal(pairs.length, pairCount);
  for (const a of pairs) for (const b of pairs) {
    const crossing = a.open < b.open && b.open < a.close && a.close < b.close;
    assert.equal(crossing, false);
  }
});
