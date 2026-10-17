import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Group,
  Loader,
  Menu,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconLayoutKanban,
  IconPlus,
  IconTable,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useWorkspaceMembersQuery } from "@/features/workspace/queries/workspace-query.ts";
import {
  useDatabaseMutations,
  useDatabaseQuery,
  useDatabaseRowsQuery,
} from "../queries/database-query";
import { FieldType, IDatabaseView, ISelectOption } from "../types/database.types";
import { buildViewRows } from "../lib/view-logic";
import TableView from "./table-view";
import BoardView from "./board-view";
import ViewToolbar from "./view-toolbar";

interface Props {
  databaseId: string;
}

export default function DatabaseView({ databaseId }: Props) {
  const { t } = useTranslation();
  const { data: database, isLoading } = useDatabaseQuery(databaseId);
  const { data: rows } = useDatabaseRowsQuery(databaseId);
  const { data: members } = useWorkspaceMembersQuery({ limit: 100 });
  const m = useDatabaseMutations(databaseId);

  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    if (database) setTitleDraft(database.title);
  }, [database?.title]);

  const views = database?.views ?? [];
  useEffect(() => {
    if (views.length && (!activeViewId || !views.find((v) => v.id === activeViewId))) {
      setActiveViewId(views[0].id);
    }
  }, [views, activeViewId]);

  const fields = database?.fields ?? [];
  const memberList =
    members?.items?.map((u: any) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
    })) ?? [];

  const activeView = views.find((v) => v.id === activeViewId) ?? views[0];

  const viewRows = useMemo(() => {
    if (!activeView || !rows) return [];
    return buildViewRows(rows, activeView.filters, activeView.sorts, fields);
  }, [rows, activeView, fields]);

  if (isLoading || !database) {
    return (
      <Box p="md">
        <Loader size="sm" />
      </Box>
    );
  }

  const updateView = (patch: Partial<IDatabaseView>) => {
    if (!activeView) return;
    m.updateView.mutate({ viewId: activeView.id, ...patch } as any);
  };

  const onCreateOption = (fieldId: string, option: ISelectOption) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const options = [...(field.config?.options ?? []), option];
    m.updateField.mutate({ fieldId, config: { ...field.config, options } });
  };

  const addView = (type: "table" | "board") => {
    m.createView.mutate(
      { databaseId, name: type === "board" ? "Board" : "Table", type },
      { onSuccess: (v) => setActiveViewId(v.id) },
    );
  };

  const groupField =
    activeView?.groupBy != null
      ? fields.find((f) => f.id === activeView.groupBy)
      : undefined;

  return (
    <Box
      style={{
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: 8,
        padding: 12,
      }}
    >
      {/* title */}
      <TextInput
        variant="unstyled"
        size="md"
        fw={600}
        value={titleDraft}
        placeholder={t("Untitled database")}
        onChange={(e) => setTitleDraft(e.currentTarget.value)}
        onBlur={() => {
          if (titleDraft.trim() && titleDraft !== database.title) {
            m.updateDatabase.mutate({ databaseId, title: titleDraft.trim() });
          }
        }}
        styles={{ input: { fontSize: 18, fontWeight: 600 } }}
        mb={4}
      />

      {/* view tabs */}
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Tabs
          value={activeViewId}
          onChange={setActiveViewId}
          variant="default"
          style={{ flex: 1, minWidth: 0 }}
        >
          <Tabs.List>
            {views.map((v) => (
              <Tabs.Tab
                key={v.id}
                value={v.id}
                leftSection={
                  v.type === "board" ? (
                    <IconLayoutKanban size={14} />
                  ) : (
                    <IconTable size={14} />
                  )
                }
                rightSection={
                  views.length > 1 ? (
                    <Menu withinPortal position="bottom" shadow="md">
                      <Menu.Target>
                        <Text
                          component="span"
                          size="xs"
                          c="dimmed"
                          px={2}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⋯
                        </Text>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => m.deleteView.mutate(v.id)}
                        >
                          {t("Delete view")}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  ) : null
                }
              >
                {v.name}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        <Menu withinPortal position="bottom-end" shadow="md">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label={t("Add view")}>
              <IconPlus size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconTable size={14} />}
              onClick={() => addView("table")}
            >
              {t("Table")}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLayoutKanban size={14} />}
              onClick={() => addView("board")}
            >
              {t("Board")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* toolbar */}
      {activeView && (
        <Group mb="sm">
          <ViewToolbar
            view={activeView}
            fields={fields}
            members={memberList}
            onChange={updateView}
          />
        </Group>
      )}

      {/* active view */}
      {activeView?.type === "board" ? (
        groupField ? (
          <BoardView
            fields={fields}
            groupField={groupField}
            rows={viewRows}
            onAddRow={(groupValue) =>
              m.createRow.mutate({
                databaseId,
                cells: groupValue ? { [groupField.id]: groupValue } : {},
              })
            }
            onDeleteRow={(rowId) => m.deleteRow.mutate(rowId)}
            onSetGroup={(rowId, value) =>
              m.updateRow.mutate({ rowId, cells: { [groupField.id]: value } })
            }
          />
        ) : (
          <Alert color="gray" variant="light">
            {t("Pick a Group property (a Select field) to see the board.")}
          </Alert>
        )
      ) : (
        <TableView
          fields={fields}
          rows={viewRows}
          members={memberList}
          onCellChange={(rowId, fieldId, value) =>
            m.updateRow.mutate({ rowId, cells: { [fieldId]: value } })
          }
          onAddRow={() => m.createRow.mutate({ databaseId })}
          onDeleteRow={(rowId) => m.deleteRow.mutate(rowId)}
          onRenameField={(fieldId, name) =>
            m.updateField.mutate({ fieldId, name })
          }
          onChangeFieldType={(fieldId, type: FieldType) =>
            m.updateField.mutate({ fieldId, type })
          }
          onDeleteField={(fieldId) => m.deleteField.mutate(fieldId)}
          onAddField={(name, type) =>
            m.createField.mutate({
              databaseId,
              name,
              type,
              config:
                type === "select" || type === "multi_select"
                  ? { options: [] }
                  : {},
            })
          }
          onCreateOption={onCreateOption}
        />
      )}
    </Box>
  );
}
