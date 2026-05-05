import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/apis/auth/auth.api";
import { IBasicUser } from "@/types/user.type";

export function useMe() {
  const { data, isLoading, error, isFetching, refetch } = useQuery<IBasicUser | null>({
    queryKey: ["auth"],
    queryFn: async () => {
      try {
        const response = await authApi();
        return response.toUser();
      } catch (error: any) {
        if (error?.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    error,
    isFetching,
    refetch,
  };
}