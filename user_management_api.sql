-- =====================================================
-- USER MANAGEMENT REST API HANDLERS
-- =====================================================
-- These handlers provide secure user CRUD operations
-- with proper password hashing and validation
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
    p_created_by IN NUMBER DEFAULT 1,
    o_user_id OUT NUMBER,
    o_message OUT VARCHAR2
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
    o_message OUT VARCHAR2
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
    p_created_by IN NUMBER DEFAULT 1,
    o_user_id OUT NUMBER,
    o_message OUT VARCHAR2
  ) AS
    v_password_hash VARCHAR2(100);
    v_existing_count NUMBER;
  BEGIN
    -- Validate required fields
    IF p_email IS NULL OR p_password IS NULL OR p_first_name IS NULL OR p_last_name IS NULL THEN
      o_message := 'Required fields missing';
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
    o_message := 'User created successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
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
    o_message OUT VARCHAR2
  ) AS
    v_password_hash VARCHAR2(100);
    v_user_exists NUMBER;
  BEGIN
    -- Check if user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM oan_pulse_users
    WHERE user_id = p_user_id;
    
    IF v_user_exists = 0 THEN
      o_message := 'User not found';
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
    o_message := 'User updated successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      o_message := 'Error updating user: ' || SQLERRM;
  END update_user;
  
END oan_pulse_user_api;
/

-- =====================================================
-- REST API WRAPPER PROCEDURES
-- =====================================================

-- POST /users/create - Create new user
CREATE OR REPLACE PROCEDURE oan_pulse_api_create_user AS
  v_body CLOB;
  v_email VARCHAR2(255);
  v_password VARCHAR2(255);
  v_first_name VARCHAR2(100);
  v_last_name VARCHAR2(100);
  v_role VARCHAR2(50);
  v_hourly_rate NUMBER;
  v_is_active NUMBER;
  v_user_id NUMBER;
  v_message VARCHAR2(500);
BEGIN
  -- Get JSON body
  v_body := :body_text;
  
  -- Parse JSON
  v_email := JSON_VALUE(v_body, '$.email');
  v_password := JSON_VALUE(v_body, '$.password');
  v_first_name := JSON_VALUE(v_body, '$.first_name');
  v_last_name := JSON_VALUE(v_body, '$.last_name');
  v_role := JSON_VALUE(v_body, '$.role');
  v_hourly_rate := JSON_VALUE(v_body, '$.hourly_rate');
  v_is_active := NVL(JSON_VALUE(v_body, '$.is_active'), 1);
  
  -- Create user
  oan_pulse_user_api.create_user(
    p_email => v_email,
    p_password => v_password,
    p_first_name => v_first_name,
    p_last_name => v_last_name,
    p_role => v_role,
    p_hourly_rate => v_hourly_rate,
    p_is_active => v_is_active,
    o_user_id => v_user_id,
    o_message => v_message
  );
  
  -- Return response
  IF v_user_id IS NOT NULL THEN
    OWA_UTIL.status_line(201, 'Created', TRUE);
    HTP.print('{');
    HTP.print('"success": true,');
    HTP.print('"message": "' || v_message || '",');
    HTP.print('"user_id": ' || v_user_id);
    HTP.print('}');
  ELSE
    OWA_UTIL.status_line(400, 'Bad Request', TRUE);
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || v_message || '"');
    HTP.print('}');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    OWA_UTIL.status_line(500, 'Internal Server Error', TRUE);
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || REPLACE(SQLERRM, '"', '\"') || '"');
    HTP.print('}');
END;
/

-- PUT /users/:id - Update user
CREATE OR REPLACE PROCEDURE oan_pulse_api_update_user AS
  v_body CLOB;
  v_user_id NUMBER;
  v_email VARCHAR2(255);
  v_password VARCHAR2(255);
  v_first_name VARCHAR2(100);
  v_last_name VARCHAR2(100);
  v_role VARCHAR2(50);
  v_hourly_rate NUMBER;
  v_is_active NUMBER;
  v_message VARCHAR2(500);
BEGIN
  -- Get user ID from path
  v_user_id := :id;
  
  -- Get JSON body
  v_body := :body_text;
  
  -- Parse JSON (all optional for update)
  BEGIN
    v_email := JSON_VALUE(v_body, '$.email');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    v_password := JSON_VALUE(v_body, '$.password');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    v_first_name := JSON_VALUE(v_body, '$.first_name');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    v_last_name := JSON_VALUE(v_body, '$.last_name');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    v_role := JSON_VALUE(v_body, '$.role');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    v_hourly_rate := JSON_VALUE(v_body, '$.hourly_rate');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    v_is_active := JSON_VALUE(v_body, '$.is_active');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  -- Update user
  oan_pulse_user_api.update_user(
    p_user_id => v_user_id,
    p_email => v_email,
    p_password => v_password,
    p_first_name => v_first_name,
    p_last_name => v_last_name,
    p_role => v_role,
    p_hourly_rate => v_hourly_rate,
    p_is_active => v_is_active,
    o_message => v_message
  );
  
  -- Return response
  IF v_message LIKE 'User updated%' THEN
    OWA_UTIL.status_line(200, 'OK', TRUE);
    HTP.print('{');
    HTP.print('"success": true,');
    HTP.print('"message": "' || v_message || '"');
    HTP.print('}');
  ELSE
    OWA_UTIL.status_line(400, 'Bad Request', TRUE);
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || v_message || '"');
    HTP.print('}');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    OWA_UTIL.status_line(500, 'Internal Server Error', TRUE);
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || REPLACE(SQLERRM, '"', '\"') || '"');
    HTP.print('}');
END;
/

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================
-- Grant execute on the package and procedures
-- (Run these if you have permission issues)

-- GRANT EXECUTE ON oan_pulse_user_api TO PUBLIC;
-- GRANT EXECUTE ON oan_pulse_api_create_user TO PUBLIC;
-- GRANT EXECUTE ON oan_pulse_api_update_user TO PUBLIC;

-- =====================================================
-- APEX REST SETUP INSTRUCTIONS
-- =====================================================
/*
Now you need to create REST handlers in APEX:

1. Go to SQL Workshop → RESTful Services
2. Find your "auth" module (or create "users" module)
3. Create these handlers:

MODULE: users (if not exists)
  Base Path: /users

TEMPLATE: create
  URI Template: create
  
  HANDLER: POST
    Source Type: PL/SQL
    Source:
    BEGIN
      oan_pulse_api_create_user;
    END;
    
TEMPLATE: :id
  URI Template: :id
  
  HANDLER: PUT
    Source Type: PL/SQL
    Parameters:
      - Name: id, Source: URI, Bind Variable: id
      - Name: body_text, Source: HTTP Body, Bind Variable: body_text
    Source:
    BEGIN
      oan_pulse_api_update_user;
    END;

4. Test with:
   POST https://oracleapex.com/ords/oan_trial/users/create
   PUT https://oracleapex.com/ords/oan_trial/users/:id
*/

