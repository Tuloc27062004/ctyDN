import api from "@/lib/api";
import { ProductList, ProductsQuery } from "@/types/product.type";


export async function getLandingProducts(queryParams: ProductsQuery) : Promise<ProductList> {
    const res = await api.get<ProductList>("/landing/products", { params: queryParams });
    return res.data;
}