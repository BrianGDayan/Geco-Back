import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateRegistroDto {
  @IsInt()
  @IsNotEmpty()
  idDetalle: number; 

  @IsInt()
  @IsNotEmpty()
  idTarea: number; 

  @IsInt()
  @IsNotEmpty()
  cantidad: number;

  @IsNumber()
  @IsNotEmpty()
  horasTrabajador: number;

  @IsNumber()
  @IsNotEmpty()
  horasAyudante: number;

  @IsString()
  @IsNotEmpty()
  nombreTrabajador: string; 

  @IsString()
  @IsNotEmpty()
  nombreAyudante: string; 
}
