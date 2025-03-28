import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PlanillasModule } from './planillas/planillas.module';
import { RegistrosModule } from './registros/registros.module';
import { PrismaModule } from './prisma/prisma.module';
import { TrabajadoresModule } from './trabajadores/trabajadores.module';

@Module({
  imports: [AuthModule, ScheduleModule.forRoot(), UsuariosModule, PlanillasModule, RegistrosModule, PrismaModule, TrabajadoresModule],
})
export class AppModule {}
