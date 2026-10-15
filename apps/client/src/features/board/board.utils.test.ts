import { describe, it, expect } from "vitest";
import { generateJitteredKeyBetween } from "fractional-indexing-jittered";
import { byPosition, positionBetween } from "./board.utils";

describe("byPosition", () => {
  it("sorts position keys bytewise ascending", () => {
    const items = [
      { position: "a2" },
      { position: "a0" },
      { position: "a1" },
    ];
    expect(items.slice().sort(byPosition).map((i) => i.position)).toEqual([
      "a0",
      "a1",
      "a2",
    ]);
  });

  it("orders bytewise (uppercase before lowercase), unlike localeCompare", () => {
    // 'A' (0x41) sorts before 'a' (0x61) bytewise; localeCompare would flip it
    expect(byPosition({ position: "A5" }, { position: "a5" })).toBeLessThan(0);
    expect("A5".localeCompare("a5")).toBeGreaterThan(0); // documents the divergence
  });

  it("treats a null position as empty (sorts first)", () => {
    expect(byPosition({ position: null }, { position: "a0" })).toBeLessThan(0);
    expect(byPosition({ position: null }, { position: null })).toBe(0);
  });

  it("keeps a real set of jittered keys in generated order", () => {
    const keys: string[] = [];
    let prev: string | null = null;
    for (let i = 0; i < 25; i++) {
      prev = generateJitteredKeyBetween(prev, null);
      keys.push(prev);
    }
    const shuffled = keys
      .map((k) => ({ position: k }))
      .sort(() => Math.random() - 0.5);
    expect(shuffled.sort(byPosition).map((i) => i.position)).toEqual(keys);
  });
});

describe("positionBetween", () => {
  it("returns a key strictly between two ordered neighbors", () => {
    const a = generateJitteredKeyBetween(null, null);
    const b = generateJitteredKeyBetween(a, null);
    const mid = positionBetween(a, b);
    expect(a < mid && mid < b).toBe(true);
  });

  it("appends after prev when next is null", () => {
    const a = generateJitteredKeyBetween(null, null);
    expect(positionBetween(a, null) > a).toBe(true);
  });

  it("prepends before next when prev is null", () => {
    const a = generateJitteredKeyBetween(null, null);
    expect(positionBetween(null, a) < a).toBe(true);
  });

  it("produces a usable key for the empty board case", () => {
    expect(positionBetween(null, null).length).toBeGreaterThan(0);
  });

  it("falls back to appending when neighbors are not strictly ordered", () => {
    // prev > next would throw inside the library; the helper must not throw
    // and should place the item after prev
    const result = positionBetween("a9", "a1");
    expect(result > "a9").toBe(true);
  });
});
