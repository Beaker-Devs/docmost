import api from "@/lib/api-client";
import {
  IAuditLogList,
  IAuditLogParams,
  IPageActivityParams,
} from "../types/audit.types";

export async function getAuditLogs(
  params: IAuditLogParams,
): Promise<IAuditLogList> {
  const req = await api.post("/audit-logs/list", params);
  return req.data;
}

export async function getAuditActions(): Promise<string[]> {
  const req = await api.post("/audit-logs/actions", {});
  return req.data;
}

export async function getPageActivity(
  params: IPageActivityParams,
): Promise<IAuditLogList> {
  const req = await api.post("/audit-logs/page", params);
  return req.data;
}
