import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderProductDto {
  @ApiProperty({ example: 'cma1product123' })
  id: string;

  @ApiProperty({ example: 'Ceramic Vase' })
  name: string;

  @ApiPropertyOptional({ example: 'A beautiful vase' })
  description: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  thumbnail: string | null;
}

export class OrderPatternDto {
  @ApiPropertyOptional({ example: 'cma1pattern123', nullable: true })
  id: string | null;

  @ApiPropertyOptional({ example: 'Hoa văn lá', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: 'LEAF_PATTERN', nullable: true })
  code: string | null;
}

export class OrderColorDto {
  @ApiPropertyOptional({ example: 'cma1color123', nullable: true })
  id: string | null;

  @ApiPropertyOptional({ example: 'Xanh rêu', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: 'MOSS_GREEN', nullable: true })
  code: string | null;

  @ApiPropertyOptional({ example: '#5E7A4A', nullable: true })
  hex: string | null;
}

export class OrderItemResponseDto {
  @ApiProperty({ example: 'cma1orderitem123' })
  id: string;

  @ApiProperty({ type: OrderProductDto })
  product: OrderProductDto;

  @ApiPropertyOptional({ type: OrderPatternDto, nullable: true })
  pattern: OrderPatternDto | null;

  @ApiPropertyOptional({ type: OrderColorDto, nullable: true })
  color: OrderColorDto | null;

  @ApiPropertyOptional({ example: 'cma13dmodel123', nullable: true })
  model3dId: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/models/preview.webp',
    nullable: true,
    description: 'Snapshot of the selected 3D model preview image at order time.',
  })
  modelPreviewImage: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/models/base-model.glb',
    nullable: true,
    description: 'Snapshot of the selected 3D model GLB URL at order time.',
  })
  modelGlbUrl: string | null;

  @ApiProperty({ example: 2 })
  quantity: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: 'cma1order123' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Please call before delivery' })
  note: string | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class OrderListItemDto {
  @ApiProperty({ example: 'cma1order123' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: 5 })
  totalItems: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class OrderListResponseDto {
  @ApiProperty({ type: [OrderListItemDto] })
  orders: OrderListItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
