import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // Aucune permission requise = accès libre (juste l'auth JWT suffit)
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('Non authentifié');

    // Le Manager a accès à tout
    if (user.roles?.includes('MANAGER')) return true;

    const userPermissions: string[] = user.permissions ?? [];

    const hasAll = requiredPermissions.every(({ action, resource }) =>
      userPermissions.includes(`${action}:${resource}`),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        'Vous n\'avez pas les permissions nécessaires',
      );
    }

    return true;
  }
}
