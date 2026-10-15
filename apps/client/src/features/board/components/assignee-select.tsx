import { useMemo } from "react";
import { Avatar, Group, Select, Text } from "@mantine/core";
import { useSpaceMembersQuery } from "@/features/space/queries/space-query";

interface AssigneeSelectProps {
  spaceId: string;
  value: string | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean;
}

export function AssigneeSelect({
  spaceId,
  value,
  onChange,
  disabled,
}: AssigneeSelectProps) {
  const { data } = useSpaceMembersQuery(spaceId, { limit: 100 });

  const users = useMemo(
    () =>
      (data?.items ?? []).filter((m: any) => m.type === "user") as Array<{
        id: string;
        name: string;
        avatarUrl: string | null;
      }>,
    [data],
  );

  const userById = useMemo(() => {
    const map: Record<string, { name: string; avatarUrl: string | null }> = {};
    users.forEach((u) => (map[u.id] = { name: u.name, avatarUrl: u.avatarUrl }));
    return map;
  }, [users]);

  const options = users.map((u) => ({ value: u.id, label: u.name }));

  return (
    <Select
      label="Assignee"
      placeholder="Unassigned"
      data={options}
      value={value}
      onChange={onChange}
      clearable
      searchable
      disabled={disabled}
      nothingFoundMessage="No members"
      comboboxProps={{ withinPortal: true }}
      leftSection={
        value && userById[value] ? (
          <Avatar size={18} radius="xl" src={userById[value].avatarUrl}>
            {userById[value].name?.charAt(0)}
          </Avatar>
        ) : undefined
      }
      renderOption={({ option }) => {
        const u = userById[option.value];
        return (
          <Group gap="xs" wrap="nowrap">
            <Avatar size={22} radius="xl" src={u?.avatarUrl}>
              {u?.name?.charAt(0)}
            </Avatar>
            <Text size="sm">{option.label}</Text>
          </Group>
        );
      }}
    />
  );
}
