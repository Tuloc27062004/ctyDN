import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PlaceOrderDto {
  @ApiProperty({
    type: [String],
    example: ['cm123cartitemid1', 'cm123cartitemid2'],
    description: 'Array of cart item IDs to place order',
  })
  @IsArray()
  @IsString({ each: true })
  cartItemIds: string[];

  @ApiPropertyOptional({ example: 'Please call me before delivery' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class GetOrdersQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
