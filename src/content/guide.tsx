import Link from 'next/link';
import type { ReactNode } from 'react';
import { LiveDemo } from '@/components/visual/live-demo';
import type { NodeTone } from '@/components/visual/tree-canvas';

export type GuideDoc = {
  slug: string;
  title: string;
  lead: string;
  section: string;
  module?: string;
  related?: string[];
  tryIt?: { label: string; href: string };
  body?: ReactNode;
  parts?: GuidePart[];
};

export type GuidePart = Pick<GuideDoc, 'slug' | 'title' | 'lead' | 'related' | 'tryIt' | 'body'>;

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="table-wrap">
    <table>
      <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const Steps = ({ items }: { items: ReactNode[] }) => (
  <ol className="steps">{items.map((item, i) => <li key={i}>{item}</li>)}</ol>
);

const Terms = ({ items }: { items: [string, ReactNode][] }) => (
  <dl className="terms">
    {items.map(([term, meaning]) => (
      <div key={term} style={{ display: 'contents' }}>
        <dt>{term}</dt>
        <dd>{meaning}</dd>
      </div>
    ))}
  </dl>
);

/** A small copy of a canvas node, so the guide can show what a color or shape looks like. */
const Chip = ({ tone, square = false, children }: { tone: NodeTone; square?: boolean; children: ReactNode }) => (
  <span className={`chip tone-${tone} ${square ? 'is-square' : ''}`}>{children}</span>
);

const SECTION_START = 'Getting Started';
const SECTION_MODULES = 'Modules';
const SECTION_FEATURES = 'Features';
const SECTION_REFERENCE = 'Reference';
const MODULE_EXPRESSIONS = 'Expression Evaluator';
const MODULE_BST = 'Binary Search Tree';
const MODULE_AVL = 'AVL Tree';

/** Tool page for each module, linked from the right column. */
export const MODULE_LINKS: Record<string, string> = {
  [MODULE_EXPRESSIONS]: '/expressions',
  [MODULE_BST]: '/trees/bst',
  [MODULE_AVL]: '/trees/avl',
};

const expressionParts: GuidePart[] = [
  {
    slug: 'writing-an-expression',
    title: 'Writing an Expression',
    lead: 'Type a calculation and press Enter. You do not need to say which notation it is in.',
    related: ['notations', 'operators', 'errors', 'keypad'],
    tryIt: { label: 'Try (8 + 4) * 3', href: '/expressions?e=(8%20%2B%204)%20*%203' },
    body: (
      <>
        <h3>How to Use It</h3>
        <Steps
          items={[
            <>Type in the input bar, or select <strong>Keypad</strong> to use buttons.</>,
            <>Leave the notation on <strong>Auto</strong>. It works out whether you typed infix, prefix, or postfix.</>,
            <>Press <kbd>Enter</kbd> or select <strong>Run</strong>. The answer appears straight away and the steps start playing.</>,
          ]}
        />
        <p>Pressing <kbd>Esc</kbd> clears the input. A small dot on <strong>Run</strong> means you have changed the input since the last run, so the results on screen are out of date.</p>

        <h3>What You Can Type</h3>
        <Table
          head={['You Type', 'It Means', 'Answer']}
          rows={[
            [<code key="1">2 + 3 * 4</code>, 'Multiplication goes before addition', '14'],
            [<code key="2">(2 + 3) * 4</code>, 'Parentheses go first', '20'],
            [<code key="3">2(3 + 4)</code>, 'A number beside parentheses multiplies', '14'],
            [<code key="4">2 ^ 3</code>, '2 to the power of 3', '8'],
            [<code key="5">-5 + 2.5</code>, 'Negative numbers and decimals work', '-2.5'],
          ]}
        />

        <h3>Good to Know</h3>
        <p>Some input is valid in two notations. Auto tries infix first, so <code>- 3 -2</code> is read as infix and gives −5. To read it as prefix instead, which gives 5, select <strong>Prefix</strong> before you run it.</p>
      </>
    ),
  },
  {
    slug: 'notations',
    title: 'Infix, Prefix, Postfix',
    lead: 'Three ways to write the same calculation. The only difference is where the operator goes.',
    related: ['writing-an-expression', 'evaluation-steps', 'expression-tree'],
    tryIt: { label: 'Try Postfix Input', href: '/expressions?e=2%203%20%2B%204%20*' },
    body: (
      <>
        <h3>What They Are</h3>
        <Table
          head={['Notation', 'Where the Operator Goes', 'Add 2 and 3', '(2 + 3) * 4']}
          rows={[
            ['Infix', 'Between the two values', <code key="a">2 + 3</code>, <code key="b">(2 + 3) * 4</code>],
            ['Prefix', 'Before the two values', <code key="c">+ 2 3</code>, <code key="d">* + 2 3 4</code>],
            ['Postfix', 'After the two values', <code key="e">2 3 +</code>, <code key="f">2 3 + 4 *</code>],
          ]}
        />
        <p>Infix is how people write math, but it needs parentheses and precedence rules. Prefix and postfix need neither, because the position of each operator already fixes the order. That is why computers find them easier.</p>

        <h3>Worked Example: Reading Postfix</h3>
        <p>Read <code>2 3 + 4 *</code> from left to right. Each operator uses the two values just before it.</p>
        <Steps
          items={[
            <><code>2 3 +</code> adds 2 and 3, which leaves <code>5 4 *</code>.</>,
            <><code>5 4 *</code> multiplies 5 and 4, which leaves <code>20</code>.</>,
          ]}
        />

        <h3>Good to Know</h3>
        <ul>
          <li>The summary strip always shows all three forms. The word <em>input</em> marks the one you typed, and the copy button copies a form.</li>
          <li>Put a space between every number and operator in prefix and postfix. <code>12 3 /</code> is correct, and <code>123/</code> is not.</li>
          <li>In prefix and postfix, write unary minus as <code>~</code>. For example, <code>5 ~</code> means −5.</li>
          <li>Infix results show full parentheses, so the order is never in doubt.</li>
        </ul>
      </>
    ),
  },
  {
    slug: 'evaluation-steps',
    title: 'Evaluation Steps',
    lead: 'A computer works out an expression by reading its postfix form one piece at a time, using a stack.',
    related: ['expression-tree', 'notations', 'playback'],
    tryIt: { label: 'Run This Example', href: '/expressions?e=(8%20%2B%204)%20*%203' },
    body: (
      <>
        <h3>What a Stack Is</h3>
        <p>A stack works like a pile of plates: you can only add to the top or take from the top. The last value added is the first one taken off.</p>

        <h3>The Rule</h3>
        <Steps
          items={[
            <>If the next piece is a <strong>number</strong>, push it onto the stack.</>,
            <>If it is an <strong>operator</strong>, pop two values, work out the answer, and push that answer back.</>,
            <>When nothing is left to read, the one value on the stack is the result.</>,
          ]}
        />

        <h3>Worked Example: (8 + 4) * 3</h3>
        <p>In postfix this is <code>8 4 + 3 *</code>.</p>
        <Table
          head={['Read', 'What Happens', 'Stack Afterward']}
          rows={[
            [<code key="1">8</code>, 'Push 8', <code key="s1">8</code>],
            [<code key="2">4</code>, 'Push 4', <code key="s2">8, 4</code>],
            [<code key="3">+</code>, 'Pop 4 and 8, work out 8 + 4 = 12, push 12', <code key="s3">12</code>],
            [<code key="4">3</code>, 'Push 3', <code key="s4">12, 3</code>],
            [<code key="5">*</code>, 'Pop 3 and 12, work out 12 × 3 = 36, push 36', <code key="s5">36</code>],
          ]}
        />
        <p>One value is left, so the answer is <strong>36</strong>.</p>

        <h3>What You See on Screen</h3>
        <p>Each operator plays as three separate steps, marked <strong>Pop</strong>, <strong>Compute</strong>, and <strong>Push</strong> in the steps panel. Beside the tree:</p>
        <Terms
          items={[
            ['Postfix', 'The expression being read. The highlighted piece is the current one.'],
            ['Working', 'The calculation in progress, such as 8 + 4 = 12.'],
            ['Stack', 'The values waiting to be used, with the top one labeled.'],
          ]}
        />

        <h3>Good to Know</h3>
        <p>The first value popped is the <strong>right</strong> side of the calculation. Order does not matter for 8 + 4, but for <code>8 4 -</code> it means 8 − 4 and not 4 − 8.</p>
      </>
    ),
  },
  {
    slug: 'expression-tree',
    title: 'Expression Tree',
    lead: 'The same calculation drawn as a tree. Watch it collapse from the bottom up until only the answer is left.',
    related: ['evaluation-steps', 'notations', 'canvas'],
    tryIt: { label: 'Run This Example', href: '/expressions?e=(2%20%2B%203)%20*%204' },
    body: (
      <>
        <LiveDemo scenes={[{ kind: 'expression', label: 'Expression tree', input: '(2 + 3) * 4' }]} height={230} />

        <h3>What It Is</h3>
        <p>Each operator sits above the two values it works on. Numbers are at the bottom. The operator at the very top runs last, so its answer is the final result.</p>

        <h3>Worked Example: (2 + 3) * 4</h3>
        <Steps
          items={[
            <><Chip tone="value">2</Chip> and <Chip tone="value">3</Chip> are read and go on the stack.</>,
            <><Chip tone="accent" square>+</Chip> uses them. They turn amber: <Chip tone="active">2</Chip> <Chip tone="active">3</Chip>, and the sum 2 + 3 = 5 appears.</>,
            <>Both children slide into the parent, and the square becomes a round <Chip tone="done">5</Chip>.</>,
            <><Chip tone="value">4</Chip> is read. Then <Chip tone="accent" square>×</Chip> uses 5 and 4 the same way, leaving <Chip tone="done">20</Chip>.</>,
          ]}
        />

        <h3>What the Shapes and Colors Mean</h3>
        <Table
          head={['Looks Like', 'Meaning']}
          rows={[
            [<Chip key="1" tone="muted">7</Chip>, 'A number that has not been read yet'],
            [<Chip key="2" tone="value">7</Chip>, 'A number on the stack, waiting to be used'],
            [<Chip key="3" tone="op" square>+</Chip>, 'An operator that has not run yet. Square means it has no answer yet.'],
            [<Chip key="4" tone="accent" square>+</Chip>, 'The operator running now'],
            [<Chip key="5" tone="active">7</Chip>, 'A value being used right now'],
            [<Chip key="6" tone="done">7</Chip>, 'An answer that has been worked out'],
          ]}
        />

        <h3>Good to Know</h3>
        <p>The tree and the stack always show the same moment: each collapse is one operation on the stack. Use <strong>Both</strong>, <strong>Tree</strong>, and <strong>Stack</strong> at the top left of the canvas to choose what you see.</p>
      </>
    ),
  },
];

const bstParts: GuidePart[] = [
  {
    slug: 'inserting-a-value',
    title: 'Inserting a Value',
    lead: 'In a binary search tree, smaller values always go left and larger values always go right.',
    related: ['deleting-a-value', 'traversals', 'balance-and-height', 'limits'],
    tryIt: { label: 'Run This Example', href: '/trees/bst?seed=40,20,60&v=30' },
    body: (
      <>
        <LiveDemo scenes={[{ kind: 'tree', label: 'BST insert', mode: 'bst', seed: '40, 20, 60', values: '30' }]} height={210} />

        <h3>How to Use It</h3>
        <Steps
          items={[
            <>Select <strong>Insert</strong>.</>,
            <>Type one value, or a list such as <code>25, 35</code>.</>,
            <>Press <kbd>Enter</kbd>. Each value then finds its place, one comparison at a time.</>,
          ]}
        />

        <h3>Worked Example: Insert 30</h3>
        <p>The tree holds 40 at the top, with 20 on its left and 60 on its right.</p>
        <Steps
          items={[
            <>Start at the top. 30 is less than 40, so go <strong>left</strong> to 20.</>,
            <>30 is greater than 20, so go <strong>right</strong>.</>,
            <>Nothing is there, so 30 becomes a new node in that spot.</>,
          ]}
        />

        <h3>What the Colors Mean</h3>
        <Table
          head={['Looks Like', 'Meaning']}
          rows={[
            [<Chip key="1" tone="active">20</Chip>, 'The node being looked at now'],
            [<Chip key="2" tone="path">40</Chip>, 'A node already passed on the way here'],
            [<Chip key="3" tone="new">30</Chip>, 'A node that has just changed'],
            [<Chip key="4" tone="danger">30</Chip>, 'A node being removed, or one out of balance'],
          ]}
        />

        <h3>Good to Know</h3>
        <ul>
          <li>A value already in the tree is ignored, and the steps say so.</li>
          <li>Insertion order changes the shape. Sorted input such as <code>10, 20, 30, 40</code> makes one long chain, and long chains are slow to search. <Link href="/guide/avl-tree#balance-and-height">AVL trees</Link> fix this.</li>
        </ul>
      </>
    ),
  },
  {
    slug: 'deleting-a-value',
    title: 'Deleting a Value',
    lead: 'First find the value. What happens next depends on how many children it has.',
    related: ['inserting-a-value', 'balance-and-height', 'examples'],
    tryIt: { label: 'Run This Example', href: '/trees/bst?seed=50,30,70,20,40,60,80&op=delete&v=30' },
    body: (
      <>
        <LiveDemo scenes={[{ kind: 'tree', label: 'Two-child delete', mode: 'bst', seed: '50, 30, 70, 20, 40', operation: 'delete', values: '30' }]} height={210} />

        <h3>How to Use It</h3>
        <p>Select <strong>Delete</strong>, type one value or a list, and press <kbd>Enter</kbd>.</p>

        <h3>The Three Cases</h3>
        <Table
          head={['The Node Has', 'What Happens', 'Why It Is Safe']}
          rows={[
            ['No children', 'It is removed.', 'Nothing depends on it.'],
            ['One child', 'The child moves up into its place.', 'The child is on the correct side of everything above.'],
            ['Two children', 'Its inorder successor takes its place.', 'The successor is larger than the left side and smaller than the rest of the right side.'],
          ]}
        />

        <h3>Worked Example: Delete 30, Which Has Two Children</h3>
        <p>30 has 20 on its left and 40 on its right.</p>
        <Steps
          items={[
            <>Find the inorder successor: go right once, then as far left as possible. That reaches 40.</>,
            <>Remove 40 from where it was.</>,
            <>Put 40 where 30 was. Every value is still in the right order.</>,
          ]}
        />

        <h3>Good to Know</h3>
        <ul>
          <li>If the value is not in the tree, nothing changes and the steps say so.</li>
          <li>In an AVL tree, removing a node can leave a node above it out of balance, so a delete can also cause <Link href="/guide/avl-tree#rotations">rotations</Link>.</li>
        </ul>
      </>
    ),
  },
  {
    slug: 'traversals',
    title: 'Traversals',
    lead: 'A traversal visits every node once. The three kinds differ only in when they visit the node itself.',
    related: ['inserting-a-value', 'balance-and-height', 'playback'],
    tryIt: { label: 'Open Binary Search Tree', href: '/trees/bst' },
    body: (
      <>
        <LiveDemo scenes={[{ kind: 'traversal', label: 'Inorder traversal', mode: 'bst', values: '40, 20, 60, 10, 30', order: 'in' }]} height={210} />

        <h3>How to Use It</h3>
        <p>Select <strong>Inorder</strong>, <strong>Preorder</strong>, or <strong>Postorder</strong> in the summary strip. The nodes light up in the order they are visited. The tree itself never changes.</p>

        <h3>Worked Example</h3>
        <p>This uses the tree in the demo above: 40 at the top, with 20 and 60 below it, and 10 and 30 below 20.</p>
        <Table
          head={['Traversal', 'At Every Node', 'Visit Order', 'Useful For']}
          rows={[
            ['Inorder', 'Left, node, right', <code key="1">10 20 30 40 60</code>, 'Getting the values in sorted order'],
            ['Preorder', 'Node, left, right', <code key="2">40 20 10 30 60</code>, 'Copying a tree'],
            ['Postorder', 'Left, right, node', <code key="3">10 30 20 60 40</code>, 'Handling children before parents'],
          ]}
        />

        <h3>Good to Know</h3>
        <p>An expression tree is evaluated in postorder, because an operator needs its two values before it can run.</p>
      </>
    ),
  },
];

const avlParts: GuidePart[] = [
  {
    slug: 'balance-and-height',
    title: 'Balance and Height',
    lead: 'Every node tracks how tall its two sides are. A difference of more than 1 means the tree must fix itself.',
    related: ['rotations', 'inserting-a-value', 'traversals'],
    body: (
      <>
        <h3>What Balance Means</h3>
        <p>The label under each node, such as <code>h3 · +2</code>, gives two numbers:</p>
        <Terms
          items={[
            ['Height (h3)', 'How many levels the node and everything below it take up.'],
            ['Balance (+2)', 'Left height minus right height. Positive means the left is taller, and negative means the right is taller.'],
          ]}
        />
        <p>Balance must stay at −1, 0, or +1. If it reaches +2 or −2, the node turns red and the tree fixes itself with a <Link href="/guide/avl-tree#rotations">rotation</Link>.</p>

        <h3>Why It Matters</h3>
        <p>A plain BST can turn into one long chain, and long chains are slow to search. Because an AVL tree stays short, searching stays fast: a tree of 1,000 values is only about 10 to 14 levels tall.</p>

        <h3>Good to Know</h3>
        <p>Inserting, deleting, and traversing work as they do in a <Link href="/guide/binary-search-tree#inserting-a-value">binary search tree</Link>. The difference is the balance check after each change.</p>
      </>
    ),
  },
  {
    slug: 'rotations',
    title: 'Rotations',
    lead: 'A rotation moves a child up and its parent down, which shortens the taller side.',
    related: ['balance-and-height', 'deleting-a-value', 'traversals'],
    tryIt: { label: 'Run This Example', href: '/trees/avl?v=30,20,10' },
    body: (
      <>
        <LiveDemo scenes={[{ kind: 'tree', label: 'Left-Left case', mode: 'avl', values: '30, 20, 10' }]} height={220} />

        <h3>Worked Example: Insert 30, 20, 10</h3>
        <Steps
          items={[
            <>30 and 20 go in as usual, with 20 on the left of 30.</>,
            <>10 goes on the left of 20. Now 30 has left height 2 and right height 0, so its balance is +2: <Chip tone="danger">30</Chip></>,
            <>A <strong>right rotation</strong> at 30 moves 20 up to the top. 10 stays on its left, and 30 moves down to its right.</>,
            <>Every balance is back to 0, and the values are still in sorted order from left to right.</>,
          ]}
        />

        <h3>Which Rotation Is Needed</h3>
        <p>Look at which side is too tall, then which way the extra node leans. A straight line needs one rotation, and a zig-zag needs two.</p>
        <Table
          head={['Case', 'Shape', 'Try', 'The Fix']}
          rows={[
            ['Left-Left', 'Straight line, leaning left', <code key="1">30, 20, 10</code>, 'Rotate right at 30'],
            ['Right-Right', 'Straight line, leaning right', <code key="2">10, 20, 30</code>, 'Rotate left at 10'],
            ['Left-Right', 'Zig-zag, left then right', <code key="3">30, 10, 20</code>, 'Rotate left at 10, then right at 30'],
            ['Right-Left', 'Zig-zag, right then left', <code key="4">10, 30, 20</code>, 'Rotate right at 30, then left at 10'],
          ]}
        />

        <h3>Good to Know</h3>
        <p>Rotations change the shape but never the left-to-right order, so the tree is still a valid BST.</p>
      </>
    ),
  },
];

/** A module is one page, and its parts are sections of that page. */
function modulePage(slug: string, title: string, lead: string, parts: GuidePart[]): GuideDoc {
  const own = new Set(parts.map(part => part.slug));
  const related = [...new Set(parts.flatMap(part => part.related ?? []))].filter(item => !own.has(item));
  return { slug, title, lead, section: SECTION_MODULES, module: title, related, parts };
}

export const guideDocs: GuideDoc[] = [
  {
    slug: 'overview',
    title: 'Start Here',
    lead: 'DSA Visuals runs an algorithm on your own input and shows every step, so you can see how it works and not only the answer.',
    section: SECTION_START,
    related: ['workspace', 'examples', 'glossary'],
    body: (
      <>
        <h2>Your First Run</h2>
        <Steps
          items={[
            <>Open <Link href="/topics">Topics</Link> and pick a tool. The <Link href="/expressions">Expression Evaluator</Link> works out arithmetic. The <Link href="/trees/bst">Binary Search Tree</Link> and <Link href="/trees/avl">AVL Tree</Link> organize numbers in a tree.</>,
            <>Give it some input. Type your own, or select <strong>Examples</strong> and choose one.</>,
            <>Watch it run. The steps play by themselves. Select <strong>Pause</strong> at any time, then move one step at a time with the arrow buttons.</>,
            <>Read the panel on the right. It says what just happened and why.</>,
          ]}
        />

        <h2>Find What You Need</h2>
        <Table
          head={['I Want To…', 'Read This']}
          rows={[
            ['Work out an expression', <Link key="a" href="/guide/expression-evaluator#writing-an-expression">Writing an Expression</Link>],
            ['Understand how the answer was reached', <Link key="b" href="/guide/expression-evaluator#evaluation-steps">Evaluation Steps</Link>],
            ['Know what the shapes and colors mean', <Link key="c" href="/guide/expression-evaluator#expression-tree">Expression Tree</Link>],
            ['Add values to a tree', <Link key="d" href="/guide/binary-search-tree#inserting-a-value">Inserting a Value</Link>],
            ['Remove values from a tree', <Link key="e" href="/guide/binary-search-tree#deleting-a-value">Deleting a Value</Link>],
            ['Understand rotations', <Link key="f" href="/guide/avl-tree#rotations">Rotations</Link>],
            ['Fix an error message', <Link key="g" href="/guide/errors">Error Messages</Link>],
            ['Look up a word', <Link key="h" href="/guide/glossary">Glossary</Link>],
          ]}
        />

        <h2>How This Guide Is Organized</h2>
        <Terms
          items={[
            ['Modules', 'One page for each tool. The right column lists its parts, so you can jump straight to one.'],
            ['Features', 'Controls that every tool shares, such as playback and examples.'],
            ['Reference', 'The exact rules, every error message, and the meaning of each word.'],
          ]}
        />

        <h2>Two Kinds of Tree</h2>
        <p>Every module draws a tree, but the trees do different jobs. An <strong>expression tree</strong> represents one calculation. A <strong>BST</strong> or <strong>AVL tree</strong> stores numbers so they are quick to find.</p>
        <h2>What's Next</h2>
        <p>More tools are on the way, including sorting, graphs, and dynamic programming. The <Link href="/topics">Topics page</Link> lists everything. Anything not ready yet is marked <em>Soon</em>, and selecting it shows what it will cover.</p>
      </>
    ),
  },
  {
    slug: 'workspace',
    title: 'Parts of the Screen',
    lead: 'Every tool has the same five parts, so once you know one tool you know them all.',
    section: SECTION_START,
    related: ['playback', 'canvas', 'shortcuts'],
    body: (
      <>
        <div className="layout-map" role="img" aria-label="Layout: input bar and summary strip across the top, canvas on the left, steps panel on the right, playback across the bottom.">
          <div className="is-wide"><b>1</b>Input bar</div>
          <div className="is-wide"><b>2</b>Summary strip</div>
          <div><b>3</b>Canvas</div>
          <div><b>4</b>Steps panel</div>
          <div className="is-wide"><b>5</b>Playback</div>
        </div>
        <Table
          head={['Part', 'What It Is For']}
          rows={[
            ['1. Input bar', 'Type your input and run it. The Examples button is here too.'],
            ['2. Summary strip', 'The main results at a glance: the answer and conversions, or the size and shape of the tree.'],
            ['3. Canvas', 'The picture of the current step. It changes as the steps play.'],
            ['4. Steps panel', 'The top says what is happening now. Below it is every step. Select one to jump to it.'],
            ['5. Playback', 'Play, pause, move one step, or change the speed.'],
          ]}
        />
      </>
    ),
  },

  modulePage('expression-evaluator', MODULE_EXPRESSIONS, 'Type a calculation, see it in all three notations, and watch it worked out one operation at a time.', expressionParts),
  modulePage('binary-search-tree', MODULE_BST, 'Store numbers in order, then add, remove, and visit them, one comparison at a time.', bstParts),
  modulePage('avl-tree', MODULE_AVL, 'A binary search tree that keeps itself short, by rotating whenever one side gets too tall.', avlParts),

  {
    slug: 'playback',
    title: 'Playback',
    lead: 'Every run is recorded, so you can move through it at your own pace, forward or backward.',
    section: SECTION_FEATURES,
    related: ['shortcuts', 'workspace', 'evaluation-steps'],
    body: (
      <Table
        head={['Control', 'What It Does']}
        rows={[
          ['Play / Pause', 'Runs the steps by themselves. Playing from the end starts over.'],
          ['Back and forward arrows', 'Move one step and pause.'],
          ['Arrows with a bar', 'Jump to the first or last step.'],
          ['Slider', 'Drag to any point in the run.'],
          ['Speed', 'From 0.5× (slower) to 4× (faster).'],
          ['Steps panel', 'Select any row to jump to that step.'],
        ]}
      />
    ),
  },
  {
    slug: 'examples',
    title: 'Examples',
    lead: 'Ready-made inputs sorted by difficulty, for when you want to see something work right away.',
    section: SECTION_FEATURES,
    related: ['writing-an-expression', 'balance-and-height', 'playback'],
    body: (
      <>
        <Steps
          items={[
            <>Select <strong>Examples</strong> in the input bar.</>,
            <>Choose a level at the top of the box.</>,
            <>Select an example. The box closes and it starts playing.</>,
          ]}
        />
        <Table
          head={['Level', 'In Expressions', 'In Trees']}
          rows={[
            ['Easy', 'One idea, such as precedence', 'First nodes and single rotations'],
            ['Medium', 'Mixed operators and powers', 'Each kind of delete and double rotations'],
            ['Hard', 'Deep nesting and negatives', 'Long chains and deeper rotations'],
            ['Complex', 'Large trees with many steps', 'Batches and chain reactions'],
            ['Notations', 'Prefix and postfix input', 'Not used'],
            ['Error checks', 'How bad input is explained', 'Not used'],
          ]}
        />
        <p className="callout">A tree example replaces the current tree, so it always starts from a known shape. Your own tree is not kept.</p>
      </>
    ),
  },
  {
    slug: 'keypad',
    title: 'Keypad',
    lead: 'Build an expression with buttons instead of typing.',
    section: SECTION_FEATURES,
    related: ['writing-an-expression', 'operators'],
    body: (
      <Steps
        items={[
          <>Select <strong>Keypad</strong> in the expression input bar.</>,
          <>Select keys to add them at the cursor. Any selected text is replaced.</>,
          <>The backspace key removes one character, and <strong>Clear</strong> empties the input.</>,
          <>Press <kbd>Enter</kbd> or select <strong>Run</strong>.</>,
        ]}
      />
    ),
  },
  {
    slug: 'canvas',
    title: 'Moving Around the Canvas',
    lead: 'Look closely at a large tree. None of this changes the tree.',
    section: SECTION_FEATURES,
    related: ['workspace', 'shortcuts'],
    body: (
      <Table
        head={['To', 'Do This']}
        rows={[
          ['Move the view', 'Drag anywhere on the canvas'],
          ['Zoom in or out', 'Select + or − at the top right of the canvas'],
          ['Go back to the full view', 'Select the middle button at the top right'],
        ]}
      />
    ),
  },
  {
    slug: 'search',
    title: 'Search',
    lead: 'Find any topic, tool, or part of this guide from anywhere in the app.',
    section: SECTION_FEATURES,
    related: ['shortcuts', 'overview'],
    body: (
      <Steps
        items={[
          <>Select the search icon in the navbar, or press <kbd>Ctrl</kbd> + <kbd>K</kbd> (<kbd>⌘</kbd> + <kbd>K</kbd> on a Mac).</>,
          <>Type a word, such as <code>rotation</code> or <code>division by zero</code>. Results appear as you type, and a topic that isn&apos;t ready yet is marked <em>Soon</em>.</>,
          <>Select a result, or move with <kbd>↑</kbd> and <kbd>↓</kbd> and press <kbd>Enter</kbd>. It opens at that exact section.</>,
        ]}
      />
    ),
  },
  {
    slug: 'shortcuts',
    title: 'Keyboard Shortcuts',
    lead: 'Keep your hands on the keyboard.',
    section: SECTION_FEATURES,
    related: ['playback', 'workspace'],
    body: (
      <>
        <Table
          head={['Key', 'What It Does']}
          rows={[
            [<kbd key="1">Enter</kbd>, 'Run your input, while typing in the input bar'],
            [<kbd key="2">Esc</kbd>, 'Clear the input, or close the Examples box'],
            [<kbd key="3">←</kbd>, 'Previous step'],
            [<kbd key="4">→</kbd>, 'Next step'],
            [<kbd key="5">Space</kbd>, 'Play or pause'],
            [<kbd key="6">Home</kbd>, 'First step'],
            [<kbd key="7">End</kbd>, 'Last step'],
            [<kbd key="8">Ctrl + K</kbd>, 'Open search, from anywhere'],
          ]}
        />
        <p>The step keys do not work while the cursor is in the input bar. Click an empty part of the page first.</p>
      </>
    ),
  },
  {
    slug: 'saving',
    title: 'Saving and Themes',
    lead: 'Your work is saved in this browser automatically. No account is needed.',
    section: SECTION_FEATURES,
    related: ['limits', 'workspace'],
    body: (
      <ul>
        <li>Your last expression, your BST, and your AVL tree come back when you return.</li>
        <li>BST and AVL each keep their own tree. <strong>Reset</strong> empties only the current one.</li>
        <li>Saved work stays in this browser. It does not move to other devices, and clearing your browser data removes it.</li>
        <li>The theme follows your system until you choose one with the sun or moon button in the navbar.</li>
      </ul>
    ),
  },

  {
    slug: 'operators',
    title: 'Operators and Precedence',
    lead: 'When an expression has several operators, this is the order they run in, from first to last.',
    section: SECTION_REFERENCE,
    related: ['writing-an-expression', 'notations', 'errors'],
    body: (
      <>
        <Table
          head={['Order', 'Operators', 'Same Level Runs', 'Example']}
          rows={[
            ['1', <code key="1">( )</code>, 'Not applicable', <code key="a">(1 + 2) * 3 = 9</code>],
            ['2', <code key="2">^</code>, 'Right to left', <code key="b">2 ^ 3 ^ 2 = 512</code>],
            ['3', 'Unary minus', 'Right to left', <code key="c">-2 ^ 2 = -4</code>],
            ['4', <code key="4">* /</code>, 'Left to right', <code key="d">8 / 4 * 2 = 4</code>],
            ['5', <code key="5">+ -</code>, 'Left to right', <code key="e">5 - 2 - 1 = 2</code>],
          ]}
        />
        <h2>Also Accepted</h2>
        <ul>
          <li>Implicit multiplication beside parentheses: <code>2(3 + 4)</code>, <code>(2)3</code>, <code>(2)(3)</code></li>
          <li>Decimals: <code>.5</code>, <code>5.</code>, <code>1.25</code></li>
          <li>The symbols <code>×</code>, <code>÷</code>, and <code>−</code></li>
        </ul>
        <h2>Not Supported</h2>
        <p>Variables such as <code>x</code>, functions such as <code>sin</code>, and scientific notation such as <code>1e5</code>.</p>
      </>
    ),
  },
  {
    slug: 'errors',
    title: 'Error Messages',
    lead: 'What each message means, with an example and how to fix it.',
    section: SECTION_REFERENCE,
    related: ['operators', 'writing-an-expression', 'limits'],
    tryIt: { label: 'See an Error', href: '/expressions?e=1%20%2F%20(2%20-%202)' },
    body: (
      <Table
        head={['The Message Says', 'Example', 'How to Fix It']}
        rows={[
          ['Unexpected character', <code key="1">2 x 3</code>, 'Use only numbers and + - * / ^ ( )'],
          ['Missing operator', <code key="2">1 2</code>, 'Add an operator: 1 + 2'],
          ['Closing parenthesis', <code key="3">(2 + 3</code>, 'Give every ( a matching )'],
          ['Expected a number', <code key="10">1 +</code>, 'Something is missing after the operator. Add a value or remove the operator.'],
          ['Needs operands', <code key="4">1 2 + +</code>, 'In prefix or postfix, each operator needs enough values. Check the count and the spaces.'],
          ['Too many operands', <code key="5">1 2 3 +</code>, 'Add an operator or remove a value'],
          ['Division by zero', <code key="6">1 / (2 - 2)</code>, 'Change the part after the /'],
          ['No real result', <code key="7">(-8) ^ .5</code>, 'A negative base needs a whole-number power'],
          ['Too large', <code key="8">10 ^ 1000</code>, 'Use smaller numbers'],
          ['Whole numbers', <code key="9">5, abc</code>, 'Tree values must be whole numbers, separated by commas or spaces'],
        ]}
      />
    ),
  },
  {
    slug: 'limits',
    title: 'Limits',
    lead: 'The largest inputs the tools accept.',
    section: SECTION_REFERENCE,
    related: ['errors', 'operators', 'saving'],
    body: (
      <>
        <Table
          head={['What', 'Limit']}
          rows={[
            ['Expression length', '500 characters'],
            ['Tree values', 'Whole numbers from −999999 to 999999'],
            ['Values in one operation', '40'],
            ['Values in one tree', '63'],
          ]}
        />
        <ul>
          <li>A list is checked before anything changes, so one bad value leaves the tree as it was.</li>
          <li>Answers are shown with up to 12 significant digits, using standard floating-point math.</li>
        </ul>
      </>
    ),
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    lead: 'The meaning of each word used in this guide and in the tools.',
    section: SECTION_REFERENCE,
    related: ['overview', 'evaluation-steps', 'balance-and-height'],
    body: (
      <>
        <h2>Expressions</h2>
        <Terms
          items={[
            ['Operand', 'A value an operator works on. In 2 + 3, the operands are 2 and 3.'],
            ['Operator', 'A symbol that does the work, such as + or *.'],
            ['Unary Minus', 'A minus sign that applies to one value, as in -5.'],
            ['Precedence', 'Which operator runs first when there are several.'],
            ['Notation', 'The way an expression is written: infix, prefix, or postfix.'],
            ['Stack', 'A pile of values where you can only add or remove at the top.'],
            ['Push / Pop', 'Add a value to the top of the stack / take the top value off.'],
          ]}
        />
        <h2>Trees</h2>
        <Terms
          items={[
            ['Node', 'One item in a tree. Each circle on the canvas is a node.'],
            ['Root', 'The node at the very top.'],
            ['Child / Parent', 'A node directly below another / the node directly above it.'],
            ['Leaf', 'A node with no children.'],
            ['Subtree', 'A node and everything below it.'],
            ['Height', 'The number of levels from a node down to its lowest leaf. An empty tree has height 0, and a single node has height 1.'],
            ['BST', 'Binary search tree: smaller values go left and larger values go right, at every node.'],
            ['AVL Tree', 'A BST that keeps itself short by rotating.'],
            ['Balance Factor', 'Left height minus right height. An AVL tree keeps it between −1 and +1.'],
            ['Rotation', 'A small rearrangement that moves a child up and its parent down, without changing the sorted order.'],
            ['Inorder Successor', 'The next larger value: the smallest value in a node’s right subtree.'],
            ['Traversal', 'Visiting every node once, in a set order.'],
          ]}
        />
      </>
    ),
  },
];

export const docBySlug = (slug: string) => guideDocs.find(doc => doc.slug === slug);

/** Where a linked topic lives: a page of its own, or a part of a module's page. */
export function guideLink(slug: string): { title: string; href: string } | undefined {
  for (const doc of guideDocs) {
    if (doc.slug === slug) return { title: doc.title, href: `/guide/${doc.slug}` };
    const part = doc.parts?.find(item => item.slug === slug);
    if (part) return { title: part.title, href: `/guide/${doc.slug}#${part.slug}` };
  }
}

/** The sidebar structure, derived from the documents so it can't drift out of sync. */
export function guideOutline() {
  const sections = [...new Set(guideDocs.map(doc => doc.section))];
  return sections.map(section => {
    const docs = guideDocs.filter(doc => doc.section === section);
    const modules = [...new Set(docs.flatMap(doc => (doc.module ? [doc.module] : [])))];
    return {
      section,
      docs: docs.filter(doc => !doc.module),
      modules: modules.map(title => ({ title, href: MODULE_LINKS[title], docs: docs.filter(doc => doc.module === title) })),
    };
  });
}
