import "next-auth";
import "next-auth/jwt";

type AppRole = "ADMIN" | "USER";
type AppStatus = "PENDING" | "ACCEPTED" | "VERIFIED" | "REJECTED";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: AppRole;
      status?: AppStatus;
      isActive?: boolean;
      authTime?: number; // unix seconds when the user last entered password
    };
  }

  interface User {
    id: string;
    role?: AppRole;
    status?: AppStatus;
    isActive?: boolean;
    authTime?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    status?: AppStatus;
    isActive?: boolean;
    authTime?: number;
  }
}