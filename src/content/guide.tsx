import Link from 'next/link';
import type { ReactNode } from 'react';
import type { NodeTone } from '@/components/visual/tree-canvas';
import { toHeadingId } from '@/lib/search';

/** Help pages: how to use the site. What each topic means is explained in its own guide, in src/content/topic-guides. */
export type GuideDoc = {
  slug: string;
  title: string;
  lead: string;
  section: string;
  tryIt?: { label: string; href: string };
  body: ReactNode;
};

/** A section heading. Its id is what search results and links point at. */
export const GuideHeading = ({ children }: { children: string }) => <h2 id={toHeadingId(children)}>{children}</h2>;

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
const SECTION_FEATURES = 'Features';
const SECTION_REFERENCE = 'Reference';

export const guideDocs: GuideDoc[] = [
  {
    slug: 'overview',
    title: 'Start Here',
    lead: 'DSA Visuals explains data structures and algorithms, then lets you run them on your own input and see every step.',
    section: SECTION_START,
    body: (
      <>
        <GuideHeading>Your First Visit</GuideHeading>
        <Steps
          items={[
            <>Open <Link href="/topics">Topics</Link>. Every topic is listed under its category.</>,
            <>Select <strong>Read</strong> in the Guide column for a full explanation of the topic, with worked examples and code.</>,
            <>Select <strong>Open</strong> in the Simulator column to run the topic on your own input.</>,
            <>In a simulator, type your input or select <strong>Examples</strong>, then watch it run. Select <strong>Pause</strong> at any time, and move one step at a time with the arrow buttons.</>,
          ]}
        />

        <GuideHeading>Find What You Need</GuideHeading>
        <Table
          head={['I Want To…', 'Read This']}
          rows={[
            ['Learn a topic', <Link key="a" href="/topics">Topics</Link>],
            ['Use a simulator', <Link key="b" href="/guide/simulators">Simulators</Link>],
            ['Know what the shapes and colors mean', <Link key="c" href="/guide/canvas#what-the-shapes-and-colors-mean">Reading the Canvas</Link>],
            ['Control the steps', <Link key="d" href="/guide/playback">Playback</Link>],
            ['Fix an error message', <Link key="e" href="/guide/errors">Error Messages</Link>],
            ['Look up a word', <Link key="f" href="/guide/glossary">Glossary</Link>],
          ]}
        />

        <GuideHeading>How This Guide Is Organized</GuideHeading>
        <Terms
          items={[
            ['Getting Started', 'What the site offers, and the parts of a simulator.'],
            ['Features', 'Controls that every tool shares, such as playback and examples.'],
            ['Reference', 'The exact rules, every error message, and the meaning of each word.'],
          ]}
        />
      </>
    ),
  },
  {
    slug: 'workspace',
    title: 'Parts of the Screen',
    lead: 'Every simulator is laid out the same way, while what it shows depends on its topic.',
    section: SECTION_START,
    body: (
      <>
        <div className="layout-map" role="img" aria-label="Layout: input bar and summary strip across the top, steps panel on the left, views in the center and on the right, playback across the bottom.">
          <div className="is-wide"><b>1</b>Input bar</div>
          <div className="is-wide"><b>2</b>Summary strip</div>
          <div><b>3</b>Steps panel</div>
          <div><b>4</b>Views</div>
          <div className="is-wide"><b>5</b>Playback</div>
        </div>
        <Table
          head={['Part', 'What It Is For']}
          rows={[
            ['1. Input bar', 'Type your input and run it. The Examples button is here too.'],
            ['2. Summary strip', 'The main results at a glance, such as the answer, the number of comparisons, or the size of a tree. Some topics have nothing to summarize, and then it is hidden.'],
            ['3. Steps panel', 'The top says what is happening now. Below it is every step. Select one to jump to it.'],
            ['4. Views', 'The picture of the current step, which changes as the steps play. It is whatever suits the topic, such as boxes, bars, a table, a graph, or a tree. Anything extra, such as a stack or a list of results, sits on the right.'],
            ['5. Playback', 'Play, pause, move one step, or change the speed.'],
          ]}
        />
      </>
    ),
  },
  {
    slug: 'simulators',
    title: 'Simulators',
    lead: 'What to type into each tool, and the controls that are unique to it. To learn the topic itself, read its guide.',
    section: SECTION_START,
    body: (
      <>
        <GuideHeading>Every Simulator</GuideHeading>
        <p>Each topic asks only for what it needs. Some have a list of values, some have a graph, and some have options that change the method. Select <strong>Examples</strong> at any time to fill everything in.</p>
        <Table
          head={['You See', 'What to Type', 'Example']}
          rows={[
            ['Values', 'Numbers separated by commas or spaces', <code key="1">5, 1, 4, 2, 8</code>],
            ['Operations', 'One action after another, or use the buttons to add them', <code key="2">push 3, push 4, pop</code>],
            ['Edges', 'Two node names with a dash, and a weight after a colon if it has one', <code key="3">A-B:4, B-C:2</code>],
            ['Items, jobs, or activities', 'A name, then its numbers in parentheses', <code key="4">A(1,4), B(3,5)</code>],
            ['A grid', 'Rows separated by a slash', <code key="5">1 3 1 / 1 5 1</code>],
            ['A tree, level by level', 'Values from the top down, with null for a missing child', <code key="6">1, 2, 3, null, 5</code>],
            ['A game tree', 'Nested lists, where each list is one position', <code key="7">[[3,5],[2,9]]</code>],
          ]}
        />
        <ul>
          <li>Inputs that don&apos;t apply to the option you chose are hidden.</li>
          <li>To add an operation with the buttons, type its value in the small box first. Some take two values, such as <code>insert 1 99</code>.</li>
          <li>If an input can&apos;t be used, the message says why, and nothing else changes.</li>
          <li>Your input for each topic is saved in this browser.</li>
        </ul>

        <GuideHeading>Expression Evaluator</GuideHeading>
        <Steps
          items={[
            <>Type in the input bar, or select <strong>Keypad</strong> to use buttons.</>,
            <>Leave the notation on <strong>Auto</strong>. It works out whether you typed infix, prefix, or postfix.</>,
            <>Press <kbd>Enter</kbd> or select <strong>Run</strong>. The answer appears straight away and the steps start playing.</>,
          ]}
        />
        <Table
          head={['You Type', 'It Means', 'Answer']}
          rows={[
            [<code key="1">2 + 3 * 4</code>, 'Multiplication goes before addition', '14'],
            [<code key="2">(2 + 3) * 4</code>, 'Parentheses go first', '20'],
            [<code key="3">2(3 + 4)</code>, 'A number beside parentheses multiplies', '14'],
            [<code key="4">2 3 + 4 *</code>, 'The same calculation in postfix', '20'],
          ]}
        />
        <ul>
          <li>A small dot on <strong>Run</strong> means you have changed the input since the last run, so the results on screen are out of date.</li>
          <li>Some input is valid in two notations. Auto tries infix first, so <code>- 3 -2</code> gives −5. To read it as prefix, which gives 5, select <strong>Prefix</strong> before you run it.</li>
          <li>The summary strip shows all three notations. The word <em>input</em> marks the one you typed, and the copy button copies a form.</li>
          <li>In prefix and postfix, put a space between every piece, and write unary minus as <code>~</code>.</li>
          <li>Use <strong>Both</strong>, <strong>Tree</strong>, and <strong>Stack</strong> at the top left of the canvas to choose what you see.</li>
        </ul>

        <GuideHeading>Notation Conversion</GuideHeading>
        <p>Choose one of the six conversions, then type your expression with numbers or letters, such as <code>A + B * C</code>. In prefix and postfix, put a space between every piece, and write unary minus as <code>~</code>. The last step shows the expression in all three notations and as a tree.</p>

        <GuideHeading>Expression Tree</GuideHeading>
        <p>Type an expression in any notation. <strong>Build</strong> shows the tree joining together from postfix, and <strong>Inorder</strong>, <strong>Preorder</strong>, and <strong>Postorder</strong> walk the finished tree. This tool only draws, so <code>1 / 0</code> gives a tree and no error.</p>

        <GuideHeading>Balanced Parentheses</GuideHeading>
        <p>Type any text with <code>( ) [ ] {'{'} {'}'}</code> in it. Other characters are skipped. Matched pairs are colored by how deep they are, and the result names the exact problem and position.</p>

        <GuideHeading>Binary Search Tree and AVL Tree</GuideHeading>
        <Steps
          items={[
            <>Select <strong>Insert</strong> or <strong>Delete</strong>.</>,
            <>Type one value, or a list such as <code>25, 35</code>.</>,
            <>Press <kbd>Enter</kbd>. Each value then plays out one comparison at a time.</>,
          ]}
        />
        <ul>
          <li>Select <strong>Inorder</strong>, <strong>Preorder</strong>, or <strong>Postorder</strong> in the summary strip to walk the tree. The tree itself doesn&apos;t change.</li>
          <li>A value already in the tree is ignored, and a value that isn&apos;t there can&apos;t be deleted. The steps say so in both cases.</li>
          <li>The two trees are saved separately. <strong>Reset</strong> empties only the current one.</li>
          <li>In an AVL tree, the label under a node, such as <code>h3 · +2</code>, shows its height and its balance.</li>
        </ul>
      </>
    ),
  },

  {
    slug: 'playback',
    title: 'Playback',
    lead: 'Every run is recorded, so you can move through it at your own pace, forward or backward.',
    section: SECTION_FEATURES,
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
    title: 'Reading the Canvas',
    lead: 'What the shapes and colors mean, and how to look closely at a large tree.',
    section: SECTION_FEATURES,
    body: (
      <>
        <GuideHeading>What the Shapes and Colors Mean</GuideHeading>
        <p>In an expression, a square is an operator with no answer yet, and a circle is a value.</p>
        <Table
          head={['Looks Like', 'In an Expression']}
          rows={[
            [<Chip key="1" tone="muted">7</Chip>, 'A number that has not been read yet'],
            [<Chip key="2" tone="value">7</Chip>, 'A number on the stack, waiting to be used'],
            [<Chip key="3" tone="op" square>+</Chip>, 'An operator that has not run yet'],
            [<Chip key="4" tone="accent" square>+</Chip>, 'The operator running now'],
            [<Chip key="5" tone="active">7</Chip>, 'A value being used right now'],
            [<Chip key="6" tone="done">7</Chip>, 'An answer that has been worked out'],
          ]}
        />
        <Table
          head={['Looks Like', 'In a Tree']}
          rows={[
            [<Chip key="1" tone="active">20</Chip>, 'The node being looked at now'],
            [<Chip key="2" tone="path">40</Chip>, 'A node already passed on the way here'],
            [<Chip key="3" tone="new">30</Chip>, 'A node that has just changed'],
            [<Chip key="4" tone="danger">30</Chip>, 'A node being removed, or one out of balance'],
          ]}
        />

        <GuideHeading>Moving Around</GuideHeading>
        <p>None of this changes the tree.</p>
        <Table
          head={['To', 'Do This']}
          rows={[
            ['Move the view', 'Drag anywhere on the canvas'],
            ['Zoom in or out', 'Select + or − at the top right of the canvas'],
            ['Go back to the full view', 'Select the middle button at the top right'],
          ]}
        />
      </>
    ),
  },
  {
    slug: 'search',
    title: 'Search',
    lead: 'Find any topic, section of a topic guide, simulator, or help page from anywhere in the app.',
    section: SECTION_FEATURES,
    body: (
      <Steps
        items={[
          <>Select the search icon in the navbar, or press <kbd>Ctrl</kbd> + <kbd>K</kbd> (<kbd>⌘</kbd> + <kbd>K</kbd> on a Mac).</>,
          <>Type a word, such as <code>rotation</code> or <code>division by zero</code>. Results appear as you type.</>,
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
    body: (
      <ul>
        <li>Your last input for each simulator comes back when you return, along with your BST and your AVL tree.</li>
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
        <GuideHeading>Also Accepted</GuideHeading>
        <ul>
          <li>Implicit multiplication beside parentheses: <code>2(3 + 4)</code>, <code>(2)3</code>, <code>(2)(3)</code></li>
          <li>Decimals: <code>.5</code>, <code>5.</code>, <code>1.25</code></li>
          <li>The symbols <code>×</code>, <code>÷</code>, and <code>−</code></li>
        </ul>
        <GuideHeading>Not Supported</GuideHeading>
        <p>Variables such as <code>x</code>, functions such as <code>sin</code>, and scientific notation such as <code>1e5</code>.</p>
      </>
    ),
  },
  {
    slug: 'errors',
    title: 'Error Messages',
    lead: 'What the messages from the Expression Evaluator and the tree tools mean. Other simulators explain their own messages as they appear.',
    section: SECTION_REFERENCE,
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
          ['Unmatched closing parenthesis', <code key="11">2 + 3)</code>, 'Remove the extra ) or add a ( before it'],
          ['Wrong type', <code key="15">([)]</code>, 'Close the most recently opened bracket first'],
          ['Never closed', <code key="16">(()</code>, 'Add the missing closing bracket'],
        ]}
      />
    ),
  },
  {
    slug: 'limits',
    title: 'Limits',
    lead: 'The largest inputs the tools accept.',
    section: SECTION_REFERENCE,
    body: (
      <>
        <Table
          head={['What', 'Limit']}
          rows={[
            ['Expression length', '500 characters'],
            ['Balanced Parentheses input', '200 characters'],
            ['Tree values', 'Whole numbers from −999999 to 999999'],
            ['Values in one operation', '40'],
            ['Values in one tree', '63'],
            ['Other simulators', 'Up to about 16 values, 16 operations, or 12 graph nodes, so every step stays readable. Each one names its own limit if you go past it.'],
            ['Steps shown', '1,500. A longer run still finishes, and its last step says how many were left out.'],
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
    lead: 'The meaning of each word used in the simulators.',
    section: SECTION_REFERENCE,
    body: (
      <>
        <GuideHeading>Expressions</GuideHeading>
        <Terms
          items={[
            ['Operand', 'A value an operator works on. In 2 + 3, the operands are 2 and 3.'],
            ['Operator', 'A symbol that does the work, such as + or *.'],
            ['Unary Minus', 'A minus sign that applies to one value, as in -5.'],
            ['Precedence', 'Which operator runs first when there are several.'],
            ['Notation', 'The way an expression is written: infix, prefix, or postfix.'],
            ['Stack', 'A pile of values where you can only add or remove at the top.'],
            ['Push / Pop', 'Add a value to the top of the stack / take the top value off.'],
            ['Token', 'One meaningful piece of text, such as a number or an operator.'],
            ['Associativity', 'Which way equal operators group. Subtraction groups from the left, and powers from the right.'],
          ]}
        />
        <GuideHeading>Trees</GuideHeading>
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

/** The sidebar structure, derived from the documents so it can't drift out of sync. */
export function guideOutline() {
  return [...new Set(guideDocs.map(doc => doc.section))].map(section => ({ section, docs: guideDocs.filter(doc => doc.section === section) }));
}
