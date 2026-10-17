import { describe, it, expect } from "vitest";
import {
  applyFilters,
  applySorts,
  buildViewRows,
  EMPTY_GROUP,
  groupRows,
  matchesFilter,
} from "./view-logic";
import { IDatabaseField, IDatabaseRow } from "../types/database.types";

const fields: IDatabaseField[] = [
  { id: "name", name: "Name", type: "text", position: "a", config: {}, databaseId: "d" },
  { id: "num", name: "Num", type: "number", position: "b", config: {}, databaseId: "d" },
  { id: "done", name: "Done", type: "checkbox", position: "c", config: {}, databaseId: "d" },
  {
    id: "status",
    name: "Status",
    type: "select",
    position: "d",
    config: { options: [{ id: "todo", name: "To do" }, { id: "done", name: "Done" }] },
    databaseId: "d",
  },
];

const row = (id: string, cells: Record<string, any>): IDatabaseRow => ({
  id,
  position: id,
  cells,
  databaseId: "d",
  createdAt: "",
});

describe("matchesFilter", () => {
  it("text contains / is / empty", () => {
    expect(matchesFilter("Hello", "contains", "ell", "text")).toBe(true);
    expect(matchesFilter("Hello", "contains", "zzz", "text")).toBe(false);
    expect(matchesFilter("Hello", "is", "Hello", "text")).toBe(true);
    expect(matchesFilter("", "is_empty", null, "text")).toBe(true);
    expect(matchesFilter("x", "is_not_empty", null, "text")).toBe(true);
  });

  it("number comparisons", () => {
    expect(matchesFilter(5, "gt", 3, "number")).toBe(true);
    expect(matchesFilter(5, "lt", 3, "number")).toBe(false);
    expect(matchesFilter(5, "gte", 5, "number")).toBe(true);
  });

  it("checkbox checked/unchecked", () => {
    expect(matchesFilter(true, "checked", null, "checkbox")).toBe(true);
    expect(matchesFilter(false, "unchecked", null, "checkbox")).toBe(true);
  });

  it("multi_select membership", () => {
    expect(matchesFilter(["a", "b"], "is", "a", "multi_select")).toBe(true);
    expect(matchesFilter(["a", "b"], "is_not", "c", "multi_select")).toBe(true);
  });
});

describe("applyFilters", () => {
  it("ANDs all filters", () => {
    const rows = [
      row("1", { name: "Alpha", num: 10 }),
      row("2", { name: "Beta", num: 2 }),
      row("3", { name: "Alpha", num: 1 }),
    ];
    const out = applyFilters(
      rows,
      [
        { id: "f1", fieldId: "name", op: "is", value: "Alpha" },
        { id: "f2", fieldId: "num", op: "gt", value: 5 },
      ],
      fields,
    );
    expect(out.map((r) => r.id)).toEqual(["1"]);
  });

  it("returns all rows when no filters", () => {
    const rows = [row("1", {})];
    expect(applyFilters(rows, [], fields)).toHaveLength(1);
  });
});

describe("applySorts", () => {
  it("sorts numbers asc/desc with empties last", () => {
    const rows = [
      row("a", { num: 3 }),
      row("b", {}),
      row("c", { num: 1 }),
    ];
    expect(applySorts(rows, [{ fieldId: "num", direction: "asc" }], fields).map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(applySorts(rows, [{ fieldId: "num", direction: "desc" }], fields).map((r) => r.id)).toEqual(["a", "c", "b"]);
  });

  it("is stable across multiple keys", () => {
    const rows = [
      row("a", { name: "x", num: 2 }),
      row("b", { name: "x", num: 1 }),
      row("c", { name: "y", num: 9 }),
    ];
    const out = applySorts(
      rows,
      [
        { fieldId: "name", direction: "asc" },
        { fieldId: "num", direction: "asc" },
      ],
      fields,
    );
    expect(out.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });
});

describe("groupRows", () => {
  const statusField = fields[3];
  it("groups by option order with empty group last", () => {
    const rows = [
      row("1", { status: "done" }),
      row("2", { status: "todo" }),
      row("3", {}),
      row("4", { status: "todo" }),
    ];
    const groups = groupRows(rows, statusField, true);
    expect(groups.map((g) => g.key)).toEqual(["todo", "done", EMPTY_GROUP]);
    expect(groups.find((g) => g.key === "todo")!.rows.map((r) => r.id)).toEqual(["2", "4"]);
    expect(groups.find((g) => g.key === EMPTY_GROUP)!.rows.map((r) => r.id)).toEqual(["3"]);
  });

  it("omits empty option groups when includeEmptyGroups is false", () => {
    const rows = [row("1", { status: "todo" })];
    const groups = groupRows(rows, statusField, false);
    expect(groups.map((g) => g.key)).toEqual(["todo"]);
  });
});

describe("buildViewRows", () => {
  it("filters then sorts", () => {
    const rows = [
      row("1", { name: "keep", num: 2 }),
      row("2", { name: "keep", num: 1 }),
      row("3", { name: "drop", num: 9 }),
    ];
    const out = buildViewRows(
      rows,
      [{ id: "f", fieldId: "name", op: "is", value: "keep" }],
      [{ fieldId: "num", direction: "asc" }],
      fields,
    );
    expect(out.map((r) => r.id)).toEqual(["2", "1"]);
  });
});
