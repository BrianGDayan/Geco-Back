import { Body, Controller, HttpStatus, Post, Res, UseGuards, Req, Patch, Param, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from "src/auth/guards/roles.guard";
import { RegistrosService } from './registros.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/type/auth.types';

@Controller('registro')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}
  
  // Endpoint para crear un nuevo registro
  @Post()
  @Roles(UserRole.ENCARGADO)
  async createRegistro(@Body() createRegistroDto: CreateRegistroDto, @Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Usuario no autenticado' });
    }
   
    const idUsuario = (req.user as any).id_usuario;

    try {
      const registro = await this.registrosService.createRegistro(createRegistroDto, idUsuario);
      return res.status(HttpStatus.CREATED).json(registro);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  // Endpoint para actualizar un registro existente
  @Patch(':idRegistro')
  @Roles(UserRole.ENCARGADO)
  async updateRegistro(@Param('idRegistro', ParseIntPipe) idRegistro: number, @Body() updateRegistroDto: UpdateRegistroDto, @Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    try {
      const updatedRegistro = await this.registrosService.updateRegistro(idRegistro, updateRegistroDto);
      return res.status(HttpStatus.OK).json(updatedRegistro);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
}
