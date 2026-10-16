import api from "@/lib/api-client";
import {
  FieldType,
  IDatabase,
  IDatabaseField,
  IDatabaseRow,
  IDatabaseView,
  ViewType,
} from "../types/database.types";

export async function createDatabase(data: {
  spaceId: string;
  title?: string;
}): Promise<IDatabase> {
  const req = await api.post("/databases/create", data);
  return req.data;
}

export async function getDatabase(databaseId: string): Promise<IDatabase> {
  const req = await api.post("/databases/info", { databaseId });
  return req.data;
}

export async function updateDatabase(data: {
  databaseId: string;
  title?: string;
  icon?: string;
}): Promise<IDatabase> {
  const req = await api.post("/databases/update", data);
  return req.data;
}

export async function getRows(databaseId: string): Promise<IDatabaseRow[]> {
  const req = await api.post("/databases/rows/list", { databaseId });
  return req.data;
}

export async function createRow(data: {
  databaseId: string;
  cells?: Record<string, any>;
}): Promise<IDatabaseRow> {
  const req = await api.post("/databases/rows/create", data);
  return req.data;
}

export async function updateRow(data: {
  rowId: string;
  cells: Record<string, any>;
}): Promise<IDatabaseRow> {
  const req = await api.post("/databases/rows/update", data);
  return req.data;
}

export async function deleteRow(rowId: string): Promise<void> {
  await api.post("/databases/rows/delete", { rowId });
}

export async function createField(data: {
  databaseId: string;
  name: string;
  type: FieldType;
  config?: Record<string, any>;
}): Promise<IDatabaseField> {
  const req = await api.post("/databases/fields/create", data);
  return req.data;
}

export async function updateField(data: {
  fieldId: string;
  name?: string;
  type?: FieldType;
  config?: Record<string, any>;
  position?: string;
}): Promise<IDatabaseField> {
  const req = await api.post("/databases/fields/update", data);
  return req.data;
}

export async function deleteField(fieldId: string): Promise<void> {
  await api.post("/databases/fields/delete", { fieldId });
}

export async function createView(data: {
  databaseId: string;
  name?: string;
  type?: ViewType;
}): Promise<IDatabaseView> {
  const req = await api.post("/databases/views/create", data);
  return req.data;
}

export async function updateView(data: {
  viewId: string;
  name?: string;
  type?: ViewType;
  filters?: any[];
  sorts?: any[];
  groupBy?: string | null;
  config?: Record<string, any>;
}): Promise<IDatabaseView> {
  const req = await api.post("/databases/views/update", data);
  return req.data;
}

export async function deleteView(viewId: string): Promise<void> {
  await api.post("/databases/views/delete", { viewId });
}
