/*
 * Swipe rows — a second way to the actions a row's buttons already offer
 * (NetNewsWire-style). Pointer events, so touch, pen and mouse share one path:
 *
 *  - a horizontal drag past SWIPE_AT fires onLeft / onRight; a shorter one
 *    springs back and does nothing;
 *  - the row keeps `touch-action: pan-y` (reading.css), so vertical scrolling
 *    stays the browser's and only a mostly-horizontal drag becomes a swipe;
 *  - with a mouse a swipe starts only from `mouseFrom` when given (an entry's
 *    byline and action bar), so dragging across an entry's text still selects
 *    it, as text should;
 *  - a click that lands within CLICK_GUARD ms of a swipe *on this row* is
 *    swallowed — the release that ends a swipe must not also open the link
 *    under the finger — while a tap on any other row goes through.
 *
 * The row element carries the state as attributes for the stylesheet:
 * `.swiping` while dragging, `data-dir` left|right, `.armed` past the threshold.
 */
import { useEffect, useRef } from 'react';

export const SWIPE_AT = 90;
const CLICK_GUARD = 250;
const MAX = 160;

export interface SwipeOptions {
  onLeft?: () => void;
  onRight?: () => void;
  /** Selector inside the row a mouse drag must start from (touch: anywhere). */
  mouseFrom?: string;
  /** Selector of the element that moves (default: the row's first child that is not .swipe-bg). */
  mover?: string;
}

export function useSwipe<T extends HTMLElement>(options: SwipeOptions) {
  const ref = useRef<T>(null);
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    let state:
      | { x: number; y: number; dx: number; on: boolean; id: number; mover: HTMLElement }
      | null = null;
    let swipedAt = 0;
    const findMover = () =>
      (latest.current.mover
        ? row.querySelector<HTMLElement>(latest.current.mover)
        : null) ??
      ([...row.children].find(
        (child) => !child.classList.contains('swipe-bg'),
      ) as HTMLElement | undefined) ??
      row;
    const move = (event: PointerEvent) => {
      if (!state || event.pointerId !== state.id) return;
      const dx = event.clientX - state.x,
        dy = event.clientY - state.y;
      if (!state.on) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          state.on = true;
          row.classList.add('swiping');
          try {
            row.setPointerCapture(event.pointerId);
          } catch {
            /* the pointer may already be gone */
          }
          // A drag that became a swipe is not a text selection.
          window.getSelection()?.removeAllRanges();
        } else return;
      }
      event.preventDefault();
      state.dx = Math.max(-MAX, Math.min(MAX, dx));
      state.mover.style.transform = `translateX(${state.dx}px)`;
      row.dataset.dir = state.dx > 0 ? 'right' : 'left';
      row.classList.toggle('armed', Math.abs(state.dx) > SWIPE_AT);
    };
    const end = (event: PointerEvent) => {
      if (!state || event.pointerId !== state.id) return;
      const { dx, on, mover } = state;
      state = null;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', end);
      if (!on) return;
      swipedAt = Date.now();
      mover.style.transition = 'transform .18s ease-out';
      mover.style.transform = '';
      setTimeout(() => {
        mover.style.transition = '';
        row.classList.remove('swiping', 'armed');
        delete row.dataset.dir;
      }, 200);
      if (event.type === 'pointercancel' || Math.abs(dx) < SWIPE_AT) return;
      if (dx > 0) latest.current.onRight?.();
      else latest.current.onLeft?.();
    };
    const down = (event: PointerEvent) => {
      if (event.button > 0 || state) return;
      const { onLeft, onRight, mouseFrom } = latest.current;
      if (!onLeft && !onRight) return;
      if (
        event.pointerType === 'mouse' &&
        mouseFrom &&
        !(event.target as Element).closest?.(mouseFrom)
      )
        return;
      // Controls inside the row keep their own drag behaviour (a text field).
      if ((event.target as Element).closest?.('input, textarea, select'))
        return;
      state = {
        x: event.clientX,
        y: event.clientY,
        dx: 0,
        on: false,
        id: event.pointerId,
        mover: findMover(),
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', end);
      document.addEventListener('pointercancel', end);
    };
    const guard = (event: MouseEvent) => {
      if (swipedAt && Date.now() - swipedAt < CLICK_GUARD) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    row.addEventListener('pointerdown', down);
    row.addEventListener('click', guard, true);
    return () => {
      row.removeEventListener('pointerdown', down);
      row.removeEventListener('click', guard, true);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', end);
    };
  }, []);
  return ref;
}
