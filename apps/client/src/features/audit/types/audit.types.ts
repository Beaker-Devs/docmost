export interface IAuditActor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface IAuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  detail: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  workspaceId: string;
  createdAt: string;
  actor: IAuditActor | null;
}

export interface IAuditLogList {
  items: IAuditLog[];
  nextCursor: string | null;
}

export interface IAuditLogParams {
  limit?: number;
  cursor?: string | null;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
