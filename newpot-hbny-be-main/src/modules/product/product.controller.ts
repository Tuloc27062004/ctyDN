import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, Roles, RolesGuard } from '../../guards';
import { ProductService } from './product.service';
import { GetProductsQueryDto } from './dto/request.dto';
import {
  ProductDetailResponseDto,
  ProductListResponseDto,
} from './dto/response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of products (with search and category filter)' })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async getProducts(
    @Query() query: GetProductsQueryDto,
  ): Promise<ProductListResponseDto> {
    return this.productService.getProducts(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get product details including availablePatterns, availableColors, defaultPatternId, defaultColorId, ready models3d, default3dModel, gallery images, legacy renderAssets, and relatedProducts',
  })
  @ApiResponse({ status: 200, type: ProductDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string): Promise<ProductDetailResponseDto> {
    return this.productService.getProductById(id);
  }
}
