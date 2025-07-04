import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class SetAuthCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(data => {
        if (data && data.access_token) {
          res.cookie('access_token', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: 'localhost',
            maxAge: 2 * 60 * 60 * 1000,
            path: '/',
          });
          // Evitar enviar el token en el JSON de respuesta
          delete data.access_token;
        }
      }),
    );
  }
}
