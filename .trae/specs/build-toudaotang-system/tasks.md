# Tasks

## Phase 1 - 基础核心

### M1: 项目基础设施
- [x] Task 1: 初始化 Next.js 项目
  - [x] 1.1: 使用 `create-next-app` 创建 Next.js 14+ 项目（App Router, TypeScript, Tailwind CSS）
  - [x] 1.2: 安装并初始化 shadcn/ui 组件库，添加常用组件（Button, Input, Card, Dialog, Table, Tabs, Sheet, DropdownMenu, Select, Badge, Avatar, Form, Toast）
  - [x] 1.3: 配置项目目录结构：`/src/app/(user)`, `/src/app/(staff)`, `/src/app/(admin)`, `/src/app/api`, `/src/lib`, `/src/components`

- [x] Task 2: 数据库设计与初始化
  - [x] 2.1: 安装 Drizzle ORM + better-sqlite3，创建 `drizzle.config.ts`
  - [x] 2.2: 编写完整数据库 Schema（`/src/lib/db/schema.ts`），包含所有 15 张核心表
  - [x] 2.3: 创建数据库连接单例（`/src/lib/db/index.ts`）
  - [x] 2.4: 生成并运行 migration，编写 seed 脚本（`/src/lib/db/seed.ts`）填充示例数据

- [x] Task 3: 认证系统
  - [x] 3.1: 安装 NextAuth.js，配置 Credentials Provider（手机号+密码登录）
  - [x] 3.2: 创建登录页面 `/src/app/login/page.tsx`
  - [x] 3.3: 创建认证 middleware（`/src/middleware.ts`），根据角色保护路由

- [x] Task 4: 三端布局框架
  - [x] 4.1: 创建用户端布局 `/(user)/layout.tsx`（底部 Tab 导航：首页/预约/订单/我的）
  - [x] 4.2: 创建员工端布局 `/(staff)/layout.tsx`（底部 Tab 导航：工作台/订单/核销/我的）
  - [x] 4.3: 创建管理端布局 `/(admin)/layout.tsx`（PC 侧边栏导航 + 移动端抽屉菜单）
  - [x] 4.4: 为每个端创建 placeholder 首页

---

### M2: 门店与员工管理
- [x] Task 5: 门店管理
  - [x] 5.1: 创建门店管理 API（`/api/stores` GET/PUT）
  - [x] 5.2: 创建管理端门店设置页面 `/(admin)/store/page.tsx`（查看和编辑门店信息、下载收款码占位）

- [x] Task 6: 员工管理
  - [x] 6.1: 创建员工管理 API（`/api/staff` CRUD + 启用/禁用）
  - [x] 6.2: 创建管理端员工列表页面 `/(admin)/staff/page.tsx`（列表、搜索、创建、禁用/启用）
  - [x] 6.3: 创建员工详情/编辑页面 `/(admin)/staff/[id]/page.tsx`（基本信息、角色、关联项目）

---

### M3: 服务项目管理
- [x] Task 7: 服务项目 CRUD
  - [x] 7.1: 创建服务项目 API（`/api/services` CRUD + 上下架）
  - [x] 7.2: 创建管理端项目列表页面 `/(admin)/services/page.tsx`（列表、分类筛选、上下架操作）
  - [x] 7.3: 创建项目创建/编辑表单（名称、价格、时长、分类）

- [x] Task 8: 手艺人-项目关联
  - [x] 8.1: 创建关联 API（`/api/staff/[id]/services` GET/POST/DELETE）
  - [x] 8.2: 在员工详情页增加"关联项目"管理（多选项目挂载/取消）

---

### M4: 客户管理
- [x] Task 9: 客户管理
  - [x] 9.1: 创建客户 API（`/api/customers` CRUD + 搜索）
  - [x] 9.2: 创建管理端客户列表页面 `/(admin)/customers/page.tsx`（列表、手机号搜索、添加客户）
  - [x] 9.3: 创建客户详情页 `/(admin)/customers/[id]/page.tsx`（基本信息、余额、次卡列表、优惠券、订单记录 Tab 切换展示）

---

## Phase 2 - 核心业务

### M5: 预约与排班系统
- [x] Task 10: 排班系统
  - [x] 10.1: 创建班次管理 API（`/api/shifts` CRUD）
  - [x] 10.2: 创建排班 API（`/api/schedules` CRUD，按周/月操作）
  - [x] 10.3: 创建管理端班次设置页面 `/(admin)/schedule/shifts/page.tsx`
  - [x] 10.4: 创建管理端排班日历页面 `/(admin)/schedule/page.tsx`（周视图，可拖拽排班）

- [x] Task 11: 预约系统与手艺人面板
  - [x] 11.1: 创建预约 API（`/api/appointments` CRUD，含时间冲突检测）
  - [x] 11.2: 创建管理端手艺人面板 `/(admin)/panel/page.tsx`（时间轴可视化，每列一个手艺人，每行一个时段）
  - [x] 11.3: 创建预约弹窗组件（选择客户/项目/手艺人/时间）
  - [x] 11.4: 创建上下钟 API 和界面按钮（上钟→服务中→自动下钟）

- [x] Task 12: 员工端预约功能
  - [x] 12.1: 员工端工作台首页 `/(staff)/page.tsx`（今日预约列表、待服务/服务中/已完成 Tab）
  - [x] 12.2: 员工端添加预约页面 `/(staff)/appointment/new/page.tsx`
  - [x] 12.3: 员工端上下钟操作界面

- [x] Task 13: 用户端预约功能
  - [x] 13.1: 用户端首页 `/(user)/page.tsx`（门店信息、服务项目展示）
  - [x] 13.2: 用户端预约页面 `/(user)/booking/page.tsx`（选择项目→选手艺人→选时间→确认）
  - [x] 13.3: 用户端订单列表 `/(user)/orders/page.tsx`（我的预约记录）

---

### M6: 订单管理
- [x] Task 14: 订单系统
  - [x] 14.1: 创建统一订单 API（`/api/orders` CRUD + 按类型筛选 + 按渠道筛选）
  - [x] 14.2: 创建管理端订单列表页面 `/(admin)/orders/page.tsx`（Tab 切换：项目订单/次卡订单/充值订单/商品订单）
  - [x] 14.3: 创建订单详情页 `/(admin)/orders/[id]/page.tsx`
  - [x] 14.4: 创建补单功能页面 `/(admin)/orders/supplement/page.tsx`（手动录入：客户、项目、金额、渠道、核销码）
  - [x] 14.5: 创建订单取消/退款 API 和确认弹窗

---

### M7: 卡券系统
- [x] Task 15: 次卡系统
  - [x] 15.1: 创建次卡 API（`/api/frequency-cards` 开单/查询/抵扣/升单/延期）
  - [x] 15.2: 管理端次卡开单页面 `/(admin)/cards/new/page.tsx`（选客户、选项目、设置次数/金额）
  - [x] 15.3: 管理端次卡列表与详情（在客户详情页内展示，支持升单和延期操作）
  - [x] 15.4: 预约下单时支持选择次卡抵扣（修改预约流程，增加卡券选择步骤）

- [x] Task 16: 余额充值系统
  - [x] 16.1: 创建余额 API（`/api/balance` 充值/查询/抵扣）
  - [x] 16.2: 管理端/员工端余额充值页面
  - [x] 16.3: 下单时支持余额抵扣（修改支付流程）

- [x] Task 17: 优惠券系统
  - [x] 17.1: 创建优惠券 API（`/api/coupons` 发放/查询/核销）
  - [x] 17.2: 管理端优惠券管理页面 `/(admin)/coupons/page.tsx`
  - [x] 17.3: 用户端优惠券列表和使用

---

## Phase 3 - 增值功能

### M8: 第三方平台核销
- [x] Task 18: 抖音/美团核销
  - [x] 18.1: 创建核销 API（`/api/verification` 支持抖音/美团券码核销）
  - [x] 18.2: 员工端核销页面 `/(staff)/verify/page.tsx`（输入手机号+券码，选择平台，一键核销生成订单）
  - [x] 18.3: 支持"先核销再完善"模式（核销后可后续补充手艺人、项目等信息）
  - [x] 18.4: 管理端补单页面支持快手/天猫渠道选择

---

### M9: 商品管理
- [x] Task 19: 商品管理
  - [x] 19.1: 创建商品 API（`/api/products` CRUD + 库存管理）
  - [x] 19.2: 管理端商品列表页面 `/(admin)/products/page.tsx`
  - [x] 19.3: 员工端商品开单页面 `/(staff)/products/sell/page.tsx`
  - [x] 19.4: 用户端商品浏览（可选）

---

### M10: 数据报表与审批
- [x] Task 20: 数据报表
  - [x] 20.1: 创建报表 API（`/api/reports` 营收汇总/订单统计/渠道分析/员工业绩）
  - [x] 20.2: 管理端数据中心页面 `/(admin)/reports/page.tsx`（营收概览、订单趋势图、渠道占比）
  - [x] 20.3: 管理端员工业绩页面 `/(admin)/reports/staff/page.tsx`（每人订单数/金额/提成）
  - [x] 20.4: 员工端"我的业绩"页面 `/(staff)/performance/page.tsx`

- [x] Task 21: 审批系统
  - [x] 21.1: 创建审批 API（`/api/approvals` 提交/审批/查询）
  - [x] 21.2: 员工端提交审批（次卡延期、更换手机号）
  - [x] 21.3: 管理端审批列表与处理页面 `/(admin)/approvals/page.tsx`

---

# Task Dependencies
- Task 2 (数据库) 必须先于所有其他功能 Task
- Task 3 (认证) 必须先于 Task 4 (布局)
- Task 4 (布局) 必须先于所有页面开发 Task
- Task 5-6 (门店/员工) 必须先于 Task 8 (手艺人关联)、Task 10 (排班)
- Task 7 (服务项目) 必须先于 Task 8 (手艺人关联)、Task 11 (预约)
- Task 9 (客户) 必须先于 Task 11-14 (预约/订单)
- Task 10 (排班) 必须先于 Task 11 (预约面板)
- Task 11 (预约) 必须先于 Task 12-13 (员工端/用户端预约)
- Task 14 (订单) 必须先于 Task 15-16 (卡券系统)
- Task 15-17 (卡券) 必须先于 Task 18 (第三方核销)
- Task 14 (订单) 必须先于 Task 20 (报表)
- Phase 1 所有任务完成后才能开始 Phase 2
- Phase 2 所有任务完成后才能开始 Phase 3
