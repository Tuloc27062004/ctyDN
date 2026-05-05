import { getAllBlogs } from "@/apis/blog/get-all-blogs.api";
import { BlogList, BlogsQuery } from "@/types/blog.type";
import { useQuery } from "@tanstack/react-query";


export function useBlog( query: BlogsQuery ) {
    const { page, limit } = query;

    const { data: blogList, isLoading, error, refetch } = useQuery<BlogList>({
        queryKey: ['blogs', page, limit],
        queryFn: async () => {
            const res = await getAllBlogs(query);
            return res;
        }
    });

    return { blogList, isLoading, error, refetch };
}