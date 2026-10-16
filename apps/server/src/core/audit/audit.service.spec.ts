jest.mock('@docmost/db/repos/audit/audit.repo', () => ({ AuditRepo: class {} }));

import { AuditService } from './audit.service';

describe('AuditService', () => {
  let repo: { insertAuditLog: jest.Mock; getWorkspaceAuditLogs: jest.Mock; getDistinctActions: jest.Mock };
  let service: AuditService;

  beforeEach(() => {
    repo = {
      insertAuditLog: jest.fn().mockResolvedValue(undefined),
      getWorkspaceAuditLogs: jest.fn().mockResolvedValue({ items: [], meta: {} }),
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
    it('coerces date strings to Date and forwards filters + pagination', async () => {
      await service.list(
        'w1',
        { action: 'page.create', startDate: '2026-01-02T00:00:00Z' },
        { page: 2, limit: 30 } as any,
      );
      const [workspaceId, filters, pagination] =
        repo.getWorkspaceAuditLogs.mock.calls[0];
      expect(workspaceId).toBe('w1');
      expect(filters.action).toBe('page.create');
      expect(filters.startDate).toBeInstanceOf(Date);
      expect(filters.endDate).toBeUndefined();
      expect(pagination).toEqual({ page: 2, limit: 30 });
    });
  });

  describe('getActions', () => {
    it('delegates to the repo', async () => {
      await expect(service.getActions('w1')).resolves.toEqual(['page.create']);
      expect(repo.getDistinctActions).toHaveBeenCalledWith('w1');
    });
  });
});
