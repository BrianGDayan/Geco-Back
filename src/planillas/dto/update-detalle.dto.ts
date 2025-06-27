import { IsInt, IsNumber, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateDetalleDto {
    @IsOptional()
    @IsUrl({}, { message: 'La especificación debe ser una URL válida' })
    especificacion?: string;
  
    @IsOptional()
    @IsString()
    posicion?: string;
  
    @IsOptional()
    @IsInt()
    tipo?: number;
  
    @IsOptional()
    @IsInt()
    medidaDiametro?: number;
  
    @IsOptional()
    @IsNumber()
    longitudCorte?: number;
  
    @ValidateIf(o => o.cantidadUnitaria !== undefined)
    @IsInt()
    cantidadUnitaria?: number;
  
    @ValidateIf(o => o.nroElementos !== undefined)
    @IsInt()
    nroElementos?: number;
  
    @ValidateIf(o => o.nroIguales !== undefined)
    @IsInt()
    nroIguales?: number;
}