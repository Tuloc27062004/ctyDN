"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { authApi } from "@/apis/auth/auth.api";
import { signInApi } from "@/apis/auth/sign-in.api";
import { signOutApi } from "@/apis/auth/sign-out.api";
import { signUpApi } from "@/apis/auth/sign-up.api";
import {
  requestPasswordResetApi,
  resetPasswordApi,
} from "@/apis/auth/reset-password.api";
import LoadingScreen from "../LoadingScreen";
import { IBasicUser } from "@/types/user.type";
import { toast } from "sonner";
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  REDIRECT_AFTER_AUTH,
  REDIRECT_IF_NOT_AUTH,
} from "@/lib/router";
import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";

interface AuthContextType {
  user: IBasicUser | null;
  isGettingUser: boolean;

  login: (data: { email: string; password: string }) => Promise<void>;
  isLoggingIn: boolean;

  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    country?: string;
    companyName?: string;
    companyAddress?: string;
  }) => Promise<void>;
  isSigningUp: boolean;

  requestPasswordReset: (email: string) => Promise<void>;
  isRequestingPasswordReset: boolean;

  resetPassword: (data: {
    email: string;
    password: string;
    token: string;
  }) => Promise<void>;
  isResettingPassword: boolean;

  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const matchesRoute = (pathname: string, routes: string[]) => {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const redirect = searchParams.get("redirect") || REDIRECT_AFTER_AUTH;
  const router = useRouter();
  const queryClient = useQueryClient();
  const isHandlingUnauthorizedRef = useRef(false);

  const { data: user, isLoading: isGettingUser } = useQuery<IBasicUser | null>({
    queryKey: ["auth"],
    queryFn: async () => {
      try {
        const res = await authApi();
        return res.toUser();
      } catch (error: any) {
        if (error?.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  useEffect(() => {
    const handleUnauthorized = async () => {
      if (isHandlingUnauthorizedRef.current) return;
      isHandlingUnauthorizedRef.current = true;

      try {
        await queryClient.cancelQueries({ queryKey: ["auth"] });
        queryClient.setQueryData(["auth"], null);
        queryClient.removeQueries({ queryKey: ["auth"], exact: false });

        try {
          await signOutApi();
        } catch {
          // Ignore sign-out failure here. Local auth state has already been cleared.
        }

        const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
        const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

        if (isPublicRoute || isAuthRoute) {
          router.refresh();
          return;
        }

        const currentSearch = searchParams.toString();
        const target = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;

        const signInUrl = new URL(
          REDIRECT_IF_NOT_AUTH,
          window.location.origin,
        );
        signInUrl.searchParams.set("redirect", target);

        toast.error("Your session has expired. Please sign in again.", {
          duration: 3000,
        });

        router.replace(`${signInUrl.pathname}${signInUrl.search}`);
        router.refresh();
      } finally {
        window.setTimeout(() => {
          isHandlingUnauthorizedRef.current = false;
        }, 300);
      }
    };

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      handleUnauthorized as EventListener,
    );

    return () => {
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized as EventListener,
      );
    };
  }, [pathname, queryClient, router, searchParams]);

  const login = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await signInApi({
        email: data.email,
        password: data.password,
      });

      const me = await authApi();
      const nextUser = me.toUser();

      queryClient.setQueryData(["auth"], nextUser);

      toast.success("Login successful", { duration: 3000 });

      // Hard navigation — guarantees the fresh has_session cookie is sent
      // on the next request and that middleware runs with it. router.replace
      // in App Router can race with React transitions and occasionally leaves
      // the user on the sign-in page even when the redirect target is valid.
      window.location.assign(redirect);
    },
    onError: (error: any) => {
      toast.error("Login failed", {
        description: error?.response?.data?.message || error?.message,
        duration: 3000,
      });
    },
  });

  const signUp = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      country?: string;
      companyName?: string;
      companyAddress?: string;
    }) => {
      await signUpApi({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        country: data.country,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
      });

      toast.success(
        "Sign up successful! Please check your email for further instructions.",
        { duration: 3000 },
      );
    },
    onError: (error: any) => {
      toast.error("Sign up failed", {
        description: error?.response?.data?.message || error?.message,
        duration: 3000,
      });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      token: string;
    }) => {
      await resetPasswordApi({
        email: data.email,
        password: data.password,
        token: data.token,
      });

      toast.success("Password reset successful!", { duration: 3000 });
      router.push("/sign-in");
    },
    onError: (error: any) => {
      toast.error("Password reset failed", {
        description: error?.response?.data?.message || error?.message,
        duration: 3000,
      });
    },
  });

  const requestPasswordReset = useMutation({
    mutationFn: async (email: string) => {
      await requestPasswordResetApi(email);
      toast.success("Please check your email for further instructions!", {
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast.error("Request password reset failed", {
        description: error?.response?.data?.message || error?.message,
        duration: 3000,
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      try {
        await signOutApi();
      } catch {
        // Local logout should still continue even if the request fails.
      } finally {
        await queryClient.cancelQueries({ queryKey: ["auth"] });
        queryClient.setQueryData(["auth"], null);
        queryClient.removeQueries({ queryKey: ["auth"], exact: false });
      }

      toast.success("Logout successful", { duration: 3000 });

      window.location.assign("/");
    },
  });

  const value: AuthContextType = {
    user: user || null,
    isGettingUser,
    login: login.mutateAsync,
    isLoggingIn: login.isPending,
    signUp: signUp.mutateAsync,
    isSigningUp: signUp.isPending,
    logout: logout.mutateAsync,
    isLoggingOut: logout.isPending,
    resetPassword: resetPassword.mutateAsync,
    isResettingPassword: resetPassword.isPending,
    requestPasswordReset: requestPasswordReset.mutateAsync,
    isRequestingPasswordReset: requestPasswordReset.isPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {isGettingUser ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};