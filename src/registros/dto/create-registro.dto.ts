import { IsDate, IsIn, IsInt, IsNotEmpty, IsNumber } from "class-validator";


export class CreateRegistroDto {

    @IsInt()
    @IsNotEmpty()
    idTarea: number;

    @IsDate()
    @IsNotEmpty()
    fecha: Date;

    @IsInt()
    @IsNotEmpty()
    cantidad: number;

    @IsNumber()
    @IsNotEmpty()
    horasTrabajador: number;

    @IsNumber()
    @IsNotEmpty()
    horasAyudante: number;
}