import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetProductsQueryDto } from './dto/request.dto';
import {
  ColorSimpleDto,
  PatternSimpleDto,
  Product3DModelResponseDto,
  ProductDetailResponseDto,
  ProductListItemDto,
  ProductListResponseDto,
  ProductRenderAssetResponseDto,
} from './dto/response.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProducts(query: GetProductsQueryDto): Promise<ProductListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query.categoryIds && query.categoryIds.length !== 0 && query.categoryIds[0] !== 'all') {
      where.categories = { some: { categoryId: { in: query.categoryIds } } };
    }

    this.logger.debug(
      `getProducts:start ${JSON.stringify({
        page,
        limit,
        skip,
        search: query.search ?? null,
        categoryIds: query.categoryIds ?? [],
      })}`,
    );

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          categories: {
            where: { category: { isActive: true } },
            include: { category: { select: { id: true, name: true } } },
          },
          images: { where: { isRender: true }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    this.logger.debug(
      `getProducts:db-result ${JSON.stringify({
        total,
        fetched: products.length,
        productIds: products.map((product) => product.id),
      })}`,
    );

    const productList: ProductListItemDto[] = products.map((product) =>
      this.mapToListItem(product),
    );

    return {
      products: productList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string): Promise<ProductDetailResponseDto> {
    this.logger.debug(`getProductById:start ${JSON.stringify({ id })}`);

    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        categories: {
          where: { category: { isActive: true } },
          include: { category: { select: { id: true, name: true } } },
        },
        images: true,
        productPatterns: {
          where: { pattern: { isActive: true } },
          include: { pattern: true },
        },
        productColors: {
          where: { color: { isActive: true } },
          include: { color: true },
        },
        renderAssets: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        },
        models3d: {
          where: { status: 'READY' },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        defaultPattern: true,
        defaultColor: true,
      },
    });

    if (!product) {
      this.logger.warn(`getProductById:not-found ${JSON.stringify({ id })}`);
      throw new NotFoundException('Product not found');
    }

    this.logger.debug(
      `getProductById:raw-product ${JSON.stringify({
        id: product.id,
        name: product.name,
        defaultPatternId: product.defaultPatternId ?? null,
        defaultColorId: product.defaultColorId ?? null,
        categoryCount: product.categories.length,
        imageCount: product.images.length,
        productPatternCount: product.productPatterns.length,
        productColorCount: product.productColors.length,
        renderAssetCount: product.renderAssets.length,
        readyModelCount: product.models3d.length,
        patterns: product.productPatterns.map((item) => ({
          id: item.pattern.id,
          name: item.pattern.name,
          textureUrl: item.pattern.textureUrl,
          defaultScale: item.pattern.defaultScale,
          defaultOpacity: item.pattern.defaultOpacity,
        })),
        colors: product.productColors.map((item) => ({
          id: item.color.id,
          name: item.color.name,
          hex: item.color.hex,
          swatchUrl: item.color.swatchUrl,
        })),
        models3d: product.models3d.map((model) => ({
          id: model.id,
          status: model.status,
          isDefault: model.isDefault,
          modelVersion: model.modelVersion ?? null,
          previewImageUrl: model.previewImageUrl ?? null,
          modelGlbUrl: model.modelGlbUrl ?? null,
          baseModelGlbUrl: model.baseModelGlbUrl ?? null,
          pbrModelGlbUrl: model.pbrModelGlbUrl ?? null,
        })),
      })}`,
    );

    const currentCategoryIds = product.categories.map(
      (productCategory) => productCategory.categoryId,
    );

    let relatedProducts: ProductListItemDto[] = [];

    if (currentCategoryIds.length > 0) {
      const relatedCandidates = await this.prisma.product.findMany({
        where: {
          id: { not: id },
          isActive: true,
          categories: {
            some: {
              categoryId: { in: currentCategoryIds },
            },
          },
        },
        include: {
          categories: {
            where: { category: { isActive: true } },
            include: { category: { select: { id: true, name: true } } },
          },
          images: { where: { isRender: true }, take: 1 },
        },
      });

      this.logger.debug(
        `getProductById:related-candidates ${JSON.stringify({
          productId: id,
          currentCategoryIds,
          candidateCount: relatedCandidates.length,
          candidateIds: relatedCandidates.map((item) => item.id),
        })}`,
      );

      relatedProducts = relatedCandidates
        .map((candidate) => {
          const sharedCategoryCount = candidate.categories.reduce((count, productCategory) => {
            return currentCategoryIds.includes(productCategory.categoryId) ? count + 1 : count;
          }, 0);

          return {
            product: candidate,
            sharedCategoryCount,
          };
        })
        .sort((a, b) => {
          if (b.sharedCategoryCount !== a.sharedCategoryCount) {
            return b.sharedCategoryCount - a.sharedCategoryCount;
          }

          const aPriority = a.product.priority ?? 0;
          const bPriority = b.product.priority ?? 0;
          if (bPriority !== aPriority) {
            return bPriority - aPriority;
          }

          return (
            new Date(b.product.createdAt).getTime() -
            new Date(a.product.createdAt).getTime()
          );
        })
        .slice(0, 4)
        .map(({ product: relatedProduct }) => this.mapToListItem(relatedProduct));
    }

    const readyModels3d = this.map3DModels(product.models3d);
    const default3dModel =
      readyModels3d.find((model) => model.isDefault) ?? readyModels3d[0] ?? null;

    const resolvedDefaultPatternId = this.resolveAvailableDefaultId(
      product.productPatterns,
      product.defaultPatternId,
      'patternId',
    );

    const resolvedDefaultColorId = this.resolveAvailableDefaultId(
      product.productColors,
      product.defaultColorId,
      'colorId',
    );

    this.logger.debug(
      `getProductById:mapped-output ${JSON.stringify({
        productId: product.id,
        availablePatternIds: product.productPatterns.map((item) => item.pattern.id),
        availableColorIds: product.productColors.map((item) => item.color.id),
        resolvedDefaultPatternId,
        resolvedDefaultColorId,
        readyModels3d: readyModels3d.map((model) => ({
          id: model.id,
          status: model.status,
          isDefault: model.isDefault,
          previewImageUrl: model.previewImageUrl,
          modelGlbUrl: model.modelGlbUrl,
          baseModelGlbUrl: model.baseModelGlbUrl,
          pbrModelGlbUrl: model.pbrModelGlbUrl,
        })),
        default3dModel: default3dModel
          ? {
              id: default3dModel.id,
              status: default3dModel.status,
              isDefault: default3dModel.isDefault,
              previewImageUrl: default3dModel.previewImageUrl,
              modelGlbUrl: default3dModel.modelGlbUrl,
              baseModelGlbUrl: default3dModel.baseModelGlbUrl,
              pbrModelGlbUrl: default3dModel.pbrModelGlbUrl,
            }
          : null,
        relatedProductIds: relatedProducts.map((item) => item.id),
      })}`,
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      categories: product.categories.map((productCategory) => productCategory.category),
      images: product.images,
      availablePatterns: this.mapPatterns(product.productPatterns),
      availableColors: this.mapColors(product.productColors),
      defaultPatternId: resolvedDefaultPatternId,
      defaultColorId: resolvedDefaultColorId,
      models3d: readyModels3d,
      default3dModel,
      renderAssets: this.mapRenderAssets(product.renderAssets),
      createdAt: product.createdAt,
      relatedProducts,
    };
  }

  private resolveAvailableDefaultId(
    items: any[],
    preferredId: string | null | undefined,
    key: 'patternId' | 'colorId',
  ): string | null {
    if (!items || items.length === 0) {
      return null;
    }

    if (preferredId) {
      const matched = items.find((item) => item[key] === preferredId);
      if (matched) {
        return preferredId;
      }
    }

    return items[0]?.[key] ?? null;
  }

  private mapPatterns(productPatterns: any[]): PatternSimpleDto[] {
    return productPatterns.map((productPattern) => ({
      id: productPattern.pattern.id,
      name: productPattern.pattern.name,
      code: productPattern.pattern.code,
      textureUrl: productPattern.pattern.textureUrl,
      defaultScale: productPattern.pattern.defaultScale,
      defaultOpacity: productPattern.pattern.defaultOpacity,
    }));
  }

  private mapColors(productColors: any[]): ColorSimpleDto[] {
    return productColors.map((productColor) => ({
      id: productColor.color.id,
      name: productColor.color.name,
      code: productColor.color.code,
      hex: productColor.color.hex,
      swatchUrl: productColor.color.swatchUrl,
    }));
  }

  private mapRenderAssets(renderAssets: any[]): ProductRenderAssetResponseDto[] {
    return renderAssets.map((renderAsset) => ({
      id: renderAsset.id,
      viewCode: renderAsset.viewCode,
      baseImageUrl: renderAsset.baseImageUrl,
      maskImageUrl: renderAsset.maskImageUrl,
      shadowImageUrl: renderAsset.shadowImageUrl,
      highlightImageUrl: renderAsset.highlightImageUrl,
      width: renderAsset.width,
      height: renderAsset.height,
      isDefault: renderAsset.isDefault,
    }));
  }

  private map3DModels(models3d: any[]): Product3DModelResponseDto[] {
    return models3d.map((model3d) => ({
      id: model3d.id,
      status: model3d.status,
      previewImageUrl: model3d.previewImageUrl ?? null,
      modelGlbUrl: model3d.modelGlbUrl ?? null,
      baseModelGlbUrl: model3d.baseModelGlbUrl ?? null,
      pbrModelGlbUrl: model3d.pbrModelGlbUrl ?? null,
      modelVersion: model3d.modelVersion ?? null,
      isDefault: model3d.isDefault,
    }));
  }

  private mapToListItem(product: any): ProductListItemDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      categories: product.categories.map((productCategory: any) => productCategory.category),
      thumbnail: product.images[0] || null,
    };
  }
}
