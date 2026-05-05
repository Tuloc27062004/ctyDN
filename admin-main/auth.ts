import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { Role, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const ONE_HOUR = 60 * 60;
const AUTH_DEBUG = true;

type AppRole = "ADMIN" | "USER";
type AppUserStatus = "PENDING" | "ACCEPTED" | "VERIFIED" | "REJECTED";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: AppUserStatus;
  isActive: boolean;
  authTime: number;
};

function authLog(message: string, data?: unknown) {
  if (!AUTH_DEBUG) return;

  const ts = new Date().toISOString();

  if (data !== undefined) {
    console.log(`[AUTH DEBUG] ${ts} ${message}`, data);
  } else {
    console.log(`[AUTH DEBUG] ${ts} ${message}`);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },

  session: {
    strategy: "jwt",
    maxAge: ONE_HOUR,
  },

  jwt: {
    maxAge: ONE_HOUR,
  },

  debug: AUTH_DEBUG,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      authorize: async (rawCredentials) => {
        authLog("authorize() called");

        const rawEmail =
          typeof rawCredentials?.email === "string"
            ? rawCredentials.email
            : "";

        const rawPassword =
          typeof rawCredentials?.password === "string"
            ? rawCredentials.password
            : "";

        authLog("rawCredentials received", {
          hasRawCredentials: !!rawCredentials,
          email: rawEmail,
          hasPassword: rawPassword.length > 0,
          passwordLength: rawPassword.length,
        });

        try {
          const parsed = credentialsSchema.safeParse({
            email: rawEmail,
            password: rawPassword,
          });

          if (!parsed.success) {
            authLog("credentialsSchema.safeParse failed", parsed.error.flatten());
            return null;
          }

          const email = parsed.data.email.trim().toLowerCase();
          const password = parsed.data.password;

          authLog("parsed credentials ok", {
            email,
            hasPassword: password.length > 0,
            passwordLength: password.length,
          });

          const user = await prisma.user.findUnique({
            where: { email },
          });

          authLog("prisma.user.findUnique finished", {
            email,
            found: !!user,
          });

          if (!user) {
            authLog("login rejected: user not found", { email });
            return null;
          }

          authLog("user found", {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            isActive: user.isActive,
            hasPassword: !!user.password,
            passwordHashLength: user.password?.length ?? 0,
          });

          if (!user.isActive) {
            authLog("login rejected: user inactive", {
              email: user.email,
              isActive: user.isActive,
            });
            return null;
          }

          if (user.role !== Role.ADMIN) {
            authLog("login rejected: role is not ADMIN", {
              email: user.email,
              role: user.role,
            });
            return null;
          }

          if (
            user.status !== UserStatus.ACCEPTED &&
            user.status !== UserStatus.VERIFIED
          ) {
            authLog("login rejected: invalid status", {
              email: user.email,
              status: user.status,
            });
            return null;
          }

          if (!user.password) {
            authLog("login rejected: missing password hash in DB", {
              email: user.email,
            });
            return null;
          }

          const ok = await verifyPassword(password, user.password);

          authLog("verifyPassword finished", {
            email: user.email,
            ok,
          });

          if (!ok) {
            authLog("login rejected: password mismatch", {
              email: user.email,
            });
            return null;
          }

          const authUser: AuthUser = {
            id: user.id,
            name: user.fullName ?? user.email,
            email: user.email,
            role: user.role as AppRole,
            status: user.status as AppUserStatus,
            isActive: user.isActive,
            authTime: Math.floor(Date.now() / 1000),
          };

          authLog("authorize success", authUser);

          return authUser;
        } catch (error) {
          console.error("[AUTH DEBUG] authorize() threw error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      authLog("jwt callback called", {
        hasToken: !!token,
        hasUser: !!user,
        trigger,
        session,
      });

      try {
        if (user) {
          const authUser = user as AuthUser;

          token.id = authUser.id;
          token.name = authUser.name;
          token.email = authUser.email;
          token.role = authUser.role;
          token.status = authUser.status;
          token.isActive = authUser.isActive;
          token.authTime = authUser.authTime;
        }

        authLog("jwt callback returning token", {
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
          status: token.status,
          isActive: token.isActive,
          authTime: token.authTime,
        });

        return token;
      } catch (error) {
        console.error("[AUTH DEBUG] jwt callback error:", error);
        throw error;
      }
    },

    async session({ session, token }) {
      authLog("session callback called", {
        hasSession: !!session,
        hasSessionUser: !!session.user,
        token: {
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
          status: token.status,
          isActive: token.isActive,
          authTime: token.authTime,
        },
      });

      try {
        if (session.user) {
          const sessionUser = session.user as typeof session.user & {
            id?: string;
            role?: AppRole;
            status?: AppUserStatus;
            isActive?: boolean;
            authTime?: number;
          };

          sessionUser.id = typeof token.id === "string" ? token.id : "";

          if (typeof token.name === "string") {
            sessionUser.name = token.name;
          }

          if (typeof token.email === "string") {
            sessionUser.email = token.email;
          }

          if (token.role === "ADMIN" || token.role === "USER") {
            sessionUser.role = token.role;
          }

          if (
            token.status === "PENDING" ||
            token.status === "ACCEPTED" ||
            token.status === "VERIFIED" ||
            token.status === "REJECTED"
          ) {
            sessionUser.status = token.status;
          }

          sessionUser.isActive = token.isActive === true;

          if (typeof token.authTime === "number") {
            sessionUser.authTime = token.authTime;
          }
        }

        authLog("session callback returning session", {
          user: session.user,
        });

        return session;
      } catch (error) {
        console.error("[AUTH DEBUG] session callback error:", error);
        throw error;
      }
    },
  },
});
