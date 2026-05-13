# 头道汤数字化经营管理系统 Spec

## Why
头道汤门店需要一套完整的数字化经营管理系统，覆盖用户预约、员工管理、订单处理、卡券核销、财务报表等核心业务流程。当前需要开发一个供个人使用的全功能版本，采用模块化架构，各模块独立开发、独立测试。

## 技术架构

### 技术栈
- **框架**: Next.js 14+ (App Router, TypeScript)
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite (via better-sqlite3) + Drizzle ORM
- **认证**: NextAuth.js (Credentials Provider, 简单账号密码)
- **设计理念**: 移动端优先 (Mobile-first)，响应式适配 PC 端
- **部署**: 本地开发优先，后续可部署至 Vercel

### 系统架构总览
```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
├──────────┬──────────┬──────────────────────────────────┤
│ /app     │ /app     │ /app                            │
│ /(user)  │ /(staff) │ /(admin)                        │
│ 用户端   │ 员工端    │ 商户PC端(BOSS系统)               │
├──────────┴──────────┴──────────────────────────────────┤
│                   API Routes (/app/api)               │
├───────────────────────────────────────────────────────┤
│              Service Layer (业务逻辑层)                │
├───────────────────────────────────────────────────────┤
│         Drizzle ORM + SQLite (数据持久化层)            │
└───────────────────────────────────────────────────────┘
```

### 三端路由设计
| 端口 | 路由前缀 | 角色 | 说明 |
|------|---------|------|------|
| 用户端 | `/(user)` | 顾客 | 预约服务、购买商品、查看会员权益 |
| 员工端 | `/(staff)` | 手艺人/前台/店长 | 帮用户下单、上下钟、查看业绩 |
| 管理端 | `/(admin)` | 店长/老板 | 全面管理：订单、客户、员工、数据 |

### 数据库核心表设计
| 表名 | 说明 | 核心字段 |
|------|------|---------|
| users | 系统用户(员工) | id, name, phone, role, status |
| customers | 客户 | id, name, phone, balance |
| stores | 门店 | id, name, address |
| services | 服务项目 | id, name, price, duration, category |
| staff_services | 手艺人-项目关联 | staff_id, service_id |
| shifts | 班次模板 | id, name, start_time, end_time |
| schedules | 排班记录 | id, staff_id, shift_id, date |
| appointments | 预约订单 | id, customer_id, service_id, staff_id, status, time |
| orders | 订单(项目/次卡/充值/商品) | id, type, customer_id, amount, channel, status |
| frequency_cards | 次卡 | id, customer_id, service_id, total_times, remaining_times |
| coupons | 优惠券 | id, customer_id, type, value, status |
| products | 商品 | id, name, price, stock |
| service_logs | 服务日志 | id, appointment_id, staff_id, content |
| commissions | 提成记录 | id, staff_id, order_id, amount |
| approvals | 审批记录 | id, type, applicant_id, status |

## What Changes (模块拆分)

系统拆分为 **10 个独立模块**，按依赖关系分为 3 个阶段：

### Phase 1 - 基础核心（M1-M4）
- **M1: 项目基础设施** — 项目初始化、数据库、认证、布局框架
- **M2: 门店与员工管理** — 门店信息、员工CRUD、角色权限
- **M3: 服务项目管理** — 服务项目CRUD、分类管理、手艺人关联
- **M4: 客户管理** — 客户信息CRUD、余额/次卡/优惠券详情查看

### Phase 2 - 核心业务（M5-M7）
- **M5: 预约与排班系统** — 班次设置、员工排班、预约创建/管理、手艺人面板、上下钟
- **M6: 订单管理** — 项目订单/次卡订单/充值订单/商品订单、补单、取消退款
- **M7: 卡券系统** — 次卡(开单/抵扣/升单/延期)、余额充值、优惠券

### Phase 3 - 增值功能（M8-M10）
- **M8: 第三方平台核销** — 抖音/美团订单核销、快手/天猫补单
- **M9: 商品管理** — 商品CRUD、商品订单、库存
- **M10: 数据报表与审批** — 财务报表、员工业绩分成、审批流程

## Impact
- 影响范围: 全新项目，无存量代码
- 部署影响: 本地 SQLite 文件作为数据库，零外部依赖

---

## ADDED Requirements

### M1: 项目基础设施

#### Requirement: 项目初始化
系统 SHALL 基于 Next.js 14+ App Router 创建项目，配置 TypeScript、Tailwind CSS、shadcn/ui 组件库。

#### Requirement: 数据库初始化
系统 SHALL 使用 Drizzle ORM + SQLite 建立数据模型，提供 migration 脚本。

#### Requirement: 认证系统
系统 SHALL 提供基于手机号+密码的登录认证，支持多角色（老板、店长、前台、手艺人、顾客）。

##### Scenario: 员工登录
- **WHEN** 员工输入手机号和密码
- **THEN** 系统验证后根据角色跳转到对应端口

#### Requirement: 布局框架
系统 SHALL 提供三套布局模板：用户端（底部Tab导航）、员工端（底部Tab导航）、管理端（侧边栏导航）。

---

### M2: 门店与员工管理

#### Requirement: 门店信息管理
系统 SHALL 支持门店基本信息的查看和编辑（名称、地址、联系方式）。

#### Requirement: 员工管理
系统 SHALL 支持员工的创建、编辑、上线/禁用操作。

##### Scenario: 创建员工
- **WHEN** 店长填写员工信息（姓名、手机号、角色）
- **THEN** 系统创建员工账号，员工可通过手机号登录

##### Scenario: 禁用员工
- **WHEN** 店长禁用某员工
- **THEN** 该员工无法登录系统，排班和预约不再显示该员工

---

### M3: 服务项目管理

#### Requirement: 项目CRUD
系统 SHALL 支持服务项目的创建、编辑、上下架、删除。每个项目包含名称、价格、时长、分类。

#### Requirement: 手艺人-项目关联
系统 SHALL 支持将服务项目挂载到指定手艺人，手艺人只显示已关联的项目。

##### Scenario: 挂载项目
- **WHEN** 店长将项目A关联到手艺人B
- **THEN** 用户预约时，选择手艺人B可看到项目A

---

### M4: 客户管理

#### Requirement: 客户信息管理
系统 SHALL 支持客户信息的添加、编辑、搜索。客户通过手机号唯一标识。

#### Requirement: 客户详情
系统 SHALL 展示客户的余额、次卡列表、优惠券、历史订单。

##### Scenario: 查看客户详情
- **WHEN** 员工在客户管理中搜索手机号
- **THEN** 系统展示该客户的完整权益信息（余额、次卡、优惠券、订单记录）

---

### M5: 预约与排班系统

#### Requirement: 班次管理
系统 SHALL 支持设置门店班次模板（班次名称、开始时间、结束时间）。

#### Requirement: 员工排班
系统 SHALL 支持按周/月为员工安排班次，排班影响手艺人是否可约。

#### Requirement: 预约管理
系统 SHALL 支持创建、修改、取消预约订单。预约包含客户、服务项目、手艺人、时间。

##### Scenario: 创建预约
- **WHEN** 客户选择服务项目、手艺人、时间
- **THEN** 系统检查手艺人排班和时间冲突，创建预约订单

#### Requirement: 手艺人面板
系统 SHALL 提供可视化的手艺人面板，以时间轴形式展示每位手艺人当天的预约状态。

#### Requirement: 上下钟
系统 SHALL 支持手艺人或前台点击上钟开始服务，服务时间结束后自动下钟。

##### Scenario: 上钟服务
- **WHEN** 手艺人点击上钟
- **THEN** 订单状态变为"服务中"，到达项目时长后自动变为"已完成"

---

### M6: 订单管理

#### Requirement: 多类型订单
系统 SHALL 支持四种订单类型：项目订单、次卡订单、充值订单、商品订单。

#### Requirement: 补单功能
系统 SHALL 支持手动补录订单（用于线下收款或第三方平台已核销的场景）。

#### Requirement: 订单取消与退款
系统 SHALL 支持取消订单并记录退款信息。

##### Scenario: 补单
- **WHEN** 员工选择补单，填写客户手机号、项目、金额、渠道
- **THEN** 系统生成对应订单记录

---

### M7: 卡券系统

#### Requirement: 次卡管理
系统 SHALL 支持次卡的开单（购买）、使用（抵扣次数）、升单（升级）、延期。

##### Scenario: 次卡抵扣
- **WHEN** 客户使用次卡预约服务
- **THEN** 系统扣除1次，订单金额为0，次卡剩余次数减1

#### Requirement: 余额充值
系统 SHALL 支持客户余额充值，充值后可用余额抵扣订单。

#### Requirement: 优惠券
系统 SHALL 支持优惠券的发放和使用。

---

### M8: 第三方平台核销

#### Requirement: 抖音核销
系统 SHALL 支持扫码/输入抖音券码进行核销，自动生成项目订单。

#### Requirement: 美团核销
系统 SHALL 支持扫码/输入美团券码进行核销，自动生成项目订单。

#### Requirement: 快手/天猫补单
系统 SHALL 支持快手/天猫订单通过补单方式录入系统。

##### Scenario: 抖音核销
- **WHEN** 员工输入客户手机号和抖音券码
- **THEN** 系统记录核销信息，生成项目订单，可后续完善手艺人等信息

---

### M9: 商品管理

#### Requirement: 商品CRUD
系统 SHALL 支持商品的创建、编辑、上下架、库存管理。

#### Requirement: 商品订单
系统 SHALL 支持商品的开单销售，支持门店自提。

---

### M10: 数据报表与审批

#### Requirement: 财务报表
系统 SHALL 提供门店营收汇总、订单统计、渠道分析等报表。

#### Requirement: 员工业绩与分成
系统 SHALL 支持按员工查看业绩和提成数据。

#### Requirement: 审批流程
系统 SHALL 支持卡券延期、更换手机号等审批功能。

##### Scenario: 查看员工分成
- **WHEN** 老板查看某员工当月业绩
- **THEN** 系统展示该员工的服务订单数、总金额、提成金额
