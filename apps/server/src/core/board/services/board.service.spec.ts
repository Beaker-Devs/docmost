// Keep heavy transitive deps out of the unit test: BoardService only needs the
// class tokens for construction, not the real implementations.
jest.mock('@docmost/db/repos/board/board.repo', () => ({ BoardRepo: class {} }));
jest.mock('../../page/services/page.service', () => ({ PageService: class {} }));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BoardService } from './board.service';

function makeRepo() {
  return {
    insertBoard: jest.fn(),
    updateBoard: jest.fn(),
    softDeleteBoard: jest.fn(),
    findById: jest.fn(),
    getBoardsInSpace: jest.fn(),
    getColumns: jest.fn(),
    getCards: jest.fn(),
    getLastColumn: jest.fn(),
    insertColumn: jest.fn(),
    updateColumn: jest.fn(),
    deleteColumn: jest.fn(),
    findColumnById: jest.fn(),
    getLastCardInColumn: jest.fn(),
    insertCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    findCardById: jest.fn(),
  };
}

describe('BoardService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let pageService: { create: jest.Mock };
  let service: BoardService;

  beforeEach(() => {
    repo = makeRepo();
    pageService = { create: jest.fn() };
    service = new BoardService(repo as any, pageService as any);
  });

  describe('createBoard', () => {
    it('creates the board and seeds 3 default columns with increasing positions', async () => {
      repo.insertBoard.mockResolvedValue({ id: 'b1', title: 'Roadmap' });
      repo.insertColumn.mockImplementation((c) => Promise.resolve(c));

      const board = await service.createBoard('u1', 'w1', {
        title: 'Roadmap',
        spaceId: 's1',
      });

      expect(board).toEqual({ id: 'b1', title: 'Roadmap' });
      expect(repo.insertBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Roadmap',
          spaceId: 's1',
          workspaceId: 'w1',
          creatorId: 'u1',
        }),
      );

      expect(repo.insertColumn).toHaveBeenCalledTimes(3);
      const names = repo.insertColumn.mock.calls.map((c) => c[0].name);
      expect(names).toEqual(['To do', 'In progress', 'Done']);

      const positions = repo.insertColumn.mock.calls.map((c) => c[0].position);
      // strictly increasing + distinct (bytewise)
      expect(positions[0] < positions[1]).toBe(true);
      expect(positions[1] < positions[2]).toBe(true);
      expect(new Set(positions).size).toBe(3);
      positions.forEach((p) => expect(p.length).toBeGreaterThan(0));
    });
  });

  describe('createColumn', () => {
    it('appends a column after the last one', async () => {
      repo.getLastColumn.mockResolvedValue({ position: 'a0' });
      repo.insertColumn.mockImplementation((c) => Promise.resolve(c));

      await service.createColumn({ boardId: 'b1', name: 'QA' });

      const arg = repo.insertColumn.mock.calls[0][0];
      expect(arg.boardId).toBe('b1');
      expect(arg.name).toBe('QA');
      expect(arg.position > 'a0').toBe(true); // placed after last
    });

    it('creates the first column when the board has none', async () => {
      repo.getLastColumn.mockResolvedValue(undefined);
      repo.insertColumn.mockImplementation((c) => Promise.resolve(c));

      await service.createColumn({ boardId: 'b1', name: 'Backlog' });

      expect(repo.insertColumn.mock.calls[0][0].position).toBeTruthy();
    });
  });

  describe('createCard', () => {
    it('rejects a column that belongs to a different board', async () => {
      repo.findColumnById.mockResolvedValue({ id: 'c1', boardId: 'OTHER' });

      await expect(
        service.createCard('u1', { boardId: 'b1', columnId: 'c1', title: 'X' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.insertCard).not.toHaveBeenCalled();
    });

    it('throws NotFound when the column does not exist', async () => {
      repo.findColumnById.mockResolvedValue(undefined);

      await expect(
        service.createCard('u1', { boardId: 'b1', columnId: 'c1', title: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a card appended after the last card in the column', async () => {
      repo.findColumnById.mockResolvedValue({ id: 'c1', boardId: 'b1' });
      repo.getLastCardInColumn.mockResolvedValue({ position: 'a0' });
      repo.insertCard.mockImplementation((c) => Promise.resolve(c));

      await service.createCard('u1', {
        boardId: 'b1',
        columnId: 'c1',
        title: 'Task',
      });

      const arg = repo.insertCard.mock.calls[0][0];
      expect(arg).toMatchObject({
        boardId: 'b1',
        columnId: 'c1',
        title: 'Task',
        creatorId: 'u1',
      });
      expect(arg.position > 'a0').toBe(true);
    });
  });

  describe('moveCard', () => {
    it('rejects moving a card into a column of another board', async () => {
      repo.findCardById.mockResolvedValue({ id: 'card1', boardId: 'bA' });
      repo.findColumnById.mockResolvedValue({ id: 'col', boardId: 'bB' });

      await expect(
        service.moveCard('card1', 'col', 'a1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.updateCard).not.toHaveBeenCalled();
    });

    it('throws NotFound when the card is missing', async () => {
      repo.findCardById.mockResolvedValue(undefined);
      await expect(service.moveCard('x', 'col', 'a1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('persists a valid same-board move', async () => {
      repo.findCardById.mockResolvedValue({ id: 'card1', boardId: 'b1' });
      repo.findColumnById.mockResolvedValue({ id: 'col2', boardId: 'b1' });
      repo.updateCard.mockResolvedValue({});

      await service.moveCard('card1', 'col2', 'a5');

      expect(repo.updateCard).toHaveBeenCalledWith(
        { columnId: 'col2', position: 'a5' },
        'card1',
      );
    });

    it('rejects an invalid (empty) position key', async () => {
      await expect(service.moveCard('card1', 'col', '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('updateCard (partial patch)', () => {
    beforeEach(() => repo.updateCard.mockResolvedValue({}));

    it('only sets the title when only the title is provided', async () => {
      await service.updateCard({ cardId: 'c1', title: 'New' });
      const [patch, id] = repo.updateCard.mock.calls[0];
      expect(id).toBe('c1');
      expect(patch).toEqual({ title: 'New' });
      expect(patch).not.toHaveProperty('description');
      expect(patch).not.toHaveProperty('assigneeId');
      expect(patch).not.toHaveProperty('dueDate');
    });

    it('clears the assignee when assigneeId is null', async () => {
      await service.updateCard({ cardId: 'c1', assigneeId: null });
      expect(repo.updateCard.mock.calls[0][0]).toEqual({ assigneeId: null });
    });

    it('coerces dueDate to a Date and null to null', async () => {
      await service.updateCard({ cardId: 'c1', dueDate: '2026-01-02T00:00:00Z' });
      expect(repo.updateCard.mock.calls[0][0].dueDate).toBeInstanceOf(Date);

      repo.updateCard.mockClear();
      await service.updateCard({ cardId: 'c1', dueDate: null });
      expect(repo.updateCard.mock.calls[0][0]).toEqual({ dueDate: null });
    });

    it('does not touch any field when nothing is provided', async () => {
      await service.updateCard({ cardId: 'c1' });
      expect(repo.updateCard.mock.calls[0][0]).toEqual({});
    });
  });

  describe('createCardPage', () => {
    it('returns the card unchanged when it already has a page', async () => {
      const card = { id: 'c1', pageId: 'p-existing', boardId: 'b1' };
      repo.findCardById.mockResolvedValue(card);

      const result = await service.createCardPage('u1', 'c1');

      expect(result).toBe(card);
      expect(pageService.create).not.toHaveBeenCalled();
    });

    it('throws NotFound when the card does not exist', async () => {
      repo.findCardById.mockResolvedValue(undefined);
      await expect(service.createCardPage('u1', 'c1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('creates a page in the board space and links it to the card', async () => {
      repo.findCardById.mockResolvedValue({
        id: 'c1',
        pageId: null,
        boardId: 'b1',
        title: 'Task',
      });
      repo.findById.mockResolvedValue({
        id: 'b1',
        spaceId: 's1',
        workspaceId: 'w1',
      });
      pageService.create.mockResolvedValue({ id: 'pNew' });
      repo.updateCard.mockResolvedValue({ id: 'c1', pageId: 'pNew' });

      await service.createCardPage('u1', 'c1', { parentPageId: 'pp' });

      expect(pageService.create).toHaveBeenCalledWith('u1', 'w1', {
        title: 'Task',
        spaceId: 's1',
        parentPageId: 'pp',
      });
      expect(repo.updateCard).toHaveBeenCalledWith({ pageId: 'pNew' }, 'c1');
    });

    it('creates a new folder then nests the card page under it', async () => {
      repo.findCardById.mockResolvedValue({
        id: 'c1',
        pageId: null,
        boardId: 'b1',
        title: 'Task',
      });
      repo.findById.mockResolvedValue({
        id: 'b1',
        spaceId: 's1',
        workspaceId: 'w1',
      });
      pageService.create
        .mockResolvedValueOnce({ id: 'folder1' }) // the folder
        .mockResolvedValueOnce({ id: 'pNew' }); // the card page
      repo.updateCard.mockResolvedValue({});

      await service.createCardPage('u1', 'c1', {
        newParentTitle: 'Cards',
        parentPageId: 'root-parent',
      });

      expect(pageService.create).toHaveBeenNthCalledWith(1, 'u1', 'w1', {
        title: 'Cards',
        spaceId: 's1',
        parentPageId: 'root-parent',
      });
      expect(pageService.create).toHaveBeenNthCalledWith(2, 'u1', 'w1', {
        title: 'Task',
        spaceId: 's1',
        parentPageId: 'folder1', // nested under the new folder
      });
    });

    it('ignores a blank newParentTitle', async () => {
      repo.findCardById.mockResolvedValue({
        id: 'c1',
        pageId: null,
        boardId: 'b1',
        title: 'Task',
      });
      repo.findById.mockResolvedValue({
        id: 'b1',
        spaceId: 's1',
        workspaceId: 'w1',
      });
      pageService.create.mockResolvedValue({ id: 'pNew' });
      repo.updateCard.mockResolvedValue({});

      await service.createCardPage('u1', 'c1', { newParentTitle: '   ' });

      expect(pageService.create).toHaveBeenCalledTimes(1);
      expect(pageService.create.mock.calls[0][2].parentPageId).toBeUndefined();
    });
  });

  describe('getBoardWithData', () => {
    it('throws NotFound for a missing board', async () => {
      repo.findById.mockResolvedValue(undefined);
      await expect(service.getBoardWithData('b1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('merges columns and cards into the board', async () => {
      repo.findById.mockResolvedValue({ id: 'b1', title: 'B' });
      repo.getColumns.mockResolvedValue([{ id: 'col1' }]);
      repo.getCards.mockResolvedValue([{ id: 'card1' }]);

      const result = await service.getBoardWithData('b1');
      expect(result).toEqual({
        id: 'b1',
        title: 'B',
        columns: [{ id: 'col1' }],
        cards: [{ id: 'card1' }],
      });
    });
  });

  describe('deleteBoard / moveColumn', () => {
    it('soft deletes the board', async () => {
      await service.deleteBoard('b1');
      expect(repo.softDeleteBoard).toHaveBeenCalledWith('b1');
    });

    it('validates position and updates the column on move', async () => {
      repo.updateColumn.mockResolvedValue({});
      await service.moveColumn('col1', 'a3');
      expect(repo.updateColumn).toHaveBeenCalledWith({ position: 'a3' }, 'col1');
    });

    it('rejects an invalid (empty) column move position', async () => {
      await expect(service.moveColumn('col1', '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
