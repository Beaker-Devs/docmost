import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import {
  useBoardsQuery,
  useCreateBoardMutation,
} from "@/features/board/queries/board-query";
import { getSpaceUrl } from "@/lib/config";

interface BoardGridProps {
  spaceId: string;
  spaceSlug: string;
  canCreate?: boolean;
}

export function BoardGrid({ spaceId, spaceSlug, canCreate }: BoardGridProps) {
  const { data: boards, isLoading } = useBoardsQuery(spaceId);
  const createBoard = useCreateBoardMutation();
  const [opened, setOpened] = useState(false);
  const [title, setTitle] = useState("");

  function handleCreate() {
    const value = title.trim();
    if (!value) return;
    createBoard.mutate(
      { title: value, spaceId },
      {
        onSuccess: () => {
          setTitle("");
          setOpened(false);
        },
      },
    );
  }

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={3}>Boards</Title>
        {canCreate && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setOpened(true)}
          >
            New board
          </Button>
        )}
      </Group>

      {!isLoading && boards?.length === 0 && (
        <Text c="dimmed">No boards yet. Create your first kanban board.</Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {boards?.map((board) => (
          <Card
            key={board.id}
            component={Link}
            to={`${getSpaceUrl(spaceSlug)}/boards/${board.id}`}
            withBorder
            padding="lg"
            radius="md"
          >
            <Group gap="sm">
              <IconLayoutKanban size={22} />
              <Text fw={600}>{board.title}</Text>
            </Group>
            {board.description && (
              <Text size="sm" c="dimmed" mt="xs" lineClamp={2}>
                {board.description}
              </Text>
            )}
          </Card>
        ))}
      </SimpleGrid>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create board"
        centered
      >
        <TextInput
          label="Board title"
          placeholder="e.g. Product Roadmap"
          data-autofocus
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={createBoard.isPending}>
            Create
          </Button>
        </Group>
      </Modal>
    </>
  );
}
