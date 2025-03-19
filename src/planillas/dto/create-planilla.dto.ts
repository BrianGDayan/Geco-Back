import { IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

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

    @IsDate()
    @IsNotEmpty()
    fecha: Date;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20, { message: 'El item no puede tener más de 20 caracteres' })
    item: string;

}
