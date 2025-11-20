import { Body, Controller, HttpStatus, Post, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from "../auth/guards/roles.guard";
import { RegistrosService } from './registros.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/type/auth.types';

@Controller('registros')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}
  
  @Post()
  @Roles(UserRole.ENCARGADO)
  async createRegistro(
    @Body() createRegistroDto: CreateRegistroDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!req.user) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Usuario no autenticado' });
    }
   
    const idUsuario = (req.user as any).id_usuario;

    try {
      const registro = await this.registrosService.createRegistro(createRegistroDto, idUsuario);
      return res.status(HttpStatus.CREATED).json(registro);
    } catch (error: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
