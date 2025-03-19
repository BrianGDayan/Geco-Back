import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';

@Controller('registros')
export class RegistrosController {

    constructor(private readonly registrosService: RegistrosService) {}
        
    @Get()
    getRegistros() {
        return this.registrosService.getRegistros();
    }

    @Get(':id')
    getRegistrosById(@Param('id', ParseIntPipe) id: number) {
        return this.registrosService.getRegistrosById(id);
    } 

    @Post()
    createRegistro(@Body(ValidationPipe) createRegistroDto: CreateRegistroDto) {
        return this.registrosService.createRegistro(createRegistroDto);
    }

    @Patch(':id')
    updateRegistro(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateRegistroDto: UpdateRegistroDto) {
        return this.registrosService.updateRegistro(id, updateRegistroDto);
    }
}
