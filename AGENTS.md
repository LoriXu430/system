<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 深圳头道汤科技 — 数字化经营管理系统

## 项目概述

头道汤门店数字化管理系统，覆盖用户端（C端）、员工端、管理端（BOSS系统）三端。  
核心场景：预约服务、上下钟、抖音/美团核销、次卡/余额管理、排班、业绩提成、审批流。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 数据库 | Cloudflare D1 (SQLite 兼容) + Drizzle ORM |
| 认证 | NextAuth.js v5 (手机号+密码，多角色) |
| 部署 | Cloudflare Pages + D1 (@opennextjs/cloudflare) |
| 包管理 | npm |

## 目录结构

```
src/
├── app/
│   ├── (admin)/        # 管理端（老板/店长/前台），路径 /admin/*
│   │   ├── layout.tsx   # 侧边栏导航布局
│   │   └── admin/
│   │       ├── page.tsx            # 仪表盘首页
│   │       ├── panel/              # 手艺人面板
│   │       ├── schedule/           # 排班管理
│   │       ├── staff/              # 员工管理
│   │       ├── customers/          # 客户管理
│   │       ├── services/           # 服务项目
│   │       ├── products/           # 商品管理
│   │       ├── orders/             # 订单管理（含补单）
│   │       ├── cards/              # 次卡管理
│   │       ├── coupons/            # 优惠券
│   │       ├── recharge/           # 余额充值
│   │       ├── reports/            # 数据报表
│   │       ├── approvals/          # 审批管理
│   │       └── store/              # 门店设置
│   ├── (staff)/        # 员工端（手艺人/前台），路径 /staff/*
│   │   ├── layout.tsx   # 底部Tab导航布局
│   │   └── staff/
│   │       ├── page.tsx            # 工作台
│   │       ├── appointment/new/    # 帮客户开单
│   │       ├── verify/             # 核销（抖音/美团）
│   │       ├── performance/        # 我的业绩
│   │       ├── products/           # 销售商品
│   │       └── approvals/          # 审批申请
│   ├── (user)/         # 用户端（C端），路径 /user/*
│   │   ├── layout.tsx   # 底部Tab导航布局
│   │   └── user/
│   │       ├── page.tsx            # 首页
│   │       ├── booking/            # 预约服务
│   │       ├── orders/             # 我的订单
│   │       └── profile/            # 个人中心
│   ├── api/            # RESTful API 路由
│   │   ├── auth/                   # NextAuth 认证
│   │   ├── appointments/           # 预约 CRUD
│   │   ├── orders/                 # 订单 CRUD
│   │   ├── staff/                  # 员工管理
│   │   ├── customers/              # 客户管理
│   │   ├── services/               # 服务项目 CRUD
│   │   ├── products/               # 商品 CRUD
│   │   ├── frequency-cards/        # 次卡（抵扣/升单/延期）
│   │   ├── balance/                # 余额充值/抵扣
│   │   ├── coupons/                # 优惠券 CRUD
│   │   ├── verification/           # 抖音/美团核销
│   │   ├── schedules/              # 排班
│   │   ├── shifts/                 # 班次模板
│   │   ├── reports/                # 报表统计
│   │   ├── approvals/              # 审批流
│   │   └── stores/                 # 门店信息
│   ├── login/          # 登录页
│   └── layout.tsx      # 根布局
├── components/
│   └── ui/             # shadcn/ui 组件
├── lib/
│   ├── db/
│   │   ├── schema.ts   # Drizzle 表定义（15张表）
│   │   ├── seed.ts     # 种子数据
│   │   └── index.ts    # 数据库连接
│   ├── auth.ts         # NextAuth 配置
│   ├── auth.config.ts  # Auth providers
│   └── utils.ts        # 工具函数
├── types/
│   └── next-auth.d.ts  # NextAuth 类型扩展
└── middleware.ts        # 认证中间件（按角色路由保护）
```

## 数据模型（15张表）

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| stores | 门店 | name, address, phone, businessHours |
| users | 系统用户（员工） | phone, passwordHash, role(owner/manager/receptionist/technician/customer) |
| customers | 客户 | phone, balance, storeId |
| services | 服务项目 | name, price, duration, category |
| staff_services | 手艺人-项目关联 | staffId, serviceId |
| shifts | 班次模板 | name, startTime, endTime |
| schedules | 排班记录 | staffId, shiftId, date |
| appointments | 预约 | customerId, serviceId, staffId, status(pending/confirmed/in_service/completed/cancelled) |
| orders | 订单 | type(service/frequency_card/recharge/product), paymentMethod, channel(store/douyin/meituan/...) |
| frequency_cards | 次卡 | totalTimes, remainingTimes, status, expireDate |
| coupons | 优惠券 | type(discount/fixed/free_service), value, minAmount |
| products | 商品 | name, price, stock |
| service_logs | 服务日志 | appointmentId, content |
| commissions | 提成记录 | staffId, orderId, amount, type |
| approvals | 审批 | type(card_extension/phone_change/refund), status(pending/approved/rejected) |

## 角色与权限

| 角色 | 可访问端 | 说明 |
|------|----------|------|
| owner (老板) | 管理端 | 全部权限，含报表、审批、提现 |
| manager (店长) | 管理端 | 日常管理，排班、订单、客户 |
| receptionist (前台) | 管理端+员工端 | 开单、核销、客户接待 |
| technician (手艺人) | 员工端 | 查看预约、上下钟、业绩 |
| customer (用户) | 用户端 | 预约、购买次卡、查看订单 |

## 开发指南

### 启动项目（本地开发）

```bash
npm install             # 安装依赖
npm run db:seed        # 初始化本地 D1 数据库 + 种子数据
npm run dev            # 启动本地开发服务器 (http://localhost:3000)
```

### Cloudflare 部署

```bash
npx wrangler login                      # 登录 Cloudflare（首次）
npx wrangler d1 create toudaotang-db    # 创建 D1 数据库
npx wrangler d1 migrations apply toudaotang-db --remote   # 推送 schema
npm run db:seed:remote                  # 填充种子数据到远程
npm run build:worker                    # 构建 Worker 包（输出到 .open-next/）
npx wrangler pages project create toudaotang-system --production-branch main  # 创建 Pages 项目
npx wrangler pages deploy               # 部署到 Cloudflare Pages
npx wrangler pages secret put AUTH_SECRET  # 设置 NextAuth 密钥
```

### 默认测试账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 老板 | 13800000001 | 123456 |
| 店长 | 13800000002 | 123456 |
| 前台 | 13800000003 | 123456 |
| 手艺人 | 13800000004 | 123456 |

### 常用命令

```bash
npm run dev             # 本地开发
npm run build           # Next.js 构建
npm run build:worker    # Cloudflare Worker 构建
npm run preview         # 本地预览 Worker
npm run deploy          # 部署到 Cloudflare Pages
npm run db:generate     # 生成 Drizzle 迁移
npm run db:migrate:local   # 执行本地迁移
npm run db:migrate:remote  # 执行远程迁移
npm run db:seed         # 填充本地种子数据
npm run db:seed:remote  # 填充远程种子数据
npm run db:studio       # 打开 Drizzle Studio
```

## 编码规范

1. **API 路由**：全部放在 `src/app/api/` 下，使用 RESTful 风格，返回 `NextResponse.json()`
2. **页面组件**：使用 `"use client"` 指令，通过 `fetch` 调用 API
3. **数据库操作**：统一使用 Drizzle ORM，不直接写 SQL；每个 handler 中用 `const db = await getDb()` 获取数据库实例
4. **认证**：通过 `getServerSession` 或 middleware 校验，角色判断在 middleware.ts
5. **UI 组件**：优先使用 `src/components/ui/` 中的 shadcn 组件
6. **数据库**：使用 Cloudflare D1，迁移文件在 `drizzle/` 目录，种子数据在 `scripts/seed.sql`

## 部署信息

- **生产地址**：https://toudaotang-system.lorixu100.workers.dev
- **部署方式**：Cloudflare Workers + Assets（`wrangler deploy`）
- **D1 数据库 ID**：dc5f74dc-d296-4c6b-804d-e59b4b933d54
- **Cloudflare 账号 ID**：f2a3d378b5fc31bde8c143eaf88f4549

## 核心业务流程

### 抖音/美团核销流程
1. 核销员输入平台验证码 → 调用 `/api/verification` 
2. 系统创建订单（channel=douyin/meituan）
3. 分配手艺人 → 上钟 → 下钟 → 完成

### 次卡流程
1. 开单：创建 frequency_card + 对应 order
2. 抵扣：每次服务减少 remainingTimes
3. 升单：补差价升级为更高次数的卡
4. 延期：通过审批流延长 expireDate

### 预约→服务流程
1. 用户/前台 创建预约 → status=pending
2. 手艺人确认 → status=confirmed
3. 上钟 → status=in_service
4. 下钟 → status=completed → 创建订单
