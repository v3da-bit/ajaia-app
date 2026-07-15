export type DocAccess = {
  ownerId: number;
  sharedUserIds: number[];
};

/** Can this user open the document (as owner or via a share)? */
export function canAccess(doc: DocAccess, userId: number): boolean {
  return doc.ownerId === userId || doc.sharedUserIds.includes(userId);
}

/** Only the owner may rename, delete, or manage sharing on the document. */
export function canManage(doc: DocAccess, userId: number): boolean {
  return doc.ownerId === userId;
}
