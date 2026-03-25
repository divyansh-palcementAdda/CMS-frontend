export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: AuthData;
  timestamp: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
  status?: string;
  emailVerified?: boolean;
  token: string;
}

export interface JwtPayload {
  userId: number;
  sub: string;
  iat: number;
  exp: number;
}
