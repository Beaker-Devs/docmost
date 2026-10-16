/**
 * Cursor-stack state for keyset pagination with prev/next navigation.
 * `cursor` is the cursor for the page currently shown (null = first page);
 * `stack` holds the cursors of the pages behind it so Prev can return.
 */
export interface CursorState {
  cursor: string | null;
  stack: (string | null)[];
}

export const initialCursorState = (): CursorState => ({
  cursor: null,
  stack: [],
});

export function goNext(state: CursorState, nextCursor: string): CursorState {
  return { cursor: nextCursor, stack: [...state.stack, state.cursor] };
}

export function goPrev(state: CursorState): CursorState {
  if (state.stack.length === 0) return state;
  const stack = [...state.stack];
  const prev = stack.pop() ?? null;
  return { cursor: prev, stack };
}

export const canGoPrev = (state: CursorState): boolean =>
  state.stack.length > 0;

/** 1-based index of the page currently shown (for display only). */
export const pageNumber = (state: CursorState): number => state.stack.length + 1;
