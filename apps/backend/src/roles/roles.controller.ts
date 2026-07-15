// roles.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RolesService,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
} from './roles.service';
import { CanCreate, CanRead, CanUpdate, CanDelete } from '../common/decorators/permissions.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @CanRead('roles')
  @ApiOperation({ summary: 'Liste des rôles' })
  findAll() {
    return this.rolesService.findAllRoles();
  }

  @Get(':id')
  @CanRead('roles')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  @CanCreate('roles')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Put(':id')
  @CanUpdate('roles')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  @CanDelete('roles')
  remove(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Get('permissions/all')
  @CanRead('roles')
  @ApiOperation({ summary: 'Liste de toutes les permissions' })
  getPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('permissions')
  @CanCreate('roles')
  @ApiOperation({ summary: 'Créer une permission' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rolesService.createPermission(dto);
  }
}
