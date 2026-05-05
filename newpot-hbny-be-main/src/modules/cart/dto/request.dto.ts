import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'cm123exampleproductid' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    example: 'cm123examplepatternid',
    nullable: true,
    description: 'Pattern id, or null for no pattern selection.',
  })
  @IsOptional()
  @IsString()
  patternId?: string | null;

  @ApiPropertyOptional({
    example: 'cm123examplecolorid',
    nullable: true,
    description: 'Color id, or null for no color selection.',
  })
  @IsOptional()
  @IsString()
  colorId?: string | null;

  @ApiPropertyOptional({
    example: 'cm123example3dmodelid',
    nullable: true,
    description:
      'Optional READY 3D model selected for storefront rendering and preview snapshots.',
  })
  @IsOptional()
  @IsString()
  model3dId?: string | null;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}