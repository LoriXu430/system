import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { orders, customers, users, commissions } from "@/lib/db/schema";
import { sql, and, gte, lte, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "overview";
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const staffId = searchParams.get("staff_id");

  try {
    if (type === "overview") {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const dayOfWeek = now.getDay() || 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek + 1);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const monthStartStr = todayStr.slice(0, 7) + "-01";

      const [todayData, weekData, monthData, todayOrders, todayCustomers] = await Promise.all([
        db
          .select({ total: sql<number>`coalesce(sum(${orders.actualAmount}), 0)` })
          .from(orders)
          .where(and(
            sql`date(${orders.createdAt}) = ${todayStr}`,
            sql`${orders.status} NOT IN ('cancelled', 'refunded')`
          )),
        db
          .select({ total: sql<number>`coalesce(sum(${orders.actualAmount}), 0)` })
          .from(orders)
          .where(and(
            sql`date(${orders.createdAt}) >= ${weekStartStr}`,
            sql`${orders.status} NOT IN ('cancelled', 'refunded')`
          )),
        db
          .select({ total: sql<number>`coalesce(sum(${orders.actualAmount}), 0)` })
          .from(orders)
          .where(and(
            sql`date(${orders.createdAt}) >= ${monthStartStr}`,
            sql`${orders.status} NOT IN ('cancelled', 'refunded')`
          )),
        db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(
            sql`date(${orders.createdAt}) = ${todayStr}`,
            sql`${orders.status} NOT IN ('cancelled', 'refunded')`
          )),
        db
          .select({ count: sql<number>`count(distinct ${orders.customerId})` })
          .from(orders)
          .where(and(
            sql`date(${orders.createdAt}) = ${todayStr}`,
            sql`${orders.status} NOT IN ('cancelled', 'refunded')`
          )),
      ]);

      return NextResponse.json({
        data: {
          todayRevenue: todayData[0].total,
          weekRevenue: weekData[0].total,
          monthRevenue: monthData[0].total,
          todayOrders: todayOrders[0].count,
          todayCustomers: todayCustomers[0].count,
        },
      });
    }

    if (type === "orders") {
      const conditions = [
        sql`${orders.status} NOT IN ('cancelled', 'refunded')`,
      ];
      if (startDate) conditions.push(sql`date(${orders.createdAt}) >= ${startDate}`);
      if (endDate) conditions.push(sql`date(${orders.createdAt}) <= ${endDate}`);

      const data = await db
        .select({
          date: sql<string>`date(${orders.createdAt})`.as("date"),
          count: sql<number>`count(*)`,
          amount: sql<number>`coalesce(sum(${orders.actualAmount}), 0)`,
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(sql`date(${orders.createdAt})`)
        .orderBy(sql`date(${orders.createdAt})`);

      return NextResponse.json({ data });
    }

    if (type === "channels") {
      const conditions = [
        sql`${orders.status} NOT IN ('cancelled', 'refunded')`,
      ];
      if (startDate) conditions.push(sql`date(${orders.createdAt}) >= ${startDate}`);
      if (endDate) conditions.push(sql`date(${orders.createdAt}) <= ${endDate}`);

      const data = await db
        .select({
          channel: orders.channel,
          count: sql<number>`count(*)`,
          amount: sql<number>`coalesce(sum(${orders.actualAmount}), 0)`,
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(orders.channel);

      return NextResponse.json({ data });
    }

    if (type === "staff") {
      const conditions = [
        sql`${orders.status} NOT IN ('cancelled', 'refunded')`,
      ];
      if (startDate) conditions.push(sql`date(${orders.createdAt}) >= ${startDate}`);
      if (endDate) conditions.push(sql`date(${orders.createdAt}) <= ${endDate}`);
      if (staffId) conditions.push(eq(orders.technicianId, staffId));

      const staffAlias = db
        .select({ id: users.id, name: users.name })
        .from(users)
        .as("staff_alias");

      const data = await db
        .select({
          staffId: orders.technicianId,
          staffName: staffAlias.name,
          count: sql<number>`count(*)`,
          amount: sql<number>`coalesce(sum(${orders.actualAmount}), 0)`,
        })
        .from(orders)
        .leftJoin(staffAlias, eq(orders.technicianId, staffAlias.id))
        .where(and(...conditions, sql`${orders.technicianId} IS NOT NULL`))
        .groupBy(orders.technicianId, staffAlias.name)
        .orderBy(sql`sum(${orders.actualAmount}) DESC`);

      // Get commission totals
      const commData = await db
        .select({
          staffId: commissions.staffId,
          commission: sql<number>`coalesce(sum(${commissions.amount}), 0)`,
        })
        .from(commissions)
        .groupBy(commissions.staffId);

      const commMap = new Map(commData.map((c) => [c.staffId, c.commission]));

      const result = data.map((d) => ({
        ...d,
        commission: commMap.get(d.staffId || "") || 0,
      }));

      return NextResponse.json({ data: result });
    }

    return NextResponse.json({ error: "无效的报表类型" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "查询失败: " + (error?.message || "") }, { status: 500 });
  }
}
