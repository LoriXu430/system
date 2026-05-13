import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq, and, like, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const conditions: SQL[] = [];

  if (category) {
    conditions.push(eq(services.category, category));
  }
  if (status === "active" || status === "inactive") {
    conditions.push(eq(services.status, status));
  }
  if (search) {
    conditions.push(like(services.name, `%${search}%`));
  }

  const result = await db
    .select()
    .from(services)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(services.createdAt);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const { name, price, duration, category, description } = body;

  if (!name || price == null || !duration) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const [created] = await db
    .insert(services)
    .values({
      name,
      price: Number(price),
      duration: Number(duration),
      category: category || null,
      description: description || null,
      storeId: session.user.storeId || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
