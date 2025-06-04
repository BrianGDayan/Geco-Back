import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUsuarioDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'La clave debe tener al menos 8 caracteres' })
    @MaxLength(16, { message: 'La clave debe tener como máximo 16 caracteres' })
    clave: string;

    @IsEnum(['admin', 'encargado'], {
        message: 'El rol debe ser "administrador" o "encargado"'
    })
    rol: 'admin' | 'encargado';
}