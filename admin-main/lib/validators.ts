import { Model3DProvider, Model3DStatus, OrderStatus } from "@prisma/client";
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

function emptyStringToNull(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalUrlString = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .url({ error: "URL must be valid" })
    .nullable()
    .optional(),
);

export const renderAssetInputSchema = z.object({
  id: cuidSchema.optional(),
  viewCode: z
    .string()
    .trim()
    .min(1, { error: "View code is required" })
    .max(80, { error: "View code is too long" }),
  baseImageUrl: z
    .string()
    .trim()
    .min(1, { error: "Base image URL is required" })
    .url({ error: "Base image URL is invalid" }),
  maskImageUrl: z
    .string()
    .trim()
    .min(1, { error: "Mask image URL is required" })
    .url({ error: "Mask image URL is invalid" }),
  shadowImageUrl: z
    .string()
    .trim()
    .min(1, { error: "Shadow image URL is required" })
    .url({ error: "Shadow image URL is invalid" }),
  highlightImageUrl: z
    .string()
    .trim()
    .min(1, { error: "Highlight image URL is required" })
    .url({ error: "Highlight image URL is invalid" }),
  width: z
    .number()
    .int({ error: "Width must be an integer" })
    .positive()
    .nullable()
    .optional(),
  height: z
    .number()
    .int({ error: "Height must be an integer" })
    .positive()
    .nullable()
    .optional(),
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
  });

export const product3DModelInputSchema = z.object({
  id: cuidSchema,
  provider: z.nativeEnum(Model3DProvider),
  status: z.nativeEnum(Model3DStatus),
  sourceImageUrl: z.string().trim().url(),
  sourceImageName: z.string().trim().max(255).nullable().optional(),
  previewImageUrl: optionalUrlString,
  tripoTaskId: z.string().trim().max(255).nullable().optional(),
  modelVersion: z.string().trim().max(120).nullable().optional(),
  faceLimit: z.number().int().positive().nullable().optional(),
  textureEnabled: z.boolean().default(true),
  pbrEnabled: z.boolean().default(true),
  exportUv: z.boolean().default(true),
  orientation: z.string().trim().max(120).nullable().optional(),
  textureAlignment: z.string().trim().max(120).nullable().optional(),
  modelGlbUrl: optionalUrlString,
  baseModelGlbUrl: optionalUrlString,
  pbrModelGlbUrl: optionalUrlString,
  errorMessage: z.string().trim().max(5000).nullable().optional(),
  isDefault: z.boolean().default(false),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
});

export const product3DGenerateRequestSchema = z.object({
  sourceImageUrl: z
    .string()
    .trim()
    .url({ error: "Source image URL is invalid" }),
  sourceImageName: z.string().trim().max(255).nullable().optional(),
  modelVersion: z.string().trim().min(1).max(120).default("P1-20260311"),
  faceLimit: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Face limit is required"
          : "Face limit must be a number",
    })
    .int({ error: "Face limit must be an integer" })
    .positive({ error: "Face limit must be greater than 0" })
    .max(200000, { error: "Face limit is too large" })
    .default(5000),
  textureEnabled: z.boolean().default(true),
  pbrEnabled: z.boolean().default(true),
  exportUv: z.boolean().default(true),
  orientation: z.string().trim().min(1).max(120).default("align_image"),
  textureAlignment: z.string().trim().min(1).max(120).default("geometry"),
});

export const product3DModelSyncRequestSchema = z.object({}).default({});

export const product3DModelDeleteRequestSchema = z.object({}).default({});

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
    .min(1, { error: "Texture image is required" })
    .url({ error: "Texture image URL is invalid" }),
  defaultScale: z
    .number()
    .positive({ error: "Default scale must be greater than 0" })
    .default(1),
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

function normalizeOptionalSelectionId(value?: string | null) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

function buildSelectionKey(input: {
  productId: string;
  patternId?: string | null;
  colorId?: string | null;
  model3dId?: string | null;
}) {
  return [
    input.productId,
    normalizeOptionalSelectionId(input.patternId) ?? "-",
    normalizeOptionalSelectionId(input.colorId) ?? "-",
    normalizeOptionalSelectionId(input.model3dId) ?? "-",
  ].join("::");
}

export const orderItemInputSchema = z.object({
  productId: cuidSchema,
  patternId: cuidSchema.nullable().optional(),
  colorId: cuidSchema.nullable().optional(),
  model3dId: cuidSchema.nullable().optional(),
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
      const key = buildSelectionKey(item);

      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "productId"],
          message:
            "Each product + pattern + color + 3D model combination can only be selected once",
        });
      }

      seen.add(key);
    });
  });

export const cartItemInputSchema = z.object({
  userId: cuidSchema,
  productId: cuidSchema,
  patternId: cuidSchema.nullable().optional(),
  colorId: cuidSchema.nullable().optional(),
  model3dId: cuidSchema.nullable().optional(),
  quantity: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Quantity is required"
          : "Quantity must be a number",
    })
    .int({ error: "Quantity must be an integer" })
    .positive({ error: "Quantity must be at least 1" }),
  note: z
    .string()
    .trim()
    .max(5000, { error: "Note is too long" })
    .nullable()
    .optional(),
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
  patternId: cuidSchema.nullable().optional(),
  colorId: cuidSchema.nullable().optional(),
  model3dId: cuidSchema.nullable().optional(),
});

export const cartItemDeleteSchema = z.object({
  userId: cuidSchema,
  productId: cuidSchema,
  patternId: cuidSchema.nullable().optional(),
  colorId: cuidSchema.nullable().optional(),
  model3dId: cuidSchema.nullable().optional(),
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
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "Slug format is invalid",
    }),

  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().trim().max(50000).nullable().optional(),

  coverImageUrl: optionalUrlString,

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
          BLOG_IMAGE_MAX_SIZE_BYTES / (1024 * 1024),
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
