
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiParam, ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { GetBlogListDto, GetBlogDetailDto } from './dto/request.dto';
import { BlogListResponseDto, BlogResponseDto } from './dto/response.dto';
import { JwtAuthGuard } from 'src/guards';


@ApiTags('Blog')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published blogs' })
  @ApiOkResponse({ type: BlogListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllBlogs(@Query() query: GetBlogListDto): Promise<BlogListResponseDto> {
    const blogs = await this.blogService.getAllBlogs();
    return { blogs, total: blogs.length, page: query.page, limit: query.limit, totalPages: Math.ceil(blogs.length / query.limit) };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get blog details by slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiOkResponse({ type: BlogResponseDto })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async getBlogBySlug(@Param() params: GetBlogDetailDto): Promise<BlogResponseDto | null> {
    return this.blogService.getBlogBySlug(params.slug);
  }
}
