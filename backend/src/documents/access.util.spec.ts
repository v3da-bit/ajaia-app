import { canAccess, canManage } from './access.util';

describe('access.util', () => {
  const doc = { ownerId: 1, sharedUserIds: [2, 3] };

  it('owner can access and manage', () => {
    expect(canAccess(doc, 1)).toBe(true);
    expect(canManage(doc, 1)).toBe(true);
  });

  it('a shared user can access but not manage', () => {
    expect(canAccess(doc, 2)).toBe(true);
    expect(canManage(doc, 2)).toBe(false);
  });

  it('a stranger can neither access nor manage', () => {
    expect(canAccess(doc, 99)).toBe(false);
    expect(canManage(doc, 99)).toBe(false);
  });
});
