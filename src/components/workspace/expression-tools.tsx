'use client';

import { useCallback, useState } from 'react';
import { toolExamples } from '@/content/examples';
import { MAX_BRACKET_INPUT, traceBrackets, type BracketFrame, type BracketResult } from '@/lib/balanced-brackets';
import { analyzeExpressionTree, buildTreeFrames, ORDER_LABELS, traversalFrames, type BuildFrame, type TraversalFrame, type TreeOrder, type TreeView } from '@/lib/expression-tree';
import { displayToken, MAX_EXPRESSION_LENGTH } from '@/lib/expressions';
import { buildForest, BUILD_LEGEND, TRAVERSAL_LEGEND, traversalTree } from '../visual/mappers';
import { BracketsView } from '../visual/expression-tool-views';
import { TreeCanvas } from '../visual/tree-canvas';
import { TopicShell } from './topic-shell';

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="strip-metric"><dt>{label}</dt><dd>{value}</dd></div>
);
const TextCell = ({ label, text }: { label: string; text: string }) => (
  <div className="strip-cell"><dt>{label}</dt><dd><code title={text}>{text}</code></dd></div>
);

const TREE_VIEWS: { value: TreeView; label: string }[] = [
  { value: 'build', label: 'Build' },
  { value: 'in', label: 'Inorder' },
  { value: 'pre', label: 'Preorder' },
  { value: 'post', label: 'Postorder' },
];

type TreeFrame = BuildFrame | TraversalFrame;
const isBuild = (frame: TreeFrame): frame is BuildFrame => 'forest' in frame;

export function ExpressionTreeWorkspace() {
  const [view, setView] = useState<TreeView>('build');

  const analyze = useCallback(
    (input: string) => {
      const data = analyzeExpressionTree(input);
      const order = view as TreeOrder;
      const frames: TreeFrame[] = view === 'build' ? buildTreeFrames(data.root) : traversalFrames(data.root, order, data.infix);
      const tokens = view === 'build' ? data.tokens : (frames.at(-1) as TraversalFrame).output;
      const isOperator = (token: string) => /^[+\-*/^~]$/.test(token);
      const items = tokens.map((token, i) => ({
        key: String(i),
        label: view !== 'build' ? `Visit ${displayToken(token)}` : isOperator(token) ? `Join ${displayToken(token)}` : `Leaf ${token}`,
        tone: isOperator(token) ? 'tone-accent' : 'tone-value',
      }));
      return { data, frames, items };
    },
    [view],
  );

  return (
    <TopicShell<TreeFrame, ReturnType<typeof analyze>>
      storageKey="dsa-expression-tree-v1"
      defaultInput="(8 + 4) * 3 - 6 / 2"
      inputLabel="Expression in infix, prefix, or postfix"
      placeholder="(2 + 3) * 4"
      maxLength={MAX_EXPRESSION_LENGTH}
      examples={toolExamples.tree}
      examplesTitle="Expression Tree examples"
      errorTitle="That Expression Can't Be Drawn"
      analyze={analyze}
      controls={(
        <div className="seg" role="group" aria-label="What to show">
          {TREE_VIEWS.map(item => (
            <button key={item.value} className={view === item.value ? 'is-active' : ''} aria-pressed={view === item.value} onClick={() => setView(item.value)}>{item.label}</button>
          ))}
        </div>
      )}
      strip={({ data }) => (
        <>
          <TextCell label="Infix" text={data.infix} />
          <TextCell label="Prefix" text={data.prefix} />
          <TextCell label="Postfix" text={data.postfix} />
        </>
      )}
      stage={({ data }, frame, playback) => {
        const duration = Math.min(480, 900 / playback.speed);
        if (isBuild(frame)) {
          return (
            <>
              <div className="stage-main"><TreeCanvas root={buildForest(frame)} legend={BUILD_LEGEND} label="Expression tree being built" duration={duration} /></div>
              <div className="stage-side">
                <div className="stack-view">
                  <div className="stack-section">
                    <span className="kicker">Postfix, read left to right</span>
                    <ol className="tape">
                      {data.tokens.map((token, i) => (
                        <li key={i} className={i === frame.step && frame.phase !== 'done' ? 'is-current' : i <= frame.step ? 'is-past' : ''}>{displayToken(token)}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="stack-section stack-grow">
                    <span className="kicker">Stack of finished subtrees</span>
                    <div className="stack">
                      {[...frame.forest].reverse().map((node, i) => (
                        <div key={node.id} className={`stack-item ${node.id === frame.activeId ? 'is-fresh' : ''}`}>
                          <span>{displayToken(node.token)}</span>
                          {i === 0 && <small>top</small>}
                        </div>
                      ))}
                      {!frame.forest.length && <div className="stack-empty">Empty</div>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        }
        return (
          <>
            <div className="stage-main"><TreeCanvas root={traversalTree(data.root, frame)} legend={TRAVERSAL_LEGEND} label="Expression tree traversal" duration={duration} /></div>
            <div className="stage-side">
              <div className="stack-view">
                <div className="stack-section">
                  <span className="kicker">{ORDER_LABELS[view as TreeOrder]} output</span>
                  <ol className="tape">
                    {frame.output.map((token, i) => <li key={i} className={i === frame.output.length - 1 && frame.phase === 'visit' ? 'is-current' : 'is-past'}>{displayToken(token)}</li>)}
                    {!frame.output.length && <li>Nothing yet</li>}
                  </ol>
                </div>
              </div>
            </div>
          </>
        );
      }}
    />
  );
}

export function BalancedBracketsWorkspace() {
  return (
    <TopicShell<BracketFrame, BracketResult>
      storageKey="dsa-brackets-v1"
      defaultInput="f(a[0], {b: (1 + 2)})"
      inputLabel="Text with brackets"
      placeholder="([{}])"
      maxLength={MAX_BRACKET_INPUT}
      examples={toolExamples.brackets}
      examplesTitle="Balanced Parentheses examples"
      errorTitle="Nothing to Check"
      analyze={traceBrackets}
      strip={result => (
        <>
          <div className="strip-result"><dt>Result</dt><dd style={result.balanced ? undefined : { color: 'var(--danger)' }}>{result.balanced ? 'Balanced' : 'Not balanced'}</dd></div>
          <Metric label="Pairs" value={result.pairCount} />
          <Metric label="Deepest" value={result.maxDepth} />
          <TextCell label="Verdict" text={result.verdict} />
        </>
      )}
      stage={(result, frame) => <BracketsView result={result} frame={frame} />}
    />
  );
}
