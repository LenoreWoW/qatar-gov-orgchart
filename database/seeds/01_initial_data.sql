-- Initial seed data for Qatar Government Organization Chart
-- This creates a realistic Qatar Government structure

-- Insert default admin user (password: Admin123!)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, first_name_ar, last_name_ar, national_id, role, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@gov.qa', '$2b$12$LQv3c1yqBwlVHpPjrGrUhOUdGkv5XgUw7RGaKKJlJXc8pNrHK7vVC', 'System', 'Administrator', 'مدير', 'النظام', '12345678901', 'super_admin', 'active');

-- Insert Attributes
INSERT INTO attributes (id, code, name_en, name_ar, description_en, description_ar, type, category, created_by) VALUES
('a1000001-0000-0000-0000-000000000001', 'SEC_CLEARANCE_L1', 'Security Clearance Level 1', 'تصريح أمني مستوى 1', 'Basic security clearance for government employees', 'تصريح أمني أساسي للموظفين الحكوميين', 'security', 'Security', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000002', 'SEC_CLEARANCE_L2', 'Security Clearance Level 2', 'تصريح أمني مستوى 2', 'Intermediate security clearance', 'تصريح أمني متوسط', 'security', 'Security', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000003', 'SEC_CLEARANCE_L3', 'Security Clearance Level 3', 'تصريح أمني مستوى 3', 'High security clearance for sensitive positions', 'تصريح أمني عالي للمناصب الحساسة', 'security', 'Security', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000004', 'BUDGET_AUTHORITY_BASIC', 'Basic Budget Authority', 'صلاحية ميزانية أساسية', 'Authority to approve basic budget items', 'صلاحية للموافقة على بنود الميزانية الأساسية', 'financial', 'Budget', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000005', 'BUDGET_AUTHORITY_ADVANCED', 'Advanced Budget Authority', 'صلاحية ميزانية متقدمة', 'Authority to approve significant budget allocations', 'صلاحية للموافقة على تخصيصات الميزانية الكبيرة', 'financial', 'Budget', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000006', 'PROCUREMENT_AUTHORITY', 'Procurement Authority', 'صلاحية المشتريات', 'Authority to approve procurement decisions', 'صلاحية للموافقة على قرارات المشتريات', 'financial', 'Procurement', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000007', 'SIGNING_AUTHORITY_BASIC', 'Basic Signing Authority', 'صلاحية توقيع أساسية', 'Authority to sign basic documents', 'صلاحية لتوقيع الوثائق الأساسية', 'administrative', 'Documentation', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000008', 'SIGNING_AUTHORITY_EXECUTIVE', 'Executive Signing Authority', 'صلاحية توقيع تنفيذية', 'Authority to sign executive level documents', 'صلاحية لتوقيع الوثائق التنفيذية', 'administrative', 'Documentation', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000009', 'HR_AUTHORITY', 'HR Management Authority', 'صلاحية إدارة الموارد البشرية', 'Authority to make HR decisions', 'صلاحية لاتخاذ قرارات الموارد البشرية', 'administrative', 'Human Resources', '550e8400-e29b-41d4-a716-446655440000'),
('a1000001-0000-0000-0000-000000000010', 'TECH_ADMIN', 'Technical Administration', 'إدارة تقنية', 'Technical system administration privileges', 'صلاحيات إدارة النظم التقنية', 'technical', 'IT Systems', '550e8400-e29b-41d4-a716-446655440000');

-- Insert Ministries
INSERT INTO ministries (id, code, name_en, name_ar, description_en, description_ar, created_by) VALUES
('m1000001-0000-0000-0000-000000000001', 'MOI', 'Ministry of Interior', 'وزارة الداخلية', 'Responsible for internal security and public safety', 'مسؤولة عن الأمن الداخلي والسلامة العامة', '550e8400-e29b-41d4-a716-446655440000'),
('m1000001-0000-0000-0000-000000000002', 'MOF', 'Ministry of Finance', 'وزارة المالية', 'Manages government finances and economic policy', 'تدير الأموال الحكومية والسياسة الاقتصادية', '550e8400-e29b-41d4-a716-446655440000'),
('m1000001-0000-0000-0000-000000000003', 'MOE', 'Ministry of Education and Higher Education', 'وزارة التعليم والتعليم العالي', 'Oversees education system from primary to university level', 'تشرف على نظام التعليم من المرحلة الابتدائية إلى الجامعية', '550e8400-e29b-41d4-a716-446655440000'),
('m1000001-0000-0000-0000-000000000004', 'MOH', 'Ministry of Public Health', 'وزارة الصحة العامة', 'Responsible for public health services and policies', 'مسؤولة عن خدمات وسياسات الصحة العامة', '550e8400-e29b-41d4-a716-446655440000'),
('m1000001-0000-0000-0000-000000000005', 'MOFA', 'Ministry of Foreign Affairs', 'وزارة الخارجية', 'Manages diplomatic relations and foreign policy', 'تدير العلاقات الدبلوماسية والسياسة الخارجية', '550e8400-e29b-41d4-a716-446655440000');

-- Insert Prime Minister Position
INSERT INTO positions (id, ministry_id, code, title_en, title_ar, description_en, description_ar, government_grade, status, max_attributes, is_management_position, level, created_by) VALUES
('p0000001-0000-0000-0000-000000000001', 'm1000001-0000-0000-0000-000000000001', 'PM-001', 'Prime Minister', 'رئيس مجلس الوزراء', 'Head of Government', 'رئيس الحكومة', 20, 'active', 10, TRUE, 0, '550e8400-e29b-41d4-a716-446655440000');

-- Insert Minister Positions
INSERT INTO positions (id, ministry_id, code, title_en, title_ar, description_en, description_ar, government_grade, status, max_attributes, is_management_position, level, parent_position_id, created_by) VALUES
('p1000001-0000-0000-0000-000000000001', 'm1000001-0000-0000-0000-000000000001', 'MIN-MOI-001', 'Minister of Interior', 'وزير الداخلية', 'Head of Ministry of Interior', 'رئيس وزارة الداخلية', 19, 'active', 8, TRUE, 1, 'p0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000002', 'm1000001-0000-0000-0000-000000000002', 'MIN-MOF-001', 'Minister of Finance', 'وزير المالية', 'Head of Ministry of Finance', 'رئيس وزارة المالية', 19, 'active', 8, TRUE, 1, 'p0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000003', 'm1000001-0000-0000-0000-000000000003', 'MIN-MOE-001', 'Minister of Education and Higher Education', 'وزير التعليم والتعليم العالي', 'Head of Ministry of Education', 'رئيس وزارة التعليم', 19, 'active', 8, TRUE, 1, 'p0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000004', 'm1000001-0000-0000-0000-000000000004', 'MIN-MOH-001', 'Minister of Public Health', 'وزير الصحة العامة', 'Head of Ministry of Public Health', 'رئيس وزارة الصحة العامة', 19, 'active', 8, TRUE, 1, 'p0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000005', 'm1000001-0000-0000-0000-000000000005', 'MIN-MOFA-001', 'Minister of Foreign Affairs', 'وزير الخارجية', 'Head of Ministry of Foreign Affairs', 'رئيس وزارة الخارجية', 19, 'active', 8, TRUE, 1, 'p0000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000');

-- Insert Departments for Ministry of Interior
INSERT INTO departments (id, ministry_id, code, name_en, name_ar, description_en, description_ar, level, created_by) VALUES
('d1000001-0000-0000-0000-000000000001', 'm1000001-0000-0000-0000-000000000001', 'MOI-POLICE', 'Police Department', 'إدارة الشرطة', 'Law enforcement and public safety', 'إنفاذ القانون والسلامة العامة', 1, '550e8400-e29b-41d4-a716-446655440000'),
('d1000001-0000-0000-0000-000000000002', 'm1000001-0000-0000-0000-000000000001', 'MOI-IMMIGRATION', 'Immigration Department', 'إدارة الهجرة', 'Immigration and border control', 'الهجرة ومراقبة الحدود', 1, '550e8400-e29b-41d4-a716-446655440000'),
('d1000001-0000-0000-0000-000000000003', 'm1000001-0000-0000-0000-000000000001', 'MOI-CIVIL-DEFENSE', 'Civil Defense Department', 'إدارة الدفاع المدني', 'Emergency response and civil defense', 'الاستجابة للطوارئ والدفاع المدني', 1, '550e8400-e29b-41d4-a716-446655440000');

-- Insert Departments for Ministry of Finance
INSERT INTO departments (id, ministry_id, code, name_en, name_ar, description_en, description_ar, level, created_by) VALUES
('d1000001-0000-0000-0000-000000000004', 'm1000001-0000-0000-0000-000000000002', 'MOF-BUDGET', 'Budget Department', 'إدارة الميزانية', 'Government budget planning and control', 'تخطيط ومراقبة الميزانية الحكومية', 1, '550e8400-e29b-41d4-a716-446655440000'),
('d1000001-0000-0000-0000-000000000005', 'm1000001-0000-0000-0000-000000000002', 'MOF-TREASURY', 'Treasury Department', 'إدارة الخزانة', 'Government treasury and cash management', 'خزانة الحكومة وإدارة النقد', 1, '550e8400-e29b-41d4-a716-446655440000'),
('d1000001-0000-0000-0000-000000000006', 'm1000001-0000-0000-0000-000000000002', 'MOF-TAX', 'Tax Department', 'إدارة الضرائب', 'Tax collection and administration', 'جباية الضرائب والإدارة', 1, '550e8400-e29b-41d4-a716-446655440000');

-- Insert Department Head Positions for Ministry of Interior
INSERT INTO positions (id, ministry_id, department_id, code, title_en, title_ar, description_en, description_ar, government_grade, status, max_attributes, is_management_position, level, parent_position_id, created_by) VALUES
('p1000001-0000-0000-0000-000000000010', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'MOI-POLICE-DIR', 'Director General of Police', 'المدير العام للشرطة', 'Head of Police Department', 'رئيس إدارة الشرطة', 17, 'active', 6, TRUE, 2, 'p1000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000011', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000002', 'MOI-IMMIGRATION-DIR', 'Director General of Immigration', 'المدير العام للهجرة', 'Head of Immigration Department', 'رئيس إدارة الهجرة', 17, 'active', 6, TRUE, 2, 'p1000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000012', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000003', 'MOI-CIVIL-DEFENSE-DIR', 'Director General of Civil Defense', 'المدير العام للدفاع المدني', 'Head of Civil Defense Department', 'رئيس إدارة الدفاع المدني', 17, 'active', 6, TRUE, 2, 'p1000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000');

-- Insert Department Head Positions for Ministry of Finance
INSERT INTO positions (id, ministry_id, department_id, code, title_en, title_ar, description_en, description_ar, government_grade, status, max_attributes, is_management_position, level, parent_position_id, created_by) VALUES
('p1000001-0000-0000-0000-000000000020', 'm1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000004', 'MOF-BUDGET-DIR', 'Director General of Budget', 'المدير العام للميزانية', 'Head of Budget Department', 'رئيس إدارة الميزانية', 17, 'active', 6, TRUE, 2, 'p1000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000021', 'm1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000005', 'MOF-TREASURY-DIR', 'Director General of Treasury', 'المدير العام للخزانة', 'Head of Treasury Department', 'رئيس إدارة الخزانة', 17, 'active', 6, TRUE, 2, 'p1000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000022', 'm1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000006', 'MOF-TAX-DIR', 'Director General of Tax', 'المدير العام للضرائب', 'Head of Tax Department', 'رئيس إدارة الضرائب', 17, 'active', 6, TRUE, 2, 'p1000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000');

-- Insert some staff positions under Police Department
INSERT INTO positions (id, ministry_id, department_id, code, title_en, title_ar, description_en, description_ar, government_grade, status, max_attributes, is_management_position, level, parent_position_id, created_by) VALUES
('p1000001-0000-0000-0000-000000000030', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'MOI-POLICE-DEPUTY', 'Deputy Director of Police', 'نائب مدير الشرطة', 'Deputy head of Police Department', 'نائب رئيس إدارة الشرطة', 16, 'active', 5, TRUE, 3, 'p1000001-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000031', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'MOI-POLICE-OPS-CMD', 'Operations Commander', 'قائد العمليات', 'Police operations commander', 'قائد عمليات الشرطة', 15, 'active', 4, TRUE, 3, 'p1000001-0000-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000032', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'MOI-POLICE-CAPTAIN', 'Police Captain', 'نقيب شرطة', 'Police Captain', 'نقيب شرطة', 13, 'active', 3, FALSE, 4, 'p1000001-0000-0000-0000-000000000031', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000033', 'm1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'MOI-POLICE-LT', 'Police Lieutenant', 'ملازم شرطة', 'Police Lieutenant', 'ملازم شرطة', 11, 'active', 2, FALSE, 5, 'p1000001-0000-0000-0000-000000000032', '550e8400-e29b-41d4-a716-446655440000');

-- Insert some staff positions under Budget Department
INSERT INTO positions (id, ministry_id, department_id, code, title_en, title_ar, description_en, description_ar, government_grade, status, max_attributes, is_management_position, level, parent_position_id, created_by) VALUES
('p1000001-0000-0000-0000-000000000040', 'm1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000004', 'MOF-BUDGET-DEPUTY', 'Deputy Director of Budget', 'نائب مدير الميزانية', 'Deputy head of Budget Department', 'نائب رئيس إدارة الميزانية', 16, 'active', 5, TRUE, 3, 'p1000001-0000-0000-0000-000000000020', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000041', 'm1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000004', 'MOF-BUDGET-SR-ANALYST', 'Senior Budget Analyst', 'محلل ميزانية أول', 'Senior budget analyst', 'محلل ميزانية أول', 14, 'active', 4, FALSE, 4, 'p1000001-0000-0000-0000-000000000040', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000042', 'm1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000004', 'MOF-BUDGET-ANALYST', 'Budget Analyst', 'محلل ميزانية', 'Budget analyst', 'محلل ميزانية', 12, 'active', 3, FALSE, 5, 'p1000001-0000-0000-0000-000000000041', '550e8400-e29b-41d4-a716-446655440000');

-- Insert Employees
INSERT INTO employees (id, employee_number, national_id, first_name, last_name, first_name_ar, last_name_ar, email, phone, hire_date, nationality, gender, created_by) VALUES
('e1000001-0000-0000-0000-000000000001', 'PM001001', '28912345601', 'Mohammed', 'Al-Thani', 'محمد', 'آل ثاني', 'mohammed.althani@gov.qa', '+974-4444-1001', '2020-01-15', 'Qatari', 'M', '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000002', 'MOI001001', '28812345602', 'Khalifa', 'Al-Kuwari', 'خليفة', 'الكواري', 'khalifa.alkuwari@moi.gov.qa', '+974-4444-2001', '2019-03-10', 'Qatari', 'M', '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000003', 'MOF001001', '28712345603', 'Ali', 'Al-Emadi', 'علي', 'العمادي', 'ali.alemadi@mof.gov.qa', '+974-4444-3001', '2018-05-20', 'Qatari', 'M', '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000004', 'MOI002001', '28612345604', 'Ahmed', 'Al-Mahmoud', 'أحمد', 'المحمود', 'ahmed.mahmoud@moi.gov.qa', '+974-4444-2002', '2020-07-12', 'Qatari', 'M', '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000005', 'MOI002002', '28512345605', 'Fatima', 'Al-Mansouri', 'فاطمة', 'المنصوري', 'fatima.mansouri@moi.gov.qa', '+974-4444-2003', '2021-02-08', 'Qatari', 'F', '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000006', 'MOF002001', '28412345606', 'Khalid', 'Al-Mannai', 'خالد', 'المناعي', 'khalid.mannai@mof.gov.qa', '+974-4444-3002', '2019-11-15', 'Qatari', 'M', '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000007', 'MOF002002', '28312345607', 'Sara', 'Al-Dosari', 'سارة', 'الدوسري', 'sara.dosari@mof.gov.qa', '+974-4444-3003', '2020-09-22', 'Qatari', 'F', '550e8400-e29b-41d4-a716-446655440000');

-- Assign employees to positions
INSERT INTO employee_positions (employee_id, position_id, start_date, assignment_type, is_current, created_by) VALUES
('e1000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', '2020-01-15', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000002', 'p1000001-0000-0000-0000-000000000001', '2019-03-10', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000003', 'p1000001-0000-0000-0000-000000000002', '2018-05-20', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000004', 'p1000001-0000-0000-0000-000000000010', '2020-07-12', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000005', 'p1000001-0000-0000-0000-000000000030', '2021-02-08', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000006', 'p1000001-0000-0000-0000-000000000020', '2019-11-15', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000'),
('e1000001-0000-0000-0000-000000000007', 'p1000001-0000-0000-0000-000000000041', '2020-09-22', 'permanent', TRUE, '550e8400-e29b-41d4-a716-446655440000');

-- Assign attributes to positions
INSERT INTO position_attributes (position_id, attribute_id, assigned_date, assigned_by) VALUES
-- Prime Minister
('p0000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003', '2020-01-15', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000005', '2020-01-15', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000008', '2020-01-15', '550e8400-e29b-41d4-a716-446655440000'),
('p0000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000009', '2020-01-15', '550e8400-e29b-41d4-a716-446655440000'),

-- Minister of Interior
('p1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003', '2019-03-10', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000008', '2019-03-10', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000009', '2019-03-10', '550e8400-e29b-41d4-a716-446655440000'),

-- Minister of Finance
('p1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000005', '2018-05-20', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000006', '2018-05-20', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000008', '2018-05-20', '550e8400-e29b-41d4-a716-446655440000'),

-- Director General of Police
('p1000001-0000-0000-0000-000000000010', 'a1000001-0000-0000-0000-000000000002', '2020-07-12', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000010', 'a1000001-0000-0000-0000-000000000007', '2020-07-12', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000010', 'a1000001-0000-0000-0000-000000000009', '2020-07-12', '550e8400-e29b-41d4-a716-446655440000'),

-- Deputy Director of Police
('p1000001-0000-0000-0000-000000000030', 'a1000001-0000-0000-0000-000000000002', '2021-02-08', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000030', 'a1000001-0000-0000-0000-000000000007', '2021-02-08', '550e8400-e29b-41d4-a716-446655440000'),

-- Director General of Budget
('p1000001-0000-0000-0000-000000000020', 'a1000001-0000-0000-0000-000000000005', '2019-11-15', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000020', 'a1000001-0000-0000-0000-000000000006', '2019-11-15', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000020', 'a1000001-0000-0000-0000-000000000007', '2019-11-15', '550e8400-e29b-41d4-a716-446655440000'),

-- Senior Budget Analyst
('p1000001-0000-0000-0000-000000000041', 'a1000001-0000-0000-0000-000000000004', '2020-09-22', '550e8400-e29b-41d4-a716-446655440000'),
('p1000001-0000-0000-0000-000000000041', 'a1000001-0000-0000-0000-000000000007', '2020-09-22', '550e8400-e29b-41d4-a716-446655440000');

-- Update ministry minister positions
UPDATE ministries SET minister_position_id = 'p1000001-0000-0000-0000-000000000001' WHERE id = 'm1000001-0000-0000-0000-000000000001';
UPDATE ministries SET minister_position_id = 'p1000001-0000-0000-0000-000000000002' WHERE id = 'm1000001-0000-0000-0000-000000000002';
UPDATE ministries SET minister_position_id = 'p1000001-0000-0000-0000-000000000003' WHERE id = 'm1000001-0000-0000-0000-000000000003';
UPDATE ministries SET minister_position_id = 'p1000001-0000-0000-0000-000000000004' WHERE id = 'm1000001-0000-0000-0000-000000000004';
UPDATE ministries SET minister_position_id = 'p1000001-0000-0000-0000-000000000005' WHERE id = 'm1000001-0000-0000-0000-000000000005';

-- Update department head positions
UPDATE departments SET head_position_id = 'p1000001-0000-0000-0000-000000000010' WHERE id = 'd1000001-0000-0000-0000-000000000001';
UPDATE departments SET head_position_id = 'p1000001-0000-0000-0000-000000000011' WHERE id = 'd1000001-0000-0000-0000-000000000002';
UPDATE departments SET head_position_id = 'p1000001-0000-0000-0000-000000000012' WHERE id = 'd1000001-0000-0000-0000-000000000003';
UPDATE departments SET head_position_id = 'p1000001-0000-0000-0000-000000000020' WHERE id = 'd1000001-0000-0000-0000-000000000004';
UPDATE departments SET head_position_id = 'p1000001-0000-0000-0000-000000000021' WHERE id = 'd1000001-0000-0000-0000-000000000005';
UPDATE departments SET head_position_id = 'p1000001-0000-0000-0000-000000000022' WHERE id = 'd1000001-0000-0000-0000-000000000006';

-- Create additional users for testing
INSERT INTO users (username, email, password_hash, first_name, last_name, first_name_ar, last_name_ar, national_id, role, status, ministry_id, created_by) VALUES
('moi_admin', 'moi.admin@moi.gov.qa', '$2b$12$LQv3c1yqBwlVHpPjrGrUhOUdGkv5XgUw7RGaKKJlJXc8pNrHK7vVC', 'Khalifa', 'Al-Kuwari', 'خليفة', 'الكواري', '28812345602', 'ministry_admin', 'active', 'm1000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('mof_admin', 'mof.admin@mof.gov.qa', '$2b$12$LQv3c1yqBwlVHpPjrGrUhOUdGkv5XgUw7RGaKKJlJXc8pNrHK7vVC', 'Ali', 'Al-Emadi', 'علي', 'العمادي', '28712345603', 'ministry_admin', 'active', 'm1000001-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000'),
('hr_admin', 'hr.admin@gov.qa', '$2b$12$LQv3c1yqBwlVHpPjrGrUhOUdGkv5XgUw7RGaKKJlJXc8pNrHK7vVC', 'Mariam', 'Al-Attiyah', 'مريم', 'العطية', '28612345608', 'hr_admin', 'active', NULL, '550e8400-e29b-41d4-a716-446655440000'),
('manager1', 'manager1@moi.gov.qa', '$2b$12$LQv3c1yqBwlVHpPjrGrUhOUdGkv5XgUw7RGaKKJlJXc8pNrHK7vVC', 'Ahmed', 'Al-Mahmoud', 'أحمد', 'المحمود', '28612345604', 'manager', 'active', 'm1000001-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000'),
('viewer1', 'viewer1@gov.qa', '$2b$12$LQv3c1yqBwlVHpPjrGrUhOUdGkv5XgUw7RGaKKJlJXc8pNrHK7vVC', 'Omar', 'Al-Rashid', 'عمر', 'الراشد', '28512345609', 'viewer', 'active', NULL, '550e8400-e29b-41d4-a716-446655440000');