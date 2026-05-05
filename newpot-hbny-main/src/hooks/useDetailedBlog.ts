import { getDetailedBlog } from "@/apis/blog/get-detailed-blog.api";
import { Blog } from "@/types/blog.type";
import { useQuery } from "@tanstack/react-query";

export function useDetailedBlog(slug: string) {
    const { data: blog, isLoading, error, refetch } = useQuery<Blog>({
        queryKey: ["blog", slug],
        queryFn: async () => {
            if (!slug) throw new Error("Blog slug is required");
            const res = await getDetailedBlog(slug);
            return res;
        },
        enabled: !!slug,
    });

    return { blog, isLoading, error, refetch };
}
