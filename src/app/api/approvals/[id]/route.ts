import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvals } from "@/lib/db/schema";
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

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  }

  const existing = await db.query.approvals.findFirst({
    where: eq(approvals.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "审批记录不存在" }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "该审批已处理" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const result = await db
    .update(approvals)
    .set({
      status: newStatus,
      reviewerId: session.user.id!,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(approvals.id, id))
    .returning();

  return NextResponse.json({ data: result[0] });
}
