import api from "@/lib/api";
import { BlogList, BlogsQuery } from "@/types/blog.type";

export async function getAllBlogs( query: BlogsQuery ) : Promise<BlogList> {
    const res = await api.get<BlogList>('/blogs', { params: query });
    return res.data;
}