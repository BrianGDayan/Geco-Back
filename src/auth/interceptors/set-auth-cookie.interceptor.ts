import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class SetAuthCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap((data) => {
        if (data && data.access_token) {
          res.cookie('access_token', data.access_token, {
            httpOnly: true,
            secure: true, // obligatorio en producción con HTTPS
            sameSite: 'none', 
            domain: process.env.COOKIE_DOMAIN || '.onrender.com', // ajusta para abarcar front y back
            maxAge: 2 * 60 * 60 * 1000,
            path: '/',
          });
          delete data.access_token;
        }
      }),
    );
  }
}
