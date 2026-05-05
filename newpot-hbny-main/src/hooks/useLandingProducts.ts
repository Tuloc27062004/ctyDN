import { getLandingProducts } from "@/apis/landing/get-landing-products.api";
import { ProductList, ProductsQuery } from "@/types/product.type";
import { useQuery } from "@tanstack/react-query";

export function useLandingProduct( queryParams: ProductsQuery) {

    const { search, categoryIds, page, limit } = queryParams;

    const { data: landingProductList, isLoading, error, refetch } = useQuery<ProductList>({
        queryKey: ['landingProducts',  categoryIds, search, page, limit],
        queryFn: async () => {
            const res = await getLandingProducts(queryParams);
            return res;
        }
    });

    return { landingProductList, isLoading, error, refetch };

}