import { IsInt, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateDetalleDto {
    @IsOptional()
    @IsString()
    especificacion?: string;
  
    @IsOptional()
    @IsInt()
    posicion?: number;
  
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