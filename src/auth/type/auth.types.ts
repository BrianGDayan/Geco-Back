export interface UserPayload {
    id_usuario: number;
    rol: string;
  }

  export enum UserRole {
    ADMIN = 'admin',
    ENCARGADO = 'encargado',
  }