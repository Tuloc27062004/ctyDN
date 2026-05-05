import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards';
import { CartService } from './cart.service';
import { AddToCartDto, CartItemResponseDto, CartResponseDto, UpdateCartItemDto } from './dto';

@ApiTags('Cart')
@ApiCookieAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(@Req() req: any): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add product with optional pattern/color/3D-model selection to cart' })
  @ApiResponse({ status: 201, type: CartItemResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addToCart(
    @Req() req: any,
    @Body() dto: AddToCartDto,
  ): Promise<CartItemResponseDto> {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Patch(':cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, type: CartItemResponseDto })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateCartItem(
    @Req() req: any,
    @Param('cartItemId') cartItemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartItemResponseDto> {
    return this.cartService.updateCartItem(req.user.id, cartItemId, dto);
  }

  @Delete(':cartItemId')
  @ApiOperation({
    summary:
      'Remove a cart item by cartItemId. This replaces productId-based removal because the same product can exist multiple times with different pattern/color selections.',
  })
  @ApiResponse({ status: 200, description: 'Cart item removed from cart' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeFromCart(
    @Req() req: any,
    @Param('cartItemId') cartItemId: string,
  ): Promise<{ message: string }> {
    await this.cartService.removeFromCart(req.user.id, cartItemId);
    return { message: 'Cart item removed from cart' };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Req() req: any): Promise<{ message: string }> {
    await this.cartService.clearCart(req.user.id);
    return { message: 'Cart cleared' };
  }
}
