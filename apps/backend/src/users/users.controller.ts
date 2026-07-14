import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignRolesDto,
} from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CanCreate,
  CanRead,
  CanUpdate,
  CanDelete,
} from '../common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @CanRead('users')
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  findAll(@Query() dto: PaginationDto) {
    return this.usersService.findAll(dto);
  }

  @Get(':id')
  @CanRead('users')
  @ApiOperation({ summary: 'Détail d\'un utilisateur' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @CanCreate('users')
  @ApiOperation({ summary: 'Créer un utilisateur' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @CanUpdate('users')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @CanUpdate('users')
  @ApiOperation({ summary: 'Activer / Désactiver un utilisateur' })
  toggle(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Delete(':id')
  @CanDelete('users')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/roles')
  @CanUpdate('users')
  @ApiOperation({ summary: 'Attribuer des rôles à un utilisateur' })
  assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(id, dto);
  }
}
