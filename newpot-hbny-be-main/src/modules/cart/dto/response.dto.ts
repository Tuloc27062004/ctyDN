import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartProductDto {
  @ApiProperty({ example: 'cma1product123' })
  id: string;

  @ApiProperty({ example: 'Ceramic Vase' })
  name: string;

  @ApiPropertyOptional({ example: 'A beautiful vase' })
  description: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  thumbnail: string | null;
}

export class CartPatternDto {
  @ApiProperty({ example: 'cma1pattern123' })
  id: string;

  @ApiProperty({ example: 'Hoa văn lá' })
  name: string;

  @ApiProperty({ example: 'LEAF_PATTERN' })
  code: string;
}

export class CartColorDto {
  @ApiProperty({ example: 'cma1color123' })
  id: string;

  @ApiProperty({ example: 'Xanh rêu' })
  name: string;

  @ApiProperty({ example: 'MOSS_GREEN' })
  code: string;

  @ApiProperty({ example: '#5E7A4A' })
  hex: string;
}

export class CartItemResponseDto {
  @ApiProperty({ example: 'cma1cartitem123' })
  id: string;

  @ApiProperty({ type: CartProductDto })
  product: CartProductDto;

  @ApiPropertyOptional({ type: CartPatternDto, nullable: true })
  pattern: CartPatternDto | null;

  @ApiPropertyOptional({ type: CartColorDto, nullable: true })
  color: CartColorDto | null;

  @ApiPropertyOptional({ example: 'cma13dmodel123', nullable: true })
  model3dId: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/models/preview.webp',
    nullable: true,
    description: 'Preferred preview image for the selected 3D model. Falls back to product thumbnail when missing.',
  })
  modelPreviewImage: string | null;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class CartResponseDto {
  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 5 })
  totalItems: number;
}
