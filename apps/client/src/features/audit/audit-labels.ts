import { TFunction } from "i18next";

// English labels for known audit actions (re-translated via i18n at render).
const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "page.create": "Created page",
  "page.update": "Updated page",
  "page.delete": "Deleted page",
  "page.move": "Moved page",
  "page.move_to_space": "Moved page to space",
  "page.copy_to_space": "Copied page to space",
  "page.restore": "Restored page",
  "space.create": "Created space",
  "space.update": "Updated space",
  "space.delete": "Deleted space",
  "space_member.add": "Added space member",
  "space_member.remove": "Removed space member",
  "space_member.change_role": "Changed space member role",
  "group.create": "Created group",
  "group.update": "Updated group",
  "group.delete": "Deleted group",
  "group_member.add": "Added group member",
  "group_member.remove": "Removed group member",
  "workspace.update": "Updated workspace settings",
  "workspace_member.deactivate": "Deactivated member",
  "workspace_member.change_role": "Changed member role",
  "workspace_member.delete": "Removed member",
  "workspace.invite": "Invited member",
  "workspace.invite_revoke": "Revoked invitation",
  "share.create": "Created public share",
  "share.delete": "Deleted public share",
  "board.create": "Created board",
  "board.update": "Updated board",
  "board.delete": "Deleted board",
};

export function auditActionLabel(action: string, t: TFunction): string {
  const label = ACTION_LABELS[action];
  return label ? t(label) : action;
}
