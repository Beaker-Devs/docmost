import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAuditActions,
  getAuditLogs,
  getPageActivity,
} from "@/features/audit/services/audit-service";
import {
  IAuditLogParams,
  IPageActivityParams,
} from "@/features/audit/types/audit.types";

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

export function usePageActivityQuery(
  params: IPageActivityParams,
  enabled = true,
) {
  return useQuery({
    queryKey: ["page-activity", params],
    queryFn: () => getPageActivity(params),
    placeholderData: keepPreviousData,
    enabled: enabled && !!params.pageId,
  });
}
