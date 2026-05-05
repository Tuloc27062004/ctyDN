import { NextResponse } from "next/server";
import { Role, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { cuidSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

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

export async function GET(req: Request, ctx: RouteContext) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const rawId = await getId(ctx.params);
  const parsedId = cuidSchema.safeParse(rawId);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const userId = parsedId.data;

  const url = new URL(req.url);
  const productQ = url.searchParams.get("productQ")?.trim() || "";
  const sort = parseCartSort(url.searchParams.get("sort"));
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(url.searchParams.get("pageSize"), 10),
    100
  );

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: Role.USER,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        companyName: true,
        isActive: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where: Prisma.CartItemWhereInput = {
      userId,
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
      user,
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
        productQ,
        sort,
      },
    });
  } catch (error) {
    console.error("Failed to load user cart:", error);
    return NextResponse.json(
      { error: "Failed to load user cart" },
      { status: 500 }
    );
  }
}
