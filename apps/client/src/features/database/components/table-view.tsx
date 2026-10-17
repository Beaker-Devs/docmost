import { ActionIcon, Button, Table, Text } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { FieldType, IDatabaseField, IDatabaseRow, ISelectOption } from "../types/database.types";
import DatabaseCell from "./database-cell";
import FieldHeader, { AddFieldMenu } from "./field-header";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Props {
  fields: IDatabaseField[];
  rows: IDatabaseRow[];
  members: Member[];
  onCellChange: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onRenameField: (fieldId: string, name: string) => void;
  onChangeFieldType: (fieldId: string, type: FieldType) => void;
  onDeleteField: (fieldId: string) => void;
  onAddField: (name: string, type: FieldType) => void;
  onCreateOption: (fieldId: string, option: ISelectOption) => void;
}

export default function TableView({
  fields,
  rows,
  members,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onRenameField,
  onChangeFieldType,
  onDeleteField,
  onAddField,
  onCreateOption,
}: Props) {
  const { t } = useTranslation();
  return (
    <Table.ScrollContainer minWidth={Math.max(500, fields.length * 180 + 80)}>
      <Table withTableBorder withColumnBorders verticalSpacing={4} horizontalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {fields.map((f) => (
              <Table.Th key={f.id} style={{ minWidth: 160 }}>
                <FieldHeader
                  field={f}
                  canDelete={fields.length > 1}
                  onRename={(name) => onRenameField(f.id, name)}
                  onChangeType={(type) => onChangeFieldType(f.id, type)}
                  onDelete={() => onDeleteField(f.id)}
                />
              </Table.Th>
            ))}
            <Table.Th style={{ width: 44 }}>
              <AddFieldMenu onAdd={onAddField} />
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={fields.length + 1}>
                <Text size="sm" c="dimmed" ta="center" py="sm">
                  {t("No rows yet")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((row) => (
              <Table.Tr key={row.id}>
                {fields.map((f) => (
                  <Table.Td key={f.id} style={{ verticalAlign: "middle" }}>
                    <DatabaseCell
                      field={f}
                      value={row.cells?.[f.id]}
                      members={members}
                      onChange={(v) => onCellChange(row.id, f.id, v)}
                      onCreateOption={(opt) => onCreateOption(f.id, opt)}
                    />
                  </Table.Td>
                ))}
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={t("Delete row")}
                    onClick={() => onDeleteRow(row.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={onAddRow}
        mt={4}
      >
        {t("New row")}
      </Button>
    </Table.ScrollContainer>
  );
}
