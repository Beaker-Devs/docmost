import { describe, it, expect } from "vitest";
import {
  canGoPrev,
  goNext,
  goPrev,
  initialCursorState,
  pageNumber,
} from "./audit-pagination";

describe("audit cursor pagination", () => {
  it("starts on the first page with no prev", () => {
    const s = initialCursorState();
    expect(s.cursor).toBeNull();
    expect(canGoPrev(s)).toBe(false);
    expect(pageNumber(s)).toBe(1);
  });

  it("advances and retreats through pages symmetrically", () => {
    let s = initialCursorState();
    s = goNext(s, "c1"); // page 2
    expect(s.cursor).toBe("c1");
    expect(pageNumber(s)).toBe(2);
    expect(canGoPrev(s)).toBe(true);

    s = goNext(s, "c2"); // page 3
    expect(s.cursor).toBe("c2");
    expect(pageNumber(s)).toBe(3);

    s = goPrev(s); // back to page 2 (cursor c1)
    expect(s.cursor).toBe("c1");
    expect(pageNumber(s)).toBe(2);

    s = goPrev(s); // back to page 1 (cursor null)
    expect(s.cursor).toBeNull();
    expect(pageNumber(s)).toBe(1);
    expect(canGoPrev(s)).toBe(false);
  });

  it("goPrev on the first page is a no-op", () => {
    const s = initialCursorState();
    expect(goPrev(s)).toEqual(s);
  });
});
