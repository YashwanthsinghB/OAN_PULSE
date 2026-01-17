-- =====================================================
-- Harvest Clone - Database Setup Script
-- Schema: YASH
-- =====================================================

-- Connect as YASH user before running these scripts
-- sqlplus YASH/Y@sh!Oracle#2026

-- =====================================================
-- STEP 1: Enable REST for YASH Schema
-- =====================================================
-- This must be run as a user with ORDS privileges
-- Usually run as a DBA or ORDS_PUBLIC_USER

BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_url_mapping_type => 'BASE_PATH',
    p_url_mapping_pattern => 'oan_pulse',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- =====================================================
-- STEP 2: Create Sequences (if not using IDENTITY)
-- =====================================================
-- Note: Modern Oracle (12c+) supports IDENTITY columns
-- Sequences are included here for compatibility

-- =====================================================
-- STEP 3: Create Core Tables
-- =====================================================

-- USERS Table (Employees/Users)
CREATE TABLE oan_pulse_users (
    user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR2(255) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    first_name VARCHAR2(100) NOT NULL,
    last_name VARCHAR2(100) NOT NULL,
    role VARCHAR2(20) DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE')),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    hourly_rate NUMBER(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTS Table
CREATE TABLE oan_pulse_clients (
    client_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    contact_email VARCHAR2(255),
    contact_phone VARCHAR2(50),
    address VARCHAR2(500),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROJECTS Table
CREATE TABLE oan_pulse_projects (
    project_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id NUMBER NOT NULL,
    name VARCHAR2(255) NOT NULL,
    code VARCHAR2(50),
    description VARCHAR2(2000),
    start_date DATE,
    end_date DATE,
    budget_hours NUMBER(10,2),
    budget_amount NUMBER(12,2),
    hourly_rate NUMBER(10,2),
    is_billable NUMBER(1) DEFAULT 1 CHECK (is_billable IN (0, 1)),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'COMPLETED')),
    created_by NUMBER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT oan_pulse_fk_projects_client FOREIGN KEY (client_id) REFERENCES oan_pulse_clients(client_id),
    CONSTRAINT oan_pulse_fk_projects_created_by FOREIGN KEY (created_by) REFERENCES oan_pulse_users(user_id)
);

-- TASKS Table
CREATE TABLE oan_pulse_tasks (
    task_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id NUMBER NOT NULL,
    name VARCHAR2(255) NOT NULL,
    description VARCHAR2(2000),
    is_billable NUMBER(1) DEFAULT 1 CHECK (is_billable IN (0, 1)),
    hourly_rate NUMBER(10,2),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT oan_pulse_fk_tasks_project FOREIGN KEY (project_id) REFERENCES oan_pulse_projects(project_id)
);

-- TIME_ENTRIES Table (Core table for time tracking)
CREATE TABLE oan_pulse_time_entries (
    time_entry_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    project_id NUMBER NOT NULL,
    task_id NUMBER,
    entry_date DATE NOT NULL,
    hours NUMBER(10,2) NOT NULL CHECK (hours > 0),
    notes VARCHAR2(2000),
    is_billable NUMBER(1) DEFAULT 1 CHECK (is_billable IN (0, 1)),
    hourly_rate NUMBER(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by NUMBER NOT NULL,
    CONSTRAINT oan_pulse_fk_time_entries_user FOREIGN KEY (user_id) REFERENCES oan_pulse_users(user_id),
    CONSTRAINT oan_pulse_fk_time_entries_project FOREIGN KEY (project_id) REFERENCES oan_pulse_projects(project_id),
    CONSTRAINT oan_pulse_fk_time_entries_task FOREIGN KEY (task_id) REFERENCES oan_pulse_tasks(task_id),
    CONSTRAINT oan_pulse_fk_time_entries_created_by FOREIGN KEY (created_by) REFERENCES oan_pulse_users(user_id)
);

-- TIMER_SESSIONS Table (For active timers)
CREATE TABLE oan_pulse_timer_sessions (
    session_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    project_id NUMBER NOT NULL,
    task_id NUMBER,
    start_time TIMESTAMP NOT NULL,
    notes VARCHAR2(2000),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    CONSTRAINT oan_pulse_fk_timer_sessions_user FOREIGN KEY (user_id) REFERENCES oan_pulse_users(user_id),
    CONSTRAINT oan_pulse_fk_timer_sessions_project FOREIGN KEY (project_id) REFERENCES oan_pulse_projects(project_id),
    CONSTRAINT oan_pulse_fk_timer_sessions_task FOREIGN KEY (task_id) REFERENCES oan_pulse_tasks(task_id)
);

-- PROJECT_TEAM_MEMBERS Table (Many-to-many relationship)
CREATE TABLE oan_pulse_project_team_members (
    project_id NUMBER NOT NULL,
    user_id NUMBER NOT NULL,
    role VARCHAR2(20) DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'LEAD')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT oan_pulse_pk_project_team PRIMARY KEY (project_id, user_id),
    CONSTRAINT oan_pulse_fk_ptm_project FOREIGN KEY (project_id) REFERENCES oan_pulse_projects(project_id),
    CONSTRAINT oan_pulse_fk_ptm_user FOREIGN KEY (user_id) REFERENCES oan_pulse_users(user_id)
);

-- EXPENSES Table (Optional - for Phase 2+)
CREATE TABLE oan_pulse_expenses (
    expense_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    project_id NUMBER NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMBER(12,2) NOT NULL CHECK (amount > 0),
    category VARCHAR2(50),
    receipt_url VARCHAR2(500),
    notes VARCHAR2(2000),
    is_billable NUMBER(1) DEFAULT 1 CHECK (is_billable IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT oan_pulse_fk_expenses_user FOREIGN KEY (user_id) REFERENCES oan_pulse_users(user_id),
    CONSTRAINT oan_pulse_fk_expenses_project FOREIGN KEY (project_id) REFERENCES oan_pulse_projects(project_id)
);

-- =====================================================
-- STEP 4: Create Indexes for Performance
-- =====================================================

-- Users indexes
CREATE INDEX oan_pulse_idx_users_email ON oan_pulse_users(email);
CREATE INDEX oan_pulse_idx_users_role ON oan_pulse_users(role);
CREATE INDEX oan_pulse_idx_users_active ON oan_pulse_users(is_active);

-- Projects indexes
CREATE INDEX oan_pulse_idx_projects_client ON oan_pulse_projects(client_id);
CREATE INDEX oan_pulse_idx_projects_status ON oan_pulse_projects(status);
CREATE INDEX oan_pulse_idx_projects_created_by ON oan_pulse_projects(created_by);

-- Tasks indexes
CREATE INDEX oan_pulse_idx_tasks_project ON oan_pulse_tasks(project_id);
CREATE INDEX oan_pulse_idx_tasks_active ON oan_pulse_tasks(is_active);

-- Time Entries indexes (most important for queries)
CREATE INDEX oan_pulse_idx_time_entries_user_date ON oan_pulse_time_entries(user_id, entry_date);
CREATE INDEX oan_pulse_idx_time_entries_project_date ON oan_pulse_time_entries(project_id, entry_date);
CREATE INDEX oan_pulse_idx_time_entries_date ON oan_pulse_time_entries(entry_date);

-- Timer Sessions indexes
CREATE INDEX oan_pulse_idx_timer_sessions_user_active ON oan_pulse_timer_sessions(user_id, is_active);
CREATE INDEX oan_pulse_idx_timer_sessions_active ON oan_pulse_timer_sessions(is_active);

-- Expenses indexes
CREATE INDEX oan_pulse_idx_expenses_user_date ON oan_pulse_expenses(user_id, expense_date);
CREATE INDEX oan_pulse_idx_expenses_project_date ON oan_pulse_expenses(project_id, expense_date);

-- =====================================================
-- STEP 5: Create Triggers for Updated_At
-- =====================================================

-- Trigger for users table
CREATE OR REPLACE TRIGGER oan_pulse_trg_users_updated_at
BEFORE UPDATE ON oan_pulse_users
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for clients table
CREATE OR REPLACE TRIGGER oan_pulse_trg_clients_updated_at
BEFORE UPDATE ON oan_pulse_clients
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for projects table
CREATE OR REPLACE TRIGGER oan_pulse_trg_projects_updated_at
BEFORE UPDATE ON oan_pulse_projects
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for tasks table
CREATE OR REPLACE TRIGGER oan_pulse_trg_tasks_updated_at
BEFORE UPDATE ON oan_pulse_tasks
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for time_entries table
CREATE OR REPLACE TRIGGER oan_pulse_trg_time_entries_updated_at
BEFORE UPDATE ON oan_pulse_time_entries
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- Trigger for expenses table
CREATE OR REPLACE TRIGGER oan_pulse_trg_expenses_updated_at
BEFORE UPDATE ON oan_pulse_expenses
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- =====================================================
-- STEP 6: Create Views for Reporting
-- =====================================================

-- View: Time Entries Summary
CREATE OR REPLACE VIEW oan_pulse_v_time_entries_summary AS
SELECT 
    te.entry_date,
    te.user_id,
    u.first_name || ' ' || u.last_name AS user_name,
    te.project_id,
    p.name AS project_name,
    te.task_id,
    t.name AS task_name,
    te.hours,
    te.is_billable,
    te.hourly_rate,
    CASE 
        WHEN te.is_billable = 1 AND te.hourly_rate IS NOT NULL 
        THEN te.hours * te.hourly_rate 
        ELSE 0 
    END AS billable_amount
FROM oan_pulse_time_entries te
JOIN oan_pulse_users u ON te.user_id = u.user_id
JOIN oan_pulse_projects p ON te.project_id = p.project_id
LEFT JOIN oan_pulse_tasks t ON te.task_id = t.task_id;

-- View: Project Budget Status
CREATE OR REPLACE VIEW oan_pulse_v_project_budget_status AS
SELECT 
    p.project_id,
    p.name AS project_name,
    p.budget_hours,
    p.budget_amount,
    COALESCE(SUM(te.hours), 0) AS actual_hours,
    COALESCE(SUM(CASE WHEN te.is_billable = 1 AND te.hourly_rate IS NOT NULL 
                 THEN te.hours * te.hourly_rate ELSE 0 END), 0) AS actual_amount,
    CASE 
        WHEN p.budget_hours IS NOT NULL 
        THEN ROUND((COALESCE(SUM(te.hours), 0) / p.budget_hours) * 100, 2)
        ELSE NULL 
    END AS hours_percentage,
    CASE 
        WHEN p.budget_amount IS NOT NULL 
        THEN ROUND((COALESCE(SUM(CASE WHEN te.is_billable = 1 AND te.hourly_rate IS NOT NULL 
                                 THEN te.hours * te.hourly_rate ELSE 0 END), 0) / p.budget_amount) * 100, 2)
        ELSE NULL 
    END AS amount_percentage
FROM oan_pulse_projects p
LEFT JOIN oan_pulse_time_entries te ON p.project_id = te.project_id
GROUP BY p.project_id, p.name, p.budget_hours, p.budget_amount;

-- View: User Utilization
CREATE OR REPLACE VIEW oan_pulse_v_user_utilization AS
SELECT 
    u.user_id,
    u.first_name || ' ' || u.last_name AS user_name,
    TRUNC(te.entry_date, 'IW') AS week_start,
    COUNT(DISTINCT te.entry_date) AS days_worked,
    SUM(te.hours) AS total_hours,
    AVG(te.hours) AS avg_hours_per_day,
    COUNT(te.time_entry_id) AS total_entries
FROM oan_pulse_users u
LEFT JOIN oan_pulse_time_entries te ON u.user_id = te.user_id
WHERE u.is_active = 1
GROUP BY u.user_id, u.first_name, u.last_name, TRUNC(te.entry_date, 'IW');

-- =====================================================
-- STEP 7: Enable REST for Tables
-- =====================================================
-- Run these after ORDS is set up and schema is enabled

-- Enable REST for users table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_object => 'OAN_PULSE_USERS',
    p_object_type => 'TABLE',
    p_object_alias => 'users',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- Enable REST for clients table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_object => 'OAN_PULSE_CLIENTS',
    p_object_type => 'TABLE',
    p_object_alias => 'clients',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- Enable REST for projects table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_object => 'OAN_PULSE_PROJECTS',
    p_object_type => 'TABLE',
    p_object_alias => 'projects',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- Enable REST for tasks table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_object => 'OAN_PULSE_TASKS',
    p_object_type => 'TABLE',
    p_object_alias => 'tasks',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- Enable REST for time_entries table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'YASH',
    p_object => 'OAN_PULSE_TIME_ENTRIES',
    p_object_type => 'TABLE',
    p_object_alias => 'time-entries',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- Enable REST for timer_sessions table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_object => 'OAN_PULSE_TIMER_SESSIONS',
    p_object_type => 'TABLE',
    p_object_alias => 'timer-sessions',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- Enable REST for expenses table
BEGIN
  ORDS.ENABLE_OBJECT(
    p_enabled => TRUE,
    p_schema => 'OAN_TRIAL',
    p_object => 'OAN_PULSE_EXPENSES',
    p_object_type => 'TABLE',
    p_object_alias => 'expenses',
    p_auto_rest_auth => FALSE
  );
  COMMIT;
END;
/

-- =====================================================
-- STEP 8: Insert Test Data (Optional - for development)
-- =====================================================

-- Insert a test admin user
-- Password: 'admin123' (you'll need to hash this properly later)
-- For now, this is just a placeholder
INSERT INTO oan_pulse_users (email, password_hash, first_name, last_name, role, hourly_rate)
VALUES ('admin@oan_pulse.com', 'PLACEHOLDER_HASH', 'Admin', 'User', 'ADMIN', 100.00);

-- Insert a test client
INSERT INTO oan_pulse_clients (name, contact_email, is_active)
VALUES ('Test Client Inc', 'contact@testclient.com', 1);

-- Insert a test project
INSERT INTO oan_pulse_projects (client_id, name, status, created_by, is_billable, hourly_rate)
VALUES (1, 'Test Project', 'ACTIVE', 1, 1, 100.00);

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check all tables were created
SELECT table_name FROM user_tables WHERE table_name LIKE 'OAN_PULSE_%' ORDER BY table_name;

-- Check all indexes were created
SELECT index_name, table_name FROM user_indexes WHERE index_name LIKE 'OAN_PULSE_IDX_%' ORDER BY table_name, index_name;

-- Check all views were created
SELECT view_name FROM user_views WHERE view_name LIKE 'OAN_PULSE_%' ORDER BY view_name;

-- Check all triggers were created
SELECT trigger_name, table_name FROM user_triggers WHERE trigger_name LIKE 'OAN_PULSE_TRG_%' ORDER BY table_name;

-- =====================================================
-- END OF SETUP SCRIPT
-- =====================================================

