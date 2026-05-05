import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetProductsQueryDto,
} from './dto/request.dto';
import {
  LandingProductListItemDto,
  LandingProductListResponseDto,
} from './dto/response.dto';

@Injectable()
export class LandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandingProducts(query: GetProductsQueryDto): Promise<LandingProductListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    // Filter by category (using explicit join table)
    if (query.categoryId && query.categoryId !== 'all') {
      where.categories = { some: { categoryId: query.categoryId } };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: 6, // Show only 6 products on landing page
        orderBy: { priority: 'desc' },
        include: {
          categories: {
            include: { category: { select: { id: true, name: true } } },
          },
          images: { where: { isRender: true }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    
    const productList: LandingProductListItemDto[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      categories: p.categories.map((pc) => pc.category),
      thumbnail: p.images[0] || null,
    }));

    return {
      products: productList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async getHeros(): Promise<LandingProductListItemDto[]> {

    const where: any = { isActive: true, priority: -999 };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        images: { where: { isRender: true }, take: 1 },
      },
    });

    const heros: LandingProductListItemDto[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      categories: [], // Heros don't need categories
      thumbnail: p.images[0] || null,
    }));

    return heros;
  }

}
