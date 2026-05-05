import { NextResponse } from "next/server";
import { Role, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  cuidSchema,
  orderInputSchema,
  zodFieldErrors,
} from "@/lib/validators";
import { prepareAdminOrderItems } from "@/lib/admin-order";

async function getId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

const orderDetailSelect = {
  id: true,
  userId: true,
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
      productId: true,
      patternId: true,
      colorId: true,
      quantity: true,
      patternNameSnapshot: true,
      colorNameSnapshot: true,
      previewImageSnapshot: true,
      patternCodeSnapshot: true,
      colorCodeSnapshot: true,
      colorHexSnapshot: true,
      model3dIdSnapshot: true,
      modelPreviewImageSnapshot: true,
      modelGlbUrlSnapshot: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

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
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const id = idParsed.data;

  const order = await prisma.order.findUnique({
    where: { id },
    select: orderDetailSelect,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
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
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const id = idParsed.data;

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

  const exists = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
    const order = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          userId: input.userId,
          status: input.status,
          note: input.note,
        },
      });

      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      await tx.orderItem.createMany({
        data: preparedItems.map((item) => ({
          ...item,
          orderId: id,
        })),
      });

      return tx.order.findUnique({
        where: { id },
        select: orderDetailSelect,
      });
    });

    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json(
      { error: "Failed to update order" },
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
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const id = idParsed.data;

  const exists = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
