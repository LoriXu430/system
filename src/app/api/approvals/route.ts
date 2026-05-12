import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvals, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const applicantId = searchParams.get("applicant_id");

  const conditions = [];
  if (status) conditions.push(eq(approvals.status, status as any));
  if (type) conditions.push(eq(approvals.type, type as any));
  if (applicantId) conditions.push(eq(approvals.applicantId, applicantId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const applicant = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .as("applicant");

  const reviewer = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .as("reviewer");

  const data = await db
    .select({
      id: approvals.id,
      type: approvals.type,
      applicantId: approvals.applicantId,
      targetId: approvals.targetId,
      status: approvals.status,
      reason: approvals.reason,
      reviewerId: approvals.reviewerId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
      applicantName: applicant.name,
      reviewerName: reviewer.name,
    })
    .from(approvals)
    .leftJoin(applicant, eq(approvals.applicantId, applicant.id))
    .leftJoin(reviewer, eq(approvals.reviewerId, reviewer.id))
    .where(where)
    .orderBy(desc(approvals.createdAt));

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { type, target_id, reason } = body;

  if (!type || !target_id) {
    return NextResponse.json({ error: "类型和目标 ID 必填" }, { status: 400 });
  }

  try {
    const result = await db
      .insert(approvals)
      .values({
        type,
        applicantId: session.user.id!,
        targetId: target_id,
        reason: reason || null,
        storeId: (session.user as any).storeId || null,
      })
      .returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
