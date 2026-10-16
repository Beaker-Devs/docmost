jest.mock('@docmost/db/repos/audit/audit.repo', () => ({ AuditRepo: class {} }));

import { AuditService } from './audit.service';

describe('AuditService', () => {
  let repo: { insertAuditLog: jest.Mock; getWorkspaceAuditLogs: jest.Mock; getDistinctActions: jest.Mock };
  let service: AuditService;

  beforeEach(() => {
    repo = {
      insertAuditLog: jest.fn().mockResolvedValue(undefined),
      getWorkspaceAuditLogs: jest
        .fn()
        .mockResolvedValue({ items: [], nextCursorId: null }),
      getDistinctActions: jest.fn().mockResolvedValue(['page.create']),
    };
    service = new AuditService(repo as any);
  });

  describe('record', () => {
    it('writes the entry via the repo', async () => {
      await service.record({ workspaceId: 'w1', action: 'page.create' } as any);
      expect(repo.insertAuditLog).toHaveBeenCalledWith({
        workspaceId: 'w1',
        action: 'page.create',
      });
    });

    it('never throws when the repo write fails', async () => {
      repo.insertAuditLog.mockRejectedValue(new Error('db down'));
      await expect(
        service.record({ workspaceId: 'w1', action: 'x' } as any),
      ).resolves.toBeUndefined();
    });
  });

  describe('list', () => {
    it('coerces date strings to Date and forwards filters + keyset opts', async () => {
      await service.list('w1', {
        action: 'page.create',
        startDate: '2026-01-02T00:00:00Z',
        limit: 50,
      });
      const [workspaceId, filters, opts] =
        repo.getWorkspaceAuditLogs.mock.calls[0];
      expect(workspaceId).toBe('w1');
      expect(filters.action).toBe('page.create');
      expect(filters.startDate).toBeInstanceOf(Date);
      expect(filters.endDate).toBeUndefined();
      expect(opts.limit).toBe(50);
      expect(opts.cursorId).toBeNull();
    });

    it('decodes an incoming cursor and returns an encoded nextCursor', async () => {
      // cursor is base64url of the id
      const cursor = Buffer.from('id-100', 'utf8').toString('base64url');
      repo.getWorkspaceAuditLogs.mockResolvedValue({
        items: [{ id: 'id-50' }],
        nextCursorId: 'id-50',
      });

      const result = await service.list('w1', { cursor });

      expect(repo.getWorkspaceAuditLogs.mock.calls[0][2].cursorId).toBe('id-100');
      expect(result.items).toEqual([{ id: 'id-50' }]);
      expect(
        Buffer.from(result.nextCursor as string, 'base64url').toString('utf8'),
      ).toBe('id-50');
    });

    it('returns a null nextCursor on the last page', async () => {
      repo.getWorkspaceAuditLogs.mockResolvedValue({
        items: [{ id: 'x' }],
        nextCursorId: null,
      });
      const result = await service.list('w1', {});
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getActions', () => {
    it('delegates to the repo', async () => {
      await expect(service.getActions('w1')).resolves.toEqual(['page.create']);
      expect(repo.getDistinctActions).toHaveBeenCalledWith('w1');
    });
  });
});
