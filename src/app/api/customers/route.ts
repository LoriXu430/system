import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { like, or, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  const conditions = search
    ? or(
        like(customers.name, `%${search}%`),
        like(customers.phone, `%${search}%`)
      )
    : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(conditions)
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(conditions),
  ]);

  return NextResponse.json({
    data,
    total: countResult[0].count,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, gender, notes } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "姓名和手机号必填" }, { status: 400 });
  }

  try {
    const result = await db.insert(customers).values({
      name,
      phone,
      gender: gender || null,
      notes: notes || null,
      storeId: (session.user as any).storeId || null,
    }).returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "该手机号已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
