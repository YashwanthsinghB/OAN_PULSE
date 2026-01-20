-- ============================================
-- PROJECT TEAM MANAGEMENT: PL/SQL API PACKAGE
-- ============================================
-- This package contains all business logic for
-- project team assignments, task management, etc.
-- ============================================

CREATE OR REPLACE PACKAGE oan_pulse_project_team_api AS
  
  -- Assign user to project
  PROCEDURE assign_user_to_project(
    p_project_id IN NUMBER,
    p_user_id IN NUMBER,
    p_role IN VARCHAR2 DEFAULT 'MEMBER',
    p_assigned_by IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Remove user from project
  PROCEDURE remove_user_from_project(
    p_project_id IN NUMBER,
    p_user_id IN NUMBER,
    p_removed_by IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Assign manager to project
  PROCEDURE assign_manager_to_project(
    p_project_id IN NUMBER,
    p_manager_id IN NUMBER,
    p_assigned_by IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Get project team members
  PROCEDURE get_project_team(
    p_project_id IN NUMBER,
    o_result OUT CLOB
  );
  
  -- Get user's assigned projects
  PROCEDURE get_user_projects(
    p_user_id IN NUMBER,
    o_result OUT CLOB
  );
  
  -- Get tasks for a project
  PROCEDURE get_project_tasks(
    p_project_id IN NUMBER,
    p_active_only IN NUMBER DEFAULT 1,
    o_result OUT CLOB
  );
  
  -- Create task for a project
  PROCEDURE create_task(
    p_project_id IN NUMBER,
    p_name IN VARCHAR2,
    p_description IN VARCHAR2 DEFAULT NULL,
    p_is_billable IN NUMBER DEFAULT 1,
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_created_by IN NUMBER,
    o_task_id OUT NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Update task
  PROCEDURE update_task(
    p_task_id IN NUMBER,
    p_name IN VARCHAR2 DEFAULT NULL,
    p_description IN VARCHAR2 DEFAULT NULL,
    p_is_billable IN NUMBER DEFAULT NULL,
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_is_active IN NUMBER DEFAULT NULL,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
  -- Delete task (soft delete - set is_active = 0)
  PROCEDURE delete_task(
    p_task_id IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  );
  
END oan_pulse_project_team_api;
/

CREATE OR REPLACE PACKAGE BODY oan_pulse_project_team_api AS

  -- Assign user to project
  PROCEDURE assign_user_to_project(
    p_project_id IN NUMBER,
    p_user_id IN NUMBER,
    p_role IN VARCHAR2 DEFAULT 'MEMBER',
    p_assigned_by IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_project_exists NUMBER;
    v_user_exists NUMBER;
    v_already_assigned NUMBER;
  BEGIN
    o_success := 0;
    
    -- Validate project exists
    SELECT COUNT(*) INTO v_project_exists
    FROM oan_pulse_projects
    WHERE project_id = p_project_id;
    
    IF v_project_exists = 0 THEN
      o_message := 'Project not found';
      RETURN;
    END IF;
    
    -- Validate user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM oan_pulse_users
    WHERE user_id = p_user_id AND is_active = 1;
    
    IF v_user_exists = 0 THEN
      o_message := 'User not found or inactive';
      RETURN;
    END IF;
    
    -- Check if already assigned
    SELECT COUNT(*) INTO v_already_assigned
    FROM oan_pulse_project_team_members
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    IF v_already_assigned > 0 THEN
      o_message := 'User is already assigned to this project';
      RETURN;
    END IF;
    
    -- Insert assignment
    INSERT INTO oan_pulse_project_team_members (
      project_id,
      user_id,
      role,
      assigned_at
    ) VALUES (
      p_project_id,
      p_user_id,
      NVL(p_role, 'MEMBER'),
      SYSTIMESTAMP
    );
    
    COMMIT;
    o_success := 1;
    o_message := 'User assigned to project successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error assigning user: ' || SQLERRM;
  END assign_user_to_project;


  -- Remove user from project
  PROCEDURE remove_user_from_project(
    p_project_id IN NUMBER,
    p_user_id IN NUMBER,
    p_removed_by IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_assigned NUMBER;
  BEGIN
    o_success := 0;
    
    -- Check if assigned
    SELECT COUNT(*) INTO v_assigned
    FROM oan_pulse_project_team_members
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    IF v_assigned = 0 THEN
      o_message := 'User is not assigned to this project';
      RETURN;
    END IF;
    
    -- Remove assignment
    DELETE FROM oan_pulse_project_team_members
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    COMMIT;
    o_success := 1;
    o_message := 'User removed from project successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error removing user: ' || SQLERRM;
  END remove_user_from_project;


  -- Assign manager to project
  PROCEDURE assign_manager_to_project(
    p_project_id IN NUMBER,
    p_manager_id IN NUMBER,
    p_assigned_by IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_project_exists NUMBER;
    v_manager_exists NUMBER;
    v_manager_role VARCHAR2(20);
  BEGIN
    o_success := 0;
    
    -- Validate project exists
    SELECT COUNT(*) INTO v_project_exists
    FROM oan_pulse_projects
    WHERE project_id = p_project_id;
    
    IF v_project_exists = 0 THEN
      o_message := 'Project not found';
      RETURN;
    END IF;
    
    -- Validate manager exists and is a manager/admin
    BEGIN
      SELECT role INTO v_manager_role
      FROM oan_pulse_users
      WHERE user_id = p_manager_id AND is_active = 1;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        o_message := 'Manager not found or inactive';
        RETURN;
    END;
    
    IF v_manager_role NOT IN ('MANAGER', 'ADMIN') THEN
      o_message := 'User must be a Manager or Admin to be assigned as project manager';
      RETURN;
    END IF;
    
    -- Update project
    UPDATE oan_pulse_projects
    SET project_manager_id = p_manager_id,
        updated_at = SYSTIMESTAMP
    WHERE project_id = p_project_id;
    
    COMMIT;
    o_success := 1;
    o_message := 'Manager assigned to project successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error assigning manager: ' || SQLERRM;
  END assign_manager_to_project;


  -- Get project team members
  PROCEDURE get_project_team(
    p_project_id IN NUMBER,
    o_result OUT CLOB
  ) AS
    v_first BOOLEAN := TRUE;
  BEGIN
    o_result := '{"team_members":[';
    
    FOR rec IN (
      SELECT 
        ptm.user_id,
        u.first_name || ' ' || u.last_name as member_name,
        u.email,
        u.role as user_role,
        ptm.role as project_role,
        TO_CHAR(ptm.assigned_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as assigned_at
      FROM oan_pulse_project_team_members ptm
      INNER JOIN oan_pulse_users u ON ptm.user_id = u.user_id
      WHERE ptm.project_id = p_project_id
      AND u.is_active = 1
      ORDER BY u.first_name, u.last_name
    ) LOOP
      IF NOT v_first THEN
        o_result := o_result || ',';
      END IF;
      v_first := FALSE;
      
      o_result := o_result || '{';
      o_result := o_result || '"user_id":' || rec.user_id;
      o_result := o_result || ',"member_name":"' || rec.member_name || '"';
      o_result := o_result || ',"email":"' || rec.email || '"';
      o_result := o_result || ',"user_role":"' || rec.user_role || '"';
      o_result := o_result || ',"project_role":"' || rec.project_role || '"';
      o_result := o_result || ',"assigned_at":"' || rec.assigned_at || '"';
      o_result := o_result || '}';
    END LOOP;
    
    o_result := o_result || ']}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_project_team;


  -- Get user's assigned projects
  PROCEDURE get_user_projects(
    p_user_id IN NUMBER,
    o_result OUT CLOB
  ) AS
    v_first BOOLEAN := TRUE;
    v_is_admin NUMBER;
  BEGIN
    -- Check if user is admin (admins see all projects)
    SELECT COUNT(*) INTO v_is_admin
    FROM oan_pulse_users
    WHERE user_id = p_user_id AND role = 'ADMIN';
    
    o_result := '{"projects":[';
    
    IF v_is_admin > 0 THEN
      -- Admin sees all active projects
      FOR rec IN (
        SELECT 
          p.project_id,
          p.name as project_name,
          p.client_id,
          c.name as client_name,
          p.status,
          p.is_billable,
          p.project_manager_id,
          m.first_name || ' ' || m.last_name as manager_name
        FROM oan_pulse_projects p
        LEFT JOIN oan_pulse_clients c ON p.client_id = c.client_id
        LEFT JOIN oan_pulse_users m ON p.project_manager_id = m.user_id
        WHERE p.status = 'ACTIVE'
        ORDER BY p.name
      ) LOOP
        IF NOT v_first THEN
          o_result := o_result || ',';
        END IF;
        v_first := FALSE;
        
        o_result := o_result || '{';
        o_result := o_result || '"project_id":' || rec.project_id;
        o_result := o_result || ',"project_name":"' || rec.project_name || '"';
        o_result := o_result || ',"client_id":' || NVL(TO_CHAR(rec.client_id), 'null');
        o_result := o_result || ',"client_name":' || CASE WHEN rec.client_name IS NOT NULL THEN '"' || rec.client_name || '"' ELSE 'null' END;
        o_result := o_result || ',"status":"' || rec.status || '"';
        o_result := o_result || ',"is_billable":' || rec.is_billable;
        o_result := o_result || ',"project_manager_id":' || NVL(TO_CHAR(rec.project_manager_id), 'null');
        o_result := o_result || ',"manager_name":' || CASE WHEN rec.manager_name IS NOT NULL THEN '"' || rec.manager_name || '"' ELSE 'null' END;
        o_result := o_result || '}';
      END LOOP;
    ELSE
      -- Regular users see only assigned projects
      FOR rec IN (
        SELECT DISTINCT
          p.project_id,
          p.name as project_name,
          p.client_id,
          c.name as client_name,
          p.status,
          p.is_billable,
          p.project_manager_id,
          m.first_name || ' ' || m.last_name as manager_name,
          CASE 
            WHEN p.project_manager_id = p_user_id THEN 'MANAGER'
            ELSE ptm.role
          END as access_level
        FROM oan_pulse_projects p
        LEFT JOIN oan_pulse_clients c ON p.client_id = c.client_id
        LEFT JOIN oan_pulse_users m ON p.project_manager_id = m.user_id
        LEFT JOIN oan_pulse_project_team_members ptm ON p.project_id = ptm.project_id AND ptm.user_id = p_user_id
        WHERE p.status = 'ACTIVE'
        AND (p.project_manager_id = p_user_id OR ptm.user_id = p_user_id)
        ORDER BY p.name
      ) LOOP
        IF NOT v_first THEN
          o_result := o_result || ',';
        END IF;
        v_first := FALSE;
        
        o_result := o_result || '{';
        o_result := o_result || '"project_id":' || rec.project_id;
        o_result := o_result || ',"project_name":"' || rec.project_name || '"';
        o_result := o_result || ',"client_id":' || NVL(TO_CHAR(rec.client_id), 'null');
        o_result := o_result || ',"client_name":' || CASE WHEN rec.client_name IS NOT NULL THEN '"' || rec.client_name || '"' ELSE 'null' END;
        o_result := o_result || ',"status":"' || rec.status || '"';
        o_result := o_result || ',"is_billable":' || rec.is_billable;
        o_result := o_result || ',"project_manager_id":' || NVL(TO_CHAR(rec.project_manager_id), 'null');
        o_result := o_result || ',"manager_name":' || CASE WHEN rec.manager_name IS NOT NULL THEN '"' || rec.manager_name || '"' ELSE 'null' END;
        o_result := o_result || ',"access_level":"' || rec.access_level || '"';
        o_result := o_result || '}';
      END LOOP;
    END IF;
    
    o_result := o_result || ']}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_user_projects;


  -- Get tasks for a project
  PROCEDURE get_project_tasks(
    p_project_id IN NUMBER,
    p_active_only IN NUMBER DEFAULT 1,
    o_result OUT CLOB
  ) AS
    v_first BOOLEAN := TRUE;
  BEGIN
    o_result := '{"tasks":[';
    
    FOR rec IN (
      SELECT 
        task_id,
        name,
        description,
        is_billable,
        hourly_rate,
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      FROM oan_pulse_tasks
      WHERE project_id = p_project_id
      AND (p_active_only = 0 OR is_active = 1)
      ORDER BY name
    ) LOOP
      IF NOT v_first THEN
        o_result := o_result || ',';
      END IF;
      v_first := FALSE;
      
      o_result := o_result || '{';
      o_result := o_result || '"task_id":' || rec.task_id;
      o_result := o_result || ',"name":"' || rec.name || '"';
      o_result := o_result || ',"description":' || CASE WHEN rec.description IS NOT NULL THEN '"' || REPLACE(rec.description, '"', '\"') || '"' ELSE 'null' END;
      o_result := o_result || ',"is_billable":' || rec.is_billable;
      o_result := o_result || ',"hourly_rate":' || NVL(TO_CHAR(rec.hourly_rate), 'null');
      o_result := o_result || ',"is_active":' || rec.is_active;
      o_result := o_result || ',"created_at":"' || rec.created_at || '"';
      o_result := o_result || '}';
    END LOOP;
    
    o_result := o_result || ']}';
    
  EXCEPTION
    WHEN OTHERS THEN
      o_result := '{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}';
  END get_project_tasks;


  -- Create task for a project
  PROCEDURE create_task(
    p_project_id IN NUMBER,
    p_name IN VARCHAR2,
    p_description IN VARCHAR2 DEFAULT NULL,
    p_is_billable IN NUMBER DEFAULT 1,
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_created_by IN NUMBER,
    o_task_id OUT NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_project_exists NUMBER;
  BEGIN
    o_success := 0;
    o_task_id := NULL;
    
    -- Validate project exists
    SELECT COUNT(*) INTO v_project_exists
    FROM oan_pulse_projects
    WHERE project_id = p_project_id;
    
    IF v_project_exists = 0 THEN
      o_message := 'Project not found';
      RETURN;
    END IF;
    
    -- Validate name
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
      o_message := 'Task name is required';
      RETURN;
    END IF;
    
    -- Insert task
    INSERT INTO oan_pulse_tasks (
      project_id,
      name,
      description,
      is_billable,
      hourly_rate,
      is_active,
      created_at
    ) VALUES (
      p_project_id,
      p_name,
      p_description,
      NVL(p_is_billable, 1),
      p_hourly_rate,
      1,
      SYSTIMESTAMP
    )
    RETURNING task_id INTO o_task_id;
    
    COMMIT;
    o_success := 1;
    o_message := 'Task created successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error creating task: ' || SQLERRM;
  END create_task;


  -- Update task
  PROCEDURE update_task(
    p_task_id IN NUMBER,
    p_name IN VARCHAR2 DEFAULT NULL,
    p_description IN VARCHAR2 DEFAULT NULL,
    p_is_billable IN NUMBER DEFAULT NULL,
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_is_active IN NUMBER DEFAULT NULL,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_task_exists NUMBER;
  BEGIN
    o_success := 0;
    
    -- Validate task exists
    SELECT COUNT(*) INTO v_task_exists
    FROM oan_pulse_tasks
    WHERE task_id = p_task_id;
    
    IF v_task_exists = 0 THEN
      o_message := 'Task not found';
      RETURN;
    END IF;
    
    -- Update only provided fields
    IF p_name IS NOT NULL THEN
      UPDATE oan_pulse_tasks SET name = p_name, updated_at = SYSTIMESTAMP WHERE task_id = p_task_id;
    END IF;
    
    IF p_description IS NOT NULL THEN
      UPDATE oan_pulse_tasks SET description = p_description, updated_at = SYSTIMESTAMP WHERE task_id = p_task_id;
    END IF;
    
    IF p_is_billable IS NOT NULL THEN
      UPDATE oan_pulse_tasks SET is_billable = p_is_billable, updated_at = SYSTIMESTAMP WHERE task_id = p_task_id;
    END IF;
    
    IF p_hourly_rate IS NOT NULL THEN
      UPDATE oan_pulse_tasks SET hourly_rate = p_hourly_rate, updated_at = SYSTIMESTAMP WHERE task_id = p_task_id;
    END IF;
    
    IF p_is_active IS NOT NULL THEN
      UPDATE oan_pulse_tasks SET is_active = p_is_active, updated_at = SYSTIMESTAMP WHERE task_id = p_task_id;
    END IF;
    
    COMMIT;
    o_success := 1;
    o_message := 'Task updated successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error updating task: ' || SQLERRM;
  END update_task;


  -- Delete task (soft delete)
  PROCEDURE delete_task(
    p_task_id IN NUMBER,
    o_success OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
  BEGIN
    o_success := 0;
    
    -- Soft delete: set is_active = 0
    UPDATE oan_pulse_tasks
    SET is_active = 0,
        updated_at = SYSTIMESTAMP
    WHERE task_id = p_task_id;
    
    IF SQL%ROWCOUNT = 0 THEN
      o_message := 'Task not found';
      RETURN;
    END IF;
    
    COMMIT;
    o_success := 1;
    o_message := 'Task deleted successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error deleting task: ' || SQLERRM;
  END delete_task;

END oan_pulse_project_team_api;
/

-- ============================================
-- VERIFICATION
-- ============================================
BEGIN
  DBMS_OUTPUT.PUT_LINE('✅ Project Team API Package Created Successfully!');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Created procedures:');
  DBMS_OUTPUT.PUT_LINE('- assign_user_to_project');
  DBMS_OUTPUT.PUT_LINE('- remove_user_from_project');
  DBMS_OUTPUT.PUT_LINE('- assign_manager_to_project');
  DBMS_OUTPUT.PUT_LINE('- get_project_team');
  DBMS_OUTPUT.PUT_LINE('- get_user_projects');
  DBMS_OUTPUT.PUT_LINE('- get_project_tasks');
  DBMS_OUTPUT.PUT_LINE('- create_task');
  DBMS_OUTPUT.PUT_LINE('- update_task');
  DBMS_OUTPUT.PUT_LINE('- delete_task');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Next: Create APEX REST handlers');
END;
/

