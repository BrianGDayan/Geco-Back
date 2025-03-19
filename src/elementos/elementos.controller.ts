import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe } from '@nestjs/common';
import { ElementosService } from './elementos.service';
import { CreateElementoDto } from './dto/create-elemento.dto';
import { UpdateElementoDto } from './dto/update-elemento.dto';

@Controller('elementos')
export class ElementosController {

    constructor(private readonly elementosService: ElementosService) {}
    
    @Get()
    getElementos() {
        return this.elementosService.getElementos();
    }

    @Get(':id')
    getElementosById(@Param('id', ParseIntPipe) id: number) {
        return this.elementosService.getElementosById(id);
    } 

    @Post()
    createElemento(@Body(ValidationPipe) createElementoDto: CreateElementoDto) {
        return this.elementosService.createElemento(createElementoDto);
    }

    @Patch(':id')
    updateElemento(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateElementoDto: UpdateElementoDto) {
        return this.elementosService.updateElemento(id, updateElementoDto);
    }
}
