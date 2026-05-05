import api from "@/lib/api";
import { ICategoryList } from "@/types/category.type";


export async function getAllCategories() : Promise<ICategoryList> {
    const res = await api.get<ICategoryList>("/categories");
    return res.data;
}