import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. 门店
export const stores = sqliteTable('stores', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  businessHours: text('business_hours'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 2. 系统用户（员工）
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  phone: text('phone').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['owner', 'manager', 'receptionist', 'technician', 'customer'] }).notNull(),
  status: text('status', { enum: ['active', 'disabled'] }).notNull().default('active'),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 3. 客户
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  phone: text('phone').unique().notNull(),
  gender: text('gender'),
  balance: real('balance').default(0),
  notes: text('notes'),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 4. 服务项目
export const services = sqliteTable('services', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  price: real('price').notNull(),
  duration: integer('duration').notNull(),
  category: text('category'),
  description: text('description'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 5. 手艺人-项目关联
export const staffServices = sqliteTable('staff_services', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  staffId: text('staff_id').notNull().references(() => users.id),
  serviceId: text('service_id').notNull().references(() => services.id),
});

// 6. 班次模板
export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// 7. 排班记录
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  staffId: text('staff_id').notNull().references(() => users.id),
  shiftId: text('shift_id').notNull().references(() => shifts.id),
  date: text('date').notNull(),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// 8. 预约订单
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  staffId: text('staff_id').notNull().references(() => users.id),
  storeId: text('store_id').references(() => stores.id),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'in_service', 'completed', 'cancelled'] }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 9. 订单
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNo: text('order_no').unique().notNull(),
  type: text('type', { enum: ['service', 'frequency_card', 'recharge', 'product'] }).notNull(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  staffId: text('staff_id').references(() => users.id),
  technicianId: text('technician_id').references(() => users.id),
  serviceId: text('service_id').references(() => services.id),
  amount: real('amount').notNull(),
  actualAmount: real('actual_amount').notNull(),
  paymentMethod: text('payment_method', { enum: ['cash', 'wechat', 'alipay', 'balance', 'frequency_card'] }).notNull(),
  channel: text('channel', { enum: ['store', 'douyin', 'meituan', 'kuaishou', 'tmall'] }).notNull().default('store'),
  verificationCode: text('verification_code'),
  status: text('status', { enum: ['pending', 'paid', 'completed', 'cancelled', 'refunded'] }).notNull().default('pending'),
  storeId: text('store_id').references(() => stores.id),
  notes: text('notes'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 10. 次卡
export const frequencyCards = sqliteTable('frequency_cards', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').notNull().references(() => customers.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  name: text('name').notNull(),
  totalTimes: integer('total_times').notNull(),
  remainingTimes: integer('remaining_times').notNull(),
  totalAmount: real('total_amount').notNull(),
  status: text('status', { enum: ['active', 'expired', 'exhausted'] }).notNull().default('active'),
  expireDate: text('expire_date'),
  storeId: text('store_id').references(() => stores.id),
  orderId: text('order_id').references(() => orders.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 11. 优惠券
export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').references(() => customers.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['discount', 'fixed', 'free_service'] }).notNull(),
  value: real('value').notNull(),
  minAmount: real('min_amount'),
  serviceId: text('service_id').references(() => services.id),
  status: text('status', { enum: ['available', 'used', 'expired'] }).notNull().default('available'),
  expireDate: text('expire_date').notNull(),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// 12. 商品
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  category: text('category'),
  description: text('description'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// 13. 服务日志
export const serviceLogs = sqliteTable('service_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  staffId: text('staff_id').notNull().references(() => users.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  content: text('content').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// 14. 提成记录
export const commissions = sqliteTable('commissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  staffId: text('staff_id').notNull().references(() => users.id),
  orderId: text('order_id').notNull().references(() => orders.id),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['service', 'card_sale', 'product_sale', 'recharge'] }).notNull(),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// 15. 审批记录
export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text('type', { enum: ['card_extension', 'phone_change', 'refund'] }).notNull(),
  applicantId: text('applicant_id').notNull().references(() => users.id),
  targetId: text('target_id').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reason: text('reason'),
  reviewerId: text('reviewer_id').references(() => users.id),
  storeId: text('store_id').references(() => stores.id),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
