import { NextResponse } from "next/server";
import { OrderStatus, Prisma, Role, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  orderInputSchema,
  zodFieldErrors,
} from "@/lib/validators";
import { prepareAdminOrderItems } from "@/lib/admin-order";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

const ORDER_STATUS_VALUES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.IN_PROGRESS,
  OrderStatus.DONE,
  OrderStatus.CANCELLED,
];

const orderListSelect = {
  id: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      companyName: true,
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      patternNameSnapshot: true,
      colorNameSnapshot: true,
      model3dIdSnapshot: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

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
  const rawStatus = url.searchParams.get("status");

  const status =
    rawStatus && ORDER_STATUS_VALUES.includes(rawStatus as OrderStatus)
      ? (rawStatus as OrderStatus)
      : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { note: { contains: q, mode: "insensitive" } },
            {
              user: {
                fullName: { contains: q, mode: "insensitive" },
              },
            },
            {
              user: {
                email: { contains: q, mode: "insensitive" },
              },
            },
            {
              user: {
                companyName: { contains: q, mode: "insensitive" },
              },
            },
            {
              items: {
                some: {
                  OR: [
                    {
                      product: {
                        name: { contains: q, mode: "insensitive" },
                      },
                    },
                    { patternNameSnapshot: { contains: q, mode: "insensitive" } },
                    { colorNameSnapshot: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [totalItems, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: orderListSelect,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load orders" },
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

  const parsed = orderInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid order input",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      id: input.userId,
      role: Role.USER,
      isActive: true,
      status: {
        in: [UserStatus.ACCEPTED, UserStatus.VERIFIED],
      },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Selected customer does not exist or is not active" },
      { status: 400 }
    );
  }

  let preparedItems;

  try {
    preparedItems = await prepareAdminOrderItems(input.items);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate order items",
      },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        status: input.status,
        note: input.note,
        items: {
          create: preparedItems,
        },
      },
      select: orderListSelect,
    });

    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
