import api from "@/lib/api";
import { BasicProduct } from "@/types/product.type";


export async function getHeros() : Promise<BasicProduct[]> {
    const res = await api.get<BasicProduct[]>("/landing/heros");
    return res.data;
}