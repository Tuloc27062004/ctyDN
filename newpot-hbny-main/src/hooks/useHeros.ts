import { getHeros } from "@/apis/landing/get-heros.api";
import { BasicProduct } from "@/types/product.type";
import { useQuery } from "@tanstack/react-query";

export function useHeros() {
  const {
    data: heros,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  } = useQuery<BasicProduct[]>({
    queryKey: ["heros"],
    queryFn: async () => {
      const res = await getHeros();
      return res;
    },
  });

  return { heros, isLoading, isError, error, refetch, isFetched };
}