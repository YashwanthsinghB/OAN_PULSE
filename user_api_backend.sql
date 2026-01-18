-- =====================================================
-- USER MANAGEMENT API - BACKEND LOGIC ONLY
-- =====================================================
-- Run this in SQL Developer or APEX SQL Workshop
-- The REST handler code will be added directly in APEX
-- =====================================================

-- Package for user management API operations
CREATE OR REPLACE PACKAGE oan_pulse_user_api AS
  -- Create new user with hashed password
  PROCEDURE create_user(
    p_email IN VARCHAR2,
    p_password IN VARCHAR2,
    p_first_name IN VARCHAR2,
    p_last_name IN VARCHAR2,
    p_role IN VARCHAR2 DEFAULT 'EMPLOYEE',
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_is_active IN NUMBER DEFAULT 1,
    o_user_id OUT NUMBER,
    o_message OUT VARCHAR2,
    o_success OUT NUMBER
  );
  
  -- Update existing user
  PROCEDURE update_user(
    p_user_id IN NUMBER,
    p_email IN VARCHAR2 DEFAULT NULL,
    p_password IN VARCHAR2 DEFAULT NULL,
    p_first_name IN VARCHAR2 DEFAULT NULL,
    p_last_name IN VARCHAR2 DEFAULT NULL,
    p_role IN VARCHAR2 DEFAULT NULL,
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_is_active IN NUMBER DEFAULT NULL,
    o_message OUT VARCHAR2,
    o_success OUT NUMBER
  );
END oan_pulse_user_api;
/

-- Package body implementation
CREATE OR REPLACE PACKAGE BODY oan_pulse_user_api AS

  -- Create new user
  PROCEDURE create_user(
    p_email IN VARCHAR2,
    p_password IN VARCHAR2,
    p_first_name IN VARCHAR2,
    p_last_name IN VARCHAR2,
    p_role IN VARCHAR2 DEFAULT 'EMPLOYEE',
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_is_active IN NUMBER DEFAULT 1,
    o_user_id OUT NUMBER,
    o_message OUT VARCHAR2,
    o_success OUT NUMBER
  ) AS
    v_password_hash VARCHAR2(100);
    v_existing_count NUMBER;
  BEGIN
    o_success := 0;
    o_user_id := NULL;
    
    -- Validate required fields
    IF p_email IS NULL OR p_password IS NULL OR p_first_name IS NULL OR p_last_name IS NULL THEN
      o_message := 'Required fields missing';
      RETURN;
    END IF;
    
    -- Validate email format (basic check)
    IF NOT REGEXP_LIKE(p_email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
      o_message := 'Invalid email format';
      RETURN;
    END IF;
    
    -- Check if email already exists
    SELECT COUNT(*) INTO v_existing_count
    FROM oan_pulse_users
    WHERE LOWER(email) = LOWER(p_email);
    
    IF v_existing_count > 0 THEN
      o_message := 'Email already exists';
      RETURN;
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE') THEN
      o_message := 'Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE';
      RETURN;
    END IF;
    
    -- Hash the password
    v_password_hash := oan_pulse_auth_utils.hash_password(p_password);
    
    -- Insert new user
    INSERT INTO oan_pulse_users (
      email, 
      password_hash, 
      first_name, 
      last_name, 
      role, 
      hourly_rate, 
      is_active,
      created_at,
      updated_at
    ) VALUES (
      p_email,
      v_password_hash,
      p_first_name,
      p_last_name,
      p_role,
      p_hourly_rate,
      p_is_active,
      SYSTIMESTAMP,
      SYSTIMESTAMP
    ) RETURNING user_id INTO o_user_id;
    
    COMMIT;
    o_success := 1;
    o_message := 'User created successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error creating user: ' || SQLERRM;
  END create_user;
  
  -- Update existing user
  PROCEDURE update_user(
    p_user_id IN NUMBER,
    p_email IN VARCHAR2 DEFAULT NULL,
    p_password IN VARCHAR2 DEFAULT NULL,
    p_first_name IN VARCHAR2 DEFAULT NULL,
    p_last_name IN VARCHAR2 DEFAULT NULL,
    p_role IN VARCHAR2 DEFAULT NULL,
    p_hourly_rate IN NUMBER DEFAULT NULL,
    p_is_active IN NUMBER DEFAULT NULL,
    o_message OUT VARCHAR2,
    o_success OUT NUMBER
  ) AS
    v_password_hash VARCHAR2(100);
    v_user_exists NUMBER;
  BEGIN
    o_success := 0;
    
    -- Check if user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM oan_pulse_users
    WHERE user_id = p_user_id;
    
    IF v_user_exists = 0 THEN
      o_message := 'User not found';
      RETURN;
    END IF;
    
    -- Validate role if provided
    IF p_role IS NOT NULL AND p_role NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE') THEN
      o_message := 'Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE';
      RETURN;
    END IF;
    
    -- Update fields that are provided
    IF p_email IS NOT NULL THEN
      UPDATE oan_pulse_users SET email = p_email WHERE user_id = p_user_id;
    END IF;
    
    IF p_password IS NOT NULL THEN
      v_password_hash := oan_pulse_auth_utils.hash_password(p_password);
      UPDATE oan_pulse_users SET password_hash = v_password_hash WHERE user_id = p_user_id;
    END IF;
    
    IF p_first_name IS NOT NULL THEN
      UPDATE oan_pulse_users SET first_name = p_first_name WHERE user_id = p_user_id;
    END IF;
    
    IF p_last_name IS NOT NULL THEN
      UPDATE oan_pulse_users SET last_name = p_last_name WHERE user_id = p_user_id;
    END IF;
    
    IF p_role IS NOT NULL THEN
      UPDATE oan_pulse_users SET role = p_role WHERE user_id = p_user_id;
    END IF;
    
    IF p_hourly_rate IS NOT NULL THEN
      UPDATE oan_pulse_users SET hourly_rate = p_hourly_rate WHERE user_id = p_user_id;
    END IF;
    
    IF p_is_active IS NOT NULL THEN
      UPDATE oan_pulse_users SET is_active = p_is_active WHERE user_id = p_user_id;
    END IF;
    
    -- Always update timestamp
    UPDATE oan_pulse_users SET updated_at = SYSTIMESTAMP WHERE user_id = p_user_id;
    
    COMMIT;
    o_success := 1;
    o_message := 'User updated successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_success := 0;
      o_message := 'Error updating user: ' || SQLERRM;
  END update_user;
  
END oan_pulse_user_api;
/

-- =====================================================
-- TEST THE PACKAGE
-- =====================================================
-- Test user creation
DECLARE
  v_user_id NUMBER;
  v_message VARCHAR2(500);
  v_success NUMBER;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Testing User Creation ===');
  
  oan_pulse_user_api.create_user(
    p_email => 'testuser@oan-pulse.com',
    p_password => 'Test1234!',
    p_first_name => 'Test',
    p_last_name => 'User',
    p_role => 'EMPLOYEE',
    p_hourly_rate => 50,
    p_is_active => 1,
    o_user_id => v_user_id,
    o_message => v_message,
    o_success => v_success
  );
  
  IF v_success = 1 THEN
    DBMS_OUTPUT.PUT_LINE('✅ SUCCESS: ' || v_message);
    DBMS_OUTPUT.PUT_LINE('   User ID: ' || v_user_id);
  ELSE
    DBMS_OUTPUT.PUT_LINE('❌ FAILED: ' || v_message);
  END IF;
END;
/

-- Verify the user was created
SELECT user_id, email, first_name, last_name, role, hourly_rate, is_active
FROM oan_pulse_users
WHERE email = 'testuser@oan-pulse.com';

-- Clean up test user (optional)
-- DELETE FROM oan_pulse_users WHERE email = 'testuser@oan-pulse.com';
-- COMMIT;

-- =====================================================
-- NEXT STEP: APEX REST SETUP
-- =====================================================
/*
Now that the package is compiled, you need to create REST handlers in APEX.
See APEX_REST_HANDLERS.md for the exact code to use in APEX.
*/

