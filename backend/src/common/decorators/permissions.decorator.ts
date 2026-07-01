import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  action: string;
  resource: string;
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Raccourcis sémantiques
export const CanCreate = (resource: string) =>
  RequirePermissions({ action: 'create', resource });

export const CanRead = (resource: string) =>
  RequirePermissions({ action: 'read', resource });

export const CanUpdate = (resource: string) =>
  RequirePermissions({ action: 'update', resource });

export const CanDelete = (resource: string) =>
  RequirePermissions({ action: 'delete', resource });
