import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, like, and, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (category) conditions.push(eq(products.category, category));
  if (status) conditions.push(eq(products.status, status as any));
  if (search) conditions.push(like(products.name, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
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
  const { name, price, stock, category, description } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "名称和价格必填" }, { status: 400 });
  }

  try {
    const result = await db
      .insert(products)
      .values({
        name,
        price,
        stock: stock || 0,
        category: category || null,
        description: description || null,
        storeId: (session.user as any).storeId || null,
      })
      .returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
