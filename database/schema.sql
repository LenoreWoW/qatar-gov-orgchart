-- Qatar Government Organization Chart Database Schema
-- Production-ready PostgreSQL schema with comprehensive audit trails

-- Enable UUID extension for audit trails
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'ministry_admin', 'hr_admin', 'manager', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE position_status AS ENUM ('active', 'vacant', 'temporary', 'archived');
CREATE TYPE attribute_type AS ENUM ('security', 'financial', 'administrative', 'technical');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'view');

-- Users table (authentication and authorization)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_ar VARCHAR(100),
    last_name_ar VARCHAR(100),
    national_id VARCHAR(11) UNIQUE,
    role user_role NOT NULL DEFAULT 'viewer',
    status user_status NOT NULL DEFAULT 'active',
    ministry_id VARCHAR(50),
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Ministries table (top-level government entities)
CREATE TABLE ministries (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    minister_position_id VARCHAR(50),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address_en TEXT,
    address_ar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Departments table (sub-entities within ministries)
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    ministry_id VARCHAR(50) NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
    parent_department_id VARCHAR(50) REFERENCES departments(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    head_position_id VARCHAR(50),
    level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Positions table (job positions within the organization)
CREATE TABLE positions (
    id VARCHAR(50) PRIMARY KEY,
    ministry_id VARCHAR(50) NOT NULL REFERENCES ministries(id),
    department_id VARCHAR(50) REFERENCES departments(id),
    parent_position_id VARCHAR(50) REFERENCES positions(id),
    code VARCHAR(30) UNIQUE NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    government_grade INTEGER NOT NULL CHECK (government_grade BETWEEN 1 AND 20),
    salary_scale VARCHAR(20),
    status position_status NOT NULL DEFAULT 'vacant',
    max_attributes INTEGER DEFAULT 5,
    requires_security_clearance BOOLEAN DEFAULT FALSE,
    is_management_position BOOLEAN DEFAULT FALSE,
    level INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Employees table (people filling positions)
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    national_id VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_ar VARCHAR(100),
    last_name_ar VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    birth_date DATE,
    hire_date DATE NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Qatari',
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    marital_status VARCHAR(20),
    photo_url VARCHAR(500),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    termination_date DATE,
    termination_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Employee positions (many-to-many with history)
CREATE TABLE employee_positions (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(id),
    position_id VARCHAR(50) NOT NULL REFERENCES positions(id),
    start_date DATE NOT NULL,
    end_date DATE,
    assignment_type VARCHAR(20) DEFAULT 'permanent', -- permanent, temporary, acting
    is_current BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    UNIQUE(employee_id, position_id, start_date)
);

-- Attributes table (position-based attributes/permissions)
CREATE TABLE attributes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    type attribute_type NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Position attributes (which attributes are assigned to which positions)
CREATE TABLE position_attributes (
    id VARCHAR(50) PRIMARY KEY,
    position_id VARCHAR(50) NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    attribute_id VARCHAR(50) NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, attribute_id)
);

-- User sessions (for session management)
CREATE TABLE user_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Audit logs (comprehensive audit trail)
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    action audit_action NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings (configuration)
CREATE TABLE system_settings (
    id VARCHAR(50) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id);
ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE ministries ADD CONSTRAINT fk_ministries_minister FOREIGN KEY (minister_position_id) REFERENCES positions(id);
ALTER TABLE ministries ADD CONSTRAINT fk_ministries_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE ministries ADD CONSTRAINT fk_ministries_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE departments ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_position_id) REFERENCES positions(id);
ALTER TABLE departments ADD CONSTRAINT fk_departments_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE departments ADD CONSTRAINT fk_departments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE positions ADD CONSTRAINT fk_positions_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE positions ADD CONSTRAINT fk_positions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE employees ADD CONSTRAINT fk_employees_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE employee_positions ADD CONSTRAINT fk_employee_positions_created_by FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE attributes ADD CONSTRAINT fk_attributes_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE attributes ADD CONSTRAINT fk_attributes_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE position_attributes ADD CONSTRAINT fk_position_attributes_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id);

ALTER TABLE system_settings ADD CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_ministry_id ON users(ministry_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_ministries_code ON ministries(code);
CREATE INDEX idx_ministries_active ON ministries(is_active);

CREATE INDEX idx_departments_ministry_id ON departments(ministry_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_active ON departments(is_active);

CREATE INDEX idx_positions_ministry_id ON positions(ministry_id);
CREATE INDEX idx_positions_department_id ON positions(department_id);
CREATE INDEX idx_positions_parent_id ON positions(parent_position_id);
CREATE INDEX idx_positions_code ON positions(code);
CREATE INDEX idx_positions_grade ON positions(government_grade);
CREATE INDEX idx_positions_status ON positions(status);

CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_national_id ON employees(national_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_active ON employees(is_active);

CREATE INDEX idx_employee_positions_employee_id ON employee_positions(employee_id);
CREATE INDEX idx_employee_positions_position_id ON employee_positions(position_id);
CREATE INDEX idx_employee_positions_current ON employee_positions(is_current);
CREATE INDEX idx_employee_positions_dates ON employee_positions(start_date, end_date);

CREATE INDEX idx_attributes_code ON attributes(code);
CREATE INDEX idx_attributes_type ON attributes(type);
CREATE INDEX idx_attributes_active ON attributes(is_active);

CREATE INDEX idx_position_attributes_position_id ON position_attributes(position_id);
CREATE INDEX idx_position_attributes_attribute_id ON position_attributes(attribute_id);
CREATE INDEX idx_position_attributes_active ON position_attributes(is_active);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (id, action, table_name, record_id, new_values)
        VALUES ('audit-' || extract(epoch from now())::text || '-' || floor(random() * 1000)::text,
                'create', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (id, action, table_name, record_id, old_values, new_values)
        VALUES ('audit-' || extract(epoch from now())::text || '-' || floor(random() * 1000)::text,
                'update', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (id, action, table_name, record_id, old_values)
        VALUES ('audit-' || extract(epoch from now())::text || '-' || floor(random() * 1000)::text,
                'delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all main tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_ministries AFTER INSERT OR UPDATE OR DELETE ON ministries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_departments AFTER INSERT OR UPDATE OR DELETE ON departments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_positions AFTER INSERT OR UPDATE OR DELETE ON positions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_employee_positions AFTER INSERT OR UPDATE OR DELETE ON employee_positions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_attributes AFTER INSERT OR UPDATE OR DELETE ON attributes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_position_attributes AFTER INSERT OR UPDATE OR DELETE ON position_attributes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON ministries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attributes_updated_at BEFORE UPDATE ON attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (id, setting_key, setting_value, description, is_public) VALUES
('s1000001-0000-0000-0000-000000000001', 'app_name', 'Qatar Government Organization Chart', 'Application name', TRUE),
('s1000001-0000-0000-0000-000000000002', 'app_version', '1.0.0', 'Application version', TRUE),
('s1000001-0000-0000-0000-000000000003', 'default_language', 'en', 'Default language (en/ar)', TRUE),
('s1000001-0000-0000-0000-000000000004', 'session_timeout', '3600', 'Session timeout in seconds', FALSE),
('s1000001-0000-0000-0000-000000000005', 'max_login_attempts', '5', 'Maximum failed login attempts', FALSE),
('s1000001-0000-0000-0000-000000000006', 'lockout_duration', '1800', 'Account lockout duration in seconds', FALSE),
('s1000001-0000-0000-0000-000000000007', 'password_min_length', '8', 'Minimum password length', FALSE),
('s1000001-0000-0000-0000-000000000008', 'require_password_complexity', 'true', 'Require complex passwords', FALSE);