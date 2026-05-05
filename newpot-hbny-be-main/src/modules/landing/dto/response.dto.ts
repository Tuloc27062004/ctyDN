import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  url: string;

  @ApiPropertyOptional({ example: 'Front view' })
  description: string | null;

  @ApiProperty({ example: true })
  isRender: boolean;
}

export class CategorySimpleDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Ceramics' })
  name: string;
}


export class LandingProductListItemDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Ceramic Vase' })
  name: string;

  @ApiPropertyOptional({ example: 'A beautiful handcrafted ceramic vase' })
  description: string | null;

  @ApiProperty({ example: 15 })
  minPrice: number;

  @ApiProperty({ example: 20 })
  maxPrice: number;

  @ApiProperty({ type: [CategorySimpleDto] })
  categories: CategorySimpleDto[];

  @ApiPropertyOptional({ type: ImageResponseDto, description: 'Thumbnail image (isRender=true)' })
  thumbnail: ImageResponseDto | null;
}

export class LandingProductListResponseDto {
  @ApiProperty({ type: [LandingProductListItemDto] })
  products: LandingProductListItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
