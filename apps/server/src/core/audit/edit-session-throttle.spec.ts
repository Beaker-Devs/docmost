import { EditSessionThrottle } from './edit-session-throttle';

describe('EditSessionThrottle', () => {
  const WINDOW = 1000;

  it('records the first edit of a session', () => {
    const t = new EditSessionThrottle(WINDOW);
    expect(t.shouldRecord('page1:user1', 0)).toBe(true);
  });

  it('suppresses further edits within the window', () => {
    const t = new EditSessionThrottle(WINDOW);
    expect(t.shouldRecord('page1:user1', 0)).toBe(true);
    expect(t.shouldRecord('page1:user1', 300)).toBe(false);
    expect(t.shouldRecord('page1:user1', 999)).toBe(false);
  });

  it('records again once the window elapses with no activity', () => {
    const t = new EditSessionThrottle(WINDOW);
    expect(t.shouldRecord('page1:user1', 0)).toBe(true);
    expect(t.shouldRecord('page1:user1', 1000)).toBe(true);
    expect(t.shouldRecord('page1:user1', 1200)).toBe(false);
  });

  it('tracks each (page, user) key independently', () => {
    const t = new EditSessionThrottle(WINDOW);
    expect(t.shouldRecord('page1:user1', 0)).toBe(true);
    expect(t.shouldRecord('page1:user2', 100)).toBe(true);
    expect(t.shouldRecord('page2:user1', 100)).toBe(true);
    expect(t.shouldRecord('page1:user1', 100)).toBe(false);
  });

  it('prunes stale keys so the map stays bounded', () => {
    const t = new EditSessionThrottle(WINDOW);
    t.shouldRecord('page1:user1', 0);
    // a much later edit for a different key prunes the stale one
    t.shouldRecord('page2:user1', 5000);
    expect((t as any).lastRecorded.has('page1:user1')).toBe(false);
    expect((t as any).lastRecorded.has('page2:user1')).toBe(true);
  });
});
