import api from "@/lib/api";
import type { DetailedProduct } from "@/types/product.type";

export async function getDetailedProduct(id: string): Promise<DetailedProduct> {
  const res = await api.get<DetailedProduct>(`/products/${id}`);
  return res.data;
}
