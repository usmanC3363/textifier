export type PermissionStatus = "pending" | "active";

export interface DocumentPermission {
  docId: string;
  role: "owner" | "editor" | "viewer";
  status: PermissionStatus;

  userId?: string;
  email?: string;

  invitedAt?: any;
  grantedAt?: any;
  firstOpenedAt?: any;

  grantedBy: string;
}
