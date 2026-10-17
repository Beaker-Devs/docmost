import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Group,
  Menu,
  ScrollArea,
  Text,
} from "@mantine/core";
import { IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import {
  IDatabaseField,
  IDatabaseRow,
  ISelectOption,
} from "../types/database.types";
import { EMPTY_GROUP, groupRows } from "../lib/view-logic";
import { colorForOption } from "../lib/field-constants";

interface Props {
  fields: IDatabaseField[];
  groupField: IDatabaseField;
  rows: IDatabaseRow[];
  onAddRow: (groupValue: string | null) => void;
  onDeleteRow: (rowId: string) => void;
  onSetGroup: (rowId: string, value: string | null) => void;
}

function cellText(row: IDatabaseRow, field: IDatabaseField): string {
  const v = row.cells?.[field.id];
  if (v === null || v === undefined || v === "") return "";
  if (field.type === "select") {
    return field.config?.options?.find((o) => o.id === v)?.name ?? String(v);
  }
  if (field.type === "checkbox") return v ? "✓" : "";
  return String(v);
}

function CardBody({
  row,
  primary,
  fields,
  groupField,
}: {
  row: IDatabaseRow;
  primary: IDatabaseField;
  fields: IDatabaseField[];
  groupField: IDatabaseField;
}) {
  return (
    <>
      <Text size="sm" fw={500} lineClamp={2}>
        {cellText(row, primary) || "Untitled"}
      </Text>
      <Group gap={4} mt={6} wrap="wrap">
        {fields
          .slice(1)
          .filter((f) => f.id !== groupField.id)
          .map((f) => {
            const t = cellText(row, f);
            return t ? (
              <Text key={f.id} size="xs" c="dimmed">
                {t}
              </Text>
            ) : null;
          })}
      </Group>
    </>
  );
}

function DraggableCard({
  row,
  primary,
  fields,
  groupField,
  options,
  onDeleteRow,
  onSetGroup,
}: {
  row: IDatabaseRow;
  primary: IDatabaseField;
  fields: IDatabaseField[];
  groupField: IDatabaseField;
  options: ISelectOption[];
  onDeleteRow: (rowId: string) => void;
  onSetGroup: (rowId: string, value: string | null) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: row.id,
  });

  return (
    <Card
      ref={setNodeRef}
      withBorder
      radius="md"
      padding="sm"
      mb="xs"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap={4} wrap="nowrap" align="flex-start" style={{ flex: 1 }}>
          <Box
            {...attributes}
            {...listeners}
            style={{ cursor: "grab", color: "var(--mantine-color-dimmed)" }}
            aria-label={t("Drag")}
          >
            <IconGripVertical size={14} />
          </Box>
          <Box style={{ flex: 1 }}>
            <CardBody
              row={row}
              primary={primary}
              fields={fields}
              groupField={groupField}
            />
          </Box>
        </Group>
        <Menu shadow="md" position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="xs">
              ⋯
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{t("Move to")}</Menu.Label>
            {options.map((o) => (
              <Menu.Item key={o.id} onClick={() => onSetGroup(row.id, o.id)}>
                {o.name}
              </Menu.Item>
            ))}
            <Menu.Item onClick={() => onSetGroup(row.id, null)}>
              {t("No {{name}}", { name: groupField.name })}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => onDeleteRow(row.id)}
            >
              {t("Delete")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}

function Column({
  groupKey,
  meta,
  count,
  groupField,
  onAddRow,
  children,
}: {
  groupKey: string;
  meta: ISelectOption | null;
  count: number;
  groupField: IDatabaseField;
  onAddRow: (groupValue: string | null) => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: groupKey });

  return (
    <Box
      ref={setNodeRef}
      w={260}
      p={6}
      style={{
        flexShrink: 0,
        borderRadius: 8,
        background: isOver
          ? "var(--mantine-color-default-hover)"
          : "transparent",
      }}
    >
      <Group justify="space-between" mb="xs" px={4}>
        <Group gap={6}>
          {meta ? (
            <Badge
              variant="light"
              color={colorForOption(meta.color)}
              radius="sm"
              styles={{ root: { textTransform: "none" } }}
            >
              {meta.name}
            </Badge>
          ) : (
            <Text size="sm" c="dimmed">
              {t("No {{name}}", { name: groupField.name })}
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {count}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={t("Add card")}
          onClick={() => onAddRow(groupKey === EMPTY_GROUP ? null : groupKey)}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Group>
      {children}
    </Box>
  );
}

export default function BoardView({
  fields,
  groupField,
  rows,
  onAddRow,
  onDeleteRow,
  onSetGroup,
}: Props) {
  const primary = fields[0];
  const groups = groupRows(rows, groupField, true);
  const options = groupField.config?.options ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const columnMeta = (key: string): ISelectOption | null =>
    key === EMPTY_GROUP
      ? null
      : (options.find((o) => o.id === key) ?? { id: key, name: key });

  const currentGroupOf = (rowId: string): string => {
    const v = rows.find((r) => r.id === rowId)?.cells?.[groupField.id];
    return v === null || v === undefined || v === "" ? EMPTY_GROUP : String(v);
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const rowId = String(active.id);
    const target = String(over.id);
    if (currentGroupOf(rowId) === target) return;
    onSetGroup(rowId, target === EMPTY_GROUP ? null : target);
  };

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <ScrollArea type="auto" offsetScrollbars>
        <Group align="flex-start" gap="sm" wrap="nowrap" pb="sm">
          {groups.map((group) => (
            <Column
              key={group.key}
              groupKey={group.key}
              meta={columnMeta(group.key)}
              count={group.rows.length}
              groupField={groupField}
              onAddRow={onAddRow}
            >
              {group.rows.map((row) => (
                <DraggableCard
                  key={row.id}
                  row={row}
                  primary={primary}
                  fields={fields}
                  groupField={groupField}
                  options={options}
                  onDeleteRow={onDeleteRow}
                  onSetGroup={onSetGroup}
                />
              ))}
            </Column>
          ))}
        </Group>
      </ScrollArea>

      <DragOverlay>
        {activeRow ? (
          <Card withBorder radius="md" padding="sm" style={{ width: 240 }}>
            <CardBody
              row={activeRow}
              primary={primary}
              fields={fields}
              groupField={groupField}
            />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
