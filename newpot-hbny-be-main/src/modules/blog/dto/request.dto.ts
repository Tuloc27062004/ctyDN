import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetBlogListDto {
  // Add filters if needed in the future
    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @IsString()
    page: number;

    @ApiProperty({ example: 10 })
    @IsNotEmpty()
    @IsString()
    limit: number;
}

export class GetBlogDetailDto {
  @ApiProperty({ example: 'my-blog-slug' })
  @IsNotEmpty()
  @IsString()
  slug: string;
}
