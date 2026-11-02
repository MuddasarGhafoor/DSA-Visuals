'use client';

import { displayToken, compactNumber } from '@/lib/expressions';
import type { ExprFrame } from '@/lib/expression-frames';

/** The postfix tape, the operation in progress, and the operand stack. */
export function StackView({ frame, tokens }: { frame: ExprFrame; tokens: string[] }) {
  const { tray } = frame;
  return (
    <div className="stack-view">
      <div className="stack-section">
        <span className="kicker">Postfix, read left to right</span>
        <ol className="tape">
          {tokens.map((token, i) => (
            <li key={i} className={i === frame.step && frame.phase !== 'done' ? 'is-current' : i <= frame.step ? 'is-past' : ''}>{displayToken(token)}</li>
          ))}
        </ol>
      </div>

      <div className="stack-section">
        <span className="kicker">Working</span>
        <div className="tray" key={`${frame.step}-${tray ? 'on' : 'off'}`}>
          {tray ? (
            <>
              {tray.left !== undefined && <span className="tray-value">{compactNumber(tray.left)}</span>}
              <span className="tray-op">{tray.op}</span>
              <span className="tray-value">{compactNumber(tray.right)}</span>
              {tray.result !== undefined && (
                <>
                  <span className="tray-op">=</span>
                  <span className="tray-value is-result">{compactNumber(tray.result)}</span>
                </>
              )}
            </>
          ) : (
            <span className="tray-idle">{frame.phase === 'done' ? 'Finished' : 'Idle'}</span>
          )}
        </div>
      </div>

      <div className="stack-section stack-grow">
        <span className="kicker">Stack</span>
        <div className="stack">
          {[...frame.stack].reverse().map((item, i) => (
            <div key={item.id} className={`stack-item ${item.id === frame.freshId ? 'is-fresh' : ''}`}>
              <span>{compactNumber(item.value)}</span>
              {i === 0 && <small>top</small>}
            </div>
          ))}
          {!frame.stack.length && <div className="stack-empty">Empty</div>}
        </div>
      </div>
    </div>
  );
}
