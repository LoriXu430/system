import { execSync } from 'child_process';

// Cloudflare D1 种子数据脚本
// 使用 wrangler d1 execute 执行 SQL 文件

async function seed() {
  const isRemote = process.argv.includes('--remote');
  const target = isRemote ? '--remote' : '--local';

  console.log(`⏳ 正在同步数据库 schema (${isRemote ? '远程' : '本地'})...`);
  execSync(`npx wrangler d1 migrations apply toudaotang-db ${target}`, { stdio: 'inherit' });
  console.log('✅ Schema 同步完成');

  console.log('⏳ 正在填充种子数据...');
  execSync(`npx wrangler d1 execute toudaotang-db ${target} --file=scripts/seed.sql`, { stdio: 'inherit' });
  console.log('🎉 种子数据填充完成！');
}

seed().catch((err) => {
  console.error('❌ Seed 失败:', err);
  process.exit(1);
});
