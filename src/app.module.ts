import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PlanillasModule } from './planillas/planillas.module';
import { RegistrosModule } from './registros/registros.module';
import { TrabajadoresModule } from './trabajadores/trabajadores.module';
import { DetallesModule } from './detalles/detalles.module';
import { PrismaModule } from './prisma/prisma.module';
import { ElementosModule } from './elementos/elementos.module';
import { DetalleTareaModule } from './detalle_tarea/detalle_tarea.module';
@Module({
  imports: [AuthModule, UsuariosModule, PlanillasModule, RegistrosModule, TrabajadoresModule, DetallesModule, ElementosModule, PrismaModule, DetalleTareaModule],
})
export class AppModule {}
