'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Library, Play } from 'lucide-react';
import type { ExampleLevel, ToolExample } from '@/content/examples';
import { usePlayback, usePlaybackKeys, type PlaybackState } from '@/lib/use-playback';
import { useSavedState } from '@/lib/use-saved-state';
import { PlaybackBar } from '../visual/playback-bar';
import { StepsRail, type RailItem } from '../visual/steps-rail';
import { ExamplesDialog } from './examples-dialog';

type BaseFrame = { step: number; title: string; detail: string };
type Run<F> = { frames: F[]; items: RailItem[]; error?: string };

const isSavedInput = (value: unknown): value is string => typeof value === 'string' && value.length <= 1000;

/**
 * Everything the expression tools share: the input, saved state, examples, playback, and steps rail.
 * Each tool brings its own engine (analyze) and its own drawing (stage). Analyze must be stable
 * between renders, and a new one (such as a change of view) replays from the start.
 */
export function TopicShell<F extends BaseFrame, R extends Run<F>>({
  storageKey,
  defaultInput,
  inputLabel,
  placeholder,
  maxLength,
  examples,
  examplesTitle,
  errorTitle,
  analyze,
  controls,
  strip,
  stage,
}: {
  storageKey: string;
  defaultInput: string;
  inputLabel: string;
  placeholder: string;
  maxLength: number;
  examples: ExampleLevel<ToolExample>[];
  examplesTitle: string;
  errorTitle: string;
  analyze: (input: string) => R;
  controls?: ReactNode;
  strip: (result: R) => ReactNode;
  stage: (result: R, frame: F, playback: PlaybackState) => ReactNode;
}) {
  const [draft, setDraft, ready] = useSavedState(storageKey, defaultInput, isSavedInput);
  const [submitted, setSubmitted] = useState(defaultInput);
  const [showExamples, setShowExamples] = useState(false);

  const outcome = useMemo(() => {
    try {
      return { result: analyze(submitted), failure: '' };
    } catch (e) {
      return { result: null, failure: (e as Error).message };
    }
  }, [analyze, submitted]);
  const { result, failure } = outcome;

  const playback = usePlayback(result?.frames.length ?? 0);
  usePlaybackKeys(playback);
  const frame = result?.frames[playback.index];

  function run(next: string = draft) {
    setDraft(next);
    setSubmitted(next);
    playback.restart();
  }

  // Restore once: a link from another page takes priority over the saved input.
  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const query = new URLSearchParams(window.location.search).get('e');
    if (query && query.length <= maxLength) run(query);
    else setSubmitted(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Switching view keeps the input and replays from the start.
  const lastAnalyze = useRef(analyze);
  useEffect(() => {
    if (lastAnalyze.current === analyze) return;
    lastAnalyze.current = analyze;
    playback.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyze]);

  return (
    <div className="ws">
      <div className="ws-bar">
        {controls}
        <input
          className="field field-mono ws-grow"
          aria-label={inputLabel}
          spellCheck={false}
          autoComplete="off"
          maxLength={maxLength}
          placeholder={placeholder}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              run();
            }
            if (e.key === 'Escape') setDraft('');
          }}
        />
        <button className="btn" onClick={() => setShowExamples(true)}><Library size={14} /><span className="btn-label">Examples</span></button>
        <button className={`btn btn-primary ${draft !== submitted ? 'is-stale' : ''}`} onClick={() => run()}><Play size={13} />Run</button>
      </div>

      {result && frame ? (
        <>
          <dl className="strip">{strip(result)}</dl>
          {result.error && <div className="ws-notice" role="status"><AlertCircle size={13} />{result.error}</div>}
          <div className="ws-body">
            <StepsRail
              counter={frame.step >= 0 ? `Step ${Math.min(frame.step + 1, result.items.length)} of ${result.items.length}` : `${result.items.length} steps`}
              title={frame.title}
              detail={frame.detail}
              items={result.items}
              current={frame.step}
              onSelect={i => playback.move(Math.max(0, result.frames.findIndex(f => f.step === i)))}
            />
            <section className="stage" aria-label="Visualization">{stage(result, frame, playback)}</section>
          </div>
          <PlaybackBar state={playback} />
        </>
      ) : (
        <div className="ws-error" role="alert">
          <AlertCircle size={22} />
          <h2>{errorTitle}</h2>
          <p>{failure}</p>
          <button className="btn" onClick={() => setShowExamples(true)}><Library size={14} />Browse Examples</button>
        </div>
      )}

      <ExamplesDialog<ToolExample>
        open={showExamples}
        onClose={() => setShowExamples(false)}
        title={examplesTitle}
        levels={examples}
        renderItem={example => (
          <button
            className="example"
            onClick={() => {
              setShowExamples(false);
              run(example.input);
            }}
          >
            <span>
              <code>{example.input}</code>
              <small>{example.about}</small>
            </span>
            <b className={example.error ? 'is-error' : ''}>{example.outcome}</b>
          </button>
        )}
      />
    </div>
  );
}
