import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';




@Controller('usuarios')
export class UsuariosController {
    
    constructor(private readonly usuariosService: UsuariosService) {}

    @Get()
    getUsuarios(@Query('rol') rol?: 'administrador' | 'encargado') {
        return this.usuariosService.getUsuarios(rol);
    }

    @Get(':id')
    getUsuarioById(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.getUsuarioById(id);
    } 

    @Post()
    createUsuario(@Body(ValidationPipe) createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.createUsuario(createUsuarioDto);
    }

    @Patch(':id')
    updateUsuario(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.updateUsuario(id, updateUsuarioDto);
    }

    @Delete(':id')
    deleteUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.deleteUsuario(id);
    }
}
