import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, or, like } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const role = searchParams.get("role");

  const conditions = [eq(users.storeId, session.user.storeId)];

  if (role) {
    conditions.push(eq(users.role, role as typeof users.role.enumValues[number]));
  }

  let results;
  if (search) {
    results = await db
      .select()
      .from(users)
      .where(
        and(
          ...conditions,
          or(
            like(users.name, `%${search}%`),
            like(users.phone, `%${search}%`)
          )
        )
      );
  } else {
    results = await db
      .select()
      .from(users)
      .where(and(...conditions));
  }

  // 排除密码哈希
  const safeResults = results.map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json(safeResults);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, role } = body;

  if (!name || !phone || !role) {
    return NextResponse.json({ error: "姓名、手机号、角色不能为空" }, { status: 400 });
  }

  // 检查手机号是否已存在
  const existing = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  });
  if (existing) {
    return NextResponse.json({ error: "手机号已存在" }, { status: 400 });
  }

  const passwordHash = bcrypt.hashSync("123456", 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      phone,
      role,
      passwordHash,
      storeId: session.user.storeId,
    })
    .returning();

  const { passwordHash: _, ...safeUser } = newUser;
  return NextResponse.json(safeUser, { status: 201 });
}
