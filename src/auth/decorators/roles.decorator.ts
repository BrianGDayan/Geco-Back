import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../type/auth.types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);