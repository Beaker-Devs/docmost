import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Avatar, Group, Menu, Text } from "@mantine/core";
import { IconDots, IconGripVertical, IconTrash } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "./board.module.css";
import { ICard } from "@/features/board/types/board.types";
import { useDeleteCardMutation } from "@/features/board/queries/board-query";

interface BoardCardProps {
  card: ICard;
  boardId: string;
  overlay?: boolean;
  readOnly?: boolean;
}

export function BoardCard({ card, boardId, overlay, readOnly }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: readOnly });
  const deleteCard = useDeleteCardMutation(boardId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!card) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        classes.card,
        !readOnly && classes.cardDraggable,
        isDragging && classes.cardDragging,
        overlay && classes.cardOverlay,
      )}
      {...(readOnly ? {} : attributes)}
      {...(readOnly ? {} : listeners)}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start" gap={4}>
        <Text size="sm" className={classes.cardTitle}>
          {card.title}
        </Text>

        {!readOnly && !overlay && (
          <Group
            gap={2}
            wrap="nowrap"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconDots size={15} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => deleteCard.mutate(card.id)}
                >
                  Delete card
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              className={classes.dragHandle}
              tabIndex={-1}
            >
              <IconGripVertical size={15} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      {card.assignee && (
        <Group mt={8} gap="xs">
          <Avatar size={20} radius="xl" src={card.assignee.avatarUrl}>
            {card.assignee.name?.charAt(0)}
          </Avatar>
          <Text size="xs" c="dimmed">
            {card.assignee.name}
          </Text>
        </Group>
      )}
    </div>
  );
}
