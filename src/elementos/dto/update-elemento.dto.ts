import { CreateElementoDto } from "./create-elemento.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateElementoDto extends PartialType(CreateElementoDto) { }