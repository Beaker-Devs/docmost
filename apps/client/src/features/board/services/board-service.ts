import api from "@/lib/api-client";
import {
  IBoard,
  IBoardWithData,
  ICard,
  IColumn,
  ICreateBoard,
  ICreateCard,
  ICreateColumn,
  IMoveCard,
} from "@/features/board/types/board.types";

// boards
export async function getBoardsInSpace(spaceId: string): Promise<IBoard[]> {
  const req = await api.post("/boards/list", { spaceId });
  return req.data;
}

export async function getBoardById(
  boardId: string,
): Promise<IBoardWithData> {
  const req = await api.post("/boards/info", { boardId });
  return req.data;
}

export async function createBoard(data: ICreateBoard): Promise<IBoard> {
  const req = await api.post("/boards/create", data);
  return req.data;
}

export async function updateBoard(
  data: { boardId: string; title?: string; description?: string; icon?: string },
): Promise<IBoard> {
  const req = await api.post("/boards/update", data);
  return req.data;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.post("/boards/delete", { boardId });
}

// columns
export async function createColumn(data: ICreateColumn): Promise<IColumn> {
  const req = await api.post("/boards/column/create", data);
  return req.data;
}

export async function updateColumn(
  data: { columnId: string; name?: string; color?: string },
): Promise<IColumn> {
  const req = await api.post("/boards/column/update", data);
  return req.data;
}

export async function moveColumn(
  data: { columnId: string; position: string },
): Promise<IColumn> {
  const req = await api.post("/boards/column/move", data);
  return req.data;
}

export async function deleteColumn(columnId: string): Promise<void> {
  await api.post("/boards/column/delete", { columnId });
}

// cards
export async function createCard(data: ICreateCard): Promise<ICard> {
  const req = await api.post("/boards/card/create", data);
  return req.data;
}

export async function updateCard(
  data: {
    cardId: string;
    title?: string;
    description?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    labels?: string[];
  },
): Promise<ICard> {
  const req = await api.post("/boards/card/update", data);
  return req.data;
}

export async function moveCard(data: IMoveCard): Promise<ICard> {
  const req = await api.post("/boards/card/move", data);
  return req.data;
}

export async function deleteCard(cardId: string): Promise<void> {
  await api.post("/boards/card/delete", { cardId });
}

export async function createCardPage(
  cardId: string,
  parentPageId?: string,
): Promise<ICard> {
  const req = await api.post("/boards/card/create-page", {
    cardId,
    parentPageId,
  });
  return req.data;
}
