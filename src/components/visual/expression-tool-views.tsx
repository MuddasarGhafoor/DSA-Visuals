'use client';

import { Check, X } from 'lucide-react';
import type { BracketFrame, BracketResult } from '@/lib/balanced-brackets';

/** The source text, one cell per character, so positions can be colored. */
function SourceText({ source, classOf }: { source: string; classOf: (position: number) => string }) {
  return (
    <div className="source">
      {[...source].map((char, i) =>
        char === '\n' ? (
          <span key={i} className="source-break" />
        ) : (
          <span key={i} className={`source-char ${char === ' ' ? 'is-space' : ''} ${classOf(i)}`}>{char === ' ' ? '·' : char}</span>
        ),
      )}
    </div>
  );
}

export function BracketsView({ result, frame }: { result: BracketResult; frame: BracketFrame }) {
  const pairOf = new Map<number, number>();
  for (const pair of frame.pairs) {
    pairOf.set(pair.open, pair.depth);
    pairOf.set(pair.close, pair.depth);
  }
  const classOf = (i: number) => {
    if (frame.bad.includes(i)) return 'is-bad';
    if (i === frame.current) return 'is-current';
    const depth = pairOf.get(i);
    if (depth !== undefined) return `pair-${depth % 3}`;
    return i < frame.cursor ? 'is-read' : '';
  };
  const finished = frame.phase === 'done' || frame.phase === 'error';
  return (
    <div className="flow">
      <div className="flow-block">
        <span className="kicker">Text, read left to right. Matched pairs are colored by how deep they are.</span>
        <SourceText source={result.source} classOf={classOf} />
      </div>
      <div className="flow-row">
        <div className="flow-block">
          <span className="kicker">Stack of open brackets</span>
          <div className="stack op-stack">
            {[...frame.stack].reverse().map((item, i) => (
              <div key={item.position} className={`stack-item ${i === 0 && frame.phase === 'push' ? 'is-fresh' : ''}`}>
                <span>{item.char}</span>
                <small>{i === 0 ? 'top' : `at ${item.position + 1}`}</small>
              </div>
            ))}
            {!frame.stack.length && <div className="stack-empty">Empty</div>}
          </div>
        </div>
        <div className="flow-block">
          <span className="kicker">Result</span>
          {finished ? (
            <div className={`verdict ${result.balanced ? 'is-good' : 'is-bad'}`}>
              {result.balanced ? <Check size={15} /> : <X size={15} />}
              {result.verdict}
            </div>
          ) : (
            <div className="compare"><span>Still reading. {frame.pairs.length} pair{frame.pairs.length === 1 ? '' : 's'} matched so far.</span></div>
          )}
        </div>
      </div>
    </div>
  );
}
