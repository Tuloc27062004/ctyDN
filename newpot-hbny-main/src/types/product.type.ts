export interface ProductCategorySummary {
  id: string;
  name: string;
}

export interface ProductImage {
  id: string;
  url: string;
  description: string | null;
  isRender: boolean;
}

export interface BasicProduct {
  id: string;
  name: string;
  description: string;
  minPrice: number | null;
  maxPrice: number | null;
  images: string[];
  categories: ProductCategorySummary[];
  thumbnail: ProductImage;
}

export interface ProductList {
  products: BasicProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsQuery {
  search?: string;
  categoryIds?: string[];
  page?: number;
  limit?: number;
}

export interface PatternOption {
  id: string;
  name: string;
  code: string;
  textureUrl: string;
  defaultScale?: number;
  defaultOpacity?: number;
}

export interface ColorOption {
  id: string;
  name: string;
  code: string;
  hex: string;
  swatchUrl?: string | null;
}

export interface ProductRenderAsset {
  id: string;
  viewCode: string;
  baseImageUrl: string;
  maskImageUrl: string;
  shadowImageUrl: string;
  highlightImageUrl: string;
  width?: number | null;
  height?: number | null;
  isDefault: boolean;
}

export type Product3DModelStatus = "DRAFT" | "PROCESSING" | "READY" | "FAILED";

export interface Product3DModel {
  id: string;
  status: Product3DModelStatus;
  isDefault: boolean;
  previewImageUrl?: string | null;
  modelGlbUrl?: string | null;
  baseModelGlbUrl?: string | null;
  pbrModelGlbUrl?: string | null;
  modelVersion?: string | null;
}

export interface ProductPreviewSelection {
  patternId: string | null;
  colorId: string | null;
}

export interface SelectedPatternSummary {
  id: string;
  name: string;
  code: string;
}

export interface SelectedColorSummary {
  id: string;
  name: string;
  code: string;
  hex: string;
}

export interface DetailedProduct {
  id: string;
  name: string;
  description: string;
  minPrice: number | null;
  maxPrice: number | null;
  categories: ProductCategorySummary[];
  images: ProductImage[];
  availablePatterns: PatternOption[];
  availableColors: ColorOption[];
  defaultPatternId: string | null;
  defaultColorId: string | null;
  models3d: Product3DModel[];
  default3dModel?: Product3DModel | null;
  renderAssets?: ProductRenderAsset[];
  createdAt: string;
  relatedProducts: BasicProduct[];
}
