import { CreateRegistroDto } from "./create-registro.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateRegistroDto extends PartialType(CreateRegistroDto) { }   