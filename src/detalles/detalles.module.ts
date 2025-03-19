import { Module } from '@nestjs/common';
import { DetallesController } from './detalles.controller';
import { DetallesService } from './detalles.service';

@Module({
  controllers: [DetallesController],
  providers: [DetallesService]
})
export class DetallesModule {}
