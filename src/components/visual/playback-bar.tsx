'use client';

import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Dropdown } from '@/components/site/dropdown';
import type { PlaybackState } from '@/lib/use-playback';

const SPEEDS = [0.5, 1, 2, 4].map(value => ({ value, label: `${value}×` }));

export function PlaybackBar({ state }: { state: PlaybackState }) {
  const { index, count, playing, speed, setSpeed, move, toggle } = state;
  const atStart = index === 0;
  const atEnd = index >= count - 1;
  const none = count < 2;

  return (
    <div className="playback">
      <div className="playback-buttons">
        <button className="icon-btn" title="First step" aria-label="First step" disabled={none || atStart} onClick={() => move(0)}><ChevronFirst size={15} /></button>
        <button className="icon-btn" title="Previous step" aria-label="Previous step" disabled={none || atStart} onClick={() => move(index - 1)}><ChevronLeft size={15} /></button>
        <button className="play-btn" aria-label={playing ? 'Pause' : 'Play'} disabled={none} onClick={toggle}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button className="icon-btn" title="Next step" aria-label="Next step" disabled={none || atEnd} onClick={() => move(index + 1)}><ChevronRight size={15} /></button>
        <button className="icon-btn" title="Last step" aria-label="Last step" disabled={none || atEnd} onClick={() => move(count - 1)}><ChevronLast size={15} /></button>
      </div>
      <input
        className="playback-slider"
        type="range"
        aria-label="Step"
        min={0}
        max={Math.max(count - 1, 0)}
        value={index}
        disabled={none}
        onChange={e => move(Number(e.target.value))}
      />
      <span className="playback-count">{count ? index + 1 : 0} / {count}</span>
      <Dropdown label="Speed" value={speed} options={SPEEDS} onChange={setSpeed} />
    </div>
  );
}
