import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/request.dto';
import { CartItemResponseDto, CartResponseDto } from './dto/response.dto';

function nonEmpty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.getCartItemInclude(),
    });

    const items = cartItems.map((cartItem) => this.mapCartItemResponse(cartItem));

    return {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartItemResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      include: {
        images: { where: { isRender: true }, take: 1 },
        productPatterns: {
          where: { pattern: { isActive: true } },
          include: { pattern: true },
        },
        productColors: {
          where: { color: { isActive: true } },
          include: { color: true },
        },
        models3d: {
          where: { status: 'READY' },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const resolvedPatternId = this.resolveOptionId(
      product.productPatterns,
      dto.patternId,
      product.defaultPatternId,
      'patternId',
    );

    const resolvedColorId = this.resolveOptionId(
      product.productColors,
      dto.colorId,
      product.defaultColorId,
      'colorId',
    );

    const resolvedModel3dId = this.resolveModel3dId(product.models3d, dto.model3dId);

    if (resolvedPatternId) {
      const allowedPattern = product.productPatterns.find(
        (productPattern) => productPattern.patternId === resolvedPatternId,
      );

      if (!allowedPattern) {
        throw new BadRequestException('Selected pattern is not available for this product');
      }
    }

    if (resolvedColorId) {
      const allowedColor = product.productColors.find(
        (productColor) => productColor.colorId === resolvedColorId,
      );

      if (!allowedColor) {
        throw new BadRequestException('Selected color is not available for this product');
      }
    }

    if (dto.model3dId && !resolvedModel3dId) {
      throw new BadRequestException('Selected 3D model is not available for this product');
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        productId: dto.productId,
        patternId: resolvedPatternId,
        colorId: resolvedColorId,
        model3dId: resolvedModel3dId,
      },
    });

    let cartItem: any;

    if (existing) {
      cartItem = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (dto.quantity || 1) },
        include: this.getCartItemInclude(),
      });
    } else {
      cartItem = await this.prisma.cartItem.create({
        data: {
          userId,
          productId: dto.productId,
          patternId: resolvedPatternId,
          colorId: resolvedColorId,
          model3dId: resolvedModel3dId,
          quantity: dto.quantity || 1,
        },
        include: this.getCartItemInclude(),
      });
    }

    return this.mapCartItemResponse(cartItem);
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: dto.quantity },
      include: this.getCartItemInclude(),
    });

    return this.mapCartItemResponse(updated);
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });
  }

  async clearCart(userId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  private getCartItemInclude() {
    return {
      product: {
        include: {
          images: { where: { isRender: true }, take: 1 },
        },
      },
      pattern: true,
      color: true,
      model3d: true,
    };
  }

  private resolveOptionId(
    items: any[],
    requestedId: string | null | undefined,
    defaultId: string | null | undefined,
    key: 'patternId' | 'colorId',
  ): string | null {
    if (!items || items.length === 0) {
      return null;
    }

    // Explicit user choice: "no pattern" / "no color"
    if (requestedId === null) {
      return null;
    }

    const normalizedRequestedId = nonEmpty(requestedId);
    if (normalizedRequestedId) {
      return normalizedRequestedId;
    }

    if (defaultId) {
      const matchedDefault = items.find((item) => item[key] === defaultId);
      if (matchedDefault) {
        return matchedDefault[key] ?? null;
      }
    }

    return items[0]?.[key] ?? null;
  }

  private resolveModel3dId(
    models3d: any[],
    requestedModel3dId?: string | null,
  ): string | null {
    if (!models3d || models3d.length === 0) {
      return null;
    }

    const normalizedRequestedModel3dId = nonEmpty(requestedModel3dId);
    if (normalizedRequestedModel3dId) {
      const selectedModel = models3d.find(
        (model3d) => model3d.id === normalizedRequestedModel3dId,
      );
      return selectedModel?.id ?? null;
    }

    return models3d.find((model3d) => model3d.isDefault)?.id ?? models3d[0]?.id ?? null;
  }

  private mapCartItemResponse(cartItem: any): CartItemResponseDto {
    const productThumbnail = nonEmpty(cartItem.product.images?.[0]?.url);
    const modelPreviewImage =
      nonEmpty(cartItem.model3d?.previewImageUrl) ?? productThumbnail;

    return {
      id: cartItem.id,
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        description: cartItem.product.description,
        thumbnail: productThumbnail,
      },
      pattern: cartItem.pattern
        ? {
            id: cartItem.pattern.id,
            name: cartItem.pattern.name,
            code: cartItem.pattern.code,
          }
        : null,
      color: cartItem.color
        ? {
            id: cartItem.color.id,
            name: cartItem.color.name,
            code: cartItem.color.code,
            hex: cartItem.color.hex,
          }
        : null,
      model3dId: cartItem.model3dId ?? null,
      modelPreviewImage,
      quantity: cartItem.quantity,
      createdAt: cartItem.createdAt,
    };
  }
}