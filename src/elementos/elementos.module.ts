import { Module } from '@nestjs/common';
import { ElementosController } from './elementos.controller';
import { ElementosService } from './elementos.service';

@Module({
  controllers: [ElementosController],
  providers: [ElementosService]
})
export class ElementosModule {}
