import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateRegistroDto {
  @IsInt()
  @IsNotEmpty()
  idDetalle: number;

  @IsInt()
  @IsNotEmpty()
  idTarea: number;

  @IsInt()
  @Min(0, { message: "La cantidad no puede ser negativa" })
  @IsNotEmpty()
  cantidad: number;

  @IsNumber()
  @Min(0.01, { message: "Las horas deben ser mayores a 0" })
  @IsNotEmpty()
  horasTrabajador: number;

  @IsNumber()
  @Min(0.01, { message: "Las horas deben ser mayores a 0" })
  @IsOptional()
  horasAyudante?: number;

  @IsString()
  @IsNotEmpty()
  nombreTrabajador: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombreAyudante?: string;
}
