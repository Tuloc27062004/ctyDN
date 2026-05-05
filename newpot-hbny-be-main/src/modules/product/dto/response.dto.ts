import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ example: 'cma1image123' })
  id: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  url: string;

  @ApiPropertyOptional({ example: 'Front view' })
  description: string | null;

  @ApiProperty({ example: true })
  isRender: boolean;
}

export class CategorySimpleDto {
  @ApiProperty({ example: 'cma1category123' })
  id: string;

  @ApiProperty({ example: 'Ceramics' })
  name: string;
}

export class PatternSimpleDto {
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

export class ColorSimpleDto {
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

export class ProductRenderAssetResponseDto {
  @ApiProperty({ example: 'cma1asset123' })
  id: string;

  @ApiProperty({ example: 'front' })
  viewCode: string;

  @ApiProperty({ example: 'https://example.com/assets/base.png' })
  baseImageUrl: string;

  @ApiProperty({ example: 'https://example.com/assets/mask.png' })
  maskImageUrl: string;

  @ApiProperty({ example: 'https://example.com/assets/shadow.png' })
  shadowImageUrl: string;

  @ApiProperty({ example: 'https://example.com/assets/highlight.png' })
  highlightImageUrl: string;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  width: number | null;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  height: number | null;

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class Product3DModelResponseDto {
  @ApiProperty({ example: 'cma13dmodel123' })
  id: string;

  @ApiProperty({ enum: ['DRAFT', 'PROCESSING', 'READY', 'FAILED'], example: 'READY' })
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';

  @ApiPropertyOptional({ example: 'https://example.com/models/preview.webp', nullable: true })
  previewImageUrl: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/models/model.glb', nullable: true })
  modelGlbUrl: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/models/base-model.glb', nullable: true })
  baseModelGlbUrl: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/models/pbr-model.glb', nullable: true })
  pbrModelGlbUrl: string | null;

  @ApiPropertyOptional({ example: 'P1-20260311', nullable: true })
  modelVersion: string | null;

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'cma1product123' })
  id: string;

  @ApiProperty({ example: 'Ceramic Vase' })
  name: string;

  @ApiPropertyOptional({ example: 'A beautiful handcrafted ceramic vase' })
  description: string | null;

  @ApiPropertyOptional({ example: 15, nullable: true })
  minPrice: number | null;

  @ApiPropertyOptional({ example: 20, nullable: true })
  maxPrice: number | null;

  @ApiProperty({ type: [CategorySimpleDto] })
  categories: CategorySimpleDto[];

  @ApiProperty({ type: [ImageResponseDto] })
  images: ImageResponseDto[];

  @ApiPropertyOptional({ type: [PatternSimpleDto] })
  availablePatterns?: PatternSimpleDto[];

  @ApiPropertyOptional({ type: [ColorSimpleDto] })
  availableColors?: ColorSimpleDto[];

  @ApiPropertyOptional({ example: 'cma1pattern123', nullable: true })
  defaultPatternId?: string | null;

  @ApiPropertyOptional({ example: 'cma1color123', nullable: true })
  defaultColorId?: string | null;

  @ApiPropertyOptional({
    type: [Product3DModelResponseDto],
    description: 'Ready 3D models for storefront rendering. Legacy clients may ignore this field.',
  })
  models3d?: Product3DModelResponseDto[];

  @ApiPropertyOptional({
    type: Product3DModelResponseDto,
    nullable: true,
    description: 'Preferred ready 3D model for storefront rendering.',
  })
  default3dModel?: Product3DModelResponseDto | null;

  @ApiPropertyOptional({
    type: [ProductRenderAssetResponseDto],
    description: 'Legacy 2D render assets kept temporarily for backward compatibility.',
  })
  renderAssets?: ProductRenderAssetResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class ProductListItemDto {
  @ApiProperty({ example: 'cma1product123' })
  id: string;

  @ApiProperty({ example: 'Ceramic Vase' })
  name: string;

  @ApiPropertyOptional({ example: 'A beautiful handcrafted ceramic vase' })
  description: string | null;

  @ApiPropertyOptional({ example: 15, nullable: true })
  minPrice: number | null;

  @ApiPropertyOptional({ example: 20, nullable: true })
  maxPrice: number | null;

  @ApiProperty({ type: [CategorySimpleDto] })
  categories: CategorySimpleDto[];

  @ApiPropertyOptional({ type: ImageResponseDto, description: 'Thumbnail image (isRender=true)' })
  thumbnail: ImageResponseDto | null;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductListItemDto] })
  products: ProductListItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

export class ProductDetailResponseDto extends ProductResponseDto {
  @ApiProperty({ type: [PatternSimpleDto] })
  availablePatterns: PatternSimpleDto[];

  @ApiProperty({ type: [ColorSimpleDto] })
  availableColors: ColorSimpleDto[];

  @ApiPropertyOptional({ example: 'cma1pattern123', nullable: true })
  defaultPatternId: string | null;

  @ApiPropertyOptional({ example: 'cma1color123', nullable: true })
  defaultColorId: string | null;

  @ApiProperty({
    type: [Product3DModelResponseDto],
    description: 'Ready 3D models ordered with the default model first.',
  })
  models3d: Product3DModelResponseDto[];

  @ApiPropertyOptional({
    type: Product3DModelResponseDto,
    nullable: true,
    description: 'Preferred ready 3D model for the storefront. Null when none is ready.',
  })
  default3dModel: Product3DModelResponseDto | null;

  @ApiPropertyOptional({
    type: [ProductRenderAssetResponseDto],
    description: 'Legacy 2D render assets kept only for migration compatibility.',
  })
  renderAssets?: ProductRenderAssetResponseDto[];

  @ApiProperty({ type: [ProductListItemDto], description: 'Related products in same categories' })
  relatedProducts: ProductListItemDto[];
}
