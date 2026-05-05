export interface IBasicUser {
  id: string;
  email: string;
  fullName: string;
  role?: "USER" | "ADMIN";
}

