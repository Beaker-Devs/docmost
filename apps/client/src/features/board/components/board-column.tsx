import { ReactNode, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ActionIcon, Badge, Group, Menu, Text, Textarea } from "@mantine/core";
import { IconDots, IconPlus, IconTrash } from "@tabler/icons-react";
import classes from "./board.module.css";
import { IColumn } from "@/features/board/types/board.types";
import { useDeleteColumnMutation } from "@/features/board/queries/board-query";

interface BoardColumnProps {
  column: IColumn;
  cardIds: string[];
  count: number;
  children: ReactNode;
  readOnly?: boolean;
  onAddCard: (title: string) => void;
}

export function BoardColumn({
  column,
  count,
  children,
  readOnly,
  onAddCard,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const deleteColumn = useDeleteColumnMutation(column.boardId);

  function submit() {
    const value = title.trim();
    if (value) onAddCard(value);
    setTitle("");
    setAdding(false);
  }

  return (
    <div className={classes.column}>
      <Group justify="space-between" className={classes.columnHeader} wrap="nowrap">
        <Group gap={8} wrap="nowrap">
          <span
            className={classes.colDot}
            style={{ backgroundColor: column.color ?? "#868e96" }}
          />
          <Text fw={600} size="sm" lineClamp={1}>
            {column.name}
          </Text>
          <Badge size="sm" variant="light" color="gray" radius="sm">
            {count}
          </Badge>
        </Group>

        {!readOnly && (
          <Menu position="bottom-end" withArrow shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => deleteColumn.mutate(column.id)}
              >
                Delete column
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <div
        ref={setNodeRef}
        className={classes.columnBody}
        data-over={isOver || undefined}
      >
        {children}

        {adding ? (
          <Textarea
            autoFocus
            autosize
            minRows={2}
            placeholder="Card title…"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            onBlur={submit}
            className={classes.addCardInput}
          />
        ) : (
          !readOnly && (
            <button
              type="button"
              className={classes.addCardBtn}
              onClick={() => setAdding(true)}
            >
              <IconPlus size={15} />
              <span>Add card</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
