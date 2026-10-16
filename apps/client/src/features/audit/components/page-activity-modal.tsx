import { useEffect, useState } from "react";
import {
  Badge,
  Group,
  Modal,
  Table,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import Paginate from "@/components/common/paginate.tsx";
import NoTableResults from "@/components/common/no-table-results.tsx";
import { usePageActivityQuery } from "@/features/audit/queries/audit-query.ts";
import { auditActionLabel } from "@/features/audit/audit-labels.ts";
import {
  CursorState,
  canGoPrev,
  goNext,
  goPrev,
  initialCursorState,
  pageNumber,
} from "@/features/audit/audit-pagination.ts";

interface PageActivityModalProps {
  pageId: string;
  opened: boolean;
  onClose: () => void;
}

export default function PageActivityModal({
  pageId,
  opened,
  onClose,
}: PageActivityModalProps) {
  const { t } = useTranslation();
  const [cursorState, setCursorState] = useState<CursorState>(
    initialCursorState(),
  );

  // reset paging whenever the modal is (re)opened or the page changes
  useEffect(() => {
    if (opened) {
      setCursorState(initialCursorState());
    }
  }, [opened, pageId]);

  const { data, isLoading } = usePageActivityQuery(
    { pageId, limit: 20, cursor: cursorState.cursor },
    opened,
  );

  const logs = data?.items ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Page activity")}
      size="lg"
    >
      <Text size="sm" c="dimmed" mb="md">
        {t("A record of recent activity on this page.")}
      </Text>

      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Time")}</Table.Th>
              <Table.Th>{t("User")}</Table.Th>
              <Table.Th>{t("Action")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.length === 0 && !isLoading ? (
              <NoTableResults colSpan={3} />
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
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Paginate
        currentPage={pageNumber(cursorState)}
        hasPrevPage={canGoPrev(cursorState)}
        hasNextPage={!!data?.nextCursor}
        onPageChange={(newPage) => {
          if (newPage > pageNumber(cursorState)) {
            if (data?.nextCursor) {
              setCursorState((s) => goNext(s, data.nextCursor as string));
            }
          } else {
            setCursorState((s) => goPrev(s));
          }
        }}
      />
    </Modal>
  );
}
