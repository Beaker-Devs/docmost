jest.mock('@docmost/db/repos/audit/audit.repo', () => ({ AuditRepo: class {} }));
jest.mock('../../integrations/environment/environment.service', () => ({
  EnvironmentService: class {},
}));

import { AuditRetentionService } from './audit-retention.service';

describe('AuditRetentionService', () => {
  let repo: { deleteOlderThan: jest.Mock };
  let env: { getAuditLogRetentionDays: jest.Mock };
  let service: AuditRetentionService;

  beforeEach(() => {
    repo = { deleteOlderThan: jest.fn().mockResolvedValue(3) };
    env = { getAuditLogRetentionDays: jest.fn().mockReturnValue(90) };
    service = new AuditRetentionService(repo as any, env as any);
  });

  it('deletes rows older than the retention cutoff', async () => {
    const before = Date.now();
    await service.prune();
    expect(repo.deleteOlderThan).toHaveBeenCalledTimes(1);
    const cutoff: Date = repo.deleteOlderThan.mock.calls[0][0];
    const expectedMs = before - 90 * 24 * 60 * 60 * 1000;
    // cutoff should be ~90 days ago (allow a few seconds of drift)
    expect(Math.abs(cutoff.getTime() - expectedMs)).toBeLessThan(10_000);
  });

  it('does nothing when retention is disabled (0)', async () => {
    env.getAuditLogRetentionDays.mockReturnValue(0);
    await service.prune();
    expect(repo.deleteOlderThan).not.toHaveBeenCalled();
  });

  it('never throws when the delete fails', async () => {
    repo.deleteOlderThan.mockRejectedValue(new Error('db down'));
    await expect(service.prune()).resolves.toBeUndefined();
  });
});
