import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "use") {
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    });

    if (!coupon) {
      return NextResponse.json({ error: "优惠券不存在" }, { status: 404 });
    }

    if (coupon.status !== "available") {
      return NextResponse.json({ error: "优惠券不可用" }, { status: 400 });
    }

    const [updated] = await db
      .update(coupons)
      .set({ status: "used" })
      .where(eq(coupons.id, id))
      .returning();

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "无效的操作" }, { status: 400 });
}
