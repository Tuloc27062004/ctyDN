export interface SessionInquiryItem {
  itemKey: string;
  productId: string;
  name: string;
  thumbnail: string | null;
  quantity: number;
  minPrice: number | null;
  maxPrice: number | null;
  patternId?: string | null;
  patternName?: string | null;
  colorId?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  previewImage?: string | null;
  model3dId?: string | null;
  modelPreviewImage?: string | null;
}

export interface AddToCartPayload {
  productId: string;
  patternId?: string | null;
  colorId?: string | null;
  model3dId?: string | null;
  quantity?: number;
}

export interface CartPatternDto {
  id: string;
  name: string;
  code: string;
}

export interface CartColorDto {
  id: string;
  name: string;
  code: string;
  hex: string;
}

export interface CartProductDto {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
}

export interface CartItemResponseDto {
  id: string;
  product: CartProductDto;
  pattern: CartPatternDto | null;
  color: CartColorDto | null;
  model3dId?: string | null;
  modelPreviewImage?: string | null;
  quantity: number;
  createdAt: string;
}

export interface CartResponseDto {
  items: CartItemResponseDto[];
  totalItems: number;
}
