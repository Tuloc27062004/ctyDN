import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards';
import { LandingService } from './landing.service';
import {
  GetProductsQueryDto,
} from './dto/request.dto';
import {
  LandingProductListItemDto,
  LandingProductListResponseDto,
} from './dto/response.dto';

@ApiTags('Landing')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get("/products")
  @ApiOperation({ summary: 'Get list of products (with search and filter)' })
  @ApiResponse({ status: 200, type: LandingProductListResponseDto })
  async getProducts(
    @Query() query: GetProductsQueryDto,
  ): Promise<LandingProductListResponseDto> {
    return this.landingService.getLandingProducts(query);
  }

  @Get("/heros")
  @ApiOperation({ summary: 'Get list of heroes (images)' })
  @ApiResponse({ status: 200, type: [LandingProductListItemDto] })
  async getHeros(
  ): Promise<LandingProductListItemDto[]> {
    return this.landingService.getHeros();
  }

}
