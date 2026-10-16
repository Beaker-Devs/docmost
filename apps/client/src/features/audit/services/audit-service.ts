import api from "@/lib/api-client";
import { IPagination } from "@/lib/types";
import { IAuditLog, IAuditLogParams } from "../types/audit.types";

export async function getAuditLogs(
  params: IAuditLogParams,
): Promise<IPagination<IAuditLog>> {
  const req = await api.post("/audit-logs/list", params);
  return req.data;
}

export async function getAuditActions(): Promise<string[]> {
  const req = await api.post("/audit-logs/actions", {});
  return req.data;
}
