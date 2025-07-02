import { Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

export class DetalleDto {
    @IsString()
    @IsNotEmpty({ message: 'La especificación es requerida' })
    especificacion: string;

    @IsString()
    @IsNotEmpty({ message: 'La posición es requerida' })
    posicion: string;

    @IsInt()
    @IsNotEmpty({ message: 'El tipo es requerido' })
    tipo: number;

    @IsInt()
    @IsNotEmpty({ message: 'El diámetro es requerido' })
    medidaDiametro: number;

    @IsNumber()
    @IsNotEmpty({ message: 'La longitud de corte es requerida' })
    longitudCorte: number;

    @IsInt()
    @IsNotEmpty({ message: 'La cantidad unitaria es requerida' })
    cantidadUnitaria: number;

    @IsInt()
    @IsNotEmpty({ message: 'El número de elementos es requerido' })
    nroElementos: number;

    @IsInt()
    @IsNotEmpty({ message: 'El número de iguales es requerido' })
    nroIguales: number;
}

export class ElementoDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre del elemento es requerido' })
    @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
    nombre: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DetalleDto)
    detalle: DetalleDto[];
}


export class CreatePlanillaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(15, { message: 'El número de planilla no puede tener más de 15 caracteres' })
    nroPlanilla: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30, { message: 'El nombre de la obra no puede tener más de 30 caracteres' })
    obra: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30, { message: 'El número de plano no puede tener más de 30 caracteres' })
    nroPlano: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(30, { message: 'El nombre del sector no puede tener más de 30 caracteres' })
    sector: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(15, { message: 'El nombre del encargado de elaborar no puede tener más de 15 caracteres' })
    encargadoElaborar: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(15, { message: 'El nombre del encargado de revisar no puede tener más de 15 caracteres' })
    encargadoRevisar: string;

    @IsString()
    @IsOptional()
    @MaxLength(15, { message: 'El nombre del encargado de aprobar no puede tener más de 15 caracteres' })
    encargadoAprobar: string;

    @IsDate({ message: 'La fecha debe ser una instancia de Date' })
    @Type(() => Date)
    @IsNotEmpty({ message: 'La fecha es requerida' })
    fecha: Date;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20, { message: 'El item no puede tener más de 20 caracteres' })
    item: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ElementoDto)
    elemento: ElementoDto[];

}
