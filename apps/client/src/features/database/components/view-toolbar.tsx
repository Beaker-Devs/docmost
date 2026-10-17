import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconArrowsSort,
  IconFilter,
  IconLayoutColumns,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  FieldType,
  FilterOp,
  IDatabaseField,
  IDatabaseView,
  IFilter,
  ISort,
} from "../types/database.types";
import { slugId } from "../lib/field-constants";

const OPS_BY_TYPE: Record<FieldType, FilterOp[]> = {
  text: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"],
  url: ["contains", "not_contains", "is", "is_not", "is_empty", "is_not_empty"],
  number: ["is", "is_not", "gt", "lt", "gte", "lte", "is_empty", "is_not_empty"],
  select: ["is", "is_not", "is_empty", "is_not_empty"],
  multi_select: ["is", "is_not", "is_empty", "is_not_empty"],
  user: ["is", "is_not", "is_empty", "is_not_empty"],
  date: ["is", "gt", "lt", "is_empty", "is_not_empty"],
  checkbox: ["checked", "unchecked"],
};

const OP_LABEL: Record<FilterOp, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  not_contains: "does not contain",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  gt: "greater than",
  lt: "less than",
  gte: "≥",
  lte: "≤",
  checked: "is checked",
  unchecked: "is unchecked",
};

const NO_VALUE_OPS: FilterOp[] = [
  "is_empty",
  "is_not_empty",
  "checked",
  "unchecked",
];

interface Props {
  view: IDatabaseView;
  fields: IDatabaseField[];
  members: { id: string; name: string }[];
  onChange: (patch: Partial<IDatabaseView>) => void;
}

function FilterValue({
  field,
  value,
  onChange,
  members,
}: {
  field: IDatabaseField;
  value: any;
  onChange: (v: any) => void;
  members: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  if (field.type === "select" || field.type === "multi_select") {
    return (
      <Select
        size="xs"
        placeholder={t("Value")}
        data={(field.config?.options ?? []).map((o) => ({
          value: o.id,
          label: o.name,
        }))}
        value={value ?? null}
        onChange={onChange}
        w={130}
      />
    );
  }
  if (field.type === "user") {
    return (
      <Select
        size="xs"
        placeholder={t("Person")}
        data={members.map((m) => ({ value: m.id, label: m.name }))}
        value={value ?? null}
        onChange={onChange}
        w={130}
      />
    );
  }
  if (field.type === "date") {
    return (
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    );
  }
  return (
    <TextInput
      size="xs"
      placeholder={t("Value")}
      value={value ?? ""}
      onChange={(e) => onChange(e.currentTarget.value)}
      w={130}
    />
  );
}

export default function ViewToolbar({
  view,
  fields,
  members,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const fieldById = new Map(fields.map((f) => [f.id, f]));
  const selectFields = fields.filter((f) => f.type === "select");
  const fieldOptions = fields.map((f) => ({ value: f.id, label: f.name }));

  const filters = view.filters ?? [];
  const sorts = view.sorts ?? [];

  const setFilters = (next: IFilter[]) => onChange({ filters: next });
  const setSorts = (next: ISort[]) => onChange({ sorts: next });

  const addFilter = () => {
    const f = fields[0];
    setFilters([
      ...filters,
      { id: slugId(), fieldId: f.id, op: OPS_BY_TYPE[f.type][0] },
    ]);
  };
  const addSort = () => {
    setSorts([...sorts, { fieldId: fields[0].id, direction: "asc" }]);
  };

  return (
    <Group gap="xs">
      {/* Filter */}
      <Popover position="bottom-start" withinPortal shadow="md" width={360}>
        <Popover.Target>
          <Button
            size="xs"
            variant={filters.length ? "light" : "subtle"}
            color="gray"
            leftSection={<IconFilter size={14} />}
          >
            {t("Filter")}
            {filters.length ? ` (${filters.length})` : ""}
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            {filters.length === 0 && (
              <Text size="xs" c="dimmed">
                {t("No filters")}
              </Text>
            )}
            {filters.map((f, i) => {
              const field = fieldById.get(f.fieldId) ?? fields[0];
              const ops = OPS_BY_TYPE[field.type];
              return (
                <Group key={f.id} gap={4} wrap="nowrap">
                  <Select
                    size="xs"
                    data={fieldOptions}
                    value={f.fieldId}
                    onChange={(v) => {
                      const nf = fieldById.get(v!)!;
                      const next = [...filters];
                      next[i] = {
                        ...f,
                        fieldId: v!,
                        op: OPS_BY_TYPE[nf.type][0],
                        value: undefined,
                      };
                      setFilters(next);
                    }}
                    w={110}
                  />
                  <Select
                    size="xs"
                    data={ops.map((o) => ({ value: o, label: t(OP_LABEL[o]) }))}
                    value={f.op}
                    onChange={(v) => {
                      const next = [...filters];
                      next[i] = { ...f, op: v as FilterOp };
                      setFilters(next);
                    }}
                    w={110}
                  />
                  {!NO_VALUE_OPS.includes(f.op) && (
                    <FilterValue
                      field={field}
                      value={f.value}
                      members={members}
                      onChange={(v) => {
                        const next = [...filters];
                        next[i] = { ...f, value: v };
                        setFilters(next);
                      }}
                    />
                  )}
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() =>
                      setFilters(filters.filter((x) => x.id !== f.id))
                    }
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Group>
              );
            })}
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconPlus size={14} />}
              onClick={addFilter}
            >
              {t("Add filter")}
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      {/* Sort */}
      <Popover position="bottom-start" withinPortal shadow="md" width={320}>
        <Popover.Target>
          <Button
            size="xs"
            variant={sorts.length ? "light" : "subtle"}
            color="gray"
            leftSection={<IconArrowsSort size={14} />}
          >
            {t("Sort")}
            {sorts.length ? ` (${sorts.length})` : ""}
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            {sorts.length === 0 && (
              <Text size="xs" c="dimmed">
                {t("No sorts")}
              </Text>
            )}
            {sorts.map((s, i) => (
              <Group key={i} gap={4} wrap="nowrap">
                <Select
                  size="xs"
                  data={fieldOptions}
                  value={s.fieldId}
                  onChange={(v) => {
                    const next = [...sorts];
                    next[i] = { ...s, fieldId: v! };
                    setSorts(next);
                  }}
                  w={140}
                />
                <Select
                  size="xs"
                  data={[
                    { value: "asc", label: t("Ascending") },
                    { value: "desc", label: t("Descending") },
                  ]}
                  value={s.direction}
                  onChange={(v) => {
                    const next = [...sorts];
                    next[i] = { ...s, direction: v as "asc" | "desc" };
                    setSorts(next);
                  }}
                  w={120}
                />
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setSorts(sorts.filter((_, x) => x !== i))}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconPlus size={14} />}
              onClick={addSort}
            >
              {t("Add sort")}
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      {/* Group */}
      <Select
        size="xs"
        variant="subtle"
        leftSection={<IconLayoutColumns size={14} />}
        placeholder={t("Group")}
        clearable
        data={selectFields.map((f) => ({ value: f.id, label: f.name }))}
        value={view.groupBy}
        onChange={(v) => onChange({ groupBy: v })}
        w={150}
      />
    </Group>
  );
}
