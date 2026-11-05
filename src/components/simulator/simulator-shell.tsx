'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Library, Play } from 'lucide-react';
import { Dropdown } from '@/components/site/dropdown';
import { PlaybackBar } from '@/components/visual/playback-bar';
import { StepsRail, type RailItem } from '@/components/visual/steps-rail';
import { ExamplesDialog } from '@/components/workspace/examples-dialog';
import { usePlayback, usePlaybackKeys } from '@/lib/use-playback';
import { useSavedState } from '@/lib/use-saved-state';
import { defaultValues, type Field, type SimExample, type SimulatorDef, type Values } from '@/simulators/kit';
import { PanelView } from './panels';

function FieldInput({ field, value, onChange, onRun }: { field: Field; value: string; onChange: (value: string) => void; onRun: () => void }) {
  const [opValue, setOpValue] = useState('');
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  };
  if (field.kind === 'choice') {
    return (
      <div className="sim-field">
        <span>{field.label}</span>
        <Dropdown label={field.label} value={value} options={field.options} onChange={onChange} />
      </div>
    );
  }
  if (field.kind === 'number') {
    return (
      <label className="sim-field">
        <span>{field.label}</span>
        <input className="field field-mono sim-number" type="number" min={field.min} max={field.max} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onEnter} />
      </label>
    );
  }
  if (field.kind === 'ops') {
    const append = (text: string) => onChange(value.trim() ? `${value.trim().replace(/,$/, '')}, ${text}` : text);
    const usesValue = field.actions.some(action => action.takesValue);
    return (
      <>
        <label className="sim-field ws-grow">
          <span>{field.label}</span>
          <input className="field field-mono" spellCheck={false} autoComplete="off" placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onEnter} />
        </label>
        <div className="sim-ops" role="group" aria-label={`Add to ${field.label}`}>
          {usesValue && <input className="field field-mono sim-op-value" aria-label="Value for the next operation" placeholder="Value" spellCheck={false} autoComplete="off" value={opValue} onChange={e => setOpValue(e.target.value)} />}
          {field.actions.map(action => (
            <button key={action.op} type="button" className="btn" onClick={() => append(action.takesValue ? `${action.op} ${opValue.trim()}`.trim() : action.op)}>{action.label}</button>
          ))}
          <button type="button" className="btn btn-quiet" onClick={() => onChange('')}>Clear</button>
        </div>
      </>
    );
  }
  return (
    <label className={`sim-field ${field.wide !== false ? 'ws-grow' : ''}`}>
      <span>{field.label}</span>
      <input className="field field-mono" spellCheck={false} autoComplete="off" placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onEnter} />
    </label>
  );
}

/** One page for every simulator. Which inputs, views, and outputs it shows all come from the definition. */
export function SimulatorShell({ def, slug, title }: { def: SimulatorDef; slug: string; title: string }) {
  const initial = useMemo(() => defaultValues(def), [def]);
  const isValid = useCallback((value: unknown): value is Values => {
    if (!value || typeof value !== 'object') return false;
    const saved = value as Record<string, unknown>;
    return def.fields.every(field => {
      const item = saved[field.key];
      if (typeof item !== 'string' || item.length > 400) return false;
      return field.kind !== 'choice' || field.options.some(option => option.value === item);
    });
  }, [def]);
  const [draft, setDraft, ready] = useSavedState<Values>(`dsa-sim-${slug}`, initial, isValid);
  const [submitted, setSubmitted] = useState<Values>(initial);
  const [showExamples, setShowExamples] = useState(false);

  // A field that doesn't apply right now is hidden, so whatever it holds must not affect the run.
  const applicable = useCallback((values: Values): Values => Object.fromEntries(def.fields.map(field => [field.key, !field.only || field.only(values) ? values[field.key] ?? field.initial : field.initial])), [def]);

  const outcome = useMemo(() => {
    try {
      return { result: def.run(submitted), failure: '' };
    } catch (e) {
      return { result: null, failure: (e as Error).message };
    }
  }, [def, submitted]);
  const { result, failure } = outcome;
  const frames = result?.frames ?? [];

  const playback = usePlayback(frames.length);
  usePlaybackKeys(playback);
  const frame = frames[playback.index];

  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    setSubmitted(applicable(draft));
  }, [ready, draft, applicable]);

  function run(next: Values = draft) {
    setDraft(next);
    setSubmitted(applicable(next));
    playback.restart();
  }

  const items: RailItem[] = useMemo(() => frames.map((item, i) => ({
    key: String(i),
    label: item.label,
    tone: `tone-${item.tone}`,
    heading: item.group && item.group !== frames[i - 1]?.group ? item.group : undefined,
  })), [frames]);

  const stale = JSON.stringify(applicable(draft)) !== JSON.stringify(submitted);
  const metrics = frame?.metrics ?? result?.summary;
  const main = frame?.panels.filter(panel => panel.zone !== 'side') ?? [];
  const side = frame?.panels.filter(panel => panel.zone === 'side') ?? [];
  const examples: SimExample[] = def.examples;

  return (
    <div className="ws">
      <div className="ws-bar">
        {def.fields.filter(field => !field.only || field.only(draft)).map(field => (
          <FieldInput key={field.key} field={field} value={draft[field.key] ?? field.initial} onChange={value => setDraft({ ...draft, [field.key]: value })} onRun={() => run()} />
        ))}
        {examples.length > 0 && <button className="btn" onClick={() => setShowExamples(true)}><Library size={14} /><span className="btn-label">Examples</span></button>}
        <button className={`btn btn-primary ${stale ? 'is-stale' : ''}`} onClick={() => run()}><Play size={13} />Run</button>
      </div>

      {result && frame ? (
        <>
          {metrics && metrics.length > 0 && (
            <dl className="strip">
              {metrics.map(metric => (
                <div className="strip-metric" key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd className={metric.tone ? `is-toned tone-${metric.tone}` : ''}>{metric.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="ws-body">
            <StepsRail
              counter={`Step ${playback.index + 1} of ${frames.length}`}
              title={frame.title}
              detail={frame.detail}
              items={items}
              current={playback.index}
              onSelect={playback.move}
            />
            <section className="stage" aria-label={`${title} visualization`}>
              <div className="sim-main">{main.map((panel, i) => <PanelView key={i} panel={panel} />)}</div>
              {side.length > 0 && <div className="stage-side sim-side">{side.map((panel, i) => <PanelView key={i} panel={panel} />)}</div>}
            </section>
          </div>
          <PlaybackBar state={playback} />
        </>
      ) : (
        <div className="ws-error" role="alert">
          <AlertCircle size={22} />
          <h2>That Input Can&apos;t Be Used</h2>
          <p>{failure || 'There is nothing to show for that input.'}</p>
          {examples.length > 0 && <button className="btn" onClick={() => setShowExamples(true)}><Library size={14} />Browse Examples</button>}
        </div>
      )}

      {examples.length > 0 && (
        <ExamplesDialog<SimExample>
          open={showExamples}
          onClose={() => setShowExamples(false)}
          title={`${title} examples`}
          levels={[{ level: 'Try These', hint: 'Each one shows something different about this topic.', items: examples }]}
          renderItem={example => (
            <button
              className="example"
              onClick={() => {
                setShowExamples(false);
                run({ ...initial, ...example.values });
              }}
            >
              <span>
                <strong>{example.title}</strong>
                <small>{example.about}</small>
              </span>
            </button>
          )}
        />
      )}
    </div>
  );
}
