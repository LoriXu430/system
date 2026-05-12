import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// 确保 data 目录存在
const dbPath = path.join(process.cwd(), 'data', 'toudaotang.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 使用 drizzle-kit push 同步 schema 到数据库
console.log('⏳ 正在同步数据库 schema...');
execSync('npx drizzle-kit push --force', { stdio: 'inherit' });
console.log('✅ Schema 同步完成');

// 创建数据库连接
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log('⏳ 开始填充示例数据...');

  const passwordHash = bcrypt.hashSync('123456', 10);

  // 1. 门店
  const storeId = crypto.randomUUID();
  db.insert(schema.stores).values({
    id: storeId,
    name: '头道汤旗舰店',
    address: '北京市朝阳区建国路88号SOHO现代城A座1层',
    phone: '010-88886666',
    businessHours: '09:00-22:00',
  }).run();
  console.log('  ✅ 门店数据已插入');

  // 2. 员工
  const ownerId = crypto.randomUUID();
  const managerId = crypto.randomUUID();
  const receptionistId = crypto.randomUUID();
  const tech1Id = crypto.randomUUID();
  const tech2Id = crypto.randomUUID();

  db.insert(schema.users).values([
    { id: ownerId, name: '张老板', phone: '13800000001', passwordHash, role: 'owner', status: 'active', storeId },
    { id: managerId, name: '李店长', phone: '13800000002', passwordHash, role: 'manager', status: 'active', storeId },
    { id: receptionistId, name: '王小美', phone: '13800000003', passwordHash, role: 'receptionist', status: 'active', storeId },
    { id: tech1Id, name: '赵师傅', phone: '13800000004', passwordHash, role: 'technician', status: 'active', storeId },
    { id: tech2Id, name: '孙师傅', phone: '13800000005', passwordHash, role: 'technician', status: 'active', storeId },
  ]).run();
  console.log('  ✅ 员工数据已插入');

  // 3. 服务项目
  const serviceData = [
    { name: '头皮理疗', price: 198, duration: 60, category: '头部护理', description: '深层清洁头皮，促进血液循环，缓解头部疲劳' },
    { name: '头部SPA', price: 298, duration: 90, category: '头部护理', description: '头部深度放松SPA，含精油按摩和热敷' },
    { name: '肩颈按摩', price: 168, duration: 60, category: '身体护理', description: '专业肩颈按摩，缓解肌肉紧张和酸痛' },
    { name: '全身精油SPA', price: 498, duration: 120, category: '身体护理', description: '全身精油按摩，深度放松身心' },
    { name: '头皮深层清洁', price: 128, duration: 45, category: '头部护理', description: '深层清洁头皮污垢和油脂，还原健康头皮' },
    { name: '养发护理', price: 358, duration: 90, category: '头部护理', description: '专业养发护理，修复受损发质，滋养头皮' },
    { name: '背部刮痧', price: 188, duration: 60, category: '身体护理', description: '传统刮痧手法，疏通经络，排毒养生' },
    { name: '足底按摩', price: 158, duration: 60, category: '足部护理', description: '足底穴位按摩，改善睡眠，促进全身循环' },
  ];

  const serviceIds: string[] = [];
  for (const s of serviceData) {
    const id = crypto.randomUUID();
    serviceIds.push(id);
    db.insert(schema.services).values({
      id,
      ...s,
      status: 'active',
      storeId,
    }).run();
  }
  console.log('  ✅ 服务项目数据已插入');

  // 4. 手艺人-项目关联（两位手艺人各关联多个项目）
  const tech1Services = [0, 1, 2, 4, 5]; // 赵师傅擅长头部和肩颈
  const tech2Services = [2, 3, 5, 6, 7]; // 孙师傅擅长身体和足部

  for (const idx of tech1Services) {
    db.insert(schema.staffServices).values({
      staffId: tech1Id,
      serviceId: serviceIds[idx],
    }).run();
  }
  for (const idx of tech2Services) {
    db.insert(schema.staffServices).values({
      staffId: tech2Id,
      serviceId: serviceIds[idx],
    }).run();
  }
  console.log('  ✅ 手艺人-项目关联数据已插入');

  // 5. 客户
  const customerNames = [
    { name: '刘女士', phone: '13900000001', gender: '女' },
    { name: '陈先生', phone: '13900000002', gender: '男' },
    { name: '杨小姐', phone: '13900000003', gender: '女' },
    { name: '黄先生', phone: '13900000004', gender: '男' },
    { name: '周女士', phone: '13900000005', gender: '女' },
    { name: '吴先生', phone: '13900000006', gender: '男' },
    { name: '郑女士', phone: '13900000007', gender: '女' },
    { name: '冯先生', phone: '13900000008', gender: '男' },
    { name: '蒋女士', phone: '13900000009', gender: '女' },
    { name: '沈先生', phone: '13900000010', gender: '男' },
    { name: '韩女士', phone: '13900000011', gender: '女' },
    { name: '唐先生', phone: '13900000012', gender: '男' },
    { name: '许小姐', phone: '13900000013', gender: '女' },
    { name: '邓先生', phone: '13900000014', gender: '男' },
    { name: '曹女士', phone: '13900000015', gender: '女' },
  ];

  for (const c of customerNames) {
    db.insert(schema.customers).values({
      ...c,
      balance: Math.floor(Math.random() * 2000),
      storeId,
    }).run();
  }
  console.log('  ✅ 客户数据已插入');

  // 6. 班次模板
  db.insert(schema.shifts).values([
    { name: '早班', startTime: '09:00', endTime: '17:00', storeId },
    { name: '晚班', startTime: '14:00', endTime: '22:00', storeId },
  ]).run();
  console.log('  ✅ 班次模板数据已插入');

  console.log('\n🎉 所有示例数据填充完成！');
}

seed().catch((err) => {
  console.error('❌ Seed 失败:', err);
  process.exit(1);
});
