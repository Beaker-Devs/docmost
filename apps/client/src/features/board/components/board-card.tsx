import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Avatar, Group, Menu, Text } from "@mantine/core";
import {
  IconDots,
  IconFileText,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import classes from "./board.module.css";
import { ICard } from "@/features/board/types/board.types";
import { useDeleteCardMutation } from "@/features/board/queries/board-query";

interface BoardCardProps {
  card: ICard;
  boardId: string;
  overlay?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
}

export function BoardCard({
  card,
  boardId,
  overlay,
  readOnly,
  onClick,
}: BoardCardProps) {
  const { t } = useTranslation();
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
      onClick={overlay ? undefined : onClick}
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
                  {t("Delete card")}
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

      {(card.pageId || card.assignee) && (
        <Group mt={8} gap="xs" justify="space-between">
          {card.assignee ? (
            <Group gap={6} wrap="nowrap">
              <Avatar size={20} radius="xl" src={card.assignee.avatarUrl}>
                {card.assignee.name?.charAt(0)}
              </Avatar>
              <Text size="xs" c="dimmed">
                {card.assignee.name}
              </Text>
            </Group>
          ) : (
            <span />
          )}
          {card.pageId && (
            <IconFileText
              size={15}
              className={classes.cardPageIcon}
              title={t("Has page")}
            />
          )}
        </Group>
      )}
    </div>
  );
}
