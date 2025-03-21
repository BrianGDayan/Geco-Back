import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';




@Controller('usuarios')
export class UsuariosController {
    
    constructor(private readonly usuariosService: UsuariosService) {}

    // Endpoint para obtener todos los usuarios
    @Get()
    async getUsuarios(@Query('rol') rol?: 'administrador' | 'encargado') {
        return this.usuariosService.getUsuarios(rol);
    }

     // Endpoint para obtener un usuario por su id
    @Get(':id')
    async getUsuarioById(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.getUsuarioById(id);
    } 

    // Endpoint para crear un usuario nuevo
    @Post()
    async createUsuario(@Body(ValidationPipe) createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.createUsuario(createUsuarioDto);
    }

    // Endpoint para modificar datos de un usuario
    @Patch(':id')
    async updateUsuario(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateUsuarioDto: UpdateUsuarioDto) {
        return this.usuariosService.updateUsuario(id, updateUsuarioDto);
    }

    // Endpoint para eliminar un usuario
    @Delete(':id')
    async deleteUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.deleteUsuario(id);
    }
}
