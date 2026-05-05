import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { cuidSchema } from "@/lib/validators";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

type CartSort =
  | "UPDATED_DESC"
  | "UPDATED_ASC"
  | "CREATED_DESC"
  | "CREATED_ASC"
  | "QUANTITY_DESC"
  | "QUANTITY_ASC";

const CART_SORT_VALUES: CartSort[] = [
  "UPDATED_DESC",
  "UPDATED_ASC",
  "CREATED_DESC",
  "CREATED_ASC",
  "QUANTITY_DESC",
  "QUANTITY_ASC",
];

function parseCartSort(value: string | null): CartSort {
  if (value && CART_SORT_VALUES.includes(value as CartSort)) {
    return value as CartSort;
  }
  return "UPDATED_DESC";
}

function getCartOrderBy(sort: CartSort): Prisma.CartItemOrderByWithRelationInput[] {
  switch (sort) {
    case "UPDATED_ASC":
      return [{ updatedAt: "asc" }, { createdAt: "asc" }];
    case "CREATED_DESC":
      return [{ createdAt: "desc" }, { updatedAt: "desc" }];
    case "CREATED_ASC":
      return [{ createdAt: "asc" }, { updatedAt: "asc" }];
    case "QUANTITY_DESC":
      return [{ quantity: "desc" }, { updatedAt: "desc" }];
    case "QUANTITY_ASC":
      return [{ quantity: "asc" }, { updatedAt: "desc" }];
    case "UPDATED_DESC":
    default:
      return [{ updatedAt: "desc" }, { createdAt: "desc" }];
  }
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

  const userQ = url.searchParams.get("userQ")?.trim() || "";
  const productQ = url.searchParams.get("productQ")?.trim() || "";
  const rawUserId = url.searchParams.get("userId")?.trim() || "";
  const sort = parseCartSort(url.searchParams.get("sort"));

  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(url.searchParams.get("pageSize"), 10),
    100
  );

  let userId: string | undefined;

  if (rawUserId) {
    const parsed = cuidSchema.safeParse(rawUserId);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    userId = parsed.data;
  }

  const where: Prisma.CartItemWhereInput = {
    user: {
      role: Role.USER,
      ...(userId ? { id: userId } : {}),
      ...(userQ
        ? {
            OR: [
              { fullName: { contains: userQ, mode: "insensitive" } },
              { email: { contains: userQ, mode: "insensitive" } },
              { companyName: { contains: userQ, mode: "insensitive" } },
              { phone: { contains: userQ, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    ...(productQ
      ? {
          product: {
            name: {
              contains: productQ,
              mode: "insensitive",
            },
          },
        }
      : {}),
  };

  try {
    const [totalItems, cartItems] = await Promise.all([
      prisma.cartItem.count({ where }),
      prisma.cartItem.findMany({
        where,
        orderBy: getCartOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          quantity: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          patternId: true,
          colorId: true,
          model3dId: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
          pattern: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          color: {
            select: {
              id: true,
              name: true,
              code: true,
              hex: true,
            },
          },
          model3d: {
            select: {
              id: true,
              status: true,
              previewImageUrl: true,
              modelGlbUrl: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      cartItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      filters: {
        userId: userId ?? null,
        userQ,
        productQ,
        sort,
      },
    });
  } catch (error) {
    console.error("Failed to load cart items:", error);
    return NextResponse.json(
      { error: "Failed to load cart items" },
      { status: 500 }
    );
  }
}
