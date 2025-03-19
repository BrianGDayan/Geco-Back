import { PartialType } from "@nestjs/mapped-types"
import { CreateDetalleDto } from "./create-detalle.dto"


export class UpdateDetalleDto extends PartialType(CreateDetalleDto) {}