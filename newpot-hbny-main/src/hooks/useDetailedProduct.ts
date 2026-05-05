import { getDetailedProduct } from "@/apis/product/get-detailed-product.api";
import type { DetailedProduct } from "@/types/product.type";
import { useQuery } from "@tanstack/react-query";

export function useDetailedProduct(id: string) {
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery<DetailedProduct>({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      return getDetailedProduct(id);
    },
    enabled: Boolean(id),
  });

  return { product, isLoading, error, refetch };
}
