import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryListResponseDto, CategoryResponseDto } from './dto/response.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<CategoryListResponseDto> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return {
      categories: categories.map((category) => this.mapToResponse(category)),
      total: categories.length,
    };
  }

  async getById(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: { id, isActive: true },
      include: {
        categoryPatterns: {
          where: { pattern: { isActive: true } },
          include: { pattern: true },
        },
        categoryColors: {
          where: { color: { isActive: true } },
          include: { color: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToResponse(category, true);
  }

  private mapToResponse(category: any, includeRules = false): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      allowedPatterns: includeRules
        ? category.categoryPatterns?.map((categoryPattern: any) => ({
            id: categoryPattern.pattern.id,
            name: categoryPattern.pattern.name,
            code: categoryPattern.pattern.code,
            textureUrl: categoryPattern.pattern.textureUrl,
            defaultScale: categoryPattern.pattern.defaultScale,
            defaultOpacity: categoryPattern.pattern.defaultOpacity,
          })) ?? []
        : undefined,
      allowedColors: includeRules
        ? category.categoryColors?.map((categoryColor: any) => ({
            id: categoryColor.color.id,
            name: categoryColor.color.name,
            code: categoryColor.color.code,
            hex: categoryColor.color.hex,
            swatchUrl: categoryColor.color.swatchUrl,
          })) ?? []
        : undefined,
      createdAt: category.createdAt,
    };
  }
}
