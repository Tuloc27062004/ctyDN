export interface BlogsQuery {
    page: number;
    limit: number;
}

export interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string | null;
    isPublished: boolean;
    publishedAt: Date | null;
    createdAt: Date;
}

export interface BlogList {
    blogs: Blog[];
    total: number;
    page: number;
    limit: number;
}