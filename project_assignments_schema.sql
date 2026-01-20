-- ============================================
-- PROJECT ASSIGNMENTS: DATABASE SCHEMA UPDATES
-- ============================================
-- This script adds project manager assignments,
-- ensures project_team_members table is ready,
-- and sets up proper relationships
-- ============================================

-- Step 1: Add project_manager_id to projects table
-- ============================================
-- This allows assigning a manager to each project
ALTER TABLE oan_pulse_projects
ADD project_manager_id NUMBER(10);

-- Add foreign key constraint
ALTER TABLE oan_pulse_projects
ADD CONSTRAINT fk_project_manager 
FOREIGN KEY (project_manager_id) 
REFERENCES oan_pulse_users(user_id);

-- Add index for performance
CREATE INDEX idx_projects_manager ON oan_pulse_projects(project_manager_id);

COMMENT ON COLUMN oan_pulse_projects.project_manager_id IS 'ID of the manager assigned to this project';

-- Step 2: Ensure project_team_members table exists and is ready
-- ============================================
-- This table already exists from database_setup.sql, but let's verify structure
-- If it doesn't exist, create it:

BEGIN
  EXECUTE IMMEDIATE '
    CREATE TABLE oan_pulse_project_team_members (
      project_id NUMBER NOT NULL,
      user_id NUMBER NOT NULL,
      role VARCHAR2(20) DEFAULT ''MEMBER'' CHECK (role IN (''MEMBER'', ''LEAD'')),
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT oan_pulse_pk_project_team PRIMARY KEY (project_id, user_id),
      CONSTRAINT oan_pulse_fk_ptm_project FOREIGN KEY (project_id) REFERENCES oan_pulse_projects(project_id),
      CONSTRAINT oan_pulse_fk_ptm_user FOREIGN KEY (user_id) REFERENCES oan_pulse_users(user_id)
    )
  ';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -955 THEN -- Table already exists
      NULL; -- Table exists, continue
    ELSE
      RAISE;
    END IF;
END;
/

-- Add index for performance
CREATE INDEX idx_ptm_project ON oan_pulse_project_team_members(project_id);
CREATE INDEX idx_ptm_user ON oan_pulse_project_team_members(user_id);

COMMENT ON TABLE oan_pulse_project_team_members IS 'Many-to-many relationship: Users assigned to projects';

-- Step 3: Ensure tasks table is properly set up
-- ============================================
-- Tasks table should already exist, but let's verify it has required fields
-- Add any missing indexes

CREATE INDEX idx_tasks_project ON oan_pulse_tasks(project_id);
CREATE INDEX idx_tasks_active ON oan_pulse_tasks(is_active);

-- Step 4: Create useful views for project assignments
-- ============================================

-- View: Projects with their managers
CREATE OR REPLACE VIEW oan_pulse_v_projects_with_managers AS
SELECT 
  p.project_id,
  p.name as project_name,
  p.client_id,
  c.name as client_name,
  p.project_manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  m.email as manager_email,
  p.status,
  p.is_billable,
  COUNT(DISTINCT ptm.user_id) as team_size,
  COUNT(DISTINCT t.task_id) as task_count
FROM oan_pulse_projects p
LEFT JOIN oan_pulse_clients c ON p.client_id = c.client_id
LEFT JOIN oan_pulse_users m ON p.project_manager_id = m.user_id
LEFT JOIN oan_pulse_project_team_members ptm ON p.project_id = ptm.project_id
LEFT JOIN oan_pulse_tasks t ON p.project_id = t.project_id AND t.is_active = 1
GROUP BY p.project_id, p.name, p.client_id, c.name, p.project_manager_id, 
         m.first_name, m.last_name, m.email, p.status, p.is_billable;

COMMENT ON VIEW oan_pulse_v_projects_with_managers IS 'Projects with their assigned managers, team size, and task count';

-- View: User's assigned projects
CREATE OR REPLACE VIEW oan_pulse_v_user_projects AS
SELECT DISTINCT
  u.user_id,
  u.first_name || ' ' || u.last_name as user_name,
  p.project_id,
  p.name as project_name,
  p.status as project_status,
  ptm.role as project_role,
  CASE 
    WHEN p.project_manager_id = u.user_id THEN 'MANAGER'
    ELSE ptm.role
  END as access_level
FROM oan_pulse_users u
INNER JOIN oan_pulse_project_team_members ptm ON u.user_id = ptm.user_id
INNER JOIN oan_pulse_projects p ON ptm.project_id = p.project_id
WHERE p.status = 'ACTIVE'
UNION
-- Also include projects where user is the manager
SELECT 
  u.user_id,
  u.first_name || ' ' || u.last_name as user_name,
  p.project_id,
  p.name as project_name,
  p.status as project_status,
  'MANAGER' as project_role,
  'MANAGER' as access_level
FROM oan_pulse_users u
INNER JOIN oan_pulse_projects p ON u.user_id = p.project_manager_id
WHERE p.status = 'ACTIVE';

COMMENT ON VIEW oan_pulse_v_user_projects IS 'All projects assigned to each user (as team member or manager)';

-- View: Project team members with details
CREATE OR REPLACE VIEW oan_pulse_v_project_teams AS
SELECT 
  p.project_id,
  p.name as project_name,
  ptm.user_id,
  u.first_name || ' ' || u.last_name as member_name,
  u.email as member_email,
  u.role as user_role,
  ptm.role as project_role,
  ptm.assigned_at
FROM oan_pulse_projects p
INNER JOIN oan_pulse_project_team_members ptm ON p.project_id = ptm.project_id
INNER JOIN oan_pulse_users u ON ptm.user_id = u.user_id
WHERE u.is_active = 1
ORDER BY p.project_id, u.first_name, u.last_name;

COMMENT ON VIEW oan_pulse_v_project_teams IS 'Detailed view of all project team members';

-- Step 5: Create helper functions for project assignments
-- ============================================

-- Function: Check if user has access to project
CREATE OR REPLACE FUNCTION oan_pulse_user_has_project_access(
  p_user_id IN NUMBER,
  p_project_id IN NUMBER
) RETURN NUMBER AS
  v_count NUMBER;
BEGIN
  -- Check if user is assigned to project as team member
  SELECT COUNT(*) INTO v_count
  FROM oan_pulse_project_team_members
  WHERE user_id = p_user_id
  AND project_id = p_project_id;
  
  IF v_count > 0 THEN
    RETURN 1;
  END IF;
  
  -- Check if user is the project manager
  SELECT COUNT(*) INTO v_count
  FROM oan_pulse_projects
  WHERE project_id = p_project_id
  AND project_manager_id = p_user_id;
  
  IF v_count > 0 THEN
    RETURN 1;
  END IF;
  
  -- Check if user is ADMIN (admins have access to all projects)
  SELECT COUNT(*) INTO v_count
  FROM oan_pulse_users
  WHERE user_id = p_user_id
  AND role = 'ADMIN';
  
  IF v_count > 0 THEN
    RETURN 1;
  END IF;
  
  RETURN 0;
END;
/

COMMENT ON FUNCTION oan_pulse_user_has_project_access IS 'Returns 1 if user has access to project, 0 otherwise';

-- Step 6: Update existing test data (optional)
-- ============================================
-- Assign a manager to an existing project for testing
-- Uncomment and modify as needed:

/*
UPDATE oan_pulse_projects 
SET project_manager_id = 21  -- Test Manager
WHERE project_id = 1;  -- Replace with actual project_id

-- Assign employees to a project
INSERT INTO oan_pulse_project_team_members (project_id, user_id, role)
VALUES (1, 41, 'MEMBER');  -- Test Employee to project 1

COMMIT;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check projects with managers
SELECT * FROM oan_pulse_v_projects_with_managers;

-- Check user project assignments
SELECT * FROM oan_pulse_v_user_projects WHERE user_id = 41;  -- Test Employee

-- Check project teams
SELECT * FROM oan_pulse_v_project_teams;

-- Test access function
SELECT 
  oan_pulse_user_has_project_access(41, 1) as employee_has_access,
  oan_pulse_user_has_project_access(21, 1) as manager_has_access,
  oan_pulse_user_has_project_access(1, 1) as admin_has_access
FROM DUAL;

COMMIT;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
BEGIN
  DBMS_OUTPUT.PUT_LINE('✅ Project Assignments Schema Update Complete!');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Added:');
  DBMS_OUTPUT.PUT_LINE('- project_manager_id to projects table');
  DBMS_OUTPUT.PUT_LINE('- Verified project_team_members table');
  DBMS_OUTPUT.PUT_LINE('- Created 3 views for project assignments');
  DBMS_OUTPUT.PUT_LINE('- Created access check function');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Next: Create API endpoints for project team management');
END;
/

