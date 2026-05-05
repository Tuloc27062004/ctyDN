import api from "@/lib/api";
import { Blog } from "@/types/blog.type";


export async function getDetailedBlog( slug: string ) : Promise<Blog> {
    const res = await api.get<Blog>(`/blogs/${slug}`);
    return res.data;
}