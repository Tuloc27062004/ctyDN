# Pottery Configurator admin repo changes

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  ADMIN
  USER
}

enum UserStatus {
  PENDING
  ACCEPTED
  VERIFIED
  REJECTED
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  DONE
  CANCELLED
}

model User {
  id             String     @id @default(cuid())
  fullName       String
  email          String     @unique
  phone          String
  country        String?
  companyName    String?
  companyAddress String?
  password       String
  role           Role
  status         UserStatus
  isActive       Boolean    @default(true)
  verifyToken    String?
  verifyTokenExp DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  cartItems CartItem[]
  orders    Order[]
  blogPosts BlogPost[] @relation("BlogPostAuthor")

  @@index([status])
  @@index([isActive])
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products         ProductCategory[]
  categoryPatterns CategoryPattern[]
  categoryColors   CategoryColor[]

  @@index([isActive])
}

model Product {
  id               String   @id @default(cuid())
  name             String
  description      String
  isActive         Boolean  @default(true)
  minPrice         Float?
  maxPrice         Float?
  priority         Int      @default(0)
  defaultPatternId String?
  defaultColorId   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  defaultPattern Pattern? @relation("ProductDefaultPattern", fields: [defaultPatternId], references: [id], onDelete: SetNull)
  defaultColor   Color?   @relation("ProductDefaultColor", fields: [defaultColorId], references: [id], onDelete: SetNull)

  images         Image[]
  cartItems      CartItem[]
  orderItems     OrderItem[]
  categories     ProductCategory[]
  productPatterns ProductPattern[]
  productColors   ProductColor[]
  renderAssets    ProductRenderAsset[]

  @@index([priority])
  @@index([isActive])
  @@index([defaultPatternId])
  @@index([defaultColorId])
}

model Pattern {
  id             String   @id @default(cuid())
  name           String
  code           String   @unique
  textureUrl     String
  defaultScale   Float    @default(1)
  defaultOpacity Float    @default(1)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  productPatterns   ProductPattern[]
  categoryPatterns  CategoryPattern[]
  defaultForProducts Product[] @relation("ProductDefaultPattern")

  @@index([isActive])
}

model Color {
  id         String   @id @default(cuid())
  name       String
  code       String   @unique
  hex        String
  swatchUrl  String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  productColors    ProductColor[]
  categoryColors   CategoryColor[]
  defaultForProducts Product[] @relation("ProductDefaultColor")

  @@index([isActive])
}

model ProductCategory {
  productId  String
  categoryId String
  createdAt  DateTime @default(now())

  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([productId, categoryId])
  @@index([categoryId])
}

model ProductPattern {
  productId String
  patternId String
  createdAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  pattern Pattern @relation(fields: [patternId], references: [id], onDelete: Cascade)

  @@id([productId, patternId])
  @@index([patternId])
}

model ProductColor {
  productId String
  colorId   String
  createdAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  color   Color   @relation(fields: [colorId], references: [id], onDelete: Cascade)

  @@id([productId, colorId])
  @@index([colorId])
}

model CategoryPattern {
  categoryId String
  patternId  String
  createdAt  DateTime @default(now())

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  pattern  Pattern  @relation(fields: [patternId], references: [id], onDelete: Cascade)

  @@id([categoryId, patternId])
  @@index([patternId])
}

model CategoryColor {
  categoryId String
  colorId    String
  createdAt  DateTime @default(now())

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  color    Color    @relation(fields: [colorId], references: [id], onDelete: Cascade)

  @@id([categoryId, colorId])
  @@index([colorId])
}

model ProductRenderAsset {
  id                String   @id @default(cuid())
  productId         String
  viewCode          String   @default("front")
  baseImageUrl      String
  maskImageUrl      String
  shadowImageUrl    String
  highlightImageUrl String
  width             Int?
  height            Int?
  isDefault         Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([productId, isDefault])
}

model Image {
  id          String   @id @default(cuid())
  url         String
  description String
  isRender    Boolean  @default(false)
  productId   String
  createdAt   DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([productId, isRender])
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  status    OrderStatus
  note      String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items OrderItem[]

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([orderId, productId])
  @@index([orderId])
  @@index([productId])
}

model BlogPost {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  excerpt       String?
  content       String?
  coverImageUrl String?
  isPublished   Boolean  @default(false)
  publishedAt   DateTime?
  createdById   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  createdBy User @relation("BlogPostAuthor", fields: [createdById], references: [id], onDelete: Restrict)

  @@index([slug])
  @@index([createdById])
  @@index([isPublished])
  @@index([publishedAt])
}
```

## `lib/validators.ts`

```ts
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const cuidSchema = z.string().cuid("Invalid id");

export const PRODUCT_IMAGE_MAX_FILES = 10;
export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const BLOG_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type AllowedImageType = (typeof IMAGE_ALLOWED_TYPES)[number];

export const PRODUCT_IMAGE_ALLOWED_TYPES = IMAGE_ALLOWED_TYPES;
export const BLOG_IMAGE_ALLOWED_TYPES = IMAGE_ALLOWED_TYPES;

export function isAllowedProductImageType(contentType: string) {
  return PRODUCT_IMAGE_ALLOWED_TYPES.includes(contentType as AllowedImageType);
}

export function isAllowedBlogImageType(contentType: string) {
  return BLOG_IMAGE_ALLOWED_TYPES.includes(contentType as AllowedImageType);
}

export function zodFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}

const optionalUrlString = z.string().trim().url().nullable().optional();

export const renderAssetInputSchema = z.object({
  id: cuidSchema.optional(),
  viewCode: z
    .string()
    .trim()
    .min(1, { error: "View code is required" })
    .max(80, { error: "View code is too long" }),
  baseImageUrl: z.string().trim().min(1, { error: "Base image URL is required" }),
  maskImageUrl: z.string().trim().min(1, { error: "Mask image URL is required" }),
  shadowImageUrl: z
    .string()
    .trim()
    .min(1, { error: "Shadow image URL is required" }),
  highlightImageUrl: z
    .string()
    .trim()
    .min(1, { error: "Highlight image URL is required" }),
  width: z.number().int({ error: "Width must be an integer" }).positive().nullable().optional(),
  height: z.number().int({ error: "Height must be an integer" }).positive().nullable().optional(),
  isDefault: z.boolean().default(false),
});

export const productInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "Product name is required" })
      .max(200, { error: "Product name is too long" }),

    description: z
      .string()
      .trim()
      .min(1, { error: "Description is required" })
      .max(5000, { error: "Description is too long" }),

    isActive: z.boolean().default(true),

    priority: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "Priority is required"
            : "Priority must be a number",
      })
      .int({ error: "Priority must be an integer" })
      .superRefine((value, ctx) => {
        if (value !== -999 && value <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Priority must be -999 or an integer greater than 0",
          });
        }
      })
      .default(1),

    minPrice: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "Min price is required"
            : "Min price must be a number",
      })
      .finite({ error: "Min price must be a valid number" })
      .nonnegative({ error: "Min price cannot be negative" })
      .nullable()
      .optional(),

    maxPrice: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "Max price is required"
            : "Max price must be a number",
      })
      .finite({ error: "Max price must be a valid number" })
      .nonnegative({ error: "Max price cannot be negative" })
      .nullable()
      .optional(),

    categoryIds: z.array(cuidSchema).max(100).default([]),
    patternIds: z.array(cuidSchema).max(200).default([]),
    colorIds: z.array(cuidSchema).max(200).default([]),
    defaultPatternId: cuidSchema.nullable().optional(),
    defaultColorId: cuidSchema.nullable().optional(),
    renderAssets: z.array(renderAssetInputSchema).max(50).default([]),
  })
  .superRefine((data, ctx) => {
    if (
      data.minPrice != null &&
      data.maxPrice != null &&
      data.minPrice > data.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minPrice"],
        message: "Min price cannot be greater than max price",
      });
    }

    if (
      data.defaultPatternId &&
      !data.patternIds.includes(data.defaultPatternId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultPatternId"],
        message: "Default pattern must be selected from allowed patterns",
      });
    }

    if (data.defaultColorId && !data.colorIds.includes(data.defaultColorId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultColorId"],
        message: "Default color must be selected from allowed colors",
      });
    }

    data.renderAssets.forEach((asset, index) => {
      if (!asset.baseImageUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["renderAssets", index, "baseImageUrl"],
          message: "Base image URL is required",
        });
      }

      if (!asset.maskImageUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["renderAssets", index, "maskImageUrl"],
          message: "Mask image URL is required",
        });
      }

      if (!asset.shadowImageUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["renderAssets", index, "shadowImageUrl"],
          message: "Shadow image URL is required",
        });
      }

      if (!asset.highlightImageUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["renderAssets", index, "highlightImageUrl"],
          message: "Highlight image URL is required",
        });
      }
    });
  });

export const patternInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Pattern name is required" })
    .max(120, { error: "Pattern name is too long" }),
  code: z
    .string()
    .trim()
    .min(1, { error: "Pattern code is required" })
    .max(80, { error: "Pattern code is too long" }),
  textureUrl: z
    .string()
    .trim()
    .min(1, { error: "Texture URL is required" }),
  defaultScale: z.number().positive({ error: "Default scale must be greater than 0" }).default(1),
  defaultOpacity: z
    .number()
    .min(0, { error: "Default opacity must be at least 0" })
    .max(1, { error: "Default opacity cannot be greater than 1" })
    .default(1),
  isActive: z.boolean().default(true),
});

export const colorInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Color name is required" })
    .max(120, { error: "Color name is too long" }),
  code: z
    .string()
    .trim()
    .min(1, { error: "Color code is required" })
    .max(80, { error: "Color code is too long" }),
  hex: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
      error: "Hex color is invalid",
    }),
  swatchUrl: optionalUrlString,
  isActive: z.boolean().default(true),
});

export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Category name is required" })
    .max(120, { error: "Category name is too long" }),

  description: z
    .string()
    .trim()
    .min(1, { error: "Description is required" })
    .max(2000, { error: "Description is too long" }),

  isActive: z.boolean().default(true),
});

export const categoryConfiguratorSchema = categoryInputSchema.extend({
  patternIds: z.array(cuidSchema).max(200).default([]),
  colorIds: z.array(cuidSchema).max(200).default([]),
});

export const orderItemInputSchema = z.object({
  productId: cuidSchema,
  quantity: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Quantity is required"
          : "Quantity must be a number",
    })
    .int({ error: "Quantity must be an integer" })
    .positive({ error: "Quantity must be at least 1" }),
});

export const orderInputSchema = z
  .object({
    userId: cuidSchema,
    status: z.nativeEnum(OrderStatus),
    note: z
      .string()
      .trim()
      .max(5000, { error: "Note is too long" })
      .default(""),
    items: z
      .array(orderItemInputSchema)
      .min(1, { error: "At least one product is required" })
      .max(200, { error: "Too many items" }),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();

    data.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "productId"],
          message: "Each product can only be selected once",
        });
      }
      seen.add(item.productId);
    });
  });

export const cartItemInputSchema = z.object({
  userId: cuidSchema,
  productId: cuidSchema,
  quantity: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Quantity is required"
          : "Quantity must be a number",
    })
    .int({ error: "Quantity must be an integer" })
    .positive({ error: "Quantity must be at least 1" }),
});

export const cartItemQuantityUpdateSchema = z.object({
  quantity: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Quantity is required"
          : "Quantity must be a number",
    })
    .int({ error: "Quantity must be an integer" })
    .positive({ error: "Quantity must be at least 1" }),
});

export const cartItemLookupSchema = z.object({
  userId: cuidSchema,
  productId: cuidSchema,
});

export const cartItemDeleteSchema = z.object({
  userId: cuidSchema,
  productId: cuidSchema,
});

export const blogPostInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Title is required" })
    .max(200),

  slug: z
    .string()
    .trim()
    .min(1, { error: "Slug is required" })
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Slug format is invalid" }),

  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().trim().max(50000).nullable().optional(),

  coverImageUrl: z
    .string()
    .trim()
    .url({ error: "Cover image URL must be a valid URL" })
    .nullable()
    .optional(),

  isPublished: z.boolean().default(false),
});

export const blogImageUploadInitSchema = z
  .object({
    filename: z
      .string()
      .trim()
      .min(1, { error: "Filename is required" })
      .max(255, { error: "Filename is too long" }),

    contentType: z
      .string()
      .trim()
      .min(1, { error: "Content type is required" }),

    fileSize: z
      .number()
      .int({ error: "File size must be an integer" })
      .positive({ error: "File size must be positive" })
      .max(BLOG_IMAGE_MAX_SIZE_BYTES, {
        error: `File exceeds ${Math.floor(
          BLOG_IMAGE_MAX_SIZE_BYTES / (1024 * 1024)
        )}MB`,
      }),
  })
  .superRefine((data, ctx) => {
    if (!isAllowedBlogImageType(data.contentType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentType"],
        message: "This blog image type is not allowed",
      });
    }
  });

const bulkIdsSchema = z
  .array(cuidSchema)
  .min(1, { error: "Select at least one item" })
  .max(200, { error: "Too many items selected" });

export const bulkIdListSchema = z.object({
  ids: bulkIdsSchema,
});

export const bulkUserActionSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(["approve", "reject", "block", "unblock"]),
});

export const bulkApprovalActionSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(["approve", "reject"]),
});

export const bulkUserAccountActionSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(["block", "unblock"]),
});

export const bulkProductActionSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(["activate", "deactivate"]),
});

export const bulkCategoryActionSchema = z.object({
  ids: bulkIdsSchema,
  action: z.enum(["activate", "deactivate"]),
});
```

## `components/admin/product-form.tsx`

```tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_FILES,
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/validators";
import { ProductPatternSelector } from "@/components/admin/product-pattern-selector";
import { ProductColorSelector } from "@/components/admin/product-color-selector";
import { ProductRenderAssetsForm } from "@/components/admin/product-render-assets-form";

export type ProductRenderAssetFormValue = {
  id?: string;
  viewCode: string;
  baseImageUrl: string;
  maskImageUrl: string;
  shadowImageUrl: string;
  highlightImageUrl: string;
  width: string;
  height: string;
  isDefault: boolean;
};

export type ProductFormValues = {
  name: string;
  description: string;
  isActive: boolean;
  priority: string;
  minPrice: string;
  maxPrice: string;
  categoryIds: string[];
  patternIds: string[];
  colorIds: string[];
  defaultPatternId: string;
  defaultColorId: string;
  renderAssets: ProductRenderAssetFormValue[];
  newImages: File[];
  markFirstAsRender: boolean;
};

export type ProductCategoryOption = {
  id: string;
  name: string;
  description: string;
  allowedPatternIds: string[];
  allowedColorIds: string[];
  allowedPatternCount?: number;
  allowedColorCount?: number;
};

export type ProductPatternOption = {
  id: string;
  name: string;
  code: string;
  textureUrl: string;
  defaultScale: number;
  defaultOpacity: number;
  isActive: boolean;
};

export type ProductColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  swatchUrl?: string | null;
  isActive: boolean;
};

type Props = {
  title: string;
  submitLabel: string;
  categories: ProductCategoryOption[];
  patterns: ProductPatternOption[];
  colors: ProductColorOption[];
  initialValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  busy?: boolean;
  dangerSlot?: React.ReactNode;
  showImagePicker?: boolean;
};

type ProductFormErrors = Partial<
  Record<
    | "name"
    | "description"
    | "priority"
    | "minPrice"
    | "maxPrice"
    | "defaultPatternId"
    | "defaultColorId"
    | "renderAssets"
    | "images",
    string
  >
>;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildAllowedSets(categoryIds: string[], categories: ProductCategoryOption[]) {
  if (categoryIds.length === 0) {
    return {
      allowedPatternIds: null as string[] | null,
      allowedColorIds: null as string[] | null,
    };
  }

  const patternSet = new Set<string>();
  const colorSet = new Set<string>();

  categories
    .filter((category) => categoryIds.includes(category.id))
    .forEach((category) => {
      category.allowedPatternIds.forEach((id) => patternSet.add(id));
      category.allowedColorIds.forEach((id) => colorSet.add(id));
    });

  return {
    allowedPatternIds: [...patternSet],
    allowedColorIds: [...colorSet],
  };
}

function validate(values: ProductFormValues, showImagePicker: boolean) {
  const errors: ProductFormErrors = {};

  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) {
    errors.name = "Vui lòng nhập tên sản phẩm.";
  } else if (name.length > 200) {
    errors.name = "Tên sản phẩm không được vượt quá 200 ký tự.";
  }

  if (!description) {
    errors.description = "Vui lòng nhập mô tả sản phẩm.";
  } else if (description.length > 5000) {
    errors.description = "Mô tả sản phẩm không được vượt quá 5000 ký tự.";
  }

  const priorityText = values.priority.trim();
  const priority = priorityText === "" ? Number.NaN : Number(priorityText);
  const isLandingCover = priority === -999;

  if (priorityText === "") {
    errors.priority = "Vui lòng nhập độ ưu tiên.";
  } else if (!Number.isInteger(priority)) {
    errors.priority = "Độ ưu tiên phải là số nguyên.";
  } else if (!isLandingCover && priority <= 0) {
    errors.priority = "Độ ưu tiên phải là số nguyên lớn hơn 0.";
  }

  const hasMin = values.minPrice.trim() !== "";
  const hasMax = values.maxPrice.trim() !== "";

  const min = hasMin ? Number(values.minPrice) : null;
  const max = hasMax ? Number(values.maxPrice) : null;

  if (hasMin && (!Number.isFinite(min) || (min ?? 0) < 0)) {
    errors.minPrice = "Giá thấp nhất phải là số không âm.";
  }

  if (hasMax && (!Number.isFinite(max) || (max ?? 0) < 0)) {
    errors.maxPrice = "Giá cao nhất phải là số không âm.";
  }

  if (
    !errors.minPrice &&
    !errors.maxPrice &&
    min != null &&
    max != null &&
    min > max
  ) {
    errors.minPrice = "Giá thấp nhất không được lớn hơn giá cao nhất.";
  }

  if (values.defaultPatternId && !values.patternIds.includes(values.defaultPatternId)) {
    errors.defaultPatternId = "Hoa văn mặc định phải nằm trong danh sách hoa văn đã chọn.";
  }

  if (values.defaultColorId && !values.colorIds.includes(values.defaultColorId)) {
    errors.defaultColorId = "Màu mặc định phải nằm trong danh sách màu đã chọn.";
  }

  const hasBrokenRenderAsset = values.renderAssets.some((asset) => {
    return (
      !asset.viewCode.trim() ||
      !asset.baseImageUrl.trim() ||
      !asset.maskImageUrl.trim() ||
      !asset.shadowImageUrl.trim() ||
      !asset.highlightImageUrl.trim()
    );
  });

  if (hasBrokenRenderAsset) {
    errors.renderAssets = "Mỗi asset pack phải có viewCode và đủ 4 URL ảnh layer.";
  }

  if (showImagePicker) {
    if (values.newImages.length > PRODUCT_IMAGE_MAX_FILES) {
      errors.images = `Chỉ được tải lên tối đa ${PRODUCT_IMAGE_MAX_FILES} ảnh trong một lần.`;
    } else {
      for (const file of values.newImages) {
        if (!PRODUCT_IMAGE_ALLOWED_TYPES.includes(file.type as never)) {
          errors.images = `Tệp "${file.name}" không phải là định dạng ảnh được hỗ trợ.`;
          break;
        }

        if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
          errors.images = `Tệp "${file.name}" vượt quá dung lượng cho phép 5MB.`;
          break;
        }
      }
    }
  }

  return errors;
}

export function ProductForm({
  title,
  submitLabel,
  categories,
  patterns,
  colors,
  initialValues,
  onSubmit,
  busy = false,
  dangerSlot,
  showImagePicker = false,
}: Props) {
  const [values, setValues] = React.useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = React.useState<ProductFormErrors>({});

  React.useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const isLandingCover = values.priority.trim() === "-999";
  const allowedOptionSets = React.useMemo(
    () => buildAllowedSets(values.categoryIds, categories),
    [values.categoryIds, categories]
  );

  function setCategoriesWithRules(nextCategoryIds: string[]) {
    const nextAllowed = buildAllowedSets(nextCategoryIds, categories);

    const nextPatternIds = nextAllowed.allowedPatternIds
      ? values.patternIds.filter((id) => nextAllowed.allowedPatternIds?.includes(id))
      : values.patternIds;

    const nextColorIds = nextAllowed.allowedColorIds
      ? values.colorIds.filter((id) => nextAllowed.allowedColorIds?.includes(id))
      : values.colorIds;

    setValues((prev) => ({
      ...prev,
      categoryIds: nextCategoryIds,
      patternIds: nextPatternIds,
      colorIds: nextColorIds,
      defaultPatternId: nextPatternIds.includes(prev.defaultPatternId)
        ? prev.defaultPatternId
        : "",
      defaultColorId: nextColorIds.includes(prev.defaultColorId)
        ? prev.defaultColorId
        : "",
    }));
  }

  function toggleCategory(id: string) {
    const nextIds = values.categoryIds.includes(id)
      ? values.categoryIds.filter((item) => item !== id)
      : [...values.categoryIds, id];

    setCategoriesWithRules(nextIds);
  }

  function removeSelectedImage(index: number) {
    setValues((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({ ...prev, images: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = validate(values, showImagePicker);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <div className="text-xl font-semibold text-slate-800">{title}</div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            1 sản phẩm tương ứng với 1 dáng chậu cơ sở. Phần hoa văn, màu sắc và asset render được cấu hình bên dưới.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name" className="text-base font-medium text-slate-800">
            Tên sản phẩm / dáng chậu
          </Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, name: e.target.value }));
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Ví dụ: Chậu tròn thấp"
            aria-invalid={Boolean(errors.name)}
            className="h-12 rounded-xl text-base"
          />
          {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label
            htmlFor="description"
            className="text-base font-medium text-slate-800"
          >
            Mô tả sản phẩm
          </Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, description: e.target.value }));
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Ví dụ: Dáng chậu cơ sở dùng cho bộ sưu tập men gốm thủ công"
            rows={5}
            aria-invalid={Boolean(errors.description)}
            className="rounded-xl text-base leading-7"
          />
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label
                htmlFor="priority"
                className="text-base font-medium text-slate-800"
              >
                Độ ưu tiên
              </Label>
              <Input
                id="priority"
                type="number"
                min="1"
                step="1"
                disabled={isLandingCover}
                value={isLandingCover ? "" : values.priority}
                onChange={(e) => {
                  const nextValue = e.target.value;

                  if (nextValue === "") {
                    setValues((prev) => ({ ...prev, priority: "" }));
                    setErrors((prev) => ({ ...prev, priority: undefined }));
                    return;
                  }

                  const parsed = Number(nextValue);
                  if (Number.isInteger(parsed) && parsed > 0) {
                    setValues((prev) => ({ ...prev, priority: nextValue }));
                    setErrors((prev) => ({ ...prev, priority: undefined }));
                  }
                }}
                placeholder={
                  isLandingCover
                    ? "Đang dùng chế độ cover landing page"
                    : "Ví dụ: 1"
                }
                aria-invalid={Boolean(errors.priority)}
                className="h-12 rounded-xl text-base disabled:bg-slate-100 disabled:text-slate-500"
              />

              {errors.priority ? (
                <p className="text-sm text-red-600">{errors.priority}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  Nhập số nguyên lớn hơn 0 cho thứ tự ưu tiên thông thường.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <label className="flex items-start gap-3 text-base text-slate-800">
                <input
                  type="checkbox"
                  checked={isLandingCover}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    setValues((prev) => ({
                      ...prev,
                      priority: checked
                        ? "-999"
                        : prev.priority.trim() === "-999"
                          ? "1"
                          : prev.priority.trim() === ""
                            ? "1"
                            : prev.priority,
                    }));

                    setErrors((prev) => ({ ...prev, priority: undefined }));
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300"
                />
                <span>
                  Đặt sản phẩm này làm ảnh cover ở landing page
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    Khi bật mục này, hệ thống sẽ tự lưu priority = -999. Đây là giá trị đặc biệt để đánh dấu sản phẩm dùng làm cover trên landing page.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="minPrice"
              className="text-base font-medium text-slate-800"
            >
              Giá thấp nhất
            </Label>
            <Input
              id="minPrice"
              type="number"
              min="0"
              step="0.01"
              value={values.minPrice}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, minPrice: e.target.value }));
                setErrors((prev) => ({ ...prev, minPrice: undefined }));
              }}
              placeholder="1200"
              aria-invalid={Boolean(errors.minPrice)}
              className="h-12 rounded-xl text-base"
            />
            {errors.minPrice ? (
              <p className="text-sm text-red-600">{errors.minPrice}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="maxPrice"
              className="text-base font-medium text-slate-800"
            >
              Giá cao nhất
            </Label>
            <Input
              id="maxPrice"
              type="number"
              min="0"
              step="0.01"
              value={values.maxPrice}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, maxPrice: e.target.value }));
                setErrors((prev) => ({ ...prev, maxPrice: undefined }));
              }}
              placeholder="1500"
              aria-invalid={Boolean(errors.maxPrice)}
              className="h-12 rounded-xl text-base"
            />
            {errors.maxPrice ? (
              <p className="text-sm text-red-600">{errors.maxPrice}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <label className="flex items-start gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>
              Sản phẩm đang được sử dụng
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Bỏ chọn nếu anh muốn tạm ngưng sản phẩm này mà không xóa khỏi hệ thống.
              </span>
            </span>
          </label>
        </div>
      </Card>

      <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <div className="text-xl font-semibold text-slate-800">Collection áp dụng</div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            Collection (danh mục) quyết định bộ hoa văn và màu sắc hợp lệ cho sản phẩm.
          </p>
        </div>

        {categories.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
            Hiện chưa có collection nào.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-base hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={values.categoryIds.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <div>
                <div className="font-medium text-slate-800">{cat.name}</div>
                <div className="mt-1 leading-6 text-slate-600">{cat.description}</div>
                <div className="mt-2 text-sm text-slate-500">
                  {cat.allowedPatternCount ?? cat.allowedPatternIds.length} hoa văn • {cat.allowedColorCount ?? cat.allowedColorIds.length} màu
                </div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <ProductPatternSelector
        patterns={patterns}
        selectedIds={values.patternIds}
        defaultPatternId={values.defaultPatternId}
        allowedIds={allowedOptionSets.allowedPatternIds}
        onSelectedIdsChange={(patternIds) => {
          setValues((prev) => ({
            ...prev,
            patternIds,
            defaultPatternId: patternIds.includes(prev.defaultPatternId)
              ? prev.defaultPatternId
              : "",
          }));
          setErrors((prev) => ({ ...prev, defaultPatternId: undefined }));
        }}
        onDefaultPatternIdChange={(defaultPatternId) => {
          setValues((prev) => ({ ...prev, defaultPatternId }));
          setErrors((prev) => ({ ...prev, defaultPatternId: undefined }));
        }}
      />
      {errors.defaultPatternId ? (
        <p className="-mt-3 text-sm text-red-600">{errors.defaultPatternId}</p>
      ) : null}

      <ProductColorSelector
        colors={colors}
        selectedIds={values.colorIds}
        defaultColorId={values.defaultColorId}
        allowedIds={allowedOptionSets.allowedColorIds}
        onSelectedIdsChange={(colorIds) => {
          setValues((prev) => ({
            ...prev,
            colorIds,
            defaultColorId: colorIds.includes(prev.defaultColorId)
              ? prev.defaultColorId
              : "",
          }));
          setErrors((prev) => ({ ...prev, defaultColorId: undefined }));
        }}
        onDefaultColorIdChange={(defaultColorId) => {
          setValues((prev) => ({ ...prev, defaultColorId }));
          setErrors((prev) => ({ ...prev, defaultColorId: undefined }));
        }}
      />
      {errors.defaultColorId ? (
        <p className="-mt-3 text-sm text-red-600">{errors.defaultColorId}</p>
      ) : null}

      <ProductRenderAssetsForm
        value={values.renderAssets}
        onChange={(renderAssets) => {
          setValues((prev) => ({ ...prev, renderAssets }));
          setErrors((prev) => ({ ...prev, renderAssets: undefined }));
        }}
        disabled={busy}
      />
      {errors.renderAssets ? (
        <p className="-mt-3 text-sm text-red-600">{errors.renderAssets}</p>
      ) : null}

      {showImagePicker && (
        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div>
            <div className="text-xl font-semibold text-slate-800">Gallery ảnh sản phẩm</div>
            <p className="mt-1 text-base leading-7 text-slate-600">
              Chọn một hoặc nhiều ảnh gallery thường để tải lên cùng sản phẩm. Đây là luồng riêng, không phải render asset pack.
            </p>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="product-images"
              className="text-base font-medium text-slate-800"
            >
              Chọn ảnh gallery
            </Label>
            <Input
              id="product-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setValues((prev) => ({
                  ...prev,
                  newImages: files,
                }));
                setErrors((prev) => ({ ...prev, images: undefined }));
              }}
              aria-invalid={Boolean(errors.images)}
              className="h-12 rounded-xl text-base file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-sm leading-6 text-slate-500">
              Tối đa {PRODUCT_IMAGE_MAX_FILES} ảnh. Mỗi ảnh không vượt quá 5MB.
            </p>
            {errors.images ? (
              <p className="text-sm text-red-600">{errors.images}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <label className="flex items-start gap-3 text-base text-slate-800">
              <input
                type="checkbox"
                checked={values.markFirstAsRender}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    markFirstAsRender: e.target.checked,
                  }))
                }
                className="mt-1 h-5 w-5 rounded border-slate-300"
              />
              <span>
                Đặt ảnh đầu tiên đã chọn làm ảnh hiển thị chính
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Nếu bật mục này, ảnh đầu tiên trong danh sách sẽ được dùng làm ảnh đại diện cho gallery.
                </span>
              </span>
            </label>
          </div>

          {values.newImages.length > 0 && (
            <div className="grid gap-3">
              {values.newImages.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-slate-800">
                      {file.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatFileSize(file.size)}
                      {index === 0 && values.markFirstAsRender ? " • Ảnh chính" : ""}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeSelectedImage(index)}
                    className="h-10 rounded-xl px-4 text-base"
                  >
                    Bỏ ảnh này
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl px-5 text-base font-semibold"
        >
          {busy ? "Đang xử lý..." : submitLabel}
        </Button>
        {dangerSlot}
      </div>
    </form>
  );
}
```

## `app/admin/products/new/page.tsx`

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import {
  ProductColorOption,
  ProductForm,
  ProductFormValues,
  ProductCategoryOption,
  ProductPatternOption,
} from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const categoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      allowedPatternIds: z.array(z.string()).default([]),
      allowedColorIds: z.array(z.string()).default([]),
      _count: z
        .object({
          categoryPatterns: z.number().optional(),
          categoryColors: z.number().optional(),
        })
        .optional(),
    })
  ),
});

const patternsSchema = z.object({
  patterns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      textureUrl: z.string(),
      defaultScale: z.number(),
      defaultOpacity: z.number(),
      isActive: z.boolean(),
    })
  ),
});

const colorsSchema = z.object({
  colors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      hex: z.string(),
      swatchUrl: z.string().nullable().optional(),
      isActive: z.boolean(),
    })
  ),
});

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

function parsePriority(value: string) {
  const trimmed = value.trim();
  const parsed = trimmed === "" ? Number.NaN : Number(trimmed);
  return Number.isInteger(parsed) && (parsed === -999 || parsed > 0) ? parsed : 1;
}

function toPayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    isActive: values.isActive,
    priority: parsePriority(values.priority),
    minPrice: parseNullableNumber(values.minPrice),
    maxPrice: parseNullableNumber(values.maxPrice),
    categoryIds: values.categoryIds,
    patternIds: values.patternIds,
    colorIds: values.colorIds,
    defaultPatternId: values.defaultPatternId || null,
    defaultColorId: values.defaultColorId || null,
    renderAssets: values.renderAssets.map((asset) => ({
      id: asset.id,
      viewCode: asset.viewCode.trim(),
      baseImageUrl: asset.baseImageUrl.trim(),
      maskImageUrl: asset.maskImageUrl.trim(),
      shadowImageUrl: asset.shadowImageUrl.trim(),
      highlightImageUrl: asset.highlightImageUrl.trim(),
      width: asset.width.trim() ? Number(asset.width) : null,
      height: asset.height.trim() ? Number(asset.height) : null,
      isDefault: asset.isDefault,
    })),
  };
}

function getApiErrorMessage(data: any, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;

  const fieldErrors = data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function uploadProductImages(productId: string, values: ProductFormValues) {
  if (values.newImages.length === 0) return;

  const formData = new FormData();
  values.newImages.forEach((file) => formData.append("files", file));
  formData.append("markFirstAsRender", String(values.markFirstAsRender));

  const res = await fetch(`/api/admin/products/${productId}/images`, {
    method: "POST",
    body: formData,
  });

  const data = await readJsonSafe(res);

  if (!res.ok) {
    throw new Error(getApiErrorMessage(data, "Không thể tải ảnh gallery lên"));
  }

  return data;
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = React.useState<ProductCategoryOption[]>([]);
  const [patterns, setPatterns] = React.useState<ProductPatternOption[]>([]);
  const [colors, setColors] = React.useState<ProductColorOption[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;

    async function loadDependencies() {
      try {
        setLoading(true);

        const [categoriesRes, patternsRes, colorsRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/patterns"),
          fetch("/api/admin/colors"),
        ]);

        const [categoriesData, patternsData, colorsData] = await Promise.all([
          readJsonSafe(categoriesRes),
          readJsonSafe(patternsRes),
          readJsonSafe(colorsRes),
        ]);

        if (!categoriesRes.ok) {
          throw new Error(getApiErrorMessage(categoriesData, "Không tải được collection"));
        }
        if (!patternsRes.ok) {
          throw new Error(getApiErrorMessage(patternsData, "Không tải được hoa văn"));
        }
        if (!colorsRes.ok) {
          throw new Error(getApiErrorMessage(colorsData, "Không tải được màu sắc"));
        }

        const parsedCategories = categoriesSchema.parse(categoriesData);
        const parsedPatterns = patternsSchema.parse(patternsData);
        const parsedColors = colorsSchema.parse(colorsData);

        if (!ignore) {
          setCategories(
            parsedCategories.categories.map((category) => ({
              id: category.id,
              name: category.name,
              description: category.description,
              allowedPatternIds: category.allowedPatternIds,
              allowedColorIds: category.allowedColorIds,
              allowedPatternCount:
                category._count?.categoryPatterns ?? category.allowedPatternIds.length,
              allowedColorCount:
                category._count?.categoryColors ?? category.allowedColorIds.length,
            }))
          );
          setPatterns(parsedPatterns.patterns);
          setColors(parsedColors.colors);
        }
      } catch (error) {
        if (!ignore) {
          toast({
            title: "Không tải được dữ liệu cấu hình",
            description:
              error instanceof Error
                ? error.message
                : "Vui lòng kiểm tra dữ liệu master rồi thử lại.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDependencies();

    return () => {
      ignore = true;
    };
  }, [toast]);

  async function handleSubmit(values: ProductFormValues) {
    const message =
      values.newImages.length > 0
        ? `Anh có muốn tạo sản phẩm này và tải lên ${values.newImages.length} ảnh gallery không?`
        : "Anh có muốn tạo sản phẩm này không?";

    const ok = window.confirm(message);
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo sản phẩm"));
      }

      const productId = data?.product?.id;
      if (!productId) {
        throw new Error("API tạo sản phẩm không trả về product.id");
      }

      if (values.newImages.length > 0) {
        await uploadProductImages(productId, values);
      }

      toast({
        title: "Đã tạo sản phẩm",
        description: "Sản phẩm đã được tạo thành công cùng dữ liệu cấu hình configurator.",
      });

      router.push(`/admin/products/${productId}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Tạo sản phẩm không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Tạo sản phẩm mới"
        description="Đang tải collection, hoa văn và màu sắc..."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/products">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải dữ liệu...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Tạo sản phẩm mới"
      description="Tạo dáng chậu cơ sở, cấu hình hoa văn, màu sắc và asset pack render."
      right={
        <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
          <Link href="/admin/products">Hủy / Quay lại</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Collection:</span> {categories.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Hoa văn master:</span> {patterns.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Màu master:</span> {colors.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Asset render:</span> thêm trực tiếp trong form
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Gallery ảnh:</span> giữ flow riêng như cũ
        </div>
      </div>

      <ProductForm
        title="Thông tin sản phẩm mới"
        submitLabel="Lưu và tạo sản phẩm"
        categories={categories}
        patterns={patterns}
        colors={colors}
        busy={busy}
        showImagePicker
        initialValues={{
          name: "",
          description: "",
          isActive: true,
          priority: "1",
          minPrice: "",
          maxPrice: "",
          categoryIds: [],
          patternIds: [],
          colorIds: [],
          defaultPatternId: "",
          defaultColorId: "",
          renderAssets: [],
          newImages: [],
          markFirstAsRender: true,
        }}
        onSubmit={handleSubmit}
      />
    </PageShell>
  );
}
```

## `app/admin/products/[id]/page.tsx`

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import {
  ProductColorOption,
  ProductForm,
  ProductFormValues,
  ProductCategoryOption,
  ProductPatternOption,
} from "@/components/admin/product-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ProductPreviewTester } from "@/components/admin/product-preview-tester";

const categoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      allowedPatternIds: z.array(z.string()).default([]),
      allowedColorIds: z.array(z.string()).default([]),
      _count: z
        .object({
          categoryPatterns: z.number().optional(),
          categoryColors: z.number().optional(),
        })
        .optional(),
    })
  ),
});

const patternsSchema = z.object({
  patterns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      textureUrl: z.string(),
      defaultScale: z.number(),
      defaultOpacity: z.number(),
      isActive: z.boolean(),
    })
  ),
});

const colorsSchema = z.object({
  colors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      hex: z.string(),
      swatchUrl: z.string().nullable().optional(),
      isActive: z.boolean(),
    })
  ),
});

const productSchema = z.object({
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    isActive: z.boolean(),
    priority: z.number(),
    minPrice: z.number().nullable().optional(),
    maxPrice: z.number().nullable().optional(),
    defaultPatternId: z.string().nullable().optional(),
    defaultColorId: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    categories: z.array(
      z.object({
        category: z.object({
          id: z.string(),
          name: z.string(),
        }),
      })
    ),
    productPatterns: z.array(
      z.object({
        patternId: z.string(),
        pattern: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          textureUrl: z.string(),
          defaultScale: z.number(),
          defaultOpacity: z.number(),
          isActive: z.boolean(),
        }),
      })
    ),
    productColors: z.array(
      z.object({
        colorId: z.string(),
        color: z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          hex: z.string(),
          swatchUrl: z.string().nullable().optional(),
          isActive: z.boolean(),
        }),
      })
    ),
    renderAssets: z.array(
      z.object({
        id: z.string(),
        viewCode: z.string(),
        baseImageUrl: z.string(),
        maskImageUrl: z.string(),
        shadowImageUrl: z.string(),
        highlightImageUrl: z.string(),
        width: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
        isDefault: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    images: z.array(
      z.object({
        id: z.string(),
        url: z.string(),
        description: z.string(),
        isRender: z.boolean(),
        createdAt: z.string(),
      })
    ),
    _count: z.object({
      cartItems: z.number(),
      productPatterns: z.number(),
      productColors: z.number(),
      renderAssets: z.number(),
    }),
  }),
});

type ProductDetail = z.infer<typeof productSchema>["product"];

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function parsePriority(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return 1;

  const num = Number(trimmed);
  return Number.isInteger(num) && (num === -999 || num > 0) ? num : 1;
}

function toPayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    isActive: values.isActive,
    priority: parsePriority(values.priority),
    minPrice: parseNullableNumber(values.minPrice),
    maxPrice: parseNullableNumber(values.maxPrice),
    categoryIds: values.categoryIds,
    patternIds: values.patternIds,
    colorIds: values.colorIds,
    defaultPatternId: values.defaultPatternId || null,
    defaultColorId: values.defaultColorId || null,
    renderAssets: values.renderAssets.map((asset) => ({
      id: asset.id,
      viewCode: asset.viewCode.trim(),
      baseImageUrl: asset.baseImageUrl.trim(),
      maskImageUrl: asset.maskImageUrl.trim(),
      shadowImageUrl: asset.shadowImageUrl.trim(),
      highlightImageUrl: asset.highlightImageUrl.trim(),
      width: asset.width.trim() ? Number(asset.width) : null,
      height: asset.height.trim() ? Number(asset.height) : null,
      isDefault: asset.isDefault,
    })),
  };
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }

  if (
    data &&
    typeof data === "object" &&
    "fieldErrors" in data &&
    (data as { fieldErrors?: unknown }).fieldErrors &&
    typeof (data as { fieldErrors?: unknown }).fieldErrors === "object"
  ) {
    const fieldErrors = (data as { fieldErrors: Record<string, unknown> }).fieldErrors;

    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [categories, setCategories] = React.useState<ProductCategoryOption[]>([]);
  const [patterns, setPatterns] = React.useState<ProductPatternOption[]>([]);
  const [colors, setColors] = React.useState<ProductColorOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [markFirstAsRender, setMarkFirstAsRender] = React.useState(true);

  async function loadAll() {
    if (!productId) {
      throw new Error("Thiếu mã sản phẩm");
    }

    const [categoriesRes, patternsRes, colorsRes, productRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/patterns"),
      fetch("/api/admin/colors"),
      fetch(`/api/admin/products/${productId}`),
    ]);

    const [categoriesData, patternsData, colorsData, productData] = await Promise.all([
      readJsonSafe(categoriesRes),
      readJsonSafe(patternsRes),
      readJsonSafe(colorsRes),
      readJsonSafe(productRes),
    ]);

    if (!categoriesRes.ok) {
      throw new Error(getApiErrorMessage(categoriesData, "Không tải được collection"));
    }
    if (!patternsRes.ok) {
      throw new Error(getApiErrorMessage(patternsData, "Không tải được hoa văn"));
    }
    if (!colorsRes.ok) {
      throw new Error(getApiErrorMessage(colorsData, "Không tải được màu sắc"));
    }
    if (!productRes.ok) {
      throw new Error(getApiErrorMessage(productData, "Không tải được sản phẩm"));
    }

    const parsedCategories = categoriesSchema.parse(categoriesData);
    const parsedPatterns = patternsSchema.parse(patternsData);
    const parsedColors = colorsSchema.parse(colorsData);
    const parsedProduct = productSchema.parse(productData);

    setCategories(
      parsedCategories.categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        allowedPatternIds: category.allowedPatternIds,
        allowedColorIds: category.allowedColorIds,
        allowedPatternCount:
          category._count?.categoryPatterns ?? category.allowedPatternIds.length,
        allowedColorCount:
          category._count?.categoryColors ?? category.allowedColorIds.length,
      }))
    );
    setPatterns(parsedPatterns.patterns);
    setColors(parsedColors.colors);
    setProduct(parsedProduct.product);
  }

  React.useEffect(() => {
    if (!productId) {
      setLoading(false);
      setProduct(null);
      setCategories([]);
      setPatterns([]);
      setColors([]);
      return;
    }

    setLoading(true);

    loadAll()
      .catch((err) => {
        console.error("Không tải được trang sản phẩm:", err);
        setProduct(null);
        setCategories([]);
        setPatterns([]);
        setColors([]);

        toast({
          title: "Không tải được sản phẩm",
          description:
            err instanceof Error
              ? err.message
              : "Dữ liệu sản phẩm hoặc master data hiện không khả dụng.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, toast]);

  async function handleUpdate(values: ProductFormValues) {
    const ok = window.confirm(
      `Anh có muốn lưu thay đổi cho sản phẩm này không?\n\nTên sản phẩm: ${values.name.trim()}`
    );
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(values)),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật sản phẩm"));
      }

      toast({
        title: "Đã lưu thay đổi",
        description: "Thông tin configurator của sản phẩm đã được cập nhật.",
      });

      await loadAll();
    } catch (e) {
      toast({
        title: "Lưu không thành công",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra khi lưu sản phẩm",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    const ok = window.confirm(
      "Anh có muốn chuyển sản phẩm này sang trạng thái tạm ngưng không?\n\nSản phẩm sẽ không bị xóa cứng khỏi hệ thống."
    );
    if (!ok) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạm ngưng sản phẩm"));
      }

      toast({
        title: "Đã tạm ngưng sản phẩm",
        description: "Sản phẩm đã được soft delete bằng cách đặt isActive = false.",
      });

      await loadAll();
    } catch (e) {
      toast({
        title: "Tạm ngưng không thành công",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra khi cập nhật trạng thái sản phẩm",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpload() {
    if (!files.length) {
      toast({
        title: "Chưa chọn ảnh",
        description: "Anh hãy chọn một hoặc nhiều ảnh trước khi tải lên.",
        variant: "destructive",
      });
      return;
    }

    const ok = window.confirm(
      `Anh có muốn thêm ${files.length} ảnh gallery vào sản phẩm này không?`
    );
    if (!ok) return;

    try {
      setUploading(true);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("markFirstAsRender", String(markFirstAsRender));

      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tải ảnh lên"));
      }

      const createdCount =
        data &&
        typeof data === "object" &&
        "createdCount" in data &&
        typeof (data as { createdCount?: unknown }).createdCount === "number"
          ? (data as { createdCount: number }).createdCount
          : files.length;

      toast({
        title: "Đã tải ảnh lên",
        description: `${createdCount} ảnh gallery đã được thêm vào sản phẩm.`,
      });

      setFiles([]);
      await loadAll();
    } catch (e) {
      toast({
        title: "Tải ảnh không thành công",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra khi tải ảnh",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function removeSelectedFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <PageShell
        title="Chỉnh sửa sản phẩm"
        description="Đang tải thông tin sản phẩm..."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/products">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Đang tải dữ liệu...
        </div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell
        title="Chỉnh sửa sản phẩm"
        description="Không tìm thấy sản phẩm cần chỉnh sửa."
        right={
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
            <Link href="/admin/products">Quay lại</Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-sm">
          Không thể tải sản phẩm được yêu cầu.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Chỉnh sửa sản phẩm: ${product.name}`}
      description="Cập nhật thông tin configurator, quản lý gallery ảnh và kiểm tra asset render."
      right={
        <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-base">
          <Link href="/admin/products">Hủy / Quay lại</Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Collection:</span> {product.categories.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Gallery ảnh:</span> {product.images.length}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Hoa văn:</span> {product._count.productPatterns}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Màu sắc:</span> {product._count.productColors}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Asset pack:</span> {product._count.renderAssets}
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
          <span className="font-medium">Cập nhật:</span> {formatDateTime(product.updatedAt)}
        </div>
      </div>

      <ProductForm
        title="Thông tin sản phẩm"
        submitLabel="Lưu thay đổi"
        categories={categories}
        patterns={patterns}
        colors={colors}
        busy={busy}
        initialValues={{
          name: product.name,
          description: product.description,
          isActive: product.isActive,
          priority: String(product.priority ?? 1),
          minPrice: product.minPrice != null ? String(product.minPrice) : "",
          maxPrice: product.maxPrice != null ? String(product.maxPrice) : "",
          categoryIds: product.categories.map((x) => x.category.id),
          patternIds: product.productPatterns.map((x) => x.patternId),
          colorIds: product.productColors.map((x) => x.colorId),
          defaultPatternId: product.defaultPatternId ?? "",
          defaultColorId: product.defaultColorId ?? "",
          renderAssets: product.renderAssets.map((asset) => ({
            id: asset.id,
            viewCode: asset.viewCode,
            baseImageUrl: asset.baseImageUrl,
            maskImageUrl: asset.maskImageUrl,
            shadowImageUrl: asset.shadowImageUrl,
            highlightImageUrl: asset.highlightImageUrl,
            width: asset.width != null ? String(asset.width) : "",
            height: asset.height != null ? String(asset.height) : "",
            isDefault: asset.isDefault,
          })),
          newImages: [],
          markFirstAsRender: true,
        }}
        onSubmit={handleUpdate}
        dangerSlot={
          <Button
            type="button"
            variant="outline"
            onClick={handleDeactivate}
            disabled={deleting}
            className="h-11 rounded-xl border-amber-300 px-5 text-base text-amber-700 hover:bg-amber-50"
          >
            {deleting ? "Đang xử lý..." : "Tạm ngưng sản phẩm"}
          </Button>
        }
      />

      <div className="mt-6">
        <ProductPreviewTester
          patterns={product.productPatterns.map((item) => item.pattern)}
          colors={product.productColors.map((item) => item.color)}
          renderAssets={product.renderAssets}
          defaultPatternId={product.defaultPatternId}
          defaultColorId={product.defaultColorId}
        />
      </div>

      <Card className="mt-6 space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Tải gallery ảnh lên</h2>
          <p className="mt-1 text-base text-slate-600">
            Đây là khu vực quản lý ảnh gallery thường. Không dùng cho render asset pack.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-base font-medium text-slate-800">
            Chọn ảnh gallery
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
          />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <label className="flex items-start gap-3 text-base text-slate-800">
            <input
              type="checkbox"
              checked={markFirstAsRender}
              onChange={(e) => setMarkFirstAsRender(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />
            <span>Đặt ảnh đầu tiên vừa tải lên làm ảnh hiển thị chính</span>
          </label>
          <p className="mt-2 pl-8 text-sm leading-6 text-slate-500">
            Nếu bật mục này, ảnh đầu tiên trong danh sách tải lên sẽ được đánh dấu là ảnh hiển thị chính.
          </p>
        </div>

        <div className="text-base text-slate-700">
          <span className="font-medium">Số ảnh đã chọn:</span> {files.length}
        </div>

        {files.length > 0 && (
          <div className="grid gap-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-slate-800">
                    {file.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                    {index === 0 && markFirstAsRender ? " • Ảnh chính" : ""}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeSelectedFile(index)}
                  className="h-10 rounded-xl px-4 text-base"
                >
                  Bỏ ảnh này
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="h-11 rounded-xl px-5 text-base font-semibold"
          >
            {uploading ? "Đang tải ảnh..." : "Tải ảnh gallery lên"}
          </Button>
        </div>
      </Card>

      <Card className="mt-6 space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Gallery ảnh hiện có</h2>
          <p className="mt-1 text-base text-slate-600">
            Danh sách các ảnh gallery đang gắn với sản phẩm này. Khu vực này hoàn toàn tách biệt với render asset pack.
          </p>
        </div>

        {product.images.length === 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
            Sản phẩm này hiện chưa có ảnh gallery nào.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {product.images.map((img) => (
            <div
              key={img.id}
              className="space-y-3 rounded-2xl border border-slate-200 p-4"
            >
              <img
                src={img.url}
                alt={img.description || "Ảnh sản phẩm"}
                className="h-48 w-full rounded-xl border border-slate-200 object-cover"
                loading="lazy"
              />

              <div className="break-all text-base font-medium text-slate-800">
                {img.description || "Ảnh sản phẩm"}
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Ảnh chính: {img.isRender ? "Có" : "Không"}
              </div>

              <div className="text-sm text-slate-500">
                Ngày thêm: {formatDateTime(img.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
```

## `app/api/admin/products/route.ts`

```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { productInputSchema, zodFieldErrors } from "@/lib/validators";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

type ProductSort =
  | "priority_desc"
  | "priority_asc"
  | "created_desc"
  | "created_asc"
  | "cart_users_desc"
  | "cart_users_asc";

function parseSort(value: string | null): ProductSort {
  switch (value) {
    case "priority_asc":
    case "created_desc":
    case "created_asc":
    case "cart_users_desc":
    case "cart_users_asc":
      return value;
    case "priority_desc":
    default:
      return "priority_desc";
  }
}

function getProductOrderBy(
  sort: ProductSort
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "priority_asc":
      return [{ priority: "asc" }, { createdAt: "desc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "cart_users_desc":
      return [{ cartItems: { _count: "desc" } }, { createdAt: "desc" }];
    case "cart_users_asc":
      return [{ cartItems: { _count: "asc" } }, { createdAt: "desc" }];
    case "priority_desc":
    default:
      return [{ priority: "desc" }, { createdAt: "desc" }];
  }
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)].filter(Boolean);
}

function normalizeRenderAssets(
  renderAssets: Array<{
    id?: string;
    viewCode: string;
    baseImageUrl: string;
    maskImageUrl: string;
    shadowImageUrl: string;
    highlightImageUrl: string;
    width?: number | null;
    height?: number | null;
    isDefault: boolean;
  }>
) {
  const trimmed = renderAssets.map((asset) => ({
    id: asset.id,
    viewCode: asset.viewCode.trim() || "front",
    baseImageUrl: asset.baseImageUrl.trim(),
    maskImageUrl: asset.maskImageUrl.trim(),
    shadowImageUrl: asset.shadowImageUrl.trim(),
    highlightImageUrl: asset.highlightImageUrl.trim(),
    width: asset.width ?? null,
    height: asset.height ?? null,
    isDefault: Boolean(asset.isDefault),
  }));

  const defaultIndex = trimmed.findIndex((asset) => asset.isDefault);
  return trimmed.map((asset, index) => ({
    ...asset,
    isDefault:
      trimmed.length === 0
        ? false
        : defaultIndex >= 0
          ? index === defaultIndex
          : index === 0,
  }));
}

async function validateConfiguratorInput(input: {
  categoryIds: string[];
  patternIds: string[];
  colorIds: string[];
  defaultPatternId?: string | null;
  defaultColorId?: string | null;
}) {
  const categoryIds = uniqueIds(input.categoryIds);
  const patternIds = uniqueIds(input.patternIds);
  const colorIds = uniqueIds(input.colorIds);

  const [categoryCount, patternCount, colorCount, categoryRules] = await Promise.all([
    categoryIds.length > 0
      ? prisma.category.count({ where: { id: { in: categoryIds } } })
      : Promise.resolve(0),
    patternIds.length > 0
      ? prisma.pattern.count({ where: { id: { in: patternIds } } })
      : Promise.resolve(0),
    colorIds.length > 0
      ? prisma.color.count({ where: { id: { in: colorIds } } })
      : Promise.resolve(0),
    categoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: {
            id: true,
            categoryPatterns: { select: { patternId: true } },
            categoryColors: { select: { colorId: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  if (categoryIds.length > 0 && categoryCount !== categoryIds.length) {
    return { ok: false as const, error: "One or more selected categories do not exist" };
  }

  if (patternIds.length > 0 && patternCount !== patternIds.length) {
    return { ok: false as const, error: "One or more selected patterns do not exist" };
  }

  if (colorIds.length > 0 && colorCount !== colorIds.length) {
    return { ok: false as const, error: "One or more selected colors do not exist" };
  }

  if (input.defaultPatternId && !patternIds.includes(input.defaultPatternId)) {
    return { ok: false as const, error: "Default pattern must be selected from patternIds" };
  }

  if (input.defaultColorId && !colorIds.includes(input.defaultColorId)) {
    return { ok: false as const, error: "Default color must be selected from colorIds" };
  }

  if (categoryIds.length > 0) {
    const allowedPatternIds = new Set<string>();
    const allowedColorIds = new Set<string>();

    categoryRules.forEach((category) => {
      category.categoryPatterns.forEach((item) => allowedPatternIds.add(item.patternId));
      category.categoryColors.forEach((item) => allowedColorIds.add(item.colorId));
    });

    const hasInvalidPattern = patternIds.some((id) => !allowedPatternIds.has(id));
    const hasInvalidColor = colorIds.some((id) => !allowedColorIds.has(id));

    if (hasInvalidPattern) {
      return {
        ok: false as const,
        error: "Selected patterns must belong to the allowed rules of the selected categories",
      };
    }

    if (hasInvalidColor) {
      return {
        ok: false as const,
        error: "Selected colors must belong to the allowed rules of the selected categories",
      };
    }
  }

  return {
    ok: true as const,
    categoryIds,
    patternIds,
    colorIds,
  };
}

export async function GET(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const url = new URL(req.url);
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(url.searchParams.get("pageSize"), 20),
    100
  );
  const q = url.searchParams.get("q")?.trim() || "";
  const rawIsActive = url.searchParams.get("isActive");
  const categoryId = url.searchParams.get("categoryId")?.trim() || "";
  const sort = parseSort(url.searchParams.get("sort"));

  let isActive: boolean | undefined;
  if (rawIsActive === "true") isActive = true;
  if (rawIsActive === "false") isActive = false;

  const where: Prisma.ProductWhereInput = {
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(categoryId
      ? {
          categories: {
            some: {
              categoryId,
            },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            {
              categories: {
                some: {
                  category: {
                    name: { contains: q, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [totalItems, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: getProductOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          priority: true,
          minPrice: true,
          maxPrice: true,
          createdAt: true,
          defaultPatternId: true,
          defaultColorId: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              images: true,
              cartItems: true,
              productPatterns: true,
              productColors: true,
              renderAssets: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      filters: {
        sort,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = productInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid product input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const validation = await validateConfiguratorInput(input);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const renderAssets = normalizeRenderAssets(input.renderAssets);

  const duplicate = await prisma.product.findFirst({
    where: {
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "A product with this name already exists" },
      { status: 409 }
    );
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          priority: input.priority,
          minPrice: input.minPrice ?? null,
          maxPrice: input.maxPrice ?? null,
          defaultPatternId: input.defaultPatternId ?? null,
          defaultColorId: input.defaultColorId ?? null,
        },
        select: { id: true },
      });

      if (validation.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: validation.categoryIds.map((categoryId) => ({
            productId: created.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.patternIds.length > 0) {
        await tx.productPattern.createMany({
          data: validation.patternIds.map((patternId) => ({
            productId: created.id,
            patternId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.colorIds.length > 0) {
        await tx.productColor.createMany({
          data: validation.colorIds.map((colorId) => ({
            productId: created.id,
            colorId,
          })),
          skipDuplicates: true,
        });
      }

      if (renderAssets.length > 0) {
        await tx.productRenderAsset.createMany({
          data: renderAssets.map((asset) => ({
            productId: created.id,
            viewCode: asset.viewCode,
            baseImageUrl: asset.baseImageUrl,
            maskImageUrl: asset.maskImageUrl,
            shadowImageUrl: asset.shadowImageUrl,
            highlightImageUrl: asset.highlightImageUrl,
            width: asset.width,
            height: asset.height,
            isDefault: asset.isDefault,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          priority: true,
          minPrice: true,
          maxPrice: true,
          defaultPatternId: true,
          defaultColorId: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              productPatterns: true,
              productColors: true,
              renderAssets: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
```

## `app/api/admin/products/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  productInputSchema,
  zodFieldErrors,
} from "@/lib/validators";

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)].filter(Boolean);
}

function normalizeRenderAssets(
  renderAssets: Array<{
    id?: string;
    viewCode: string;
    baseImageUrl: string;
    maskImageUrl: string;
    shadowImageUrl: string;
    highlightImageUrl: string;
    width?: number | null;
    height?: number | null;
    isDefault: boolean;
  }>
) {
  const trimmed = renderAssets.map((asset) => ({
    viewCode: asset.viewCode.trim() || "front",
    baseImageUrl: asset.baseImageUrl.trim(),
    maskImageUrl: asset.maskImageUrl.trim(),
    shadowImageUrl: asset.shadowImageUrl.trim(),
    highlightImageUrl: asset.highlightImageUrl.trim(),
    width: asset.width ?? null,
    height: asset.height ?? null,
    isDefault: Boolean(asset.isDefault),
  }));

  const defaultIndex = trimmed.findIndex((asset) => asset.isDefault);

  return trimmed.map((asset, index) => ({
    ...asset,
    isDefault:
      trimmed.length === 0
        ? false
        : defaultIndex >= 0
          ? index === defaultIndex
          : index === 0,
  }));
}

async function validateConfiguratorInput(input: {
  categoryIds: string[];
  patternIds: string[];
  colorIds: string[];
  defaultPatternId?: string | null;
  defaultColorId?: string | null;
}) {
  const categoryIds = uniqueIds(input.categoryIds);
  const patternIds = uniqueIds(input.patternIds);
  const colorIds = uniqueIds(input.colorIds);

  const [categoryCount, patternCount, colorCount, categoryRules] = await Promise.all([
    categoryIds.length > 0
      ? prisma.category.count({ where: { id: { in: categoryIds } } })
      : Promise.resolve(0),
    patternIds.length > 0
      ? prisma.pattern.count({ where: { id: { in: patternIds } } })
      : Promise.resolve(0),
    colorIds.length > 0
      ? prisma.color.count({ where: { id: { in: colorIds } } })
      : Promise.resolve(0),
    categoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: {
            id: true,
            categoryPatterns: { select: { patternId: true } },
            categoryColors: { select: { colorId: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  if (categoryIds.length > 0 && categoryCount !== categoryIds.length) {
    return { ok: false as const, error: "One or more selected categories do not exist" };
  }

  if (patternIds.length > 0 && patternCount !== patternIds.length) {
    return { ok: false as const, error: "One or more selected patterns do not exist" };
  }

  if (colorIds.length > 0 && colorCount !== colorIds.length) {
    return { ok: false as const, error: "One or more selected colors do not exist" };
  }

  if (input.defaultPatternId && !patternIds.includes(input.defaultPatternId)) {
    return { ok: false as const, error: "Default pattern must be selected from patternIds" };
  }

  if (input.defaultColorId && !colorIds.includes(input.defaultColorId)) {
    return { ok: false as const, error: "Default color must be selected from colorIds" };
  }

  if (categoryIds.length > 0) {
    const allowedPatternIds = new Set<string>();
    const allowedColorIds = new Set<string>();

    categoryRules.forEach((category) => {
      category.categoryPatterns.forEach((item) => allowedPatternIds.add(item.patternId));
      category.categoryColors.forEach((item) => allowedColorIds.add(item.colorId));
    });

    const hasInvalidPattern = patternIds.some((id) => !allowedPatternIds.has(id));
    const hasInvalidColor = colorIds.some((id) => !allowedColorIds.has(id));

    if (hasInvalidPattern) {
      return {
        ok: false as const,
        error: "Selected patterns must belong to the allowed rules of the selected categories",
      };
    }

    if (hasInvalidColor) {
      return {
        ok: false as const,
        error: "Selected colors must belong to the allowed rules of the selected categories",
      };
    }
  }

  return {
    ok: true as const,
    categoryIds,
    patternIds,
    colorIds,
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const id = idParsed.data;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      priority: true,
      minPrice: true,
      maxPrice: true,
      defaultPatternId: true,
      defaultColorId: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      productPatterns: {
        orderBy: { createdAt: "asc" },
        select: {
          patternId: true,
          pattern: {
            select: {
              id: true,
              name: true,
              code: true,
              textureUrl: true,
              defaultScale: true,
              defaultOpacity: true,
              isActive: true,
            },
          },
        },
      },
      productColors: {
        orderBy: { createdAt: "asc" },
        select: {
          colorId: true,
          color: {
            select: {
              id: true,
              name: true,
              code: true,
              hex: true,
              swatchUrl: true,
              isActive: true,
            },
          },
        },
      },
      renderAssets: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          viewCode: true,
          baseImageUrl: true,
          maskImageUrl: true,
          shadowImageUrl: true,
          highlightImageUrl: true,
          width: true,
          height: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      images: {
        orderBy: [{ isRender: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          url: true,
          description: true,
          isRender: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          cartItems: true,
          productPatterns: true,
          productColors: true,
          renderAssets: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const id = idParsed.data;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = productInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid product input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const exists = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const duplicate = await prisma.product.findFirst({
    where: {
      NOT: { id },
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Another product already uses this name" },
      { status: 409 }
    );
  }

  const validation = await validateConfiguratorInput(input);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const renderAssets = normalizeRenderAssets(input.renderAssets);

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          priority: input.priority,
          minPrice: input.minPrice ?? null,
          maxPrice: input.maxPrice ?? null,
          defaultPatternId: input.defaultPatternId ?? null,
          defaultColorId: input.defaultColorId ?? null,
        },
      });

      await tx.productCategory.deleteMany({ where: { productId: id } });
      await tx.productPattern.deleteMany({ where: { productId: id } });
      await tx.productColor.deleteMany({ where: { productId: id } });
      await tx.productRenderAsset.deleteMany({ where: { productId: id } });

      if (validation.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: validation.categoryIds.map((categoryId) => ({
            productId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.patternIds.length > 0) {
        await tx.productPattern.createMany({
          data: validation.patternIds.map((patternId) => ({
            productId: id,
            patternId,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.colorIds.length > 0) {
        await tx.productColor.createMany({
          data: validation.colorIds.map((colorId) => ({
            productId: id,
            colorId,
          })),
          skipDuplicates: true,
        });
      }

      if (renderAssets.length > 0) {
        await tx.productRenderAsset.createMany({
          data: renderAssets.map((asset) => ({
            productId: id,
            viewCode: asset.viewCode,
            baseImageUrl: asset.baseImageUrl,
            maskImageUrl: asset.maskImageUrl,
            shadowImageUrl: asset.shadowImageUrl,
            highlightImageUrl: asset.highlightImageUrl,
            width: asset.width,
            height: asset.height,
            isDefault: asset.isDefault,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          priority: true,
          minPrice: true,
          maxPrice: true,
          defaultPatternId: true,
          defaultColorId: true,
          _count: {
            select: {
              productPatterns: true,
              productColors: true,
              renderAssets: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const id = idParsed.data;

  const exists = await prisma.product.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({ ok: true, softDeleted: true, product });
  } catch {
    return NextResponse.json(
      { error: "Failed to deactivate product" },
      { status: 500 }
    );
  }
}
```

## `app/admin/categories/page.tsx`

```tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { categoryConfiguratorSchema } from "@/lib/validators";
import { CategoryOptionRulesForm } from "@/components/admin/category-option-rules-form";

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  allowedPatternIds: z.array(z.string()).default([]),
  allowedColorIds: z.array(z.string()).default([]),
  _count: z.object({
    products: z.number(),
    categoryPatterns: z.number(),
    categoryColors: z.number(),
  }),
});

const patternSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
});

const colorSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  hex: z.string(),
  isActive: z.boolean(),
});

const listSchema = z.object({
  categories: z.array(categorySchema),
});

const patternsListSchema = z.object({
  patterns: z.array(patternSchema),
});

const colorsListSchema = z.object({
  colors: z.array(colorSchema),
});

type Category = z.infer<typeof categorySchema>;
type Pattern = z.infer<typeof patternSchema>;
type Color = z.infer<typeof colorSchema>;
type FormMode = "create" | "edit";

type CategoryFieldErrors = Partial<
  Record<"name" | "description" | "patternIds" | "colorIds", string>
>;

function getApiErrorMessage(data: any, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;

  const fieldErrors = data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Category[]>([]);
  const [patterns, setPatterns] = React.useState<Pattern[]>([]);
  const [colors, setColors] = React.useState<Color[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [mode, setMode] = React.useState<FormMode>("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [patternIds, setPatternIds] = React.useState<string[]>([]);
  const [colorIds, setColorIds] = React.useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<CategoryFieldErrors>({});

  async function load() {
    const [categoriesRes, patternsRes, colorsRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/patterns"),
      fetch("/api/admin/colors"),
    ]);

    const [categoriesData, patternsData, colorsData] = await Promise.all([
      readJsonSafe(categoriesRes),
      readJsonSafe(patternsRes),
      readJsonSafe(colorsRes),
    ]);

    if (!categoriesRes.ok) {
      throw new Error(getApiErrorMessage(categoriesData, "Không tải được collection"));
    }
    if (!patternsRes.ok) {
      throw new Error(getApiErrorMessage(patternsData, "Không tải được hoa văn"));
    }
    if (!colorsRes.ok) {
      throw new Error(getApiErrorMessage(colorsData, "Không tải được màu sắc"));
    }

    setItems(listSchema.parse(categoriesData).categories);
    setPatterns(patternsListSchema.parse(patternsData).patterns);
    setColors(colorsListSchema.parse(colorsData).colors);
  }

  React.useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => {
        toast({
          title: "Không tải được dữ liệu",
          description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((cat) => {
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(filteredItems.map((x) => x.id));
      return prev.filter((id) => allowed.has(id));
    });
  }, [filteredItems]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setPatternIds([]);
    setColorIds([]);
    setFieldErrors({});
  }

  function startEdit(category: Category) {
    setMode("edit");
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description);
    setIsActive(category.isActive);
    setPatternIds(category.allowedPatternIds);
    setColorIds(category.allowedColorIds);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateCurrentForm() {
    const parsed = categoryConfiguratorSchema.safeParse({
      name: name.trim(),
      description: description.trim(),
      isActive,
      patternIds,
      colorIds,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        description: errors.description?.[0],
        patternIds: errors.patternIds?.[0],
        colorIds: errors.colorIds?.[0],
      });
      return false;
    }

    setFieldErrors({});
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCurrentForm()) return;

    const ok = window.confirm(`Anh có muốn tạo collection mới không?\n\nTên collection: ${name.trim()}`);
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
          patternIds,
          colorIds,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo collection"));
      }

      toast({
        title: "Đã tạo collection",
        description: `${data.category.name} đã được thêm thành công.`,
      });

      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Tạo collection không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!validateCurrentForm()) return;

    const ok = window.confirm(`Anh có muốn lưu thay đổi cho collection này không?\n\nTên collection: ${name.trim()}`);
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
          patternIds,
          colorIds,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật collection"));
      }

      toast({
        title: "Đã lưu thay đổi",
        description: `${data.category.name} đã được cập nhật.`,
      });

      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Lưu không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(category: Category) {
    const nextStatus = !category.isActive;
    const ok = window.confirm(
      nextStatus
        ? `Anh có muốn kích hoạt collection "${category.name}" không?`
        : `Anh có muốn tạm ngưng collection "${category.name}" không?`
    );
    if (!ok) return;

    try {
      setBusy(true);

      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          isActive: nextStatus,
          patternIds: category.allowedPatternIds,
          colorIds: category.allowedColorIds,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể đổi trạng thái collection"));
      }

      toast({
        title: nextStatus ? "Đã kích hoạt collection" : "Đã tạm ngưng collection",
        description: `Trạng thái của "${category.name}" đã được cập nhật.`,
      });

      if (editingId === category.id) {
        setIsActive(nextStatus);
      }

      await load();
    } catch (error) {
      toast({
        title: "Đổi trạng thái không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(category: Category) {
    const ok = window.confirm(
      `Anh có chắc muốn xóa collection "${category.name}" không?\n\nChỉ có thể xóa nếu chưa có sản phẩm nào đang dùng collection này.`
    );
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể xóa collection"));
      }

      toast({
        title: "Đã xóa collection",
        description: `"${category.name}" đã được xóa.`,
      });

      if (editingId === category.id) {
        resetForm();
      }

      await load();
    } catch (error) {
      toast({
        title: "Xóa không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runBulk(action: "activate" | "deactivate") {
    if (selectedIds.length === 0) return;

    const ok = window.confirm(
      action === "activate"
        ? `Anh có muốn kích hoạt ${selectedIds.length} collection đã chọn không?`
        : `Anh có muốn tạm ngưng ${selectedIds.length} collection đã chọn không?`
    );
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch("/api/admin/categories/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const data = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật hàng loạt"));
      }

      toast({
        title:
          action === "activate"
            ? "Đã kích hoạt các collection đã chọn"
            : "Đã tạm ngưng các collection đã chọn",
        description: `${data.updatedCount} collection đã được cập nhật.`,
      });

      setSelectedIds([]);
      await load();
    } catch (error) {
      toast({
        title: "Thao tác hàng loạt không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Quản lý collection"
      description="Danh mục hiện đóng vai trò collection, đồng thời định nghĩa hoa văn và màu sắc được phép."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số collection: <span className="font-semibold">{items.length}</span>
        </div>
      }
    >
      <div className="grid gap-6">
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate}>
          <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {mode === "create" ? "Thêm collection mới" : "Chỉnh sửa collection"}
                </div>
                <p className="mt-1 text-base text-slate-600">
                  Điền thông tin cơ bản và cấu hình quy tắc hoa văn / màu sắc cho collection.
                </p>
              </div>

              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={busy}
                  className="h-11 rounded-xl px-5 text-base"
                >
                  Hủy / Quay lại
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-base font-medium text-slate-800">
                  Tên collection
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ví dụ: Bộ sưu tập men rạn"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="h-12 rounded-xl text-base"
                />
                {fieldErrors.name ? <p className="text-sm text-red-600">{fieldErrors.name}</p> : null}
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-base text-slate-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <span>
                    Collection đang được sử dụng
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      Bỏ chọn nếu anh muốn tạm ngưng collection mà không xóa khỏi hệ thống.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-base font-medium text-slate-800">
                Mô tả collection
              </Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }}
                placeholder="Mô tả ngắn về phong cách, chất liệu hoặc bộ quy tắc của collection"
                className="rounded-xl text-base leading-7"
              />
              {fieldErrors.description ? (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              ) : null}
            </div>
          </Card>

          <div className="mt-6">
            <CategoryOptionRulesForm
              patterns={patterns}
              colors={colors}
              patternIds={patternIds}
              colorIds={colorIds}
              onPatternIdsChange={(ids) => {
                setPatternIds(ids);
                setFieldErrors((prev) => ({ ...prev, patternIds: undefined }));
              }}
              onColorIdsChange={(ids) => {
                setColorIds(ids);
                setFieldErrors((prev) => ({ ...prev, colorIds: undefined }));
              }}
            />
            {fieldErrors.patternIds ? <p className="mt-2 text-sm text-red-600">{fieldErrors.patternIds}</p> : null}
            {fieldErrors.colorIds ? <p className="mt-2 text-sm text-red-600">{fieldErrors.colorIds}</p> : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={busy} className="h-11 rounded-xl px-5 text-base font-semibold">
              {busy
                ? "Đang xử lý..."
                : mode === "create"
                  ? "Tạo collection"
                  : "Lưu thay đổi collection"}
            </Button>
          </div>
        </form>

        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Danh sách collection</div>
              <p className="mt-1 text-base text-slate-600">
                Theo dõi số sản phẩm, số hoa văn và số màu đang được phép trong từng collection.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc mô tả"
                className="h-11 w-full rounded-xl text-base sm:w-[280px]"
              />
              <Button type="button" variant="outline" onClick={() => runBulk("activate")} disabled={busy || selectedIds.length === 0} className="h-11 rounded-xl px-5 text-base">
                Kích hoạt đã chọn
              </Button>
              <Button type="button" variant="outline" onClick={() => runBulk("deactivate")} disabled={busy || selectedIds.length === 0} className="h-11 rounded-xl px-5 text-base">
                Tạm ngưng đã chọn
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Đang tải danh sách collection...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Không có collection nào phù hợp.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((category) => {
                const checked = selectedIds.includes(category.id);
                return (
                  <div key={category.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, category.id]
                                : prev.filter((id) => id !== category.id)
                            );
                          }}
                          className="mt-1 h-5 w-5 rounded border-slate-300"
                        />

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-lg font-semibold text-slate-800">{category.name}</div>
                            <span className={`rounded-full px-3 py-1 text-sm font-medium ${category.isActive ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                              {category.isActive ? "Đang dùng" : "Tạm ngưng"}
                            </span>
                          </div>
                          <p className="mt-2 max-w-4xl text-base leading-7 text-slate-600">
                            {category.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span>Sản phẩm: {category._count.products}</span>
                            <span>Hoa văn cho phép: {category._count.categoryPatterns}</span>
                            <span>Màu cho phép: {category._count.categoryColors}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(category)} disabled={busy} className="h-10 rounded-xl px-4 text-base">
                          Chỉnh sửa
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleToggleActive(category)} disabled={busy} className="h-10 rounded-xl px-4 text-base">
                          {category.isActive ? "Tạm ngưng" : "Kích hoạt"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(category)} disabled={busy || category._count.products > 0} className="h-10 rounded-xl px-4 text-base">
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
```

## `app/api/admin/categories/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  categoryConfiguratorSchema,
  zodFieldErrors,
} from "@/lib/validators";

function uniqueIds(ids: string[]) {
  return [...new Set(ids)].filter(Boolean);
}

function mapCategory(category: any) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    categoryPatterns: category.categoryPatterns,
    categoryColors: category.categoryColors,
    allowedPatternIds: category.categoryPatterns.map((item: any) => item.patternId),
    allowedColorIds: category.categoryColors.map((item: any) => item.colorId),
    _count: category._count,
  };
}

async function validateOptionIds(patternIds: string[], colorIds: string[]) {
  const [patternCount, colorCount] = await Promise.all([
    patternIds.length > 0
      ? prisma.pattern.count({ where: { id: { in: patternIds } } })
      : Promise.resolve(0),
    colorIds.length > 0
      ? prisma.color.count({ where: { id: { in: colorIds } } })
      : Promise.resolve(0),
  ]);

  if (patternIds.length > 0 && patternCount !== patternIds.length) {
    return "One or more selected patterns do not exist";
  }

  if (colorIds.length > 0 && colorCount !== colorIds.length) {
    return "One or more selected colors do not exist";
  }

  return null;
}

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      categoryPatterns: {
        orderBy: { createdAt: "asc" },
        select: {
          patternId: true,
          pattern: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },
        },
      },
      categoryColors: {
        orderBy: { createdAt: "asc" },
        select: {
          colorId: true,
          color: {
            select: {
              id: true,
              name: true,
              code: true,
              hex: true,
              isActive: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
          categoryPatterns: true,
          categoryColors: true,
        },
      },
    },
  });

  return NextResponse.json({ categories: categories.map(mapCategory) });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = categoryConfiguratorSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid category input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const patternIds = uniqueIds(body.patternIds);
  const colorIds = uniqueIds(body.colorIds);

  const [existing, optionError] = await Promise.all([
    prisma.category.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
    validateOptionIds(patternIds, colorIds),
  ]);

  if (existing) {
    return NextResponse.json(
      { error: "Category name already exists" },
      { status: 409 }
    );
  }

  if (optionError) {
    return NextResponse.json({ error: optionError }, { status: 400 });
  }

  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
      select: { id: true },
    });

    if (patternIds.length > 0) {
      await tx.categoryPattern.createMany({
        data: patternIds.map((patternId) => ({
          categoryId: created.id,
          patternId,
        })),
        skipDuplicates: true,
      });
    }

    if (colorIds.length > 0) {
      await tx.categoryColor.createMany({
        data: colorIds.map((colorId) => ({
          categoryId: created.id,
          colorId,
        })),
        skipDuplicates: true,
      });
    }

    const fullCategory = await tx.category.findUnique({
      where: { id: created.id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        categoryPatterns: {
          orderBy: { createdAt: "asc" },
          select: {
            patternId: true,
            pattern: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        },
        categoryColors: {
          orderBy: { createdAt: "asc" },
          select: {
            colorId: true,
            color: {
              select: {
                id: true,
                name: true,
                code: true,
                hex: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            categoryPatterns: true,
            categoryColors: true,
          },
        },
      },
    });

    return fullCategory;
  });

  return NextResponse.json({ ok: true, category: mapCategory(category) });
}
```

## `app/api/admin/categories/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  categoryConfiguratorSchema,
  cuidSchema,
  zodFieldErrors,
} from "@/lib/validators";

function uniqueIds(ids: string[]) {
  return [...new Set(ids)].filter(Boolean);
}

function mapCategory(category: any) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    categoryPatterns: category.categoryPatterns,
    categoryColors: category.categoryColors,
    allowedPatternIds: category.categoryPatterns.map((item: any) => item.patternId),
    allowedColorIds: category.categoryColors.map((item: any) => item.colorId),
    _count: category._count,
  };
}

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

async function validateOptionIds(patternIds: string[], colorIds: string[]) {
  const [patternCount, colorCount] = await Promise.all([
    patternIds.length > 0
      ? prisma.pattern.count({ where: { id: { in: patternIds } } })
      : Promise.resolve(0),
    colorIds.length > 0
      ? prisma.color.count({ where: { id: { in: colorIds } } })
      : Promise.resolve(0),
  ]);

  if (patternIds.length > 0 && patternCount !== patternIds.length) {
    return "One or more selected patterns do not exist";
  }

  if (colorIds.length > 0 && colorCount !== colorIds.length) {
    return "One or more selected colors do not exist";
  }

  return null;
}

async function getCategoryDetail(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      categoryPatterns: {
        orderBy: { createdAt: "asc" },
        select: {
          patternId: true,
          pattern: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },
        },
      },
      categoryColors: {
        orderBy: { createdAt: "asc" },
        select: {
          colorId: true,
          color: {
            select: {
              id: true,
              name: true,
              code: true,
              hex: true,
              isActive: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
          categoryPatterns: true,
          categoryColors: true,
        },
      },
    },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const category = await getCategoryDetail(idParsed.data);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category: mapCategory(category) });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = categoryConfiguratorSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid category input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const patternIds = uniqueIds(body.patternIds);
  const colorIds = uniqueIds(body.colorIds);

  const [existing, duplicate, optionError] = await Promise.all([
    prisma.category.findUnique({
      where: { id: idParsed.data },
      select: { id: true },
    }),
    prisma.category.findFirst({
      where: {
        NOT: { id: idParsed.data },
        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
    validateOptionIds(patternIds, colorIds),
  ]);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (duplicate) {
    return NextResponse.json(
      { error: "Another category already uses this name" },
      { status: 409 }
    );
  }

  if (optionError) {
    return NextResponse.json({ error: optionError }, { status: 400 });
  }

  const category = await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id: idParsed.data },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
    });

    await tx.categoryPattern.deleteMany({
      where: { categoryId: idParsed.data },
    });
    await tx.categoryColor.deleteMany({
      where: { categoryId: idParsed.data },
    });

    if (patternIds.length > 0) {
      await tx.categoryPattern.createMany({
        data: patternIds.map((patternId) => ({
          categoryId: idParsed.data,
          patternId,
        })),
        skipDuplicates: true,
      });
    }

    if (colorIds.length > 0) {
      await tx.categoryColor.createMany({
        data: colorIds.map((colorId) => ({
          categoryId: idParsed.data,
          colorId,
        })),
        skipDuplicates: true,
      });
    }

    return tx.category.findUnique({
      where: { id: idParsed.data },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        categoryPatterns: {
          orderBy: { createdAt: "asc" },
          select: {
            patternId: true,
            pattern: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        },
        categoryColors: {
          orderBy: { createdAt: "asc" },
          select: {
            colorId: true,
            color: {
              select: {
                id: true,
                name: true,
                code: true,
                hex: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            categoryPatterns: true,
            categoryColors: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ ok: true, category: mapCategory(category) });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category._count.products > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete category because it is still used by products",
      },
      { status: 400 }
    );
  }

  await prisma.category.delete({
    where: { id: idParsed.data },
  });

  return NextResponse.json({ ok: true });
}
```

## `components/admin/sidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Newspaper,
  ShoppingCart,
  Heart,
  Palette,
  Shapes,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Collection", icon: Tags },
  { href: "/admin/patterns", label: "Hoa văn", icon: Shapes },
  { href: "/admin/colors", label: "Màu sắc", icon: Palette },
  { href: "/admin/carts", label: "Sản phẩm quan tâm", icon: Heart },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/blogs", label: "Bài viết", icon: Newspaper },
  { href: "/admin/users", label: "Người dùng", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="text-lg font-semibold text-slate-800">Trang quản trị</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">Chọn mục cần quản lý</p>
      </div>

      <nav className="px-3 py-4">
        <div className="mb-3 px-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          Menu chính
        </div>

        <div className="space-y-2">
          {items.map((it) => {
            const active = it.exact
              ? pathname === it.href
              : pathname === it.href || pathname.startsWith(`${it.href}/`);

            const Icon = it.icon;

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-slate-700" : "text-slate-400"
                  )}
                />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
```

## `app/admin/patterns/page.tsx`

```tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { patternInputSchema } from "@/lib/validators";

const patternSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  textureUrl: z.string(),
  defaultScale: z.number(),
  defaultOpacity: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z
    .object({
      productPatterns: z.number(),
      categoryPatterns: z.number(),
      defaultForProducts: z.number(),
    })
    .optional(),
});

const listSchema = z.object({
  patterns: z.array(patternSchema),
});

type Pattern = z.infer<typeof patternSchema>;
type FormMode = "create" | "edit";

type FieldErrors = Partial<
  Record<"name" | "code" | "textureUrl" | "defaultScale" | "defaultOpacity", string>
>;

function getApiErrorMessage(data: any, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;

  const fieldErrors = data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function AdminPatternsPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Pattern[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [mode, setMode] = React.useState<FormMode>("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [textureUrl, setTextureUrl] = React.useState("");
  const [defaultScale, setDefaultScale] = React.useState("1");
  const [defaultOpacity, setDefaultOpacity] = React.useState("1");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  async function load() {
    const res = await fetch("/api/admin/patterns");
    const data = await readJsonSafe(res);
    if (!res.ok) {
      throw new Error(getApiErrorMessage(data, "Không tải được danh sách hoa văn"));
    }
    setItems(listSchema.parse(data).patterns);
  }

  React.useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => {
        toast({
          title: "Không tải được hoa văn",
          description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q));
  }, [items, search]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setName("");
    setCode("");
    setTextureUrl("");
    setDefaultScale("1");
    setDefaultOpacity("1");
    setIsActive(true);
    setErrors({});
  }

  function startEdit(pattern: Pattern) {
    setMode("edit");
    setEditingId(pattern.id);
    setName(pattern.name);
    setCode(pattern.code);
    setTextureUrl(pattern.textureUrl);
    setDefaultScale(String(pattern.defaultScale));
    setDefaultOpacity(String(pattern.defaultOpacity));
    setIsActive(pattern.isActive);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPayload() {
    return {
      name: name.trim(),
      code: code.trim(),
      textureUrl: textureUrl.trim(),
      defaultScale: Number(defaultScale),
      defaultOpacity: Number(defaultOpacity),
      isActive,
    };
  }

  function validateForm() {
    const parsed = patternInputSchema.safeParse(getPayload());
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        code: fieldErrors.code?.[0],
        textureUrl: fieldErrors.textureUrl?.[0],
        defaultScale: fieldErrors.defaultScale?.[0],
        defaultOpacity: fieldErrors.defaultOpacity?.[0],
      });
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setBusy(true);
      const res = await fetch("/api/admin/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo hoa văn"));
      }
      toast({ title: "Đã tạo hoa văn", description: `${data.pattern.name} đã được thêm.` });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Tạo hoa văn không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !validateForm()) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/patterns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật hoa văn"));
      }
      toast({ title: "Đã cập nhật hoa văn", description: `${data.pattern.name} đã được cập nhật.` });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Cập nhật không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(pattern: Pattern) {
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/patterns/${pattern.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pattern.name,
          code: pattern.code,
          textureUrl: pattern.textureUrl,
          defaultScale: pattern.defaultScale,
          defaultOpacity: pattern.defaultOpacity,
          isActive: !pattern.isActive,
        }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể đổi trạng thái hoa văn"));
      }
      await load();
    } catch (error) {
      toast({
        title: "Đổi trạng thái không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(pattern: Pattern) {
    const ok = window.confirm(`Anh có muốn ngừng sử dụng hoa văn "${pattern.name}" không?`);
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/patterns/${pattern.id}`, { method: "DELETE" });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể ngừng sử dụng hoa văn"));
      }
      toast({ title: "Đã ngừng sử dụng hoa văn", description: `${pattern.name} đã được chuyển sang trạng thái tạm ngưng.` });
      if (editingId === pattern.id) resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Thao tác không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Hoa văn"
      description="Quản lý master data hoa văn để tái sử dụng cho collection và sản phẩm."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số hoa văn: <span className="font-semibold">{items.length}</span>
        </div>
      }
    >
      <div className="grid gap-6">
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate}>
          <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {mode === "create" ? "Tạo hoa văn mới" : "Chỉnh sửa hoa văn"}
                </div>
                <p className="mt-1 text-base text-slate-600">
                  Master hoa văn sẽ được dùng lại cho collection và sản phẩm.
                </p>
              </div>
              {mode === "edit" ? (
                <Button type="button" variant="outline" onClick={resetForm} className="h-11 rounded-xl px-5 text-base">
                  Hủy / Quay lại
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Tên hoa văn</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Mã hoa văn</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.code ? <p className="text-sm text-red-600">{errors.code}</p> : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-base font-medium text-slate-800">Texture URL</Label>
              <Input value={textureUrl} onChange={(e) => setTextureUrl(e.target.value)} className="h-12 rounded-xl text-base" />
              {errors.textureUrl ? <p className="text-sm text-red-600">{errors.textureUrl}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Scale mặc định</Label>
                <Input type="number" min="0.01" step="0.01" value={defaultScale} onChange={(e) => setDefaultScale(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.defaultScale ? <p className="text-sm text-red-600">{errors.defaultScale}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Opacity mặc định</Label>
                <Input type="number" min="0" max="1" step="0.01" value={defaultOpacity} onChange={(e) => setDefaultOpacity(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.defaultOpacity ? <p className="text-sm text-red-600">{errors.defaultOpacity}</p> : null}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-base text-slate-800">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300" />
                  <span>Hoa văn đang được sử dụng</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy} className="h-11 rounded-xl px-5 text-base font-semibold">
                {busy ? "Đang xử lý..." : mode === "create" ? "Tạo hoa văn" : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>
        </form>

        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Danh sách hoa văn</div>
              <p className="mt-1 text-base text-slate-600">
                Theo dõi mức độ sử dụng của từng hoa văn trong collection và sản phẩm.
              </p>
            </div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã" className="h-11 w-full rounded-xl text-base sm:w-[280px]" />
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">Đang tải dữ liệu...</div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">Không có hoa văn nào.</div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((pattern) => (
                <div key={pattern.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-slate-800">{pattern.name}</div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{pattern.code}</span>
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${pattern.isActive ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                          {pattern.isActive ? "Đang dùng" : "Tạm ngưng"}
                        </span>
                      </div>
                      <div className="mt-2 break-all text-sm text-slate-500">Texture: {pattern.textureUrl}</div>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>Scale: {pattern.defaultScale}</span>
                        <span>Opacity: {pattern.defaultOpacity}</span>
                        <span>Dùng trong sản phẩm: {pattern._count?.productPatterns ?? 0}</span>
                        <span>Dùng trong collection: {pattern._count?.categoryPatterns ?? 0}</span>
                        <span>Làm mặc định: {pattern._count?.defaultForProducts ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(pattern)} className="h-10 rounded-xl px-4 text-base">Chỉnh sửa</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleToggle(pattern)} className="h-10 rounded-xl px-4 text-base">{pattern.isActive ? "Tạm ngưng" : "Kích hoạt"}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(pattern)} className="h-10 rounded-xl px-4 text-base">Ngừng dùng</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
```

## `app/admin/colors/page.tsx`

```tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { PageShell } from "@/components/admin/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { colorInputSchema } from "@/lib/validators";

const colorSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  hex: z.string(),
  swatchUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z
    .object({
      productColors: z.number(),
      categoryColors: z.number(),
      defaultForProducts: z.number(),
    })
    .optional(),
});

const listSchema = z.object({
  colors: z.array(colorSchema),
});

type Color = z.infer<typeof colorSchema>;
type FormMode = "create" | "edit";

type FieldErrors = Partial<Record<"name" | "code" | "hex" | "swatchUrl", string>>;

function getApiErrorMessage(data: any, fallback: string) {
  if (data?.error && typeof data.error === "string") return data.error;

  const fieldErrors = data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    for (const value of Object.values(fieldErrors)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function AdminColorsPage() {
  const { toast } = useToast();

  const [items, setItems] = React.useState<Color[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [mode, setMode] = React.useState<FormMode>("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [hex, setHex] = React.useState("#000000");
  const [swatchUrl, setSwatchUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  async function load() {
    const res = await fetch("/api/admin/colors");
    const data = await readJsonSafe(res);
    if (!res.ok) {
      throw new Error(getApiErrorMessage(data, "Không tải được danh sách màu"));
    }
    setItems(listSchema.parse(data).colors);
  }

  React.useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => {
        toast({
          title: "Không tải được màu sắc",
          description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.hex.toLowerCase().includes(q));
  }, [items, search]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setName("");
    setCode("");
    setHex("#000000");
    setSwatchUrl("");
    setIsActive(true);
    setErrors({});
  }

  function startEdit(color: Color) {
    setMode("edit");
    setEditingId(color.id);
    setName(color.name);
    setCode(color.code);
    setHex(color.hex);
    setSwatchUrl(color.swatchUrl ?? "");
    setIsActive(color.isActive);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPayload() {
    return {
      name: name.trim(),
      code: code.trim(),
      hex: hex.trim(),
      swatchUrl: swatchUrl.trim() || null,
      isActive,
    };
  }

  function validateForm() {
    const parsed = colorInputSchema.safeParse(getPayload());
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        code: fieldErrors.code?.[0],
        hex: fieldErrors.hex?.[0],
        swatchUrl: fieldErrors.swatchUrl?.[0],
      });
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setBusy(true);
      const res = await fetch("/api/admin/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể tạo màu sắc"));
      }
      toast({ title: "Đã tạo màu sắc", description: `${data.color.name} đã được thêm.` });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Tạo màu sắc không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !validateForm()) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/colors/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật màu sắc"));
      }
      toast({ title: "Đã cập nhật màu sắc", description: `${data.color.name} đã được cập nhật.` });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Cập nhật không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(color: Color) {
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/colors/${color.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: color.name,
          code: color.code,
          hex: color.hex,
          swatchUrl: color.swatchUrl ?? null,
          isActive: !color.isActive,
        }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể đổi trạng thái màu sắc"));
      }
      await load();
    } catch (error) {
      toast({
        title: "Đổi trạng thái không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(color: Color) {
    const ok = window.confirm(`Anh có muốn ngừng sử dụng màu "${color.name}" không?`);
    if (!ok) return;

    try {
      setBusy(true);
      const res = await fetch(`/api/admin/colors/${color.id}`, { method: "DELETE" });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể ngừng sử dụng màu sắc"));
      }
      toast({ title: "Đã ngừng sử dụng màu sắc", description: `${color.name} đã được chuyển sang trạng thái tạm ngưng.` });
      if (editingId === color.id) resetForm();
      await load();
    } catch (error) {
      toast({
        title: "Thao tác không thành công",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      title="Màu sắc"
      description="Quản lý master data màu sắc để tái sử dụng cho collection và sản phẩm."
      right={
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-base text-slate-700">
          Tổng số màu: <span className="font-semibold">{items.length}</span>
        </div>
      }
    >
      <div className="grid gap-6">
        <form onSubmit={mode === "create" ? handleCreate : handleUpdate}>
          <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {mode === "create" ? "Tạo màu mới" : "Chỉnh sửa màu"}
                </div>
                <p className="mt-1 text-base text-slate-600">
                  Master màu sẽ được dùng lại cho collection và sản phẩm.
                </p>
              </div>
              {mode === "edit" ? (
                <Button type="button" variant="outline" onClick={resetForm} className="h-11 rounded-xl px-5 text-base">
                  Hủy / Quay lại
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Tên màu</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Mã màu</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.code ? <p className="text-sm text-red-600">{errors.code}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label className="text-base font-medium text-slate-800">Mã hex</Label>
                <div className="flex gap-3">
                  <Input value={hex} onChange={(e) => setHex(e.target.value)} className="h-12 rounded-xl text-base" />
                  <span className="inline-block h-12 w-12 rounded-xl border border-slate-200" style={{ backgroundColor: hex }} />
                </div>
                {errors.hex ? <p className="text-sm text-red-600">{errors.hex}</p> : null}
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="text-base font-medium text-slate-800">Swatch URL (tùy chọn)</Label>
                <Input value={swatchUrl} onChange={(e) => setSwatchUrl(e.target.value)} className="h-12 rounded-xl text-base" />
                {errors.swatchUrl ? <p className="text-sm text-red-600">{errors.swatchUrl}</p> : null}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-base text-slate-800">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300" />
                <span>Màu sắc đang được sử dụng</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy} className="h-11 rounded-xl px-5 text-base font-semibold">
                {busy ? "Đang xử lý..." : mode === "create" ? "Tạo màu" : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>
        </form>

        <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-800">Danh sách màu sắc</div>
              <p className="mt-1 text-base text-slate-600">
                Theo dõi mức độ sử dụng của từng màu trong collection và sản phẩm.
              </p>
            </div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, mã hoặc hex" className="h-11 w-full rounded-xl text-base sm:w-[280px]" />
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">Đang tải dữ liệu...</div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">Không có màu nào.</div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((color) => (
                <div key={color.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-block h-8 w-8 rounded-full border border-slate-200" style={{ backgroundColor: color.hex }} />
                        <div className="text-lg font-semibold text-slate-800">{color.name}</div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{color.code}</span>
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${color.isActive ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
                          {color.isActive ? "Đang dùng" : "Tạm ngưng"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">Hex: {color.hex}</div>
                      {color.swatchUrl ? <div className="mt-2 break-all text-sm text-slate-500">Swatch: {color.swatchUrl}</div> : null}
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>Dùng trong sản phẩm: {color._count?.productColors ?? 0}</span>
                        <span>Dùng trong collection: {color._count?.categoryColors ?? 0}</span>
                        <span>Làm mặc định: {color._count?.defaultForProducts ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(color)} className="h-10 rounded-xl px-4 text-base">Chỉnh sửa</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleToggle(color)} className="h-10 rounded-xl px-4 text-base">{color.isActive ? "Tạm ngưng" : "Kích hoạt"}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(color)} className="h-10 rounded-xl px-4 text-base">Ngừng dùng</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
```

## `app/api/admin/patterns/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { patternInputSchema, zodFieldErrors } from "@/lib/validators";

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const patterns = await prisma.pattern.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      textureUrl: true,
      defaultScale: true,
      defaultOpacity: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          productPatterns: true,
          categoryPatterns: true,
          defaultForProducts: true,
        },
      },
    },
  });

  return NextResponse.json({ patterns });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = patternInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid pattern input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const normalizedCode = normalizeCode(body.code);

  const duplicate = await prisma.pattern.findFirst({
    where: {
      OR: [
        {
          code: {
            equals: normalizedCode,
            mode: "insensitive",
          },
        },
        {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Pattern name or code already exists" },
      { status: 409 }
    );
  }

  const pattern = await prisma.pattern.create({
    data: {
      name: body.name,
      code: normalizedCode,
      textureUrl: body.textureUrl,
      defaultScale: body.defaultScale,
      defaultOpacity: body.defaultOpacity,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, pattern }, { status: 201 });
}
```

## `app/api/admin/patterns/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  patternInputSchema,
  zodFieldErrors,
} from "@/lib/validators";

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid pattern id" }, { status: 400 });
  }

  const pattern = await prisma.pattern.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      name: true,
      code: true,
      textureUrl: true,
      defaultScale: true,
      defaultOpacity: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          productPatterns: true,
          categoryPatterns: true,
          defaultForProducts: true,
        },
      },
    },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  return NextResponse.json({ pattern });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid pattern id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patternInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid pattern input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const normalizedCode = normalizeCode(body.code);

  const existing = await prisma.pattern.findUnique({
    where: { id: idParsed.data },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const duplicate = await prisma.pattern.findFirst({
    where: {
      NOT: { id: idParsed.data },
      OR: [
        {
          code: {
            equals: normalizedCode,
            mode: "insensitive",
          },
        },
        {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Another pattern already uses this name or code" },
      { status: 409 }
    );
  }

  const pattern = await prisma.pattern.update({
    where: { id: idParsed.data },
    data: {
      name: body.name,
      code: normalizedCode,
      textureUrl: body.textureUrl,
      defaultScale: body.defaultScale,
      defaultOpacity: body.defaultOpacity,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, pattern });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid pattern id" }, { status: 400 });
  }

  const pattern = await prisma.pattern.findUnique({
    where: { id: idParsed.data },
    select: { id: true, isActive: true },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const updated = await prisma.pattern.update({
    where: { id: idParsed.data },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, softDisabled: true, pattern: updated });
}
```

## `app/api/admin/colors/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { colorInputSchema, zodFieldErrors } from "@/lib/validators";

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const colors = await prisma.color.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      hex: true,
      swatchUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          productColors: true,
          categoryColors: true,
          defaultForProducts: true,
        },
      },
    },
  });

  return NextResponse.json({ colors });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = colorInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid color input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const normalizedCode = normalizeCode(body.code);

  const duplicate = await prisma.color.findFirst({
    where: {
      OR: [
        {
          code: {
            equals: normalizedCode,
            mode: "insensitive",
          },
        },
        {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Color name or code already exists" },
      { status: 409 }
    );
  }

  const color = await prisma.color.create({
    data: {
      name: body.name,
      code: normalizedCode,
      hex: body.hex,
      swatchUrl: body.swatchUrl ?? null,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, color }, { status: 201 });
}
```

## `app/api/admin/colors/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  colorInputSchema,
  cuidSchema,
  zodFieldErrors,
} from "@/lib/validators";

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid color id" }, { status: 400 });
  }

  const color = await prisma.color.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      name: true,
      code: true,
      hex: true,
      swatchUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          productColors: true,
          categoryColors: true,
          defaultForProducts: true,
        },
      },
    },
  });

  if (!color) {
    return NextResponse.json({ error: "Color not found" }, { status: 404 });
  }

  return NextResponse.json({ color });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid color id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = colorInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid color input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const normalizedCode = normalizeCode(body.code);

  const existing = await prisma.color.findUnique({
    where: { id: idParsed.data },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Color not found" }, { status: 404 });
  }

  const duplicate = await prisma.color.findFirst({
    where: {
      NOT: { id: idParsed.data },
      OR: [
        {
          code: {
            equals: normalizedCode,
            mode: "insensitive",
          },
        },
        {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Another color already uses this name or code" },
      { status: 409 }
    );
  }

  const color = await prisma.color.update({
    where: { id: idParsed.data },
    data: {
      name: body.name,
      code: normalizedCode,
      hex: body.hex,
      swatchUrl: body.swatchUrl ?? null,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ ok: true, color });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid color id" }, { status: 400 });
  }

  const color = await prisma.color.findUnique({
    where: { id: idParsed.data },
    select: { id: true, isActive: true },
  });

  if (!color) {
    return NextResponse.json({ error: "Color not found" }, { status: 404 });
  }

  const updated = await prisma.color.update({
    where: { id: idParsed.data },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, softDisabled: true, color: updated });
}
```

## `app/api/admin/products/[id]/render-assets/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  renderAssetInputSchema,
  zodFieldErrors,
} from "@/lib/validators";
import { z } from "zod";

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

const updateSchema = renderAssetInputSchema.extend({
  id: cuidSchema,
});

const deleteSchema = z.object({
  id: cuidSchema,
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const idParsed = cuidSchema.safeParse(rawId);

  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const renderAssets = await prisma.productRenderAsset.findMany({
    where: { productId: idParsed.data },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ renderAssets });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawProductId = await getId(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);

  if (!productIdParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = renderAssetInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid render asset input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productIdParsed.data },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currentCount = await prisma.productRenderAsset.count({
    where: { productId: productIdParsed.data },
  });

  const asset = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault || currentCount === 0) {
      await tx.productRenderAsset.updateMany({
        where: { productId: productIdParsed.data },
        data: { isDefault: false },
      });
    }

    return tx.productRenderAsset.create({
      data: {
        productId: productIdParsed.data,
        viewCode: parsed.data.viewCode,
        baseImageUrl: parsed.data.baseImageUrl,
        maskImageUrl: parsed.data.maskImageUrl,
        shadowImageUrl: parsed.data.shadowImageUrl,
        highlightImageUrl: parsed.data.highlightImageUrl,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        isDefault: parsed.data.isDefault || currentCount === 0,
      },
    });
  });

  return NextResponse.json({ ok: true, renderAsset: asset }, { status: 201 });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawProductId = await getId(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);

  if (!productIdParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid render asset input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const existing = await prisma.productRenderAsset.findFirst({
    where: {
      id: parsed.data.id,
      productId: productIdParsed.data,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Render asset not found" }, { status: 404 });
  }

  const asset = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.productRenderAsset.updateMany({
        where: {
          productId: productIdParsed.data,
          NOT: { id: parsed.data.id },
        },
        data: { isDefault: false },
      });
    }

    return tx.productRenderAsset.update({
      where: { id: parsed.data.id },
      data: {
        viewCode: parsed.data.viewCode,
        baseImageUrl: parsed.data.baseImageUrl,
        maskImageUrl: parsed.data.maskImageUrl,
        shadowImageUrl: parsed.data.shadowImageUrl,
        highlightImageUrl: parsed.data.highlightImageUrl,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        isDefault: parsed.data.isDefault,
      },
    });
  });

  return NextResponse.json({ ok: true, renderAsset: asset });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawProductId = await getId(ctx.params);
  const productIdParsed = cuidSchema.safeParse(rawProductId);

  if (!productIdParsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid render asset delete payload",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const existing = await prisma.productRenderAsset.findFirst({
    where: {
      id: parsed.data.id,
      productId: productIdParsed.data,
    },
    select: { id: true, isDefault: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Render asset not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.productRenderAsset.delete({
      where: { id: parsed.data.id },
    });

    if (existing.isDefault) {
      const nextDefault = await tx.productRenderAsset.findFirst({
        where: { productId: productIdParsed.data },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (nextDefault) {
        await tx.productRenderAsset.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
```

## `components/admin/product-render-assets-form.tsx`

```tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RenderAssetValue = {
  id?: string;
  viewCode: string;
  baseImageUrl: string;
  maskImageUrl: string;
  shadowImageUrl: string;
  highlightImageUrl: string;
  width: string;
  height: string;
  isDefault: boolean;
};

type Props = {
  value: RenderAssetValue[];
  onChange: (value: RenderAssetValue[]) => void;
  disabled?: boolean;
};

type UploadField =
  | "baseImageUrl"
  | "maskImageUrl"
  | "shadowImageUrl"
  | "highlightImageUrl";

const FIELD_LABELS: Record<UploadField, string> = {
  baseImageUrl: "Ảnh nền base",
  maskImageUrl: "Ảnh mask",
  shadowImageUrl: "Ảnh shadow",
  highlightImageUrl: "Ảnh highlight",
};

function createEmptyAsset(): RenderAssetValue {
  return {
    viewCode: "front",
    baseImageUrl: "",
    maskImageUrl: "",
    shadowImageUrl: "",
    highlightImageUrl: "",
    width: "",
    height: "",
    isDefault: false,
  };
}

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.error || `Không thể tải tệp lên (${res.status})`
    );
  }

  if (!data?.url || typeof data.url !== "string") {
    throw new Error("API upload không trả về URL hợp lệ.");
  }

  return data.url as string;
}

export function ProductRenderAssetsForm({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);

  function updateAsset(index: number, patch: Partial<RenderAssetValue>) {
    onChange(
      value.map((asset, currentIndex) => {
        if (currentIndex !== index) return asset;
        return { ...asset, ...patch };
      })
    );
  }

  function addAsset() {
    const next = [...value, createEmptyAsset()];
    if (next.length === 1) {
      next[0].isDefault = true;
    }
    onChange(next);
  }

  function removeAsset(index: number) {
    const next = value.filter((_, currentIndex) => currentIndex !== index);
    if (next.length > 0 && !next.some((asset) => asset.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
  }

  function setDefault(index: number) {
    onChange(
      value.map((asset, currentIndex) => ({
        ...asset,
        isDefault: currentIndex === index,
      }))
    );
  }

  async function handleUpload(index: number, field: UploadField, file?: File | null) {
    if (!file) return;

    const key = `${index}:${field}`;
    try {
      setUploadingKey(key);
      const url = await uploadFile(file);
      updateAsset(index, { [field]: url } as Partial<RenderAssetValue>);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải ảnh lên";
      window.alert(message);
    } finally {
      setUploadingKey(null);
    }
  }

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-800">Bộ asset render</div>
          <p className="mt-1 text-base leading-7 text-slate-600">
            Các asset này phục vụ engine render layer-based ở website sau này. Không dùng chung với gallery ảnh sản phẩm.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addAsset}
          disabled={disabled}
          className="h-11 rounded-xl px-5 text-base"
        >
          Thêm asset pack
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Chưa có asset pack nào. Anh có thể thêm nhiều góc nhìn như front, side, top...
        </div>
      ) : null}

      <div className="grid gap-5">
        {value.map((asset, index) => (
          <div key={asset.id ?? `asset-${index}`} className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-800">
                  Asset pack #{index + 1}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Mã view hiện tại: {asset.viewCode || "front"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDefault(index)}
                  disabled={disabled}
                  className="h-10 rounded-xl px-4 text-base"
                >
                  {asset.isDefault ? "Đang là mặc định" : "Đặt mặc định"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeAsset(index)}
                  disabled={disabled}
                  className="h-10 rounded-xl px-4 text-base"
                >
                  Xóa asset pack
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2 md:col-span-2">
                <label className="text-base font-medium text-slate-800">Mã góc nhìn</label>
                <Input
                  value={asset.viewCode}
                  onChange={(e) => updateAsset(index, { viewCode: e.target.value })}
                  placeholder="front"
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={asset.isDefault}
                  onChange={() => setDefault(index)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Asset pack mặc định
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {(
                [
                  "baseImageUrl",
                  "maskImageUrl",
                  "shadowImageUrl",
                  "highlightImageUrl",
                ] as UploadField[]
              ).map((field) => {
                const key = `${index}:${field}`;
                return (
                  <div key={field} className="grid gap-2">
                    <label className="text-base font-medium text-slate-800">
                      {FIELD_LABELS[field]}
                    </label>
                    <Input
                      value={asset[field]}
                      onChange={(e) =>
                        updateAsset(index, { [field]: e.target.value } as Partial<RenderAssetValue>)
                      }
                      placeholder="https://..."
                      className="h-12 rounded-xl text-base"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            void handleUpload(index, field, file);
                            e.currentTarget.value = "";
                          }}
                        />
                        {uploadingKey === key ? "Đang tải..." : `Tải ${FIELD_LABELS[field]}`}
                      </label>
                      {asset[field] ? (
                        <a
                          href={asset[field]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-slate-500 underline"
                        >
                          Mở URL
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-base font-medium text-slate-800">Chiều rộng render</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={asset.width}
                  onChange={(e) => updateAsset(index, { width: e.target.value })}
                  placeholder="1200"
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-base font-medium text-slate-800">Chiều cao render</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={asset.height}
                  onChange={(e) => updateAsset(index, { height: e.target.value })}
                  placeholder="1200"
                  className="h-12 rounded-xl text-base"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

## `components/admin/product-pattern-selector.tsx`

```tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type PatternOption = {
  id: string;
  name: string;
  code: string;
  textureUrl: string;
  defaultScale: number;
  defaultOpacity: number;
  isActive: boolean;
};

type Props = {
  patterns: PatternOption[];
  selectedIds: string[];
  defaultPatternId: string;
  allowedIds?: string[] | null;
  onSelectedIdsChange: (ids: string[]) => void;
  onDefaultPatternIdChange: (id: string) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function ProductPatternSelector({
  patterns,
  selectedIds,
  defaultPatternId,
  allowedIds = null,
  onSelectedIdsChange,
  onDefaultPatternIdChange,
}: Props) {
  const allowedSet = React.useMemo(
    () => (allowedIds ? new Set(allowedIds) : null),
    [allowedIds]
  );

  const visiblePatterns = React.useMemo(() => {
    if (!allowedSet) return patterns;

    const allowed = patterns.filter((pattern) => allowedSet.has(pattern.id));
    const selectedButBlocked = patterns.filter(
      (pattern) => selectedIds.includes(pattern.id) && !allowedSet.has(pattern.id)
    );

    return [...allowed, ...selectedButBlocked];
  }, [patterns, selectedIds, allowedSet]);

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Hoa văn cho sản phẩm</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Chọn các hoa văn khách hàng có thể áp dụng cho dáng chậu này.
        </p>
        {allowedSet ? (
          <p className="mt-2 text-sm leading-6 text-amber-700">
            Danh sách bên dưới đang được giới hạn theo các bộ sưu tập đã chọn.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Chưa giới hạn theo bộ sưu tập, admin có thể chọn từ toàn bộ master data.
          </p>
        )}
      </div>

      {visiblePatterns.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Chưa có hoa văn nào khả dụng.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visiblePatterns.map((pattern) => {
            const isBlocked = allowedSet ? !allowedSet.has(pattern.id) : false;
            const checked = selectedIds.includes(pattern.id);

            return (
              <label
                key={pattern.id}
                className={`rounded-xl border p-4 transition-colors ${
                  checked
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 bg-white"
                } ${isBlocked ? "opacity-70" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isBlocked}
                    onChange={() => {
                      const nextIds = toggleId(selectedIds, pattern.id);
                      onSelectedIdsChange(nextIds);

                      if (checked && defaultPatternId === pattern.id) {
                        onDefaultPatternIdChange("");
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-800">{pattern.name}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {pattern.code}
                      </span>
                      {!pattern.isActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Tạm ngưng master
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Scale mặc định: {pattern.defaultScale} • Opacity mặc định: {pattern.defaultOpacity}
                    </div>
                    <div className="mt-2 break-all text-sm text-slate-500">
                      Texture: {pattern.textureUrl}
                    </div>
                    {checked ? (
                      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="default-pattern"
                          checked={defaultPatternId === pattern.id}
                          onChange={() => onDefaultPatternIdChange(pattern.id)}
                          className="h-4 w-4 border-slate-300"
                        />
                        Chọn làm hoa văn mặc định
                      </label>
                    ) : null}
                    {isBlocked ? (
                      <p className="mt-3 text-sm text-amber-700">
                        Hoa văn này không nằm trong bộ quy tắc của collection đang chọn.
                      </p>
                    ) : null}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Đã chọn <span className="font-semibold">{selectedIds.length}</span> hoa văn.
        {defaultPatternId ? " Đã cấu hình hoa văn mặc định." : " Chưa chọn hoa văn mặc định."}
      </div>
    </Card>
  );
}
```

## `components/admin/product-color-selector.tsx`

```tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type ColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  swatchUrl?: string | null;
  isActive: boolean;
};

type Props = {
  colors: ColorOption[];
  selectedIds: string[];
  defaultColorId: string;
  allowedIds?: string[] | null;
  onSelectedIdsChange: (ids: string[]) => void;
  onDefaultColorIdChange: (id: string) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function ProductColorSelector({
  colors,
  selectedIds,
  defaultColorId,
  allowedIds = null,
  onSelectedIdsChange,
  onDefaultColorIdChange,
}: Props) {
  const allowedSet = React.useMemo(
    () => (allowedIds ? new Set(allowedIds) : null),
    [allowedIds]
  );

  const visibleColors = React.useMemo(() => {
    if (!allowedSet) return colors;

    const allowed = colors.filter((color) => allowedSet.has(color.id));
    const selectedButBlocked = colors.filter(
      (color) => selectedIds.includes(color.id) && !allowedSet.has(color.id)
    );

    return [...allowed, ...selectedButBlocked];
  }, [colors, selectedIds, allowedSet]);

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Màu sắc cho sản phẩm</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Chọn các màu khách hàng có thể áp dụng cho dáng chậu này.
        </p>
        {allowedSet ? (
          <p className="mt-2 text-sm leading-6 text-amber-700">
            Danh sách bên dưới đang được giới hạn theo các bộ sưu tập đã chọn.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Chưa giới hạn theo bộ sưu tập, admin có thể chọn từ toàn bộ master data.
          </p>
        )}
      </div>

      {visibleColors.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Chưa có màu nào khả dụng.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleColors.map((color) => {
            const isBlocked = allowedSet ? !allowedSet.has(color.id) : false;
            const checked = selectedIds.includes(color.id);

            return (
              <label
                key={color.id}
                className={`rounded-xl border p-4 transition-colors ${
                  checked
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 bg-white"
                } ${isBlocked ? "opacity-70" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isBlocked}
                    onChange={() => {
                      const nextIds = toggleId(selectedIds, color.id);
                      onSelectedIdsChange(nextIds);

                      if (checked && defaultColorId === color.id) {
                        onDefaultColorIdChange("");
                      }
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded-full border border-slate-200"
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
                      />
                      <div className="font-medium text-slate-800">{color.name}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {color.code}
                      </span>
                      {!color.isActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Tạm ngưng master
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 text-sm text-slate-500">Hex: {color.hex}</div>
                    {color.swatchUrl ? (
                      <div className="mt-2 break-all text-sm text-slate-500">
                        Swatch: {color.swatchUrl}
                      </div>
                    ) : null}

                    {checked ? (
                      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="default-color"
                          checked={defaultColorId === color.id}
                          onChange={() => onDefaultColorIdChange(color.id)}
                          className="h-4 w-4 border-slate-300"
                        />
                        Chọn làm màu mặc định
                      </label>
                    ) : null}

                    {isBlocked ? (
                      <p className="mt-3 text-sm text-amber-700">
                        Màu này không nằm trong bộ quy tắc của collection đang chọn.
                      </p>
                    ) : null}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Đã chọn <span className="font-semibold">{selectedIds.length}</span> màu.
        {defaultColorId ? " Đã cấu hình màu mặc định." : " Chưa chọn màu mặc định."}
      </div>
    </Card>
  );
}
```

## `components/admin/category-option-rules-form.tsx`

```tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type PatternOption = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

type ColorOption = {
  id: string;
  name: string;
  code: string;
  hex: string;
  isActive: boolean;
};

type Props = {
  patterns: PatternOption[];
  colors: ColorOption[];
  patternIds: string[];
  colorIds: string[];
  onPatternIdsChange: (ids: string[]) => void;
  onColorIdsChange: (ids: string[]) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function CategoryOptionRulesForm({
  patterns,
  colors,
  patternIds,
  colorIds,
  onPatternIdsChange,
  onColorIdsChange,
}: Props) {
  return (
    <Card className="space-y-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Quy tắc tùy chọn theo collection</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Collection quyết định tập hoa văn và màu sắc nào được phép dùng cho các sản phẩm thuộc collection đó.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="text-base font-semibold text-slate-800">Hoa văn được phép</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Chọn các hoa văn hợp lệ cho collection này.
            </p>
          </div>

          {patterns.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Chưa có master hoa văn.
            </div>
          ) : (
            <div className="grid gap-3">
              {patterns.map((pattern) => (
                <label
                  key={pattern.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={patternIds.includes(pattern.id)}
                    onChange={() => onPatternIdsChange(toggleId(patternIds, pattern.id))}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-800">{pattern.name}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {pattern.code}
                      </span>
                      {!pattern.isActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Tạm ngưng master
                        </span>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-base font-semibold text-slate-800">Màu sắc được phép</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Chọn các màu hợp lệ cho collection này.
            </p>
          </div>

          {colors.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
              Chưa có master màu sắc.
            </div>
          ) : (
            <div className="grid gap-3">
              {colors.map((color) => (
                <label
                  key={color.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={colorIds.includes(color.id)}
                    onChange={() => onColorIdsChange(toggleId(colorIds, color.id))}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded-full border border-slate-200"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="font-medium text-slate-800">{color.name}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {color.code}
                      </span>
                      {!color.isActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Tạm ngưng master
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Hex: {color.hex}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

## `components/admin/product-preview-tester.tsx`

```tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

type PatternOption = {
  id: string;
  name: string;
  textureUrl: string;
};

type ColorOption = {
  id: string;
  name: string;
  hex: string;
};

type RenderAsset = {
  id?: string;
  viewCode: string;
  baseImageUrl: string;
  maskImageUrl: string;
  shadowImageUrl: string;
  highlightImageUrl: string;
  isDefault: boolean;
};

type Props = {
  patterns: PatternOption[];
  colors: ColorOption[];
  renderAssets: RenderAsset[];
  defaultPatternId?: string | null;
  defaultColorId?: string | null;
};

export function ProductPreviewTester({
  patterns,
  colors,
  renderAssets,
  defaultPatternId,
  defaultColorId,
}: Props) {
  const [patternId, setPatternId] = React.useState(defaultPatternId || patterns[0]?.id || "");
  const [colorId, setColorId] = React.useState(defaultColorId || colors[0]?.id || "");
  const [assetId, setAssetId] = React.useState(
    renderAssets.find((asset) => asset.isDefault)?.id || renderAssets[0]?.id || ""
  );

  React.useEffect(() => {
    if (!patternId && patterns[0]?.id) {
      setPatternId(defaultPatternId || patterns[0].id);
    }
  }, [patterns, patternId, defaultPatternId]);

  React.useEffect(() => {
    if (!colorId && colors[0]?.id) {
      setColorId(defaultColorId || colors[0].id);
    }
  }, [colors, colorId, defaultColorId]);

  React.useEffect(() => {
    if (!assetId && renderAssets[0]?.id) {
      setAssetId(renderAssets.find((asset) => asset.isDefault)?.id || renderAssets[0].id || "");
    }
  }, [renderAssets, assetId]);

  const selectedPattern = patterns.find((item) => item.id === patternId) || null;
  const selectedColor = colors.find((item) => item.id === colorId) || null;
  const selectedAsset = renderAssets.find((item) => item.id === assetId) || renderAssets[0] || null;

  return (
    <Card className="space-y-5 rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div>
        <div className="text-xl font-semibold text-slate-800">Tester preview nội bộ</div>
        <p className="mt-1 text-base leading-7 text-slate-600">
          Khối này chỉ giúp admin kiểm tra nhanh luồng dữ liệu pattern + color + asset pack. Đây chưa phải engine render hoàn chỉnh.
        </p>
      </div>

      {patterns.length === 0 || colors.length === 0 || renderAssets.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-600">
          Cần có ít nhất 1 hoa văn, 1 màu và 1 asset pack để dùng tester.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-base font-medium text-slate-800">Hoa văn</label>
              <select
                value={patternId}
                onChange={(e) => setPatternId(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              >
                {patterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-base font-medium text-slate-800">Màu sắc</label>
              <select
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              >
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-base font-medium text-slate-800">Asset pack</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"
              >
                {renderAssets.map((asset) => (
                  <option key={asset.id ?? asset.viewCode} value={asset.id}>
                    {asset.viewCode}{asset.isDefault ? " (mặc định)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-base font-semibold text-slate-800">Xem cấu trúc layer</div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {selectedAsset?.baseImageUrl ? (
                  <img
                    src={selectedAsset.baseImageUrl}
                    alt="Base layer"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}
                {selectedPattern?.textureUrl ? (
                  <img
                    src={selectedPattern.textureUrl}
                    alt="Pattern layer"
                    className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-70"
                  />
                ) : null}
                {selectedAsset?.maskImageUrl ? (
                  <img
                    src={selectedAsset.maskImageUrl}
                    alt="Mask layer"
                    className="absolute inset-0 h-full w-full object-contain opacity-80"
                  />
                ) : null}
                {selectedAsset?.shadowImageUrl ? (
                  <img
                    src={selectedAsset.shadowImageUrl}
                    alt="Shadow layer"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}
                {selectedAsset?.highlightImageUrl ? (
                  <img
                    src={selectedAsset.highlightImageUrl}
                    alt="Highlight layer"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}
                {selectedColor ? (
                  <div
                    className="absolute bottom-3 right-3 rounded-full border border-white/80 px-3 py-1 text-sm font-medium text-slate-800 shadow"
                    style={{ backgroundColor: selectedColor.hex }}
                  >
                    {selectedColor.name}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-base font-semibold text-slate-800">Thông tin đang kiểm tra</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Frontend renderer sau này sẽ đọc đúng các URL và metadata này để dựng preview thật.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div><span className="font-medium">Hoa văn:</span> {selectedPattern?.name || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Texture URL:</span> {selectedPattern?.textureUrl || "-"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Màu:</span>
                  <span>{selectedColor?.name || "-"}</span>
                  {selectedColor ? (
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-slate-200"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                  ) : null}
                </div>
                <div className="mt-2"><span className="font-medium">Hex:</span> {selectedColor?.hex || "-"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div><span className="font-medium">View:</span> {selectedAsset?.viewCode || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Base:</span> {selectedAsset?.baseImageUrl || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Mask:</span> {selectedAsset?.maskImageUrl || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Shadow:</span> {selectedAsset?.shadowImageUrl || "-"}</div>
                <div className="mt-2 break-all"><span className="font-medium">Highlight:</span> {selectedAsset?.highlightImageUrl || "-"}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
```

