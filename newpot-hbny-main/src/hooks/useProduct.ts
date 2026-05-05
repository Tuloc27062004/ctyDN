import { getAllProducts } from "@/apis/product/get-all-products.api";
import { ProductList, ProductsQuery } from "@/types/product.type";
import { useQuery } from "@tanstack/react-query";

export function useProduct( queryParams: ProductsQuery) {

    const { search, categoryIds, page, limit } = queryParams;

    const { data: productList, isLoading, error, refetch } = useQuery<ProductList>({
        queryKey: ['products',  categoryIds, search, page, limit],
        queryFn: async () => {
            const res = await getAllProducts(queryParams);
            return res;
        }
    });

    return { productList, isLoading, error, refetch };

}