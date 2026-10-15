import { useEffect, useMemo, useState } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { generateJitteredKeyBetween } from "fractional-indexing-jittered";
import { Box, Button, Group, Loader, Text, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import classes from "./board.module.css";
import { useBoardQuery } from "@/features/board/queries/board-query";
import {
  useCreateCardMutation,
  useCreateColumnMutation,
  useMoveCardMutation,
} from "@/features/board/queries/board-query";
import { ICard, IColumn } from "@/features/board/types/board.types";
import { BoardColumn } from "./board-column";
import { BoardCard } from "./board-card";

type CardMap = Record<string, ICard>;
type ColumnItems = Record<string, string[]>; // columnId -> ordered cardIds

interface BoardViewProps {
  boardId: string;
  readOnly?: boolean;
}

export function BoardView({ boardId, readOnly = false }: BoardViewProps) {
  const { data: board, isLoading } = useBoardQuery(boardId);
  const moveCard = useMoveCardMutation(boardId);
  const createColumn = useCreateColumnMutation();
  const createCard = useCreateCardMutation();

  const [columns, setColumns] = useState<IColumn[]>([]);
  const [cards, setCards] = useState<CardMap>({});
  const [items, setItems] = useState<ColumnItems>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // hydrate local state whenever the server data changes
  useEffect(() => {
    if (!board) return;
    const sortedColumns = [...board.columns].sort((a, b) =>
      (a.position ?? "").localeCompare(b.position ?? ""),
    );
    const cardMap: CardMap = {};
    const colItems: ColumnItems = {};
    sortedColumns.forEach((c) => (colItems[c.id] = []));
    [...board.cards]
      .sort((a, b) => (a.position ?? "").localeCompare(b.position ?? ""))
      .forEach((card) => {
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

  const findColumn = (id: string): string | undefined => {
    if (id in items) return id;
    return Object.keys(items).find((colId) => items[colId].includes(id));
  };

  const activeCard = activeId ? cards[activeId] : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeColumn = findColumn(active.id as string);
    const overColumn = findColumn(over.id as string);
    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setItems((prev) => {
      const activeItems = prev[activeColumn];
      const overItems = prev[overColumn];
      const activeIndex = activeItems.indexOf(active.id as string);

      // position in the target list
      let overIndex = overItems.indexOf(over.id as string);
      if (overIndex === -1) overIndex = overItems.length;

      return {
        ...prev,
        [activeColumn]: activeItems.filter((id) => id !== active.id),
        [overColumn]: [
          ...overItems.slice(0, overIndex),
          active.id as string,
          ...overItems.slice(overIndex),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const cardId = active.id as string;
    const targetColumn = findColumn(over.id as string) ?? findColumn(cardId);
    if (!targetColumn) return;

    // reorder within the target column
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
    const prevCard = idx > 0 ? cards[targetItems[idx - 1]] : null;
    const nextCard =
      idx < targetItems.length - 1 ? cards[targetItems[idx + 1]] : null;

    let position: string;
    try {
      position = generateJitteredKeyBetween(
        prevCard?.position ?? null,
        nextCard?.position ?? null,
      );
    } catch {
      position = generateJitteredKeyBetween(prevCard?.position ?? null, null);
    }

    // update local card so subsequent drags use fresh position/column
    setCards((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], columnId: targetColumn, position },
    }));

    moveCard.mutate({ cardId, columnId: targetColumn, position });
  }

  function handleAddColumn() {
    const name = newColumnName.trim();
    if (!name) return;
    createColumn.mutate({ boardId, name });
    setNewColumnName("");
    setAddingColumn(false);
  }

  const columnCardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(items).forEach((c) => (counts[c] = items[c].length));
    return counts;
  }, [items]);

  if (isLoading) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={classes.board}>
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            cardIds={items[column.id] ?? []}
            count={columnCardCounts[column.id] ?? 0}
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
                />
              ))}
            </SortableContext>
          </BoardColumn>
        ))}

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
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
