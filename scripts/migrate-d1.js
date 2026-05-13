// 迁移脚本：将所有 API 路由从 `db` 同步导入改为 `getDb()` 异步调用
const fs = require('fs');
const path = require('path');

const basePath = '/Users/bytedance/Downloads/system';

const apiFiles = [
  'src/app/api/customers/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/staff/route.ts',
  'src/app/api/staff/[id]/route.ts',
  'src/app/api/staff/[id]/services/route.ts',
  'src/app/api/services/route.ts',
  'src/app/api/services/[id]/route.ts',
  'src/app/api/stores/route.ts',
  'src/app/api/shifts/route.ts',
  'src/app/api/shifts/[id]/route.ts',
  'src/app/api/schedules/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/appointments/route.ts',
  'src/app/api/appointments/[id]/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/verification/route.ts',
  'src/app/api/coupons/route.ts',
  'src/app/api/coupons/[id]/route.ts',
  'src/app/api/balance/route.ts',
  'src/app/api/balance/deduct/route.ts',
  'src/app/api/frequency-cards/route.ts',
  'src/app/api/frequency-cards/[id]/route.ts',
  'src/app/api/approvals/route.ts',
  'src/app/api/approvals/[id]/route.ts',
];

let totalUpdated = 0;

for (const file of apiFiles) {
  const filePath = path.join(basePath, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Step 1: Replace import
  content = content.replace(
    'import { db } from "@/lib/db";',
    'import { getDb } from "@/lib/db";'
  );

  // Step 2: Add `const db = await getDb();` after auth check blocks
  // Pattern 1: "未登录" 
  content = content.replace(
    /return NextResponse\.json\(\{ error: "未登录" \}, \{ status: 401 \}\);\n  \}\n/g,
    'return NextResponse.json({ error: "未登录" }, { status: 401 });\n  }\n  const db = await getDb();\n'
  );
  // Pattern 2: "未授权"
  content = content.replace(
    /return NextResponse\.json\(\{ error: "未授权" \}, \{ status: 401 \}\);\n  \}\n/g,
    'return NextResponse.json({ error: "未授权" }, { status: 401 });\n  }\n  const db = await getDb();\n'
  );

  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file}`);
  totalUpdated++;
}

// Handle auth.ts separately
const authPath = path.join(basePath, 'src/lib/auth.ts');
let authContent = fs.readFileSync(authPath, 'utf-8');
authContent = authContent.replace(
  'import { db } from "@/lib/db";',
  'import { getDb } from "@/lib/db";'
);
authContent = authContent.replace(
  'if (!credentials?.phone || !credentials?.password) return null;',
  'if (!credentials?.phone || !credentials?.password) return null;\n\n        const db = await getDb();'
);
fs.writeFileSync(authPath, authContent);
console.log('✅ src/lib/auth.ts');
totalUpdated++;

console.log(`\n🎉 共更新 ${totalUpdated} 个文件`);
