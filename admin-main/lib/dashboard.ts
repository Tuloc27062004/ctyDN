import { prisma } from "@/lib/prisma";

// Vietnam timezone is UTC+7 and has no DST.
// We compute business-day boundaries in Vietnam time, then convert back to UTC Date objects for Prisma.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function toVietnamTime(date: Date) {
  return new Date(date.getTime() + VN_OFFSET_MS);
}

function fromVietnamTime(date: Date) {
  return new Date(date.getTime() - VN_OFFSET_MS);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date) {
  const d = toVietnamTime(date);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function startOfToday(base = new Date()) {
  const d = toVietnamTime(base);
  d.setHours(0, 0, 0, 0);
  return fromVietnamTime(d);
}

function startOfWeek(base = new Date()) {
  const d = toVietnamTime(base);
  d.setHours(0, 0, 0, 0);

  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);

  return fromVietnamTime(d);
}

function startOfMonth(base = new Date()) {
  const d = toVietnamTime(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return fromVietnamTime(d);
}

export async function getAdminOverviewData() {
  const trendDays = 14;
  const trendStart = startOfToday();
  trendStart.setDate(trendStart.getDate() - (trendDays - 1));

  const [counts, trendOrders, distinctInterestedUsers, distinctInterestedProducts] =
    await Promise.all([
      Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { status: { in: ["ACCEPTED", "VERIFIED"] } } }),
        prisma.user.count({ where: { isActive: false } }),

        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: false } }),
        prisma.product.count({ where: { images: { none: {} } } }),

        prisma.category.count(),
        prisma.category.count({ where: { isActive: false } }),

        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "IN_PROGRESS" } }),
        prisma.order.count({ where: { status: "DONE" } }),
        prisma.order.count({ where: { status: "CANCELLED" } }),
        prisma.order.count({ where: { createdAt: { gte: startOfWeek() } } }),
        prisma.order.count({
          where: {
            status: "DONE",
            updatedAt: { gte: startOfMonth() },
          },
        }),

        prisma.cartItem.count(),
        prisma.cartItem.count({
          where: {
            createdAt: { gte: startOfWeek() },
          },
        }),
        prisma.cartItem.count({
          where: {
            AND: [{ note: { not: null } }, { note: { not: "" } }],
          },
        }),
      ]),

      prisma.order.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),

      prisma.cartItem.groupBy({
        by: ["userId"],
      }),

      prisma.cartItem.groupBy({
        by: ["productId"],
      }),
    ]);

  const [
    totalUsers,
    pendingUsers,
    acceptedUsers,
    blockedUsers,

    totalProducts,
    activeProducts,
    inactiveProducts,
    productsWithoutImages,

    totalCategories,
    inactiveCategories,

    totalOrders,
    pendingOrders,
    inProgressOrders,
    doneOrders,
    cancelledOrders,
    ordersThisWeek,
    doneOrdersThisMonth,

    totalInterestItems,
    interestThisWeek,
    interestWithNote,
  ] = counts;

  const buckets = new Map<string, number>();
  for (let i = 0; i < trendDays; i++) {
    const d = new Date(trendStart);
    d.setDate(trendStart.getDate() + i);
    buckets.set(dateKey(d), 0);
  }

  for (const order of trendOrders) {
    const key = dateKey(order.createdAt);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const series = Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    users: {
      total: totalUsers,
      pending: pendingUsers,
      accepted: acceptedUsers,
      blocked: blockedUsers,
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: inactiveProducts,
      withoutImages: productsWithoutImages,
    },
    categories: {
      total: totalCategories,
      inactive: inactiveCategories,
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      inProgress: inProgressOrders,
      done: doneOrders,
      cancelled: cancelledOrders,
      thisWeek: ordersThisWeek,
      doneThisMonth: doneOrdersThisMonth,
    },
    interests: {
      totalItems: totalInterestItems,
      users: distinctInterestedUsers.length,
      products: distinctInterestedProducts.length,
      withNote: interestWithNote,
      thisWeek: interestThisWeek,
    },
    series,
  };
}