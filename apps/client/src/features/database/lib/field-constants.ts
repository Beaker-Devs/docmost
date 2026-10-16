import { FieldType } from "../types/database.types";

// Mantine color names used for select-option swatches
export const OPTION_COLORS = [
  "gray",
  "red",
  "pink",
  "grape",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
] as const;

export function colorForOption(color?: string): string {
  return color && OPTION_COLORS.includes(color as any) ? color : "gray";
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  multi_select: "Multi-select",
  date: "Date",
  checkbox: "Checkbox",
  user: "Person",
  url: "URL",
};

export function randomOptionColor(): string {
  return OPTION_COLORS[Math.floor(Math.random() * OPTION_COLORS.length)];
}

export function slugId(): string {
  return Math.random().toString(36).slice(2, 10);
}
