import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryPatternSimpleDto {
  @ApiProperty({ example: 'cma1pattern123' })
  id: string;

  @ApiProperty({ example: 'Hoa văn lá' })
  name: string;

  @ApiProperty({ example: 'LEAF_PATTERN' })
  code: string;

  @ApiProperty({ example: 'https://example.com/patterns/leaf-texture.png' })
  textureUrl: string;

  @ApiProperty({ example: 1 })
  defaultScale: number;

  @ApiProperty({ example: 1 })
  defaultOpacity: number;
}

export class CategoryColorSimpleDto {
  @ApiProperty({ example: 'cma1color123' })
  id: string;

  @ApiProperty({ example: 'Xanh rêu' })
  name: string;

  @ApiProperty({ example: 'MOSS_GREEN' })
  code: string;

  @ApiProperty({ example: '#5E7A4A' })
  hex: string;

  @ApiPropertyOptional({ example: 'https://example.com/swatches/moss-green.png' })
  swatchUrl: string | null;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 'cma1category123' })
  id: string;

  @ApiProperty({ example: 'Ceramics' })
  name: string;

  @ApiProperty({ example: 'Handcrafted ceramic products', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: [CategoryPatternSimpleDto] })
  allowedPatterns?: CategoryPatternSimpleDto[];

  @ApiPropertyOptional({ type: [CategoryColorSimpleDto] })
  allowedColors?: CategoryColorSimpleDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class CategoryListResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  categories: CategoryResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;
}
