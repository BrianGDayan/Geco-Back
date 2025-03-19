import { IsNotEmpty, IsString, MaxLength } from "class-validator";


export class CreateElementoDto {
    
    @IsString()
    @IsNotEmpty()
    @MaxLength(50, { message: 'El nombre del elemento no puede tener más de 50 caracteres' })
    nombre: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(15, { message: 'El número de planilla no puede tener más de 15 caracteres' })
    nroPlanilla: string;

}