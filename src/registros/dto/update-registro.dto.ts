import { IsDate, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRegistroDto {
    @IsOptional()
    @IsInt()
    cantidad?: number;

    @IsOptional()
    @IsNumber()
    horasTrabajador?: number;

    @IsOptional()
    @IsNumber()
    horasAyudante?: number;

    @IsOptional()
    @IsString()
    nombreTrabajador?: string; 
    
    @IsOptional()
    @IsString()
    nombreAyudante?: string; 
}
