import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Badge,
  Group,
  Select,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import Paginate from "@/components/common/paginate.tsx";
import NoTableResults from "@/components/common/no-table-results.tsx";
import useUserRole from "@/hooks/use-user-role.tsx";
import { getAppName } from "@/lib/config.ts";
import {
  useAuditActionsQuery,
  useAuditLogsQuery,
} from "@/features/audit/queries/audit-query.ts";
import { auditActionLabel } from "@/features/audit/audit-labels.ts";
import { IAuditLog } from "@/features/audit/types/audit.types.ts";
import { useWorkspaceMembersQuery } from "@/features/workspace/queries/workspace-query.ts";

function resourceSummary(log: IAuditLog): string {
  const d = log.detail || {};
  return (
    d.title || d.name || d.email || log.resourceId || log.resourceType || "—"
  );
}

export default function AuditLog() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();

  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { data, isLoading } = useAuditLogsQuery({
    page,
    limit: 30,
    action: action ?? undefined,
    userId: userId ?? undefined,
  });
  const { data: actions } = useAuditActionsQuery();
  const { data: members } = useWorkspaceMembersQuery({ limit: 100 });

  if (!isAdmin) {
    return null;
  }

  const actionOptions =
    actions?.map((a) => ({ value: a, label: auditActionLabel(a, t) })) ?? [];
  const memberOptions =
    members?.items?.map((m) => ({ value: m.id, label: m.name })) ?? [];

  const logs = data?.items ?? [];

  return (
    <>
      <Helmet>
        <title>
          {t("Audit log")} - {getAppName()}
        </title>
      </Helmet>
      <SettingsTitle title={t("Audit log")} />

      <Text size="sm" c="dimmed" mb="md">
        {t("A record of activity across your workspace.")}
      </Text>

      <Group mb="sm" gap="sm">
        <Select
          placeholder={t("All actions")}
          data={actionOptions}
          value={action}
          onChange={(v) => {
            setAction(v);
            setPage(1);
          }}
          searchable
          clearable
          w={220}
        />
        <Select
          placeholder={t("All members")}
          data={memberOptions}
          value={userId}
          onChange={(v) => {
            setUserId(v);
            setPage(1);
          }}
          searchable
          clearable
          w={220}
        />
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Time")}</Table.Th>
              <Table.Th>{t("User")}</Table.Th>
              <Table.Th>{t("Action")}</Table.Th>
              <Table.Th>{t("Resource")}</Table.Th>
              <Table.Th>{t("IP address")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.length === 0 && !isLoading ? (
              <NoTableResults colSpan={5} />
            ) : (
              logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(log.createdAt).toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {log.actor ? (
                      <Group gap="xs" wrap="nowrap">
                        <CustomAvatar
                          avatarUrl={log.actor.avatarUrl ?? ""}
                          name={log.actor.name}
                          size="sm"
                        />
                        <Text size="sm" lineClamp={1}>
                          {log.actor.name}
                        </Text>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t("System")}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="gray" radius="sm">
                      {auditActionLabel(log.action, t)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {resourceSummary(log)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip
                      label={log.userAgent || ""}
                      disabled={!log.userAgent}
                      multiline
                      w={320}
                    >
                      <Text size="sm" c="dimmed">
                        {log.ipAddress || "—"}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {data?.meta && (
        <Paginate
          currentPage={page}
          hasPrevPage={data.meta.hasPrevPage}
          hasNextPage={data.meta.hasNextPage}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
