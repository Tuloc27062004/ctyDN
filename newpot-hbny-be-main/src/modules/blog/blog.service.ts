import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogResponseDto } from './dto/response.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBlogs(): Promise<BlogResponseDto[]> {
    const blogs = await this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
    return blogs.map((b) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt ?? null,
      content: b.content ?? null,
      coverImageUrl: b.coverImageUrl ?? null,
      isPublished: b.isPublished,
      publishedAt: b.publishedAt ?? null,
      createdAt: b.createdAt,
    }));
  }

  async getBlogBySlug(slug: string): Promise<BlogResponseDto | null> {
    const b = await this.prisma.blogPost.findUnique({
      where: { slug },
    });
    if (!b) return null;
    return {
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt ?? null,
      content: b.content ?? null,
      coverImageUrl: b.coverImageUrl ?? null,
      isPublished: b.isPublished,
      publishedAt: b.publishedAt ?? null,
      createdAt: b.createdAt,
    };
  }
}
