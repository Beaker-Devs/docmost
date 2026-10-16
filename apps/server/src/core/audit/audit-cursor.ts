/**
 * Opaque keyset cursor for the audit log. We paginate on the row id (a uuid v7,
 * which is monotonic/time-ordered), so the cursor is just the last seen id,
 * base64-encoded so callers treat it as opaque.
 */
export function encodeAuditCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64url');
}

export function decodeAuditCursor(cursor?: string | null): string | null {
  if (!cursor) return null;
  try {
    const id = Buffer.from(cursor, 'base64url').toString('utf8');
    return id.length ? id : null;
  } catch {
    return null;
  }
}
