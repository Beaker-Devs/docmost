import { decodeAuditCursor, encodeAuditCursor } from './audit-cursor';

describe('audit cursor', () => {
  it('round-trips an id', () => {
    const id = '01a1413a-31b3-759e-a2a5-583eca131ed3';
    expect(decodeAuditCursor(encodeAuditCursor(id))).toBe(id);
  });

  it('produces an opaque (non-plaintext) cursor', () => {
    const id = 'abc-123';
    expect(encodeAuditCursor(id)).not.toBe(id);
  });

  it('returns null for empty/undefined input', () => {
    expect(decodeAuditCursor(undefined)).toBeNull();
    expect(decodeAuditCursor(null)).toBeNull();
    expect(decodeAuditCursor('')).toBeNull();
  });
});
