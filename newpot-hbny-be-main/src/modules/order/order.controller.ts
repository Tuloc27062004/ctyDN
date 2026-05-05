import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards';
import {
  GetOrdersQueryDto,
  OrderListResponseDto,
  OrderResponseDto,
  PlaceOrderDto,
} from './dto';
import { OrderService } from './order.service';

@ApiTags('Orders - User')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Place an order from cart items and preserve selected pattern/color/3D model snapshots' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid cart items' })
  async placeOrder(
    @Req() req: any,
    @Body() dto: PlaceOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.placeOrder(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, type: OrderListResponseDto })
  async getUserOrders(
    @Req() req: any,
    @Query() query: GetOrdersQueryDto,
  ): Promise<OrderListResponseDto> {
    return this.orderService.getUserOrders(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details including selected pattern/color and 3D model snapshot per item' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getUserOrderById(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.getUserOrderById(req.user.id, id);
  }
}
