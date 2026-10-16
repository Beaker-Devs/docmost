/**
 * Coalesces a burst of document saves into a single audit entry per editing
 * session. Collaborative edits are persisted every few seconds while someone
 * types; without throttling that would flood the audit log. We record the
 * first edit of a session and then suppress further edits for the same
 * (page, user) until the window elapses with no activity.
 *
 * In-memory and best-effort: a process restart simply starts a fresh window,
 * which is acceptable for audit-of-edits (content history itself lives in page
 * versions).
 */
export class EditSessionThrottle {
  private readonly lastRecorded = new Map<string, number>();

  constructor(private readonly windowMs: number) {}

  /**
   * Returns true if an audit entry should be written for `key` now. Stale keys
   * are pruned on each call so the map stays bounded to recently active
   * editors.
   */
  shouldRecord(key: string, now: number = Date.now()): boolean {
    this.prune(now);
    if (this.lastRecorded.has(key)) {
      return false;
    }
    this.lastRecorded.set(key, now);
    return true;
  }

  private prune(now: number): void {
    for (const [k, ts] of this.lastRecorded) {
      if (now - ts >= this.windowMs) {
        this.lastRecorded.delete(k);
      }
    }
  }
}
