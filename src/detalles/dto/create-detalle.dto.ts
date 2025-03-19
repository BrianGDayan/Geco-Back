import { IsIn, IsInt, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class CreateDetalleDto {
 
    @IsString()
    @IsNotEmpty()
    especificacion: string;

    @IsInt()
    @IsNotEmpty()
    posicion: number;
    
    @IsInt()
    @IsNotEmpty()
    tipo: number;

    @IsInt()
    @IsNotEmpty()
    medidaDiametro: number;

    @IsNumber()
    @IsNotEmpty()
    longitudCorte: number;

    @IsInt()
    @IsNotEmpty()
    cantidadUnitaria: number;

    @IsInt()
    @IsNotEmpty()
    nroElementos: number;
    
    @IsInt()
    @IsNotEmpty()
    nroIguales: number;
}