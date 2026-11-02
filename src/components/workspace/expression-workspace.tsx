'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Calculator, Check, Copy, Delete, Library, Play } from 'lucide-react';
import { expressionExamples, type ExpressionExample } from '@/content/examples';
import { buildExpressionFrames } from '@/lib/expression-frames';
import { analyzeExpression, formatNumber, MAX_EXPRESSION_LENGTH, type Notation, type NotationChoice } from '@/lib/expressions';
import { usePlayback, usePlaybackKeys } from '@/lib/use-playback';
import { useSavedState } from '@/lib/use-saved-state';
import { EXPRESSION_LEGEND, expressionVisual } from '../visual/mappers';
import { PlaybackBar } from '../visual/playback-bar';
import { StackView } from '../visual/stack-view';
import { StepsRail, type RailItem } from '../visual/steps-rail';
import { TreeCanvas } from '../visual/tree-canvas';
import { ExamplesDialog } from './examples-dialog';

type Saved = { input: string; notation: NotationChoice };
type View = 'both' | 'tree' | 'stack';

const DEFAULT: Saved = { input: '(8 + 4) * 3 - 6 / 2', notation: 'auto' };
const NOTATIONS: { value: NotationChoice; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'infix', label: 'Infix' },
  { value: 'prefix', label: 'Prefix' },
  { value: 'postfix', label: 'Postfix' },
];
const KEYS = ['7', '8', '9', ' / ', '4', '5', '6', ' * ', '1', '2', '3', ' - ', '0', '.', ' ^ ', ' + ', '(', ')'];
const PHASES = [
  { phase: 'pick', label: 'Pop' },
  { phase: 'compute', label: 'Compute' },
  { phase: 'merge', label: 'Push' },
];

const isSaved = (x: unknown): x is Saved =>
  !!x && typeof x === 'object' && 'input' in x && typeof x.input === 'string' && x.input.length <= MAX_EXPRESSION_LENGTH && 'notation' in x && ['auto', 'infix', 'prefix', 'postfix'].includes(String(x.notation));

export function ExpressionWorkspace() {
  const [draft, setDraft, ready] = useSavedState('dsa-expression-v1', DEFAULT, isSaved);
  const [submitted, setSubmitted] = useState(DEFAULT);
  const [view, setView] = useState<View>('both');
  const [keypad, setKeypad] = useState(false);
  const [examples, setExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => {
    try {
      return { data: analyzeExpression(submitted.input, submitted.notation), error: '' };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [submitted]);
  const data = analysis.data;
  const frames = useMemo(() => (data ? buildExpressionFrames(data) : []), [data]);
  const playback = usePlayback(frames.length);
  usePlaybackKeys(playback);
  const frame = frames[playback.index];

  // Restore once: a link from the guide takes priority over the saved input.
  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const query = new URLSearchParams(window.location.search).get('e');
    if (query && query.length <= MAX_EXPRESSION_LENGTH) run({ input: query, notation: 'auto' });
    else setSubmitted(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function run(next: Saved = draft) {
    setDraft(next);
    setSubmitted({ ...next });
    setKeypad(false);
    playback.restart();
  }

  function insert(token: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? draft.input.length;
    const end = el?.selectionEnd ?? start;
    const input = draft.input.slice(0, start) + token + draft.input.slice(end);
    if (input.length > MAX_EXPRESSION_LENGTH) return;
    setDraft({ ...draft, input });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function backspace() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? draft.input.length;
    const end = el?.selectionEnd ?? start;
    const at = start === end ? Math.max(0, start - 1) : start;
    setDraft({ ...draft, input: draft.input.slice(0, at) + draft.input.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at, at);
    });
  }

  const railItems: RailItem[] = useMemo(
    () => data?.steps.map((step, i) => ({ key: String(i), label: step.message, tone: step.kind === 'apply' ? 'tone-accent' : 'tone-value' })) ?? [],
    [data],
  );
  const stale = draft.input !== submitted.input || draft.notation !== submitted.notation;
  const applyStep = frame && frame.step >= 0 && data?.steps[frame.step].kind === 'apply' && frame.phase !== 'done';

  return (
    <div className="ws">
      <div className="ws-bar">
        <div className="seg" role="group" aria-label="Input notation">
          {NOTATIONS.map(n => (
            <button key={n.value} className={draft.notation === n.value ? 'is-active' : ''} aria-pressed={draft.notation === n.value} onClick={() => setDraft({ ...draft, notation: n.value })}>{n.label}</button>
          ))}
        </div>
        <input
          ref={inputRef}
          className="field field-mono ws-grow"
          aria-label="Expression"
          spellCheck={false}
          autoComplete="off"
          maxLength={MAX_EXPRESSION_LENGTH}
          placeholder="(8 + 4) * 3"
          value={draft.input}
          onChange={e => setDraft({ ...draft, input: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter') run();
            if (e.key === 'Escape') setDraft({ ...draft, input: '' });
          }}
        />
        <div className="popover-anchor">
          <button className={`btn ${keypad ? 'is-active' : ''}`} aria-expanded={keypad} onClick={() => setKeypad(k => !k)}><Calculator size={14} /><span className="btn-label">Keypad</span></button>
          {keypad && (
            <div className="keypad">
              {KEYS.map(key => <button key={key} className={/[+*/^()-]/.test(key) ? 'is-op' : ''} onClick={() => insert(key)}>{key.trim()}</button>)}
              <button aria-label="Delete previous character" onClick={backspace}><Delete size={14} /></button>
              <button onClick={() => setDraft({ ...draft, input: '' })}>Clear</button>
            </div>
          )}
        </div>
        <button className="btn" onClick={() => setExamples(true)}><Library size={14} /><span className="btn-label">Examples</span></button>
        <button className={`btn btn-primary ${stale ? 'is-stale' : ''}`} onClick={() => run()}><Play size={13} />Run</button>
      </div>

      {data ? (
        <>
          <dl className="strip">
            <div className="strip-result">
              <dt>Result</dt>
              <dd>{formatNumber(data.result)}</dd>
            </div>
            {(['infix', 'prefix', 'postfix'] as Notation[]).map(n => (
              <ConversionCell key={n} name={n} text={data[n]} isInput={data.notation === n} />
            ))}
          </dl>

          <div className="ws-body">
            <section className={`stage stage-${view}`} aria-label="Visualization">
              <div className="seg seg-floating" role="group" aria-label="View">
                {(['both', 'tree', 'stack'] as View[]).map(v => (
                  <button key={v} className={view === v ? 'is-active' : ''} aria-pressed={view === v} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>
                ))}
              </div>
              {view !== 'stack' && frame && (
                <div className="stage-main">
                  <TreeCanvas root={expressionVisual(data.root, frame)} legend={EXPRESSION_LEGEND} label="Expression tree" duration={Math.min(480, 900 / playback.speed)} />
                </div>
              )}
              {view !== 'tree' && frame && (
                <div className="stage-side">
                  <StackView frame={frame} tokens={data.postfix.split(' ')} />
                </div>
              )}
            </section>
            {frame && (
              <StepsRail
                counter={frame.step >= 0 ? `Step ${frame.step + 1} of ${data.steps.length}` : `${data.steps.length} steps`}
                title={frame.title}
                detail={frame.detail}
                items={railItems}
                current={frame.step}
                onSelect={i => playback.move(frames.findIndex(f => f.step === i))}
                extra={applyStep ? (
                  <ol className="phases">
                    {PHASES.map(p => <li key={p.phase} className={frame.phase === p.phase ? 'is-active' : ''}>{p.label}</li>)}
                  </ol>
                ) : null}
              />
            )}
          </div>
          <PlaybackBar state={playback} />
        </>
      ) : (
        <div className="ws-error" role="alert">
          <AlertCircle size={22} />
          <h2>That Expression Can't Be Evaluated</h2>
          <p>{analysis.error}</p>
          <button className="btn" onClick={() => setExamples(true)}><Library size={14} />Browse Examples</button>
        </div>
      )}

      <ExamplesDialog<ExpressionExample>
        open={examples}
        onClose={() => setExamples(false)}
        title="Expression examples"
        levels={expressionExamples}
        renderItem={example => (
          <button
            className="example"
            onClick={() => {
              setExamples(false);
              run({ input: example.input, notation: example.notation });
            }}
          >
            <span>
              <code>{example.input}</code>
              <small>{example.about}</small>
            </span>
            <b className={example.error ? 'is-error' : ''}>{example.error ? 'Error' : `= ${example.result}`}</b>
          </button>
        )}
      />
    </div>
  );
}

function ConversionCell({ name, text, isInput }: { name: Notation; text: string; isInput: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access can be refused. The text stays selectable.
    }
  }
  return (
    <div className="strip-cell">
      <dt>{name}{isInput && <em>input</em>}</dt>
      <dd>
        <code title={text}>{text}</code>
        <button className="copy-btn" aria-label={`Copy ${name}`} title={`Copy ${name}`} onClick={copy}>{copied ? <Check size={12} /> : <Copy size={12} />}</button>
      </dd>
    </div>
  );
}
