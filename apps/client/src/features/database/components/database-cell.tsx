import { useEffect, useState } from "react";
import {
  Badge,
  Checkbox,
  Group,
  Menu,
  NumberInput,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IDatabaseField, ISelectOption } from "../types/database.types";
import {
  colorForOption,
  randomOptionColor,
  slugId,
} from "../lib/field-constants";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface CellProps {
  field: IDatabaseField;
  value: any;
  onChange: (value: any) => void;
  onCreateOption?: (option: ISelectOption) => void;
  members?: Member[];
}

function OptionBadge({ option }: { option?: ISelectOption }) {
  if (!option) return null;
  return (
    <Badge
      variant="light"
      color={colorForOption(option.color)}
      radius="sm"
      styles={{ root: { textTransform: "none" } }}
    >
      {option.name}
    </Badge>
  );
}

function SelectCell({
  field,
  value,
  onChange,
  onCreateOption,
  multi,
}: CellProps & { multi?: boolean }) {
  const [search, setSearch] = useState("");
  const options = field.config?.options ?? [];
  const selectedIds: string[] = multi
    ? Array.isArray(value)
      ? value
      : []
    : value
      ? [value]
      : [];

  const toggle = (id: string) => {
    if (multi) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      onChange(next);
    } else {
      onChange(selectedIds[0] === id ? null : id);
    }
  };

  const createAndSelect = () => {
    const name = search.trim();
    if (!name) return;
    const option: ISelectOption = {
      id: slugId(),
      name,
      color: randomOptionColor(),
    };
    onCreateOption?.(option);
    setSearch("");
    if (multi) onChange([...selectedIds, option.id]);
    else onChange(option.id);
  };

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );
  const exact = options.some(
    (o) => o.name.toLowerCase() === search.trim().toLowerCase(),
  );

  return (
    <Menu shadow="md" width={240} position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton
          style={{ display: "block", width: "100%", minHeight: 24 }}
        >
          <Group gap={4} wrap="wrap">
            {selectedIds.length === 0 ? (
              <Text size="sm" c="dimmed">
                &nbsp;
              </Text>
            ) : (
              selectedIds.map((id) => (
                <OptionBadge
                  key={id}
                  option={options.find((o) => o.id === id)}
                />
              ))
            )}
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <TextInput
          placeholder="Search or create…"
          size="xs"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim() && !exact) createAndSelect();
          }}
          mb={6}
        />
        {filtered.map((o) => (
          <Menu.Item key={o.id} onClick={() => toggle(o.id)}>
            <Group justify="space-between">
              <OptionBadge option={o} />
              {selectedIds.includes(o.id) && <Text size="xs">✓</Text>}
            </Group>
          </Menu.Item>
        ))}
        {search.trim() && !exact && (
          <Menu.Item
            leftSection={<IconPlus size={14} />}
            onClick={createAndSelect}
          >
            Create "{search.trim()}"
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

function UserCell({ value, onChange, members = [] }: CellProps) {
  const selected = members.find((m) => m.id === value);
  return (
    <Menu shadow="md" width={240} position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton style={{ display: "block", width: "100%", minHeight: 24 }}>
          {selected ? (
            <Group gap={6} wrap="nowrap">
              <CustomAvatar
                avatarUrl={selected.avatarUrl ?? ""}
                name={selected.name}
                size="xs"
              />
              <Text size="sm">{selected.name}</Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              &nbsp;
            </Text>
          )}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {value && (
          <Menu.Item onClick={() => onChange(null)} c="dimmed">
            Clear
          </Menu.Item>
        )}
        {members.map((m) => (
          <Menu.Item key={m.id} onClick={() => onChange(m.id)}>
            <Group gap={6} wrap="nowrap">
              <CustomAvatar avatarUrl={m.avatarUrl ?? ""} name={m.name} size="xs" />
              <Text size="sm">{m.name}</Text>
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

function TextLikeCell({ field, value, onChange }: CellProps) {
  const [local, setLocal] = useState<string>(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value]);
  return (
    <TextInput
      variant="unstyled"
      size="sm"
      value={local}
      placeholder=""
      type={field.type === "url" ? "url" : "text"}
      onChange={(e) => setLocal(e.currentTarget.value)}
      onBlur={() => {
        if ((value ?? "") !== local) onChange(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      styles={{ input: { minHeight: 24, height: 24 } }}
    />
  );
}

export default function DatabaseCell(props: CellProps) {
  const { field, value, onChange } = props;

  switch (field.type) {
    case "number": {
      return (
        <NumberInput
          variant="unstyled"
          size="sm"
          hideControls
          value={value ?? ""}
          onChange={(v) => onChange(v === "" ? null : v)}
          styles={{ input: { minHeight: 24, height: 24 } }}
        />
      );
    }
    case "checkbox":
      return (
        <Checkbox
          checked={value === true}
          onChange={(e) => onChange(e.currentTarget.checked)}
        />
      );
    case "select":
      return <SelectCell {...props} />;
    case "multi_select":
      return <SelectCell {...props} multi />;
    case "user":
      return <UserCell {...props} />;
    case "date":
      return (
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.currentTarget.value || null)}
          style={{
            border: "none",
            background: "transparent",
            font: "inherit",
            color: "inherit",
            width: "100%",
            outline: "none",
          }}
        />
      );
    case "url":
      return <TextLikeCell {...props} />;
    default:
      return <TextLikeCell {...props} />;
  }
}
