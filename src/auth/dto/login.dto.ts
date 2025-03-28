import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @IsString()
  @IsNotEmpty()
  clave: string;
}