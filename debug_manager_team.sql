-- ============================================
-- DEBUG: Manager Team Relationships
-- ============================================
-- Run this in SQL Workshop to check:
-- 1. Manager-employee relationships
-- 2. Time entries with PENDING status
-- 3. Which entries should show for each manager
-- ============================================

-- Step 1: Check all users and their managers
SELECT 
  u.user_id,
  u.first_name || ' ' || u.last_name as name,
  u.email,
  u.role,
  u.manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  m.role as manager_role
FROM oan_pulse_users u
LEFT JOIN oan_pulse_users m ON u.manager_id = m.user_id
ORDER BY u.role, u.user_id;

-- Step 2: Check time entries and their approval status
SELECT 
  te.time_entry_id,
  te.user_id,
  u.first_name || ' ' || u.last_name as employee_name,
  u.manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  te.entry_date,
  te.hours,
  te.approval_status,
  TO_CHAR(te.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM oan_pulse_time_entries te
INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
LEFT JOIN oan_pulse_users m ON u.manager_id = m.user_id
ORDER BY te.created_at DESC;

-- Step 3: Check pending entries for each manager
SELECT 
  m.user_id as manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  COUNT(te.time_entry_id) as pending_count
FROM oan_pulse_users m
LEFT JOIN oan_pulse_users e ON m.user_id = e.manager_id
LEFT JOIN oan_pulse_time_entries te ON e.user_id = te.user_id AND te.approval_status = 'PENDING'
WHERE m.role IN ('MANAGER', 'ADMIN')
GROUP BY m.user_id, m.first_name, m.last_name
ORDER BY m.user_id;

-- Step 4: Detailed view - What should each manager see?
SELECT 
  m.user_id as manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  e.user_id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  te.time_entry_id,
  te.entry_date,
  te.hours,
  te.approval_status,
  p.name as project_name
FROM oan_pulse_users m
INNER JOIN oan_pulse_users e ON m.user_id = e.manager_id
LEFT JOIN oan_pulse_time_entries te ON e.user_id = te.user_id
LEFT JOIN oan_pulse_projects p ON te.project_id = p.project_id
WHERE m.role IN ('MANAGER', 'ADMIN')
ORDER BY m.user_id, te.entry_date DESC;

-- Step 5: Fix missing manager_id relationships (if needed)
-- Uncomment and run if employees don't have managers assigned:

/*
-- Set Test Manager (user_id=21) as manager for all employees
UPDATE oan_pulse_users 
SET manager_id = 21 
WHERE role = 'EMPLOYEE' 
AND manager_id IS NULL;

COMMIT;
*/

-- Step 6: Check if there are any PENDING entries at all
SELECT 
  approval_status,
  COUNT(*) as count,
  SUM(hours) as total_hours
FROM oan_pulse_time_entries
GROUP BY approval_status;

