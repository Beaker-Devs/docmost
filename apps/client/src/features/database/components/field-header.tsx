import { useState } from "react";
import {
  ActionIcon,
  Group,
  Menu,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconAbc,
  IconCalendar,
  IconCheckbox,
  IconChevronDown,
  IconHash,
  IconLink,
  IconList,
  IconListCheck,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { FieldType, IDatabaseField } from "../types/database.types";
import { FIELD_TYPE_LABELS } from "../lib/field-constants";

const TYPE_ICON: Record<FieldType, React.FC<any>> = {
  text: IconAbc,
  number: IconHash,
  select: IconList,
  multi_select: IconListCheck,
  date: IconCalendar,
  checkbox: IconCheckbox,
  user: IconUser,
  url: IconLink,
};

interface Props {
  field: IDatabaseField;
  onRename: (name: string) => void;
  onChangeType: (type: FieldType) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function FieldHeader({
  field,
  onRename,
  onChangeType,
  onDelete,
  canDelete,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(field.name);
  const Icon = TYPE_ICON[field.type];

  return (
    <Menu shadow="md" width={240} position="bottom-start" withinPortal>
      <Menu.Target>
        <Group
          gap={4}
          wrap="nowrap"
          style={{ cursor: "pointer", width: "100%" }}
        >
          <Icon size={14} opacity={0.6} />
          <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
            {field.name}
          </Text>
          <IconChevronDown size={12} opacity={0.4} />
        </Group>
      </Menu.Target>
      <Menu.Dropdown>
        <TextInput
          size="xs"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onBlur={() => name.trim() && name !== field.name && onRename(name.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (name.trim()) onRename(name.trim());
              (e.target as HTMLInputElement).blur();
            }
          }}
          mb={6}
        />
        <Menu.Label>{t("Type")}</Menu.Label>
        {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((ft) => {
          const TIcon = TYPE_ICON[ft];
          return (
            <Menu.Item
              key={ft}
              leftSection={<TIcon size={14} />}
              rightSection={
                field.type === ft ? <Text size="xs">✓</Text> : null
              }
              onClick={() => onChangeType(ft)}
            >
              {t(FIELD_TYPE_LABELS[ft])}
            </Menu.Item>
          );
        })}
        {canDelete && (
          <>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={onDelete}
            >
              {t("Delete property")}
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

interface AddFieldProps {
  onAdd: (name: string, type: FieldType) => void;
}

export function AddFieldMenu({ onAdd }: AddFieldProps) {
  const { t } = useTranslation();
  return (
    <Menu shadow="md" width={220} position="bottom-start" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={t("Add property")}>
          <Text size="sm">+</Text>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("New property")}</Menu.Label>
        {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((ft) => {
          const TIcon = TYPE_ICON[ft];
          return (
            <Menu.Item
              key={ft}
              leftSection={<TIcon size={14} />}
              onClick={() => onAdd(FIELD_TYPE_LABELS[ft], ft)}
            >
              {t(FIELD_TYPE_LABELS[ft])}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
