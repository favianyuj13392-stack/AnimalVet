export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    rol : {
      id: number;
      nombre: string;
    }
  };
}