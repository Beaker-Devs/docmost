import { ReactNode, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Badge, Group, Menu, Text, Textarea } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDots, IconPlus, IconTrash } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "./board.module.css";
import { IColumn } from "@/features/board/types/board.types";
import { useDeleteColumnMutation } from "@/features/board/queries/board-query";

interface BoardColumnProps {
  column: IColumn;
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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
    disabled: readOnly,
  });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const deleteColumn = useDeleteColumnMutation(column.boardId);

  function submit() {
    const value = title.trim();
    if (value) onAddCard(value);
    setTitle("");
    setAdding(false);
  }

  function confirmDeleteColumn() {
    modals.openConfirmModal({
      title: "Delete column",
      children: (
        <Text size="sm">
          Delete <b>{column.name}</b>
          {count > 0
            ? ` and its ${count} card${count === 1 ? "" : "s"}?`
            : "?"}{" "}
          This cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteColumn.mutate(column.id),
    });
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(classes.column, isDragging && classes.columnDragging)}
    >
      <Group
        ref={setActivatorNodeRef}
        justify="space-between"
        className={clsx(classes.columnHeader, !readOnly && classes.columnHandle)}
        wrap="nowrap"
        {...(readOnly ? {} : attributes)}
        {...(readOnly ? {} : listeners)}
      >
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
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={confirmDeleteColumn}
              >
                Delete column
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <div className={classes.columnBody} data-over={isOver || undefined}>
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
