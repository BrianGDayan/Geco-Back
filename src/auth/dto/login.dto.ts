import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsInt()
  @IsNotEmpty()
  idUsuario: number;

  @IsString()
  @IsNotEmpty()
  clave: string;
}