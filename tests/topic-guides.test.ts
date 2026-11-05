import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { allTopics, catalog, topicByTitle, topicSlug } from '../src/lib/catalog.ts';
import { guideSections, highlightCode, parseGuide, parseInline, plainText, type Block, type InlineNode } from '../src/lib/guide-markdown.ts';
import { topicGuide } from '../src/content/topic-guides.ts';

test('a guide parses into blocks, with an outline of its headings', () => {
  const guide = parseGuide([
    '> The summary.',
    '',
    '## First Part',
    'Some words',
    'on two lines.',
    '',
    '### Detail',
    '- one',
    '- two',
    '',
    '1. step',
    '',
    '> A note.',
    '',
    '```python',
    '# a comment, not a heading',
    'x = 1',
    '```',
    '',
    '| A | B |',
    '| --- | --- |',
    '| `a \\| b` | 2 |',
    '',
    '## Second Part',
    '### Detail',
    'More.',
  ].join('\n'));
  assert.equal(guide.summary, 'The summary.');
  assert.deepEqual(guide.blocks.map(block => block.kind), ['heading', 'p', 'heading', 'ul', 'ol', 'note', 'code', 'table', 'heading', 'heading', 'p']);
  assert.equal((guide.blocks[1] as { text: string }).text, 'Some words on two lines.');
  assert.deepEqual((guide.blocks[7] as { rows: string[][] }).rows, [['`a | b`', '2']]);
  assert.deepEqual(guide.outline.map(item => item.id), ['first-part', 'second-part']);
  assert.deepEqual(guide.outline.map(item => item.subs[0].id), ['first-part-detail', 'second-part-detail'], 'repeated sub-headings still get their own ids');
  assert.deepEqual(guideSections(guide).map(section => section.id), ['first-part', 'first-part-detail', 'second-part', 'second-part-detail']);
});

test('a guide with a mistake in it is refused', () => {
  assert.throws(() => parseGuide('## No summary'), /must start/);
  assert.throws(() => parseGuide('> s\n# Top heading'), /only ## and ###/);
  assert.throws(() => parseGuide('> s\n### Too early'), /before any ##/);
  assert.throws(() => parseGuide('> s\n```python\nx = 1'), /never closed/);
  assert.throws(() => parseGuide('> s\n```\nx\n```'), /name its language/);
  assert.throws(() => parseGuide('> s\n| a | b |\n| --- | --- |\n| 1 |'), /has 1 cells/);
  assert.throws(() => parseGuide('> s\n| a |\n| b |'), /head, a divider/);
});

test('inline text handles code, bold, links, and escaped symbols', () => {
  assert.deepEqual(parseInline('See `a*b` and **[[Stack]] now** or [[AVL Tree|this]].'), [
    { kind: 'text', text: 'See ' },
    { kind: 'code', text: 'a*b' },
    { kind: 'text', text: ' and ' },
    { kind: 'strong', children: [{ kind: 'topic', title: 'Stack', text: 'Stack' }, { kind: 'text', text: ' now' }] },
    { kind: 'text', text: ' or ' },
    { kind: 'topic', title: 'AVL Tree', text: 'this' },
    { kind: 'text', text: '.' },
  ]);
  assert.equal(plainText('**A\\*** finds it, and `x` is [[Stack|here]]'), 'A* finds it, and x is here');
  assert.equal(plainText('2 * 3 * 4'), '2 * 3 * 4', 'a lone star is just a star');
  assert.deepEqual(parseGuide('> s\n## A\\* vs Others').outline[0].title, 'A* vs Others', 'headings handle it too');
});

test('highlighting colors code without changing it', () => {
  const code = 'def f(x):  # "not a string"\n    return "if" + str(x)  # done';
  const pieces = highlightCode(code, 'python');
  assert.equal(pieces.map(piece => piece.text).join(''), code);
  assert.deepEqual(pieces.filter(piece => piece.kind === 'keyword').map(piece => piece.text), ['def', 'return']);
  assert.deepEqual(pieces.filter(piece => piece.kind === 'string').map(piece => piece.text), ['"if"']);
  assert.equal(pieces.filter(piece => piece.kind === 'comment').length, 2);
  assert.deepEqual(highlightCode('if x', 'text'), [{ kind: 'plain', text: 'if x' }]);
});

function topicLinks(nodes: InlineNode[]): string[] {
  return nodes.flatMap(node => (node.kind === 'topic' ? [node.title] : node.kind === 'strong' ? topicLinks(node.children) : []));
}

const textsOf = (block: Block): string[] => {
  switch (block.kind) {
    case 'p':
    case 'note':
      return [block.text];
    case 'ul':
    case 'ol':
      return block.items;
    case 'table':
      return [...block.head, ...block.rows.flat()];
    default:
      return [];
  }
};

test('every topic has exactly one guide, and no guide is left over', () => {
  const files = readdirSync(join(process.cwd(), 'src', 'content', 'topic-guides')).map(name => name.replace(/\.md$/, '')).sort();
  assert.deepEqual(files, allTopics.map(topicSlug).sort());
});

test('every guide is complete, well spaced into sections, and only links to real topics', () => {
  for (const topic of allTopics) {
    const guide = topicGuide(topic);
    const where = topic.title;
    assert.ok(guide.summary.length > 20, `${where}: summary`);
    assert.ok(guide.outline.length >= 3, `${where}: at least three sections`);

    const words = guide.blocks.flatMap(textsOf).join(' ').split(/\s+/).length;
    assert.ok(words >= 200, `${where}: has only ${words} words`);
    assert.ok(guide.blocks.some(block => block.kind === 'code' || block.kind === 'table'), `${where}: shows a worked example`);

    const ids = guide.blocks.flatMap(block => (block.kind === 'heading' ? [block.id] : []));
    assert.equal(new Set(ids).size, ids.length, `${where}: heading ids are unique`);

    for (const text of [guide.summary, ...guide.blocks.flatMap(textsOf)]) {
      for (const title of topicLinks(parseInline(text))) assert.ok(topicByTitle(title), `${where}: links to "${title}", which doesn't exist`);
    }
  }
});

test('the catalog has the agreed shape', () => {
  assert.equal(allTopics.length, 111);
  assert.equal(catalog.length, 10);
  for (const [title, id] of [['KMP', 'searching'], ['Rabin-Karp', 'searching'], ['Naive Pattern Matching', 'searching'], ['String Hashing', 'hashing'], ['P vs NP', 'foundations'], ['NP-Complete Problems', 'foundations'], ['GCD', 'foundations']]) {
    assert.ok(catalog.find(group => group.id === id)!.topics.some(topic => topic.title === title), `${title} is in ${id}`);
  }
});
