// Stub heavy modules so the controller can be constructed in isolation.
jest.mock('./services/board.service', () => ({ BoardService: class {} }));
jest.mock('@docmost/db/repos/board/board.repo', () => ({ BoardRepo: class {} }));
jest.mock('../casl/abilities/space-ability.factory', () => ({
  __esModule: true,
  default: class {},
}));
jest.mock('../../common/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class {},
}));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BoardController } from './board.controller';

const USER = { id: 'u1' } as any;
const WORKSPACE = { id: 'w1' } as any;

function setup(abilityAllows: boolean) {
  const service = {
    getBoardsInSpace: jest.fn().mockResolvedValue([]),
    getBoardWithData: jest.fn().mockResolvedValue({ id: 'b1' }),
    createBoard: jest.fn().mockResolvedValue({ id: 'b1' }),
    deleteBoard: jest.fn().mockResolvedValue(undefined),
    moveCard: jest.fn().mockResolvedValue({}),
    deleteColumn: jest.fn().mockResolvedValue(undefined),
  };
  const repo = {
    findById: jest.fn().mockResolvedValue({ id: 'b1', spaceId: 's1' }),
    findCardById: jest.fn().mockResolvedValue({ id: 'card1', boardId: 'b1' }),
    findColumnById: jest.fn().mockResolvedValue({ id: 'col1', boardId: 'b1' }),
  };
  const cannot = jest.fn().mockReturnValue(!abilityAllows);
  const spaceAbility = {
    createForUser: jest.fn().mockResolvedValue({ cannot }),
  };
  const controller = new BoardController(
    service as any,
    repo as any,
    spaceAbility as any,
  );
  return { controller, service, repo, spaceAbility, cannot };
}

describe('BoardController (authorization)', () => {
  describe('list', () => {
    it('forbids when the user cannot read the space', async () => {
      const { controller } = setup(false);
      await expect(
        controller.list({ spaceId: 's1' } as any, USER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns boards when allowed', async () => {
      const { controller, service, spaceAbility } = setup(true);
      await controller.list({ spaceId: 's1' } as any, USER);
      expect(spaceAbility.createForUser).toHaveBeenCalledWith(USER, 's1');
      expect(service.getBoardsInSpace).toHaveBeenCalledWith('s1');
    });
  });

  describe('info', () => {
    it('throws NotFound when the board does not exist', async () => {
      const { controller, repo } = setup(true);
      repo.findById.mockResolvedValueOnce(undefined);
      await expect(
        controller.info({ boardId: 'b1' } as any, USER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids when the user cannot read the board space', async () => {
      const { controller } = setup(false);
      await expect(
        controller.info({ boardId: 'b1' } as any, USER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns board data when allowed', async () => {
      const { controller, service } = setup(true);
      await controller.info({ boardId: 'b1' } as any, USER);
      expect(service.getBoardWithData).toHaveBeenCalledWith('b1');
    });
  });

  describe('create', () => {
    it('forbids when the user cannot create in the space', async () => {
      const { controller } = setup(false);
      await expect(
        controller.create({ title: 'B', spaceId: 's1' } as any, USER, WORKSPACE),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates with the workspace id when allowed', async () => {
      const { controller, service } = setup(true);
      const dto = { title: 'B', spaceId: 's1' } as any;
      await controller.create(dto, USER, WORKSPACE);
      expect(service.createBoard).toHaveBeenCalledWith('u1', 'w1', dto);
    });
  });

  describe('delete', () => {
    it('forbids when the user cannot manage the board space', async () => {
      const { controller } = setup(false);
      await expect(
        controller.delete({ boardId: 'b1' } as any, USER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('moveCard', () => {
    it('resolves the board via the card and forbids without edit access', async () => {
      const { controller, repo } = setup(false);
      await expect(
        controller.moveCard(
          { cardId: 'card1', columnId: 'col1', position: 'a1' } as any,
          USER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.findCardById).toHaveBeenCalledWith('card1');
    });

    it('throws NotFound when the card is missing', async () => {
      const { controller, repo } = setup(true);
      repo.findCardById.mockResolvedValueOnce(undefined);
      await expect(
        controller.moveCard(
          { cardId: 'x', columnId: 'col1', position: 'a1' } as any,
          USER,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('moves the card when allowed', async () => {
      const { controller, service } = setup(true);
      await controller.moveCard(
        { cardId: 'card1', columnId: 'col1', position: 'a1' } as any,
        USER,
      );
      expect(service.moveCard).toHaveBeenCalledWith('card1', 'col1', 'a1');
    });
  });

  describe('deleteColumn', () => {
    it('resolves the board via the column and forbids without edit access', async () => {
      const { controller, repo } = setup(false);
      await expect(
        controller.deleteColumn({ columnId: 'col1' } as any, USER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.findColumnById).toHaveBeenCalledWith('col1');
    });
  });
});
