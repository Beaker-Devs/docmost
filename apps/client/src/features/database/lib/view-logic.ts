import {
  FilterOp,
  IDatabaseField,
  IDatabaseRow,
  IFilter,
  ISort,
} from "../types/database.types";

export const EMPTY_GROUP = "__empty__";

function cellValue(row: IDatabaseRow, fieldId: string): any {
  return row.cells?.[fieldId];
}

function isEmpty(v: any): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Evaluate a single filter against a cell value. */
export function matchesFilter(
  value: any,
  op: FilterOp,
  target: any,
  fieldType: IDatabaseField["type"],
): boolean {
  switch (op) {
    case "is_empty":
      return isEmpty(value);
    case "is_not_empty":
      return !isEmpty(value);
    case "checked":
      return value === true;
    case "unchecked":
      return value !== true;
    case "is":
      if (fieldType === "multi_select") {
        return Array.isArray(value) && value.includes(target);
      }
      return String(value ?? "") === String(target ?? "");
    case "is_not":
      if (fieldType === "multi_select") {
        return !(Array.isArray(value) && value.includes(target));
      }
      return String(value ?? "") !== String(target ?? "");
    case "contains":
      return String(value ?? "")
        .toLowerCase()
        .includes(String(target ?? "").toLowerCase());
    case "not_contains":
      return !String(value ?? "")
        .toLowerCase()
        .includes(String(target ?? "").toLowerCase());
    case "gt":
      return Number(value) > Number(target);
    case "lt":
      return Number(value) < Number(target);
    case "gte":
      return Number(value) >= Number(target);
    case "lte":
      return Number(value) <= Number(target);
    default:
      return true;
  }
}

/** Apply all filters (AND) to the rows. */
export function applyFilters(
  rows: IDatabaseRow[],
  filters: IFilter[],
  fields: IDatabaseField[],
): IDatabaseRow[] {
  if (!filters?.length) return rows;
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  return rows.filter((row) =>
    filters.every((f) => {
      const field = fieldById.get(f.fieldId);
      if (!field) return true;
      return matchesFilter(cellValue(row, f.fieldId), f.op, f.value, field.type);
    }),
  );
}

/** Compare two non-empty values of a given type. */
function compareNonEmpty(a: any, b: any, type: IDatabaseField["type"]): number {
  if (type === "number") return Number(a) - Number(b);
  if (type === "checkbox") return (a === true ? 1 : 0) - (b === true ? 1 : 0);
  if (type === "date") {
    return new Date(a).getTime() - new Date(b).getTime();
  }
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

/**
 * Apply multi-key sort (stable). Empty cells always sort last, regardless of
 * the sort direction.
 */
export function applySorts(
  rows: IDatabaseRow[],
  sorts: ISort[],
  fields: IDatabaseField[],
): IDatabaseRow[] {
  if (!sorts?.length) return rows;
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  return [...rows].sort((r1, r2) => {
    for (const s of sorts) {
      const field = fieldById.get(s.fieldId);
      if (!field) continue;
      const a = cellValue(r1, s.fieldId);
      const b = cellValue(r2, s.fieldId);
      const aEmpty = isEmpty(a);
      const bEmpty = isEmpty(b);
      if (aEmpty && bEmpty) continue;
      if (aEmpty) return 1; // empties last, independent of direction
      if (bEmpty) return -1;
      const c = compareNonEmpty(a, b, field.type);
      if (c !== 0) return s.direction === "asc" ? c : -c;
    }
    return 0;
  });
}

export interface RowGroup {
  key: string; // option id, or EMPTY_GROUP
  rows: IDatabaseRow[];
}

/**
 * Group rows by a (select) field. Groups follow the field's option order,
 * with the empty group last; only non-empty groups + the empty group that
 * actually has rows are returned when `includeEmptyGroups` is false.
 */
export function groupRows(
  rows: IDatabaseRow[],
  field: IDatabaseField,
  includeEmptyGroups = true,
): RowGroup[] {
  const buckets = new Map<string, IDatabaseRow[]>();
  const options = field.config?.options ?? [];
  if (includeEmptyGroups) {
    for (const o of options) buckets.set(o.id, []);
  }
  for (const row of rows) {
    const v = cellValue(row, field.id);
    const key = isEmpty(v) ? EMPTY_GROUP : String(v);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(row);
  }

  const groups: RowGroup[] = [];
  for (const o of options) {
    const rs = buckets.get(o.id);
    if (rs && (includeEmptyGroups || rs.length)) {
      groups.push({ key: o.id, rows: rs });
      buckets.delete(o.id);
    }
  }
  // any option values not in the field's option list (stale), excluding empty
  for (const [key, rs] of buckets) {
    if (key !== EMPTY_GROUP) groups.push({ key, rows: rs });
  }
  const empty = buckets.get(EMPTY_GROUP);
  if (empty && (includeEmptyGroups || empty.length)) {
    groups.push({ key: EMPTY_GROUP, rows: empty });
  }
  return groups;
}

/** Full pipeline: filter then sort. */
export function buildViewRows(
  rows: IDatabaseRow[],
  filters: IFilter[],
  sorts: ISort[],
  fields: IDatabaseField[],
): IDatabaseRow[] {
  return applySorts(applyFilters(rows, filters, fields), sorts, fields);
}
