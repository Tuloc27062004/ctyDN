import { ApiProperty } from '@nestjs/swagger';

export class BlogResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Blog Title' })
  title: string;

  @ApiProperty({ example: 'blog-title' })
  slug: string;

  @ApiProperty({ example: 'Short excerpt', nullable: true })
  excerpt: string | null;

  @ApiProperty({ example: 'Full content', nullable: true })
  content: string | null;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true })
  coverImageUrl: string | null;

  @ApiProperty({ example: true })
  isPublished: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class BlogListResponseDto {
  @ApiProperty({ type: [BlogResponseDto] })
  blogs: BlogResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
