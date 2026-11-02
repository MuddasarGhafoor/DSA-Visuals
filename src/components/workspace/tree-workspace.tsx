'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Library, Minus, Plus, RotateCcw } from 'lucide-react';
import { treeExamples, type TreeExample } from '@/content/examples';
import { balance, height, MAX_NODES, MAX_VALUE, operateTree, signed, traversalSteps, values, type TraversalOrder, type TreeMode, type TreeNode, type TreeOperation, type TreeStep, type TreeStepKind } from '@/lib/trees';
import { usePlayback, usePlaybackKeys } from '@/lib/use-playback';
import { useSavedState } from '@/lib/use-saved-state';
import { TREE_LEGEND, treeTrail, treeVisual } from '../visual/mappers';
import { PlaybackBar } from '../visual/playback-bar';
import { StepsRail, type RailItem } from '../visual/steps-rail';
import { TreeCanvas } from '../visual/tree-canvas';
import { ExamplesDialog } from './examples-dialog';

type Saved = { bst: TreeNode | null; avl: TreeNode | null };

function isSaved(x: unknown): x is Saved {
  if (!x || typeof x !== 'object' || !('bst' in x) || !('avl' in x)) return false;
  function check(n: unknown, low: number, high: number, avl: boolean, depth = 0): boolean {
    if (n === null) return true;
    if (depth > MAX_NODES || !n || typeof n !== 'object' || !('value' in n) || !('left' in n) || !('right' in n) || !('height' in n)) return false;
    const t = n as TreeNode;
    return Number.isSafeInteger(t.value) && Math.abs(t.value) <= MAX_VALUE && t.value > low && t.value < high
      && check(t.left, low, t.value, avl, depth + 1) && check(t.right, t.value, high, avl, depth + 1)
      && t.height === 1 + Math.max(height(t.left), height(t.right)) && (!avl || Math.abs(balance(t)) <= 1);
  }
  return check(x.bst, -Infinity, Infinity, false) && check(x.avl, -Infinity, Infinity, true)
    && values(x.bst as TreeNode | null).length <= MAX_NODES && values(x.avl as TreeNode | null).length <= MAX_NODES;
}

const buildTree = (input: string, mode: TreeMode) => operateTree(null, input, 'insert', mode).at(-1)!.root;
const STARTER = '40, 20, 60, 10, 30, 50, 70';
const INITIAL: Saved = { bst: buildTree(STARTER, 'bst'), avl: buildTree(STARTER, 'avl') };

const INTRO: Record<TreeMode, { title: string; detail: string }> = {
  bst: { title: 'Binary Search Tree', detail: 'Smaller values go left and larger values go right. Insert or delete values to see the path each one takes.' },
  avl: { title: 'AVL Tree', detail: 'A binary search tree that keeps itself short. Each node shows its height and balance. Beyond ±1, rotations fix the shape.' },
};

const KIND_TONES: Partial<Record<TreeStepKind, string>> = {
  place: 'tone-new',
  done: 'tone-new',
  replace: 'tone-new',
  remove: 'tone-new',
  found: 'tone-danger',
  imbalance: 'tone-danger',
  missing: 'tone-danger',
  duplicate: 'tone-danger',
  rotate: 'tone-accent',
  start: 'tone-muted',
};

const ORDERS: { order: TraversalOrder; label: string }[] = [
  { order: 'in', label: 'Inorder' },
  { order: 'pre', label: 'Preorder' },
  { order: 'post', label: 'Postorder' },
];

export function TreeWorkspace({ mode }: { mode: TreeMode }) {
  const [saved, setSaved, ready] = useSavedState<Saved>('dsa-trees-v1', INITIAL, isSaved);
  const [operation, setOperation] = useState<TreeOperation>('insert');
  const [input, setInput] = useState('25, 35');
  const [error, setError] = useState('');
  const [steps, setSteps] = useState<TreeStep[]>([]);
  const [traversal, setTraversal] = useState<TraversalOrder | null>(null);
  const [examples, setExamples] = useState(false);

  const playback = usePlayback(steps.length);
  usePlaybackKeys(playback);
  const step: TreeStep | undefined = steps[playback.index];
  const root = step ? step.root : saved[mode];

  function play(next: TreeStep[], final: TreeNode | null) {
    setSaved({ ...saved, [mode]: final });
    setSteps(next);
    setTraversal(null);
    setError('');
    playback.restart();
  }

  function apply() {
    try {
      const next = operateTree(saved[mode], input, operation, mode);
      play(next, next.at(-1)!.root);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function loadExample(example: { seed?: string; operation: TreeOperation; values: string }) {
    try {
      const base = example.seed ? buildTree(example.seed, mode) : null;
      const next = operateTree(base, example.values, example.operation, mode);
      setOperation(example.operation);
      setInput(example.values);
      play(next, next.at(-1)!.root);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function traverse(order: TraversalOrder) {
    const next = traversalSteps(saved[mode], order);
    if (!next.length) return;
    setSteps(next);
    setTraversal(order);
    setError('');
    playback.restart();
  }

  function reset() {
    setSaved({ ...saved, [mode]: null });
    setSteps([]);
    setTraversal(null);
    setError('');
    playback.move(0);
  }

  // A link from the guide starts a fresh example.
  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const query = new URLSearchParams(window.location.search);
    const v = query.get('v');
    if (v) loadExample({ seed: query.get('seed') ?? undefined, operation: query.get('op') === 'delete' ? 'delete' : 'insert', values: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const railItems: RailItem[] = useMemo(
    () => steps.map((s, i) => ({
      key: String(i),
      label: s.title,
      heading: i === 0 || steps[i - 1].group !== s.group ? s.groupLabel : undefined,
      tone: KIND_TONES[s.kind] ?? 'tone-value',
    })),
    [steps],
  );

  const visited = step?.kind === 'visit' ? step.path.length : 0;
  const sequence = values(saved[mode], traversal ?? 'in');
  const intro = INTRO[mode];

  return (
    <div className="ws">
      <div className="ws-bar">
        <div className="seg" role="group" aria-label="Operation">
          <button className={operation === 'insert' ? 'is-active' : ''} aria-pressed={operation === 'insert'} onClick={() => setOperation('insert')}><Plus size={13} />Insert</button>
          <button className={operation === 'delete' ? 'is-active' : ''} aria-pressed={operation === 'delete'} onClick={() => setOperation('delete')}><Minus size={13} />Delete</button>
        </div>
        <input
          className="field field-mono ws-grow"
          aria-label="Values, separated by commas"
          spellCheck={false}
          autoComplete="off"
          placeholder="25, 35"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') apply();
            if (e.key === 'Escape') setInput('');
          }}
        />
        <button className="btn" onClick={() => setExamples(true)}><Library size={14} /><span className="btn-label">Examples</span></button>
        <button className="btn" onClick={reset} title={`Empty the ${mode.toUpperCase()} tree`}><RotateCcw size={13} /><span className="btn-label">Reset</span></button>
        <button className="btn btn-primary" onClick={apply}>{operation === 'insert' ? 'Insert' : 'Delete'}</button>
      </div>

      {error && <div className="ws-notice" role="alert"><AlertCircle size={14} />{error}</div>}

      <dl className="strip strip-tree">
        <Metric label="Nodes" value={values(root).length} />
        <Metric label="Height" value={height(root)} />
        <Metric label="Root" value={root?.value ?? '–'} />
        <Metric label="Balance" value={root ? signed(balance(root)) : '–'} />
        <div className="strip-cell strip-traversal">
          <dt>Traversal</dt>
          <dd>
            <div className="mini-seg" role="group" aria-label="Play a traversal">
              {ORDERS.map(({ order, label }) => (
                <button key={order} className={traversal === order ? 'is-active' : ''} onClick={() => traverse(order)}>{label}</button>
              ))}
            </div>
            <code className="sequence">
              {sequence.map((v, i) => <span key={v} className={traversal && i < visited ? 'is-visited' : ''}>{v}</span>)}
              {!sequence.length && <span>Empty</span>}
            </code>
          </dd>
        </div>
      </dl>

      <div className="ws-body">
        <section className="stage" aria-label="Visualization">
          <div className="stage-main">
            <TreeCanvas
              root={treeVisual(root, step, mode)}
              trail={treeTrail(step)}
              legend={TREE_LEGEND}
              label={intro.title}
              duration={Math.min(520, 900 / playback.speed)}
              empty={
                <>
                  <h2>This tree is empty</h2>
                  <p>Insert a few values, or start from an example.</p>
                  <button className="btn" onClick={() => setExamples(true)}><Library size={14} />Browse examples</button>
                </>
              }
            />
          </div>
        </section>
        <StepsRail
          counter={step ? `Step ${playback.index + 1} of ${steps.length}` : undefined}
          title={step?.title ?? intro.title}
          detail={step?.message ?? intro.detail}
          items={railItems}
          current={playback.index}
          onSelect={playback.move}
          empty="Each comparison, change, and rotation will be listed here."
        />
      </div>
      <PlaybackBar state={playback} />

      <ExamplesDialog<TreeExample>
        open={examples}
        onClose={() => setExamples(false)}
        title={`${mode === 'bst' ? 'BST' : 'AVL'} examples`}
        levels={treeExamples[mode]}
        renderItem={example => (
          <button
            className="example"
            onClick={() => {
              setExamples(false);
              loadExample(example);
            }}
          >
            <span>
              <strong>{example.title}</strong>
              <small>{example.about}</small>
            </span>
            <code className="example-values" title={`${example.seed ? `Start: ${example.seed}. ` : ''}${example.operation === 'insert' ? 'Insert' : 'Delete'} ${example.values}`}>
              {example.operation === 'insert' ? '+' : '−'} {example.values}
            </code>
          </button>
        )}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="strip-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
