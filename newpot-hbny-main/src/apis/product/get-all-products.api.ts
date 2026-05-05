import api from "@/lib/api";
import { ProductList, ProductsQuery } from "@/types/product.type";


export async function getAllProducts(queryParams: ProductsQuery) : Promise<ProductList> {
    const res = await api.get<ProductList>("/products", { params: queryParams });
    return res.data;
}