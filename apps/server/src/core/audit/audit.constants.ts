/**
 * Allowlist of mutating API routes that produce an audit entry. Docmost uses
 * POST for both reads and writes, so only paths listed here are recorded —
 * everything else (including reads) is ignored.
 */
export interface AuditRouteDef {
  action: string;
  resourceType: string;
  /** request-body field that holds the primary resource id, if any */
  resourceIdField?: string;
}

export const AUDIT_ROUTES: Record<string, AuditRouteDef> = {
  // pages
  '/api/pages/create': { action: 'page.create', resourceType: 'page' },
  '/api/pages/update': { action: 'page.update', resourceType: 'page', resourceIdField: 'pageId' },
  '/api/pages/delete': { action: 'page.delete', resourceType: 'page', resourceIdField: 'pageId' },
  '/api/pages/move': { action: 'page.move', resourceType: 'page', resourceIdField: 'pageId' },
  '/api/pages/move-to-space': { action: 'page.move_to_space', resourceType: 'page', resourceIdField: 'pageId' },
  '/api/pages/copy-to-space': { action: 'page.copy_to_space', resourceType: 'page', resourceIdField: 'pageId' },
  '/api/pages/restore': { action: 'page.restore', resourceType: 'page', resourceIdField: 'pageId' },

  // spaces
  '/api/spaces/create': { action: 'space.create', resourceType: 'space' },
  '/api/spaces/update': { action: 'space.update', resourceType: 'space', resourceIdField: 'spaceId' },
  '/api/spaces/delete': { action: 'space.delete', resourceType: 'space', resourceIdField: 'spaceId' },
  '/api/spaces/members/add': { action: 'space_member.add', resourceType: 'space', resourceIdField: 'spaceId' },
  '/api/spaces/members/remove': { action: 'space_member.remove', resourceType: 'space', resourceIdField: 'spaceId' },
  '/api/spaces/members/role': { action: 'space_member.change_role', resourceType: 'space', resourceIdField: 'spaceId' },

  // groups
  '/api/groups/create': { action: 'group.create', resourceType: 'group' },
  '/api/groups/update': { action: 'group.update', resourceType: 'group', resourceIdField: 'groupId' },
  '/api/groups/delete': { action: 'group.delete', resourceType: 'group', resourceIdField: 'groupId' },
  '/api/groups/members/add': { action: 'group_member.add', resourceType: 'group', resourceIdField: 'groupId' },
  '/api/groups/members/remove': { action: 'group_member.remove', resourceType: 'group', resourceIdField: 'groupId' },

  // workspace & members
  '/api/workspace/update': { action: 'workspace.update', resourceType: 'workspace' },
  '/api/workspace/members/deactivate': { action: 'workspace_member.deactivate', resourceType: 'workspace', resourceIdField: 'userId' },
  '/api/workspace/members/role': { action: 'workspace_member.change_role', resourceType: 'workspace', resourceIdField: 'userId' },
  '/api/workspace/members/delete': { action: 'workspace_member.delete', resourceType: 'workspace', resourceIdField: 'userId' },
  '/api/workspace/invites/create': { action: 'workspace.invite', resourceType: 'workspace' },
  '/api/workspace/invites/revoke': { action: 'workspace.invite_revoke', resourceType: 'workspace' },

  // shares
  '/api/shares/create': { action: 'share.create', resourceType: 'share', resourceIdField: 'pageId' },
  '/api/shares/delete': { action: 'share.delete', resourceType: 'share', resourceIdField: 'shareId' },

  // boards
  '/api/boards/create': { action: 'board.create', resourceType: 'board' },
  '/api/boards/update': { action: 'board.update', resourceType: 'board', resourceIdField: 'boardId' },
  '/api/boards/delete': { action: 'board.delete', resourceType: 'board', resourceIdField: 'boardId' },
};

/**
 * Request-body fields that are safe to copy into the audit detail. Everything
 * else (notably passwords, tokens, page content) is dropped.
 */
export const AUDIT_SAFE_FIELDS = [
  'title',
  'name',
  'email',
  'role',
  'visibility',
  'spaceId',
  'pageId',
  'groupId',
  'boardId',
  'cardId',
  'columnId',
  'shareId',
  'userId',
  'memberId',
  'parentPageId',
  'newParentTitle',
  'userIds',
  'groupIds',
  'spaceIds',
] as const;

/** Human-readable labels for actions (English source; UI re-translates). */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'page.create': 'Created page',
  'page.update': 'Updated page',
  'page.delete': 'Deleted page',
  'page.move': 'Moved page',
  'page.move_to_space': 'Moved page to space',
  'page.copy_to_space': 'Copied page to space',
  'page.restore': 'Restored page',
  'space.create': 'Created space',
  'space.update': 'Updated space',
  'space.delete': 'Deleted space',
  'space_member.add': 'Added space member',
  'space_member.remove': 'Removed space member',
  'space_member.change_role': 'Changed space member role',
  'group.create': 'Created group',
  'group.update': 'Updated group',
  'group.delete': 'Deleted group',
  'group_member.add': 'Added group member',
  'group_member.remove': 'Removed group member',
  'workspace.update': 'Updated workspace settings',
  'workspace_member.deactivate': 'Deactivated member',
  'workspace_member.change_role': 'Changed member role',
  'workspace_member.delete': 'Removed member',
  'workspace.invite': 'Invited member',
  'workspace.invite_revoke': 'Revoked invitation',
  'share.create': 'Created public share',
  'share.delete': 'Deleted public share',
  'board.create': 'Created board',
  'board.update': 'Updated board',
  'board.delete': 'Deleted board',
};
