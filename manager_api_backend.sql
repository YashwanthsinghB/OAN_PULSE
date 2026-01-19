-- ============================================
-- MANAGER FEATURES: PL/SQL API PACKAGE
-- ============================================
-- This package contains all business logic for
-- manager features: team management, approvals, etc.
-- ============================================

CREATE OR REPLACE PACKAGE oan_pulse_manager_api AS
  
  -- Get team members for a manager
  PROCEDURE get_team_members(
    p_manager_id IN NUMBER,
    o_result OUT CLOB
  );
  
  -- Get pending approvals for a manager
  PROCEDURE get_pending_approvals(
    p_manager_id IN NUMBER,
    o_result OUT CLOB
  );
  
  -- Get team time entries (all statuses)
  PROCEDURE get_team_time_entries(
    p_manager_id IN NUMBER,
    p_start_date IN DATE DEFAULT NULL,
    p_end_date IN DATE DEFAULT NULL,
    p_status IN VARCHAR2 DEFAULT NULL,
    o_result OUT CLOB
  );
  
  -- Approve a time entry
  PROCEDURE approve_time_entry(
    p_time_entry_id IN NUMBER,
    p_manager_id IN NUMBER,
    p_notes IN VARCHAR2 DEFAULT NULL,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Reject a time entry
  PROCEDURE reject_time_entry(
    p_time_entry_id IN NUMBER,
    p_manager_id IN NUMBER,
    p_reason IN VARCHAR2,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Get team statistics
  PROCEDURE get_team_stats(
    p_manager_id IN NUMBER,
    p_start_date IN DATE DEFAULT NULL,
    p_end_date IN DATE DEFAULT NULL,
    o_result OUT CLOB
  );
  
END oan_pulse_manager_api;
/

CREATE OR REPLACE PACKAGE BODY oan_pulse_manager_api AS

  -- Get team members for a manager
  PROCEDURE get_team_members(
    p_manager_id IN NUMBER,
    o_result OUT CLOB
  ) AS
    v_first BOOLEAN := TRUE;
    v_count NUMBER;
  BEGIN
    o_result := '{"team_members":[';
    
    FOR rec IN (
      SELECT 
        user_id,
        email,
        first_name,
        last_name,
        role,
        hourly_rate,
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      FROM oan_pulse_users
      WHERE manager_id = p_manager_id
      AND is_active = 1
      ORDER BY first_name, last_name
    ) LOOP
      IF NOT v_first THEN
        o_result := o_result || ',';
      END IF;
      v_first := FALSE;
      
      o_result := o_result || '{';
      o_result := o_result || '"user_id":' || rec.user_id;
      o_result := o_result || ',"email":"' || rec.email || '"';
      o_result := o_result || ',"first_name":"' || rec.first_name || '"';
      o_result := o_result || ',"last_name":"' || rec.last_name || '"';
      o_result := o_result || ',"role":"' || rec.role || '"';
      o_result := o_result || ',"hourly_rate":' || NVL(TO_CHAR(rec.hourly_rate), 'null');
      o_result := o_result || ',"is_active":' || rec.is_active;
      o_result := o_result || ',"created_at":"' || rec.created_at || '"';
      o_result := o_result || '}';
    END LOOP;
    
    -- Get count separately
    SELECT COUNT(*) INTO v_count 
    FROM oan_pulse_users 
    WHERE manager_id = p_manager_id AND is_active = 1;
    
    o_result := o_result || '],"count":' || v_count;
    o_result := o_result || '}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_team_members;


  -- Get pending approvals for a manager
  PROCEDURE get_pending_approvals(
    p_manager_id IN NUMBER,
    o_result OUT CLOB
  ) AS
    v_first BOOLEAN := TRUE;
    v_count NUMBER;
  BEGIN
    o_result := '{"pending_approvals":[';
    
    FOR rec IN (
      SELECT 
        te.time_entry_id,
        te.user_id,
        u.first_name || ' ' || u.last_name as employee_name,
        te.project_id,
        p.name as project_name,
        TO_CHAR(te.entry_date, 'YYYY-MM-DD') as entry_date,
        te.hours,
        te.notes,
        te.is_billable,
        te.approval_status,
        TO_CHAR(te.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      FROM oan_pulse_time_entries te
      INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
      LEFT JOIN oan_pulse_projects p ON te.project_id = p.project_id
      WHERE u.manager_id = p_manager_id
      AND te.approval_status = 'PENDING'
      ORDER BY te.entry_date DESC, te.created_at DESC
    ) LOOP
      IF NOT v_first THEN
        o_result := o_result || ',';
      END IF;
      v_first := FALSE;
      
      o_result := o_result || '{';
      o_result := o_result || '"time_entry_id":' || rec.time_entry_id;
      o_result := o_result || ',"user_id":' || rec.user_id;
      o_result := o_result || ',"employee_name":"' || rec.employee_name || '"';
      o_result := o_result || ',"project_id":' || NVL(TO_CHAR(rec.project_id), 'null');
      o_result := o_result || ',"project_name":' || CASE WHEN rec.project_name IS NOT NULL THEN '"' || rec.project_name || '"' ELSE 'null' END;
      o_result := o_result || ',"entry_date":"' || rec.entry_date || '"';
      o_result := o_result || ',"hours":' || rec.hours;
      o_result := o_result || ',"notes":' || CASE WHEN rec.notes IS NOT NULL THEN '"' || REPLACE(rec.notes, '"', '\"') || '"' ELSE 'null' END;
      o_result := o_result || ',"is_billable":' || rec.is_billable;
      o_result := o_result || ',"approval_status":"' || rec.approval_status || '"';
      o_result := o_result || ',"created_at":"' || rec.created_at || '"';
      o_result := o_result || '}';
    END LOOP;
    
    -- Get count separately
    SELECT COUNT(*) INTO v_count
    FROM oan_pulse_time_entries te
    INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
    WHERE u.manager_id = p_manager_id
    AND te.approval_status = 'PENDING';
    
    o_result := o_result || '],"count":' || v_count;
    o_result := o_result || '}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_pending_approvals;


  -- Get team time entries (all statuses, with filters)
  PROCEDURE get_team_time_entries(
    p_manager_id IN NUMBER,
    p_start_date IN DATE DEFAULT NULL,
    p_end_date IN DATE DEFAULT NULL,
    p_status IN VARCHAR2 DEFAULT NULL,
    o_result OUT CLOB
  ) AS
    v_first BOOLEAN := TRUE;
    v_start_date DATE;
    v_end_date DATE;
  BEGIN
    -- Default date range: current week
    v_start_date := NVL(p_start_date, TRUNC(SYSDATE, 'IW'));
    v_end_date := NVL(p_end_date, TRUNC(SYSDATE, 'IW') + 6);
    
    o_result := '{"time_entries":[';
    
    FOR rec IN (
      SELECT 
        te.time_entry_id,
        te.user_id,
        u.first_name || ' ' || u.last_name as employee_name,
        te.project_id,
        p.name as project_name,
        TO_CHAR(te.entry_date, 'YYYY-MM-DD') as entry_date,
        te.hours,
        te.notes,
        te.is_billable,
        te.approval_status,
        te.approved_by,
        TO_CHAR(te.approved_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as approved_at,
        te.rejection_reason,
        TO_CHAR(te.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      FROM oan_pulse_time_entries te
      INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
      LEFT JOIN oan_pulse_projects p ON te.project_id = p.project_id
      WHERE u.manager_id = p_manager_id
      AND te.entry_date BETWEEN v_start_date AND v_end_date
      AND (p_status IS NULL OR te.approval_status = p_status)
      ORDER BY te.entry_date DESC, u.first_name, te.created_at DESC
    ) LOOP
      IF NOT v_first THEN
        o_result := o_result || ',';
      END IF;
      v_first := FALSE;
      
      o_result := o_result || '{';
      o_result := o_result || '"time_entry_id":' || rec.time_entry_id;
      o_result := o_result || ',"user_id":' || rec.user_id;
      o_result := o_result || ',"employee_name":"' || rec.employee_name || '"';
      o_result := o_result || ',"project_id":' || NVL(TO_CHAR(rec.project_id), 'null');
      o_result := o_result || ',"project_name":' || CASE WHEN rec.project_name IS NOT NULL THEN '"' || rec.project_name || '"' ELSE 'null' END;
      o_result := o_result || ',"entry_date":"' || rec.entry_date || '"';
      o_result := o_result || ',"hours":' || rec.hours;
      o_result := o_result || ',"notes":' || CASE WHEN rec.notes IS NOT NULL THEN '"' || REPLACE(rec.notes, '"', '\"') || '"' ELSE 'null' END;
      o_result := o_result || ',"is_billable":' || rec.is_billable;
      o_result := o_result || ',"approval_status":"' || rec.approval_status || '"';
      o_result := o_result || ',"approved_by":' || NVL(TO_CHAR(rec.approved_by), 'null');
      o_result := o_result || ',"approved_at":' || CASE WHEN rec.approved_at IS NOT NULL THEN '"' || rec.approved_at || '"' ELSE 'null' END;
      o_result := o_result || ',"rejection_reason":' || CASE WHEN rec.rejection_reason IS NOT NULL THEN '"' || REPLACE(rec.rejection_reason, '"', '\"') || '"' ELSE 'null' END;
      o_result := o_result || ',"created_at":"' || rec.created_at || '"';
      o_result := o_result || '}';
    END LOOP;
    
    o_result := o_result || ']';
    o_result := o_result || ',"start_date":"' || TO_CHAR(v_start_date, 'YYYY-MM-DD') || '"';
    o_result := o_result || ',"end_date":"' || TO_CHAR(v_end_date, 'YYYY-MM-DD') || '"';
    o_result := o_result || '}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_team_time_entries;


  -- Approve a time entry
  PROCEDURE approve_time_entry(
    p_time_entry_id IN NUMBER,
    p_manager_id IN NUMBER,
    p_notes IN VARCHAR2 DEFAULT NULL,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_user_id NUMBER;
    v_user_manager_id NUMBER;
  BEGIN
    o_success := 0;
    
    -- Verify the time entry exists and belongs to the manager's team
    BEGIN
      SELECT te.user_id, u.manager_id
      INTO v_user_id, v_user_manager_id
      FROM oan_pulse_time_entries te
      INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
      WHERE te.time_entry_id = p_time_entry_id;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        o_message := 'Time entry not found';
        RETURN;
    END;
    
    -- Verify manager has permission
    IF v_user_manager_id != p_manager_id THEN
      o_message := 'You do not have permission to approve this time entry';
      RETURN;
    END IF;
    
    -- Update the time entry
    UPDATE oan_pulse_time_entries
    SET approval_status = 'APPROVED',
        approved_by = p_manager_id,
        approved_at = SYSTIMESTAMP,
        rejection_reason = NULL
    WHERE time_entry_id = p_time_entry_id;
    
    -- Log to history (trigger will handle this)
    
    COMMIT;
    o_success := 1;
    o_message := 'Time entry approved successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error approving time entry: ' || SQLERRM;
  END approve_time_entry;


  -- Reject a time entry
  PROCEDURE reject_time_entry(
    p_time_entry_id IN NUMBER,
    p_manager_id IN NUMBER,
    p_reason IN VARCHAR2,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_user_id NUMBER;
    v_user_manager_id NUMBER;
  BEGIN
    o_success := 0;
    
    -- Validate reason
    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
      o_message := 'Rejection reason is required';
      RETURN;
    END IF;
    
    -- Verify the time entry exists and belongs to the manager's team
    BEGIN
      SELECT te.user_id, u.manager_id
      INTO v_user_id, v_user_manager_id
      FROM oan_pulse_time_entries te
      INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
      WHERE te.time_entry_id = p_time_entry_id;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        o_message := 'Time entry not found';
        RETURN;
    END;
    
    -- Verify manager has permission
    IF v_user_manager_id != p_manager_id THEN
      o_message := 'You do not have permission to reject this time entry';
      RETURN;
    END IF;
    
    -- Update the time entry
    UPDATE oan_pulse_time_entries
    SET approval_status = 'REJECTED',
        approved_by = p_manager_id,
        approved_at = SYSTIMESTAMP,
        rejection_reason = p_reason
    WHERE time_entry_id = p_time_entry_id;
    
    -- Log to history (trigger will handle this)
    
    COMMIT;
    o_success := 1;
    o_message := 'Time entry rejected successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error rejecting time entry: ' || SQLERRM;
  END reject_time_entry;


  -- Get team statistics
  PROCEDURE get_team_stats(
    p_manager_id IN NUMBER,
    p_start_date IN DATE DEFAULT NULL,
    p_end_date IN DATE DEFAULT NULL,
    o_result OUT CLOB
  ) AS
    v_start_date DATE;
    v_end_date DATE;
    v_total_hours NUMBER;
    v_approved_hours NUMBER;
    v_pending_hours NUMBER;
    v_rejected_hours NUMBER;
    v_billable_hours NUMBER;
    v_pending_count NUMBER;
    v_approved_count NUMBER;
    v_rejected_count NUMBER;
    v_team_size NUMBER;
    v_first BOOLEAN := TRUE;
  BEGIN
    -- Default date range: current month
    v_start_date := NVL(p_start_date, TRUNC(SYSDATE, 'MM'));
    v_end_date := NVL(p_end_date, LAST_DAY(SYSDATE));
    
    -- Get aggregate stats
    SELECT 
      NVL(SUM(te.hours), 0),
      NVL(SUM(CASE WHEN te.approval_status = 'APPROVED' THEN te.hours ELSE 0 END), 0),
      NVL(SUM(CASE WHEN te.approval_status = 'PENDING' THEN te.hours ELSE 0 END), 0),
      NVL(SUM(CASE WHEN te.approval_status = 'REJECTED' THEN te.hours ELSE 0 END), 0),
      NVL(SUM(CASE WHEN te.is_billable = 1 THEN te.hours ELSE 0 END), 0),
      NVL(SUM(CASE WHEN te.approval_status = 'PENDING' THEN 1 ELSE 0 END), 0),
      NVL(SUM(CASE WHEN te.approval_status = 'APPROVED' THEN 1 ELSE 0 END), 0),
      NVL(SUM(CASE WHEN te.approval_status = 'REJECTED' THEN 1 ELSE 0 END), 0)
    INTO 
      v_total_hours,
      v_approved_hours,
      v_pending_hours,
      v_rejected_hours,
      v_billable_hours,
      v_pending_count,
      v_approved_count,
      v_rejected_count
    FROM oan_pulse_time_entries te
    INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
    WHERE u.manager_id = p_manager_id
    AND te.entry_date BETWEEN v_start_date AND v_end_date;
    
    -- Get team size
    SELECT COUNT(*) INTO v_team_size
    FROM oan_pulse_users
    WHERE manager_id = p_manager_id
    AND is_active = 1;
    
    -- Build JSON response
    o_result := '{';
    o_result := o_result || '"total_hours":' || v_total_hours;
    o_result := o_result || ',"approved_hours":' || v_approved_hours;
    o_result := o_result || ',"pending_hours":' || v_pending_hours;
    o_result := o_result || ',"rejected_hours":' || v_rejected_hours;
    o_result := o_result || ',"billable_hours":' || v_billable_hours;
    o_result := o_result || ',"pending_count":' || v_pending_count;
    o_result := o_result || ',"approved_count":' || v_approved_count;
    o_result := o_result || ',"rejected_count":' || v_rejected_count;
    o_result := o_result || ',"team_size":' || v_team_size;
    o_result := o_result || ',"start_date":"' || TO_CHAR(v_start_date, 'YYYY-MM-DD') || '"';
    o_result := o_result || ',"end_date":"' || TO_CHAR(v_end_date, 'YYYY-MM-DD') || '"';
    
    -- Add per-employee breakdown
    o_result := o_result || ',"by_employee":[';
    FOR rec IN (
      SELECT 
        te.user_id,
        u.first_name || ' ' || u.last_name as employee_name,
        COUNT(*) as entry_count,
        SUM(te.hours) as total_hours,
        SUM(CASE WHEN te.approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN te.approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
      FROM oan_pulse_time_entries te
      INNER JOIN oan_pulse_users u ON te.user_id = u.user_id
      WHERE u.manager_id = p_manager_id
      AND te.entry_date BETWEEN v_start_date AND v_end_date
      GROUP BY te.user_id, u.first_name, u.last_name
      ORDER BY u.first_name, u.last_name
    ) LOOP
      IF NOT v_first THEN
        o_result := o_result || ',';
      END IF;
      v_first := FALSE;
      
      o_result := o_result || '{';
      o_result := o_result || '"user_id":' || rec.user_id;
      o_result := o_result || ',"employee_name":"' || rec.employee_name || '"';
      o_result := o_result || ',"entry_count":' || rec.entry_count;
      o_result := o_result || ',"total_hours":' || rec.total_hours;
      o_result := o_result || ',"pending_count":' || rec.pending_count;
      o_result := o_result || ',"approved_count":' || rec.approved_count;
      o_result := o_result || '}';
    END LOOP;
    o_result := o_result || ']';
    
    o_result := o_result || '}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_team_stats;

END oan_pulse_manager_api;
/

-- ============================================
-- VERIFICATION
-- ============================================
BEGIN
  DBMS_OUTPUT.PUT_LINE('✅ Manager API Package Created Successfully!');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Created procedures:');
  DBMS_OUTPUT.PUT_LINE('- get_team_members');
  DBMS_OUTPUT.PUT_LINE('- get_pending_approvals');
  DBMS_OUTPUT.PUT_LINE('- get_team_time_entries');
  DBMS_OUTPUT.PUT_LINE('- approve_time_entry');
  DBMS_OUTPUT.PUT_LINE('- reject_time_entry');
  DBMS_OUTPUT.PUT_LINE('- get_team_stats');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Next: Create APEX REST handlers');
END;
/

