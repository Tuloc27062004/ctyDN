import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetOrdersQueryDto,
  OrderListResponseDto,
  OrderResponseDto,
  PlaceOrderDto,
} from './dto';

function nonEmpty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async placeOrder(userId: string, dto: PlaceOrderDto): Promise<OrderResponseDto> {
    const order = await this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: {
          id: { in: dto.cartItemIds },
          userId,
        },
        include: {
          product: {
            include: {
              images: { where: { isRender: true }, take: 1 },
            },
          },
          pattern: true,
          color: true,
          model3d: true,
        },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('No valid cart items found');
      }

      if (cartItems.length !== dto.cartItemIds.length) {
        throw new BadRequestException('Some cart items were not found');
      }

      const itemCreates = cartItems.map((cartItem) => {
        const productThumbnail = nonEmpty(cartItem.product.images?.[0]?.url);
        const modelPreviewImage = nonEmpty(cartItem.model3d?.previewImageUrl);
        const modelGlbUrl =
          nonEmpty(cartItem.model3d?.pbrModelGlbUrl) ??
          nonEmpty(cartItem.model3d?.modelGlbUrl) ??
          nonEmpty(cartItem.model3d?.baseModelGlbUrl);

        if (cartItem.model3dId) {
          if (!cartItem.model3d) {
            throw new BadRequestException(
              `3D model for cart item ${cartItem.id} is no longer available`,
            );
          }
          if (!modelGlbUrl) {
            throw new BadRequestException(
              `3D model for cart item ${cartItem.id} has no downloadable GLB file`,
            );
          }
        }

        const previewSnapshot = modelPreviewImage ?? productThumbnail;

        return {
          quantity: cartItem.quantity,
          product: {
            connect: { id: cartItem.productId },
          },
          patternId: cartItem.patternId ?? null,
          colorId: cartItem.colorId ?? null,
          patternNameSnapshot: cartItem.pattern?.name ?? null,
          colorNameSnapshot: cartItem.color?.name ?? null,
          previewImageSnapshot: previewSnapshot,
          patternCodeSnapshot: cartItem.pattern?.code ?? null,
          colorCodeSnapshot: cartItem.color?.code ?? null,
          colorHexSnapshot: cartItem.color?.hex ?? null,
          model3dIdSnapshot: cartItem.model3dId ?? null,
          modelPreviewImageSnapshot: modelPreviewImage,
          modelGlbUrlSnapshot: modelGlbUrl,
        };
      });

      const created = await tx.order.create({
        data: {
          note: dto.note ?? '',
          status: OrderStatus.PENDING,
          user: {
            connect: { id: userId },
          },
          items: {
            create: itemCreates,
          },
        },
        include: this.getOrderInclude(),
      });

      await tx.cartItem.deleteMany({
        where: { id: { in: dto.cartItemIds } },
      });

      return created;
    });

    return this.mapToOrderResponse(order);
  }

  async getUserOrders(
    userId: string,
    query: GetOrdersQueryDto,
  ): Promise<OrderListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: order.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: this.getOrderInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.mapToOrderResponse(order);
  }

  private getOrderInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isRender: true },
                take: 1,
              },
            },
          },
          pattern: true,
          color: true,
        },
      },
    };
  }

  private mapToOrderResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      status: order.status,
      note: order.note,
      items: order.items.map((item: any) => {
        const productThumbnail = item.product.images?.[0]?.url || null;
        const preferredPreviewImage =
          item.modelPreviewImageSnapshot ?? item.previewImageSnapshot ?? productThumbnail;

        return {
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            thumbnail: preferredPreviewImage,
          },
          pattern:
            item.patternId || item.patternNameSnapshot || item.patternCodeSnapshot
              ? {
                  id: item.pattern?.id ?? item.patternId ?? null,
                  name: item.pattern?.name ?? item.patternNameSnapshot ?? null,
                  code: item.pattern?.code ?? item.patternCodeSnapshot ?? null,
                }
              : null,
          color:
            item.colorId ||
            item.colorNameSnapshot ||
            item.colorCodeSnapshot ||
            item.colorHexSnapshot
              ? {
                  id: item.color?.id ?? item.colorId ?? null,
                  name: item.color?.name ?? item.colorNameSnapshot ?? null,
                  code: item.color?.code ?? item.colorCodeSnapshot ?? null,
                  hex: item.color?.hex ?? item.colorHexSnapshot ?? null,
                }
              : null,
          model3dId: item.model3dIdSnapshot ?? null,
          modelPreviewImage: preferredPreviewImage,
          modelGlbUrl: item.modelGlbUrlSnapshot ?? null,
          quantity: item.quantity,
        };
      }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
