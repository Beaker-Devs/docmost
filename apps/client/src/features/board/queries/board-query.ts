import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  createBoard,
  createCard,
  createCardPage,
  createColumn,
  deleteBoard,
  deleteCard,
  deleteColumn,
  getBoardById,
  getBoardsInSpace,
  moveCard,
  moveColumn,
  updateBoard,
  updateCard,
  updateColumn,
} from "@/features/board/services/board-service";
import {
  IBoard,
  IBoardWithData,
  ICard,
  IColumn,
} from "@/features/board/types/board.types";

export function useBoardsQuery(
  spaceId: string,
): UseQueryResult<IBoard[], Error> {
  return useQuery({
    queryKey: ["boards", spaceId],
    queryFn: () => getBoardsInSpace(spaceId),
    enabled: !!spaceId,
  });
}

export function useBoardQuery(
  boardId: string,
): UseQueryResult<IBoardWithData, Error> {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoardById(boardId),
    enabled: !!boardId,
  });
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation<IBoard, Error, Parameters<typeof createBoard>[0]>({
    mutationFn: (data) => createBoard(data),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["boards", board.spaceId] });
    },
    onError: () =>
      notifications.show({ message: "Failed to create board", color: "red" }),
  });
}

export function useDeleteBoardMutation(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (boardId) => deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", spaceId] });
    },
  });
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation<IBoard, Error, Parameters<typeof updateBoard>[0]>({
    mutationFn: (data) => updateBoard(data),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["board", board.id] });
    },
  });
}

export function useCreateColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation<IColumn, Error, Parameters<typeof createColumn>[0]>({
    mutationFn: (data) => createColumn(data),
    onSuccess: (col) => {
      queryClient.invalidateQueries({ queryKey: ["board", col.boardId] });
    },
  });
}

export function useUpdateColumnMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<IColumn, Error, Parameters<typeof updateColumn>[0]>({
    mutationFn: (data) => updateColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useDeleteColumnMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (columnId) => deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useCreateCardMutation() {
  const queryClient = useQueryClient();
  return useMutation<ICard, Error, Parameters<typeof createCard>[0]>({
    mutationFn: (data) => createCard(data),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: ["board", card.boardId] });
    },
    onError: () =>
      notifications.show({ message: "Failed to create card", color: "red" }),
  });
}

export function useUpdateCardMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<ICard, Error, Parameters<typeof updateCard>[0]>({
    mutationFn: (data) => updateCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useDeleteCardMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (cardId) => deleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useCreateCardPageMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    ICard,
    Error,
    { cardId: string; parentPageId?: string; newParentTitle?: string }
  >({
    mutationFn: (data) => createCardPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () =>
      notifications.show({
        message: "Failed to create page for card",
        color: "red",
      }),
  });
}

/**
 * Card moves are applied optimistically in the board view, so this mutation
 * only persists the change and re-syncs on error.
 */
export function useMoveCardMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<ICard, Error, Parameters<typeof moveCard>[0]>({
    mutationFn: (data) => moveCard(data),
    onError: () => {
      notifications.show({ message: "Failed to move card", color: "red" });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useMoveColumnMutation(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation<IColumn, Error, Parameters<typeof moveColumn>[0]>({
    mutationFn: (data) => moveColumn(data),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}
