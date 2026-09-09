interface PermissionGroups {
  USER: { MANAGE: "manage_users" };
  ROLE: { MANAGE: "manage_roles" };
  PERMISSION: { MANAGE: "manage_permissions" };
  ORDERS: { VIEW: "view_orders"; UPDATE: "update_orders" };
}
export const PERMISSION_GROUPS: PermissionGroups = {
  USER: { MANAGE: "manage_users" },
  ROLE: { MANAGE: "manage_roles" },
  PERMISSION: { MANAGE: "manage_permissions" },
  ORDERS: { VIEW: "view_orders", UPDATE: "update_orders" },
};
export type PermissionName = {
  [K in keyof PermissionGroups]: PermissionGroups[K][keyof PermissionGroups[K]];
}[keyof PermissionGroups];
export const USER_PERMISSIONS = PERMISSION_GROUPS.USER;
export const ROLE_PERMISSIONS = PERMISSION_GROUPS.ROLE;
export const PERMISSION_PERMISSIONS = PERMISSION_GROUPS.PERMISSION;
