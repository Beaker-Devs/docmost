export type FieldType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "user"
  | "url";

export type ViewType = "table" | "board";

export interface ISelectOption {
  id: string;
  name: string;
  color?: string;
}

export interface IFieldConfig {
  options?: ISelectOption[];
}

export interface IDatabaseField {
  id: string;
  name: string;
  type: FieldType;
  position: string | null;
  config: IFieldConfig | null;
  databaseId: string;
}

export interface IDatabaseRow {
  id: string;
  position: string | null;
  cells: Record<string, any>;
  databaseId: string;
  createdAt: string;
}

export type FilterOp =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "checked"
  | "unchecked";

export interface IFilter {
  id: string;
  fieldId: string;
  op: FilterOp;
  value?: any;
}

export interface ISort {
  fieldId: string;
  direction: "asc" | "desc";
}

export interface IDatabaseView {
  id: string;
  name: string;
  type: ViewType;
  filters: IFilter[];
  sorts: ISort[];
  groupBy: string | null;
  config: Record<string, any> | null;
  position: string | null;
  databaseId: string;
}

export interface IDatabase {
  id: string;
  title: string;
  icon: string | null;
  spaceId: string;
  workspaceId: string;
  fields: IDatabaseField[];
  views: IDatabaseView[];
}
