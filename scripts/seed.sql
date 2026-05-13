-- 头道汤数字化管理系统 - 种子数据
-- 用法: wrangler d1 execute toudaotang-db --file=drizzle/seed.sql --local (本地)
-- 用法: wrangler d1 execute toudaotang-db --file=drizzle/seed.sql --remote (远程)

-- 密码: 123456
-- bcrypt hash: $2b$10$AYQcnzMkBC62/BZii.b08u6C4FktKL3asyzJ2/0DIddYZ3f0eN3bm

-- 1. 门店
INSERT INTO stores (id, name, address, phone, business_hours, created_at, updated_at) VALUES
('store-001', '头道汤旗舰店', '北京市朝阳区建国路88号SOHO现代城A座1层', '010-88886666', '09:00-22:00', datetime('now'), datetime('now'));

-- 2. 员工
INSERT INTO users (id, name, phone, password_hash, role, status, store_id, created_at, updated_at) VALUES
('user-owner', '张老板', '13800000001', '$2b$10$AYQcnzMkBC62/BZii.b08u6C4FktKL3asyzJ2/0DIddYZ3f0eN3bm', 'owner', 'active', 'store-001', datetime('now'), datetime('now')),
('user-manager', '李店长', '13800000002', '$2b$10$AYQcnzMkBC62/BZii.b08u6C4FktKL3asyzJ2/0DIddYZ3f0eN3bm', 'manager', 'active', 'store-001', datetime('now'), datetime('now')),
('user-receptionist', '王小美', '13800000003', '$2b$10$AYQcnzMkBC62/BZii.b08u6C4FktKL3asyzJ2/0DIddYZ3f0eN3bm', 'receptionist', 'active', 'store-001', datetime('now'), datetime('now')),
('user-tech1', '赵师傅', '13800000004', '$2b$10$AYQcnzMkBC62/BZii.b08u6C4FktKL3asyzJ2/0DIddYZ3f0eN3bm', 'technician', 'active', 'store-001', datetime('now'), datetime('now')),
('user-tech2', '孙师傅', '13800000005', '$2b$10$AYQcnzMkBC62/BZii.b08u6C4FktKL3asyzJ2/0DIddYZ3f0eN3bm', 'technician', 'active', 'store-001', datetime('now'), datetime('now'));

-- 3. 服务项目
INSERT INTO services (id, name, price, duration, category, description, status, store_id, created_at, updated_at) VALUES
('svc-001', '头皮理疗', 198, 60, '头部护理', '深层清洁头皮，促进血液循环，缓解头部疲劳', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-002', '头部SPA', 298, 90, '头部护理', '头部深度放松SPA，含精油按摩和热敷', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-003', '肩颈按摩', 168, 60, '身体护理', '专业肩颈按摩，缓解肌肉紧张和酸痛', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-004', '全身精油SPA', 498, 120, '身体护理', '全身精油按摩，深度放松身心', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-005', '头皮深层清洁', 128, 45, '头部护理', '深层清洁头皮污垢和油脂，还原健康头皮', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-006', '养发护理', 358, 90, '头部护理', '专业养发护理，修复受损发质，滋养头皮', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-007', '背部刮痧', 188, 60, '身体护理', '传统刮痧手法，疏通经络，排毒养生', 'active', 'store-001', datetime('now'), datetime('now')),
('svc-008', '足底按摩', 158, 60, '足部护理', '足底穴位按摩，改善睡眠，促进全身循环', 'active', 'store-001', datetime('now'), datetime('now'));

-- 4. 手艺人-项目关联
INSERT INTO staff_services (id, staff_id, service_id) VALUES
('ss-01', 'user-tech1', 'svc-001'),
('ss-02', 'user-tech1', 'svc-002'),
('ss-03', 'user-tech1', 'svc-003'),
('ss-04', 'user-tech1', 'svc-005'),
('ss-05', 'user-tech1', 'svc-006'),
('ss-06', 'user-tech2', 'svc-003'),
('ss-07', 'user-tech2', 'svc-004'),
('ss-08', 'user-tech2', 'svc-006'),
('ss-09', 'user-tech2', 'svc-007'),
('ss-10', 'user-tech2', 'svc-008');

-- 5. 客户
INSERT INTO customers (id, name, phone, gender, balance, store_id, created_at, updated_at) VALUES
('cust-001', '刘女士', '13900000001', '女', 500, 'store-001', datetime('now'), datetime('now')),
('cust-002', '陈先生', '13900000002', '男', 1200, 'store-001', datetime('now'), datetime('now')),
('cust-003', '杨小姐', '13900000003', '女', 300, 'store-001', datetime('now'), datetime('now')),
('cust-004', '黄先生', '13900000004', '男', 0, 'store-001', datetime('now'), datetime('now')),
('cust-005', '周女士', '13900000005', '女', 1800, 'store-001', datetime('now'), datetime('now')),
('cust-006', '吴先生', '13900000006', '男', 200, 'store-001', datetime('now'), datetime('now')),
('cust-007', '郑女士', '13900000007', '女', 950, 'store-001', datetime('now'), datetime('now')),
('cust-008', '冯先生', '13900000008', '男', 0, 'store-001', datetime('now'), datetime('now')),
('cust-009', '蒋女士', '13900000009', '女', 600, 'store-001', datetime('now'), datetime('now')),
('cust-010', '沈先生', '13900000010', '男', 1500, 'store-001', datetime('now'), datetime('now'));

-- 6. 班次模板
INSERT INTO shifts (id, name, start_time, end_time, store_id, created_at) VALUES
('shift-am', '早班', '09:00', '17:00', 'store-001', datetime('now')),
('shift-pm', '晚班', '14:00', '22:00', 'store-001', datetime('now'));
