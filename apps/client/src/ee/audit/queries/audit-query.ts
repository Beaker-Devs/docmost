import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAuditActions,
  getAuditLogs,
} from "@/ee/audit/services/audit-service";
import { IAuditLogParams } from "@/ee/audit/types/audit.types";

export function useAuditLogsQuery(params: IAuditLogParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditActionsQuery() {
  return useQuery({
    queryKey: ["audit-actions"],
    queryFn: () => getAuditActions(),
  });
}
