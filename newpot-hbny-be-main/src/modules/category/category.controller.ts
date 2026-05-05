import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, Roles, RolesGuard } from '../../guards';
import { CategoryService } from './category.service';
import { CategoryListResponseDto, CategoryResponseDto } from './dto/response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({ status: 200, type: CategoryListResponseDto })
  async getAll(): Promise<CategoryListResponseDto> {
    return this.categoryService.getAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category by ID with allowedPatterns and allowedColors' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getById(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoryService.getById(id);
  }
}
