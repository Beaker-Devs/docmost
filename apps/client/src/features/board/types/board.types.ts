export interface IBoardUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ICard {
  id: string;
  title: string;
  description: string | null;
  position: string | null;
  labels: string[] | null;
  dueDate: string | null;
  columnId: string;
  boardId: string;
  pageId: string | null;
  assigneeId: string | null;
  assignee?: IBoardUser | null;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IColumn {
  id: string;
  name: string;
  color: string | null;
  position: string | null;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBoard {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  creatorId: string | null;
  creator?: IBoardUser | null;
  spaceId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IBoardWithData extends IBoard {
  columns: IColumn[];
  cards: ICard[];
}

export interface ICreateBoard {
  title: string;
  description?: string;
  icon?: string;
  spaceId: string;
}

export interface ICreateColumn {
  boardId: string;
  name: string;
  color?: string;
}

export interface ICreateCard {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
}

export interface IMoveCard {
  cardId: string;
  columnId: string;
  position: string;
}
