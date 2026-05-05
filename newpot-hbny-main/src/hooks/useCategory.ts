import { getAllCategories } from "@/apis/category/get-all-categories.api";
import { ICategoryList } from "@/types/category.type";
import { useQuery } from "@tanstack/react-query";

export function useCategory() {

    const { data: categoryList, isLoading, error, refetch } = useQuery<ICategoryList>({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await getAllCategories();
            return res;
        }
    });

    return { categoryList, isLoading, error, refetch };

}