import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { byPosition, positionBetween } from "@/features/board/board.utils";
import { Box, Button, Group, Loader, Text, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import classes from "./board.module.css";
import {
  useBoardQuery,
  useCreateCardMutation,
  useCreateColumnMutation,
  useMoveCardMutation,
  useMoveColumnMutation,
} from "@/features/board/queries/board-query";
import { ICard, IColumn } from "@/features/board/types/board.types";
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";
import { CardDrawer } from "./card-drawer";

type CardMap = Record<string, ICard>;
type ColumnItems = Record<string, string[]>; // columnId -> ordered cardIds

interface BoardViewProps {
  boardId: string;
  spaceSlug: string;
  readOnly?: boolean;
}

export function BoardView({ boardId, spaceSlug, readOnly = false }: BoardViewProps) {
  const { data: board, isLoading } = useBoardQuery(boardId);
  const moveCard = useMoveCardMutation(boardId);
  const moveColumn = useMoveColumnMutation(boardId);
  const createColumn = useCreateColumnMutation();
  const createCard = useCreateCardMutation();

  const [columns, setColumns] = useState<IColumn[]>([]);
  const [cards, setCards] = useState<CardMap>({});
  const [items, setItems] = useState<ColumnItems>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  // tracks an in-progress drag so a background refetch doesn't reset state
  // mid-drag; the card's origin lets us skip persisting a no-op drop.
  const activeRef = useRef<{ id: string; columnId: string; index: number } | null>(
    null,
  );

  // hydrate local state whenever the server data changes
  useEffect(() => {
    if (!board) return;
    if (activeRef.current) return; // don't clobber an in-progress drag
    const sortedColumns = [...board.columns].sort(byPosition);
    const cardMap: CardMap = {};
    const colItems: ColumnItems = {};
    sortedColumns.forEach((c) => (colItems[c.id] = []));
    [...board.cards].sort(byPosition).forEach((card) => {
      cardMap[card.id] = card;
      if (!colItems[card.columnId]) colItems[card.columnId] = [];
      colItems[card.columnId].push(card.id);
    });
    setColumns(sortedColumns);
    setCards(cardMap);
    setItems(colItems);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const findColumn = (id: string): string | undefined => {
    if (id in items) return id;
    return Object.keys(items).find((colId) => items[colId].includes(id));
  };

  const activeCard = activeType === "card" && activeId ? cards[activeId] : null;
  const activeColumn =
    activeType === "column" && activeId
      ? columns.find((c) => c.id === activeId)
      : null;

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const type =
      (event.active.data.current?.type as "card" | "column") ?? "card";
    setActiveId(id);
    setActiveType(type);
    if (type === "card") {
      const columnId = findColumn(id);
      activeRef.current = columnId
        ? { id, columnId, index: items[columnId].indexOf(id) }
        : null;
    } else {
      activeRef.current = { id, columnId: "", index: 0 };
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (activeType === "column") return; // columns reorder on drag end only
    const { active, over } = event;
    if (!over) return;
    const activeColumnId = findColumn(active.id as string);
    const overColumnId = findColumn(over.id as string);
    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId)
      return;

    setItems((prev) => {
      const activeItems = prev[activeColumnId];
      const overItems = prev[overColumnId];
      let overIndex = overItems.indexOf(over.id as string);
      if (overIndex === -1) overIndex = overItems.length;

      return {
        ...prev,
        [activeColumnId]: activeItems.filter((id) => id !== active.id),
        [overColumnId]: [
          ...overItems.slice(0, overIndex),
          active.id as string,
          ...overItems.slice(overIndex),
        ],
      };
    });
  }

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columnIds.indexOf(active.id as string);
    const newIndex = columnIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(columns, oldIndex, newIndex);
    setColumns(reordered);

    const idx = reordered.findIndex((c) => c.id === active.id);
    const prevCol = idx > 0 ? reordered[idx - 1] : null;
    const nextCol = idx < reordered.length - 1 ? reordered[idx + 1] : null;

    const position = positionBetween(
      prevCol?.position ?? null,
      nextCol?.position ?? null,
    );
    moveColumn.mutate({ columnId: active.id as string, position });
  }

  function handleCardDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const targetColumn = findColumn(over.id as string) ?? findColumn(cardId);
    if (!targetColumn) return;

    let targetItems = items[targetColumn];
    const oldIndex = targetItems.indexOf(cardId);
    let overIndex = targetItems.indexOf(over.id as string);
    if (overIndex === -1) overIndex = targetItems.length - 1;

    if (oldIndex !== overIndex && oldIndex !== -1) {
      const reordered = [...targetItems];
      reordered.splice(oldIndex, 1);
      reordered.splice(overIndex, 0, cardId);
      targetItems = reordered;
      setItems((prev) => ({ ...prev, [targetColumn]: reordered }));
    }

    const idx = targetItems.indexOf(cardId);

    // dropped back where it started — nothing to persist
    const origin = activeRef.current;
    if (origin && origin.columnId === targetColumn && origin.index === idx) {
      return;
    }

    const prevCard = idx > 0 ? cards[targetItems[idx - 1]] : null;
    const nextCard =
      idx < targetItems.length - 1 ? cards[targetItems[idx + 1]] : null;

    const position = positionBetween(
      prevCard?.position ?? null,
      nextCard?.position ?? null,
    );

    setCards((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], columnId: targetColumn, position },
    }));
    moveCard.mutate({ cardId, columnId: targetColumn, position });
  }

  function handleDragEnd(event: DragEndEvent) {
    const type = activeType;
    setActiveId(null);
    setActiveType(null);
    if (type === "column") handleColumnDragEnd(event);
    else handleCardDragEnd(event);
    activeRef.current = null;
  }

  function handleAddColumn() {
    const name = newColumnName.trim();
    if (!name) return;
    createColumn.mutate({ boardId, name });
    setNewColumnName("");
    setAddingColumn(false);
  }

  if (isLoading) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={classes.board}>
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                count={items[column.id]?.length ?? 0}
                readOnly={readOnly}
                onAddCard={(title) =>
                  createCard.mutate({ boardId, columnId: column.id, title })
                }
              >
                <SortableContext
                  items={items[column.id] ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  {(items[column.id] ?? []).map((cardId) => (
                    <BoardCard
                      key={cardId}
                      card={cards[cardId]}
                      boardId={boardId}
                      readOnly={readOnly}
                      onClick={() => setOpenCardId(cardId)}
                    />
                  ))}
                </SortableContext>
              </BoardColumn>
            ))}
          </SortableContext>

          {!readOnly && (
            <div className={classes.addColumn}>
              {addingColumn ? (
                <Box>
                  <TextInput
                    autoFocus
                    placeholder="Column name"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") setAddingColumn(false);
                    }}
                    onBlur={() => setAddingColumn(false)}
                  />
                  <Group mt="xs" gap="xs">
                    <Button size="xs" onMouseDown={handleAddColumn}>
                      Add
                    </Button>
                  </Group>
                </Box>
              ) : (
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setAddingColumn(true)}
                  fullWidth
                  justify="flex-start"
                >
                  <Text size="sm">Add column</Text>
                </Button>
              )}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeCard ? (
            <BoardCard card={activeCard} boardId={boardId} overlay readOnly />
          ) : activeColumn ? (
            <div className={classes.columnOverlay}>
              <Text fw={600} size="sm">
                {activeColumn.name}
              </Text>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDrawer
        cardId={openCardId}
        card={openCardId ? cards[openCardId] : null}
        boardId={boardId}
        spaceId={board?.spaceId ?? ""}
        spaceSlug={spaceSlug}
        readOnly={readOnly}
        onClose={() => setOpenCardId(null)}
      />
    </>
  );
}
