'use client';

import { useCallback, useEffect, useState } from 'react';

export const FRAME_MS = 1100;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePlayback(count: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playing) return;
    if (index >= count - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex(i => Math.min(i + 1, count - 1)), FRAME_MS / speed);
    return () => clearTimeout(timer);
  }, [playing, index, count, speed]);

  const move = useCallback((next: number) => {
    setPlaying(false);
    setIndex(next);
  }, []);

  /** Rewind and play, unless the user has asked for less motion. */
  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(!prefersReducedMotion());
  }, []);

  const toggle = useCallback(() => {
    setIndex(i => (i >= count - 1 ? 0 : i));
    setPlaying(p => !p);
  }, [count]);

  return { index: Math.min(index, Math.max(count - 1, 0)), playing, speed, setSpeed, count, move, restart, toggle };
}

export type PlaybackState = ReturnType<typeof usePlayback>;

/** Arrow keys step, space plays. Ignored while typing or when a control has focus. */
export function usePlaybackKeys({ index, count, move, toggle }: PlaybackState) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (target.closest('input, textarea, select, button, a, dialog')) return;
      if (e.key === 'ArrowRight') move(Math.min(index + 1, count - 1));
      else if (e.key === 'ArrowLeft') move(Math.max(index - 1, 0));
      else if (e.key === 'Home') move(0);
      else if (e.key === 'End') move(count - 1);
      else if (e.key === ' ') toggle();
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, move, toggle]);
}
