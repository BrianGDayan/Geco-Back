import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, ValidationPipe } from '@nestjs/common';
import { DetallesService } from './detalles.service';
import { CreateDetalleDto } from './dto/create-detalle.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';

@Controller('detalles')
export class DetallesController {

    constructor(private readonly detallesService: DetallesService) {}
        
    @Get()
    getDetalles() {
        return this.detallesService.getDetalles();
    }

    @Get(':id')
    getDetallesById(@Param('id', ParseIntPipe) id: number) {
        return this.detallesService.getDetallesById(id);
    } 

    @Post()
    createDetalle(@Body(ValidationPipe) createDetalleDto: CreateDetalleDto) {
        return this.detallesService.createDetalle(createDetalleDto);
    }

    @Patch(':id')
    updateDetalle(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateDetalleDto: UpdateDetalleDto) {
        return this.detallesService.updateDetalle(id, updateDetalleDto);
    }
    
}
