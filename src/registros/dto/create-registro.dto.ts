import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

class OperadorInputDto {
  @IsInt()
  @IsNotEmpty()
  idTrabajador: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tiempoHoras?: number;

  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;
}

export class CreateRegistroDto {
  @IsInt()
  @IsNotEmpty()
  idDetalle: number;

  @IsInt()
  @IsNotEmpty()
  idTarea: number;

  @IsInt()
  @Min(1, { message: "La cantidad debe ser mayor a 0" })
  cantidad: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperadorInputDto)
  operadores: OperadorInputDto[];
}
