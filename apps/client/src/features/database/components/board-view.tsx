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
import { IconPlus, IconTrash } from "@tabler/icons-react";
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

  const columnMeta = (key: string): ISelectOption | null =>
    key === EMPTY_GROUP
      ? null
      : (options.find((o) => o.id === key) ?? { id: key, name: key });

  return (
    <ScrollArea type="auto" offsetScrollbars>
      <Group align="flex-start" gap="sm" wrap="nowrap" pb="sm">
        {groups.map((group) => {
          const meta = columnMeta(group.key);
          return (
            <Box key={group.key} w={260} style={{ flexShrink: 0 }}>
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
                      No {groupField.name}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed">
                    {group.rows.length}
                  </Text>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="Add card"
                  onClick={() =>
                    onAddRow(group.key === EMPTY_GROUP ? null : group.key)
                  }
                >
                  <IconPlus size={14} />
                </ActionIcon>
              </Group>

              {group.rows.map((row) => (
                <Card
                  key={row.id}
                  withBorder
                  radius="md"
                  padding="sm"
                  mb="xs"
                >
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text size="sm" fw={500} lineClamp={2}>
                      {cellText(row, primary) || "Untitled"}
                    </Text>
                    <Menu shadow="md" position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="xs">
                          ⋯
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Move to</Menu.Label>
                        {options.map((o) => (
                          <Menu.Item
                            key={o.id}
                            onClick={() => onSetGroup(row.id, o.id)}
                          >
                            {o.name}
                          </Menu.Item>
                        ))}
                        <Menu.Item onClick={() => onSetGroup(row.id, null)}>
                          No {groupField.name}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => onDeleteRow(row.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
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
                </Card>
              ))}
            </Box>
          );
        })}
      </Group>
    </ScrollArea>
  );
}
