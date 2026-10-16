jest.mock('@docmost/db/repos/database/database.repo', () => ({
  DatabaseRepo: class {},
}));

import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let repo: any;
  let service: DatabaseService;

  beforeEach(() => {
    repo = {
      insertDatabase: jest.fn().mockResolvedValue({ id: 'db1', title: 'T' }),
      insertField: jest.fn().mockResolvedValue({ id: 'f' }),
      insertView: jest.fn().mockResolvedValue({ id: 'v' }),
      findById: jest.fn().mockResolvedValue({ id: 'db1', spaceId: 's1' }),
      listFields: jest.fn().mockResolvedValue([]),
      listViews: jest.fn().mockResolvedValue([]),
      findRowById: jest.fn(),
      updateRow: jest.fn().mockResolvedValue(undefined),
      findViewById: jest.fn(),
      countViews: jest.fn(),
      deleteView: jest.fn().mockResolvedValue(undefined),
      lastRowPosition: jest.fn().mockResolvedValue(null),
      insertRow: jest.fn().mockResolvedValue({ id: 'r' }),
    };
    service = new DatabaseService(repo);
  });

  describe('createDatabase', () => {
    it('seeds a Name + Status schema and a default Table view', async () => {
      await service.createDatabase(
        { spaceId: 's1', title: 'Projects' },
        'w1',
        'u1',
      );
      expect(repo.insertDatabase).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Projects',
          spaceId: 's1',
          workspaceId: 'w1',
          creatorId: 'u1',
        }),
      );
      const fieldNames = repo.insertField.mock.calls.map((c: any[]) => c[0].name);
      expect(fieldNames).toEqual(['Name', 'Status']);
      const statusCall = repo.insertField.mock.calls[1][0];
      expect(statusCall.type).toBe('select');
      expect(statusCall.config.options.length).toBeGreaterThan(0);
      expect(repo.insertView).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'table' }),
      );
    });

    it('falls back to a default title when blank', async () => {
      await service.createDatabase({ spaceId: 's1' }, 'w1', 'u1');
      expect(repo.insertDatabase.mock.calls[0][0].title).toBe(
        'Untitled database',
      );
    });
  });

  describe('updateRow', () => {
    it('merges the partial cell patch into existing cells', async () => {
      repo.findRowById
        .mockResolvedValueOnce({ id: 'r1', cells: { a: 1, b: 2 } })
        .mockResolvedValueOnce({ id: 'r1', cells: { a: 1, b: 2, c: 3 } });
      await service.updateRow({ rowId: 'r1', cells: { c: 3 } });
      expect(repo.updateRow).toHaveBeenCalledWith(
        { cells: { a: 1, b: 2, c: 3 } },
        'r1',
      );
    });

    it('overwrites a provided key but keeps the others', async () => {
      repo.findRowById.mockResolvedValue({ id: 'r1', cells: { a: 1, b: 2 } });
      await service.updateRow({ rowId: 'r1', cells: { b: 9 } });
      expect(repo.updateRow).toHaveBeenCalledWith(
        { cells: { a: 1, b: 9 } },
        'r1',
      );
    });
  });

  describe('deleteView', () => {
    it('refuses to delete the last view', async () => {
      repo.findViewById.mockResolvedValue({ id: 'v1', databaseId: 'db1' });
      repo.countViews.mockResolvedValue(1);
      await expect(service.deleteView('v1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.deleteView).not.toHaveBeenCalled();
    });

    it('deletes when more than one view remains', async () => {
      repo.findViewById.mockResolvedValue({ id: 'v1', databaseId: 'db1' });
      repo.countViews.mockResolvedValue(2);
      await service.deleteView('v1');
      expect(repo.deleteView).toHaveBeenCalledWith('v1');
    });
  });
});
