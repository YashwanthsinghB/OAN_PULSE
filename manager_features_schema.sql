-- ============================================
-- MANAGER FEATURES: DATABASE SCHEMA UPDATES
-- ============================================
-- This script adds manager-employee relationships,
-- time entry approval workflow, and related tables
-- ============================================

-- Step 1: Add manager_id to users table
-- ============================================
-- This creates the manager-employee hierarchy
ALTER TABLE oan_pulse_users 
ADD manager_id NUMBER(10);

-- Add foreign key constraint
ALTER TABLE oan_pulse_users
ADD CONSTRAINT fk_user_manager 
FOREIGN KEY (manager_id) 
REFERENCES oan_pulse_users(user_id);

-- Add index for performance
CREATE INDEX idx_users_manager ON oan_pulse_users(manager_id);

COMMENT ON COLUMN oan_pulse_users.manager_id IS 'ID of the manager this user reports to (null for admins/top-level managers)';


-- Step 2: Add approval status to time_entries
-- ============================================
ALTER TABLE oan_pulse_time_entries
ADD approval_status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL
CONSTRAINT chk_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE oan_pulse_time_entries
ADD approved_by NUMBER(10);

ALTER TABLE oan_pulse_time_entries
ADD approved_at TIMESTAMP;

ALTER TABLE oan_pulse_time_entries
ADD rejection_reason VARCHAR2(500);

-- Add foreign key for approved_by
ALTER TABLE oan_pulse_time_entries
ADD CONSTRAINT fk_entry_approver 
FOREIGN KEY (approved_by) 
REFERENCES oan_pulse_users(user_id);

-- Add index for querying by status
CREATE INDEX idx_entries_approval_status ON oan_pulse_time_entries(approval_status);
CREATE INDEX idx_entries_approved_by ON oan_pulse_time_entries(approved_by);

COMMENT ON COLUMN oan_pulse_time_entries.approval_status IS 'Current approval status: PENDING, APPROVED, or REJECTED';
COMMENT ON COLUMN oan_pulse_time_entries.approved_by IS 'User ID of the manager who approved/rejected this entry';
COMMENT ON COLUMN oan_pulse_time_entries.approved_at IS 'Timestamp when the entry was approved/rejected';
COMMENT ON COLUMN oan_pulse_time_entries.rejection_reason IS 'Reason for rejection (optional)';


-- Step 3: Create approval history table
-- ============================================
-- Tracks all approval actions for audit trail
CREATE TABLE oan_pulse_approval_history (
  history_id NUMBER(10) PRIMARY KEY,
  time_entry_id NUMBER(10) NOT NULL,
  action VARCHAR2(20) NOT NULL CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMITTED')),
  performed_by NUMBER(10) NOT NULL,
  performed_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  previous_status VARCHAR2(20),
  new_status VARCHAR2(20),
  notes VARCHAR2(500),
  CONSTRAINT fk_history_entry FOREIGN KEY (time_entry_id) REFERENCES oan_pulse_time_entries(time_entry_id),
  CONSTRAINT fk_history_user FOREIGN KEY (performed_by) REFERENCES oan_pulse_users(user_id)
);

-- Create sequence for history_id
CREATE SEQUENCE oan_pulse_seq_approval_history START WITH 1 INCREMENT BY 1;

-- Create trigger for auto-incrementing history_id
CREATE OR REPLACE TRIGGER oan_pulse_trg_approval_history_id
BEFORE INSERT ON oan_pulse_approval_history
FOR EACH ROW
BEGIN
  IF :NEW.history_id IS NULL THEN
    SELECT oan_pulse_seq_approval_history.NEXTVAL INTO :NEW.history_id FROM DUAL;
  END IF;
END;
/

-- Add indexes
CREATE INDEX idx_history_entry ON oan_pulse_approval_history(time_entry_id);
CREATE INDEX idx_history_performed_by ON oan_pulse_approval_history(performed_by);
CREATE INDEX idx_history_performed_at ON oan_pulse_approval_history(performed_at);

COMMENT ON TABLE oan_pulse_approval_history IS 'Audit trail of all time entry approval actions';


-- Step 4: Create useful views for manager queries
-- ============================================

-- View: Team members for each manager
CREATE OR REPLACE VIEW oan_pulse_v_team_members AS
SELECT 
  m.user_id as manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  e.user_id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.email as employee_email,
  e.role as employee_role,
  e.is_active as employee_is_active
FROM oan_pulse_users m
INNER JOIN oan_pulse_users e ON m.user_id = e.manager_id
WHERE e.is_active = 1;

COMMENT ON VIEW oan_pulse_v_team_members IS 'Lists all active employees and their managers';


-- View: Team time entries pending approval
CREATE OR REPLACE VIEW oan_pulse_v_pending_approvals AS
SELECT 
  te.time_entry_id,
  te.user_id,
  u.first_name || ' ' || u.last_name as employee_name,
  u.manager_id,
  te.project_id,
  p.name as project_name,
  te.entry_date,
  te.hours,
  te.notes,
  te.is_billable,
  te.approval_status,
  te.created_at
FROM oan_pulse_time_entries te
INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
LEFT JOIN oan_pulse_projects p ON te.project_id = p.project_id
WHERE te.approval_status = 'PENDING'
ORDER BY te.entry_date DESC, te.created_at DESC;

COMMENT ON VIEW oan_pulse_v_pending_approvals IS 'All time entries pending manager approval';


-- View: Team time summary for managers
CREATE OR REPLACE VIEW oan_pulse_v_team_time_summary AS
SELECT 
  u.manager_id,
  te.user_id,
  u.first_name || ' ' || u.last_name as employee_name,
  COUNT(te.time_entry_id) as total_entries,
  SUM(CASE WHEN te.approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN te.approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN te.approval_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
  SUM(te.hours) as total_hours,
  SUM(CASE WHEN te.approval_status = 'APPROVED' THEN te.hours ELSE 0 END) as approved_hours,
  SUM(CASE WHEN te.is_billable = 1 THEN te.hours ELSE 0 END) as billable_hours
FROM oan_pulse_users u
INNER JOIN oan_pulse_time_entries te ON u.user_id = te.user_id
WHERE u.manager_id IS NOT NULL
GROUP BY u.manager_id, te.user_id, u.first_name, u.last_name;

COMMENT ON VIEW oan_pulse_v_team_time_summary IS 'Aggregated time tracking stats by employee for each manager';


-- Step 5: Update existing test data
-- ============================================
-- Assign managers to test users
-- Admin (user_id=1) has no manager (top level)
-- Manager (user_id=21) reports to Admin
-- Employees report to Manager

-- Set Manager's manager to Admin
UPDATE oan_pulse_users 
SET manager_id = 1 
WHERE user_id = 21;

-- Set all employees' manager to the Test Manager
UPDATE oan_pulse_users 
SET manager_id = 21 
WHERE role = 'EMPLOYEE';

-- Set all existing time entries to PENDING for employees
UPDATE oan_pulse_time_entries te
SET approval_status = 'PENDING'
WHERE EXISTS (
  SELECT 1 FROM oan_pulse_users u 
  WHERE u.user_id = te.user_id 
  AND u.role = 'EMPLOYEE'
);

-- Auto-approve time entries for managers and admins
UPDATE oan_pulse_time_entries te
SET approval_status = 'APPROVED',
    approved_by = te.user_id,
    approved_at = SYSTIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM oan_pulse_users u 
  WHERE u.user_id = te.user_id 
  AND u.role IN ('ADMIN', 'MANAGER')
);

COMMIT;


-- Step 6: Create trigger to log approval actions
-- ============================================
CREATE OR REPLACE TRIGGER oan_pulse_trg_approval_log
AFTER UPDATE OF approval_status ON oan_pulse_time_entries
FOR EACH ROW
WHEN (NEW.approval_status != OLD.approval_status)
DECLARE
  v_action VARCHAR2(20);
BEGIN
  -- Determine the action
  IF :NEW.approval_status = 'APPROVED' THEN
    v_action := 'APPROVED';
  ELSIF :NEW.approval_status = 'REJECTED' THEN
    v_action := 'REJECTED';
  ELSIF :NEW.approval_status = 'PENDING' THEN
    v_action := 'RESUBMITTED';
  END IF;
  
  -- Log to history
  INSERT INTO oan_pulse_approval_history (
    time_entry_id,
    action,
    performed_by,
    previous_status,
    new_status,
    notes
  ) VALUES (
    :NEW.time_entry_id,
    v_action,
    :NEW.approved_by,
    :OLD.approval_status,
    :NEW.approval_status,
    :NEW.rejection_reason
  );
END;
/


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check manager-employee relationships
SELECT 
  e.user_id,
  e.first_name || ' ' || e.last_name as employee,
  e.role,
  m.first_name || ' ' || m.last_name as manager
FROM oan_pulse_users e
LEFT JOIN oan_pulse_users m ON e.manager_id = m.user_id
ORDER BY e.role, e.user_id;

-- Check time entry approval statuses
SELECT 
  approval_status,
  COUNT(*) as count,
  SUM(hours) as total_hours
FROM oan_pulse_time_entries
GROUP BY approval_status;

-- Check views
SELECT * FROM oan_pulse_v_team_members;
SELECT * FROM oan_pulse_v_pending_approvals WHERE ROWNUM <= 10;

COMMIT;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
BEGIN
  DBMS_OUTPUT.PUT_LINE('✅ Manager Features Schema Update Complete!');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Added:');
  DBMS_OUTPUT.PUT_LINE('- manager_id to users table');
  DBMS_OUTPUT.PUT_LINE('- approval_status to time_entries table');
  DBMS_OUTPUT.PUT_LINE('- oan_pulse_approval_history table');
  DBMS_OUTPUT.PUT_LINE('- 3 views for manager queries');
  DBMS_OUTPUT.PUT_LINE('- Triggers for audit logging');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Next: Run APEX REST setup for manager endpoints');
END;
/

