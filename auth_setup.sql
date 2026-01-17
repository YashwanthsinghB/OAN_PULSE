-- ============================================================================
-- OAN PULSE - AUTHENTICATION SETUP
-- ============================================================================
-- This file contains everything you need to set up authentication
-- Run this in SQL Developer or SQL Workshop in APEX
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE PASSWORD UTILITIES PACKAGE
-- ============================================================================
-- This package handles password hashing and verification
-- Uses Oracle's built-in DBMS_CRYPTO for secure hashing
-- ============================================================================

CREATE OR REPLACE PACKAGE oan_pulse_auth_utils AS
  -- Hash a plain text password
  FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2;
  
  -- Verify a password against its hash
  FUNCTION verify_password(
    p_password IN VARCHAR2,
    p_hash IN VARCHAR2
  ) RETURN BOOLEAN;
  
  -- Generate a random session token
  FUNCTION generate_token RETURN VARCHAR2;
  
END oan_pulse_auth_utils;
/

CREATE OR REPLACE PACKAGE BODY oan_pulse_auth_utils AS

  -- Hash a password using SHA-256
  FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2 IS
    l_hash RAW(2000);
  BEGIN
    -- Use SHA-256 hashing (industry standard)
    l_hash := DBMS_CRYPTO.HASH(
      src => UTL_RAW.CAST_TO_RAW(p_password),
      typ => DBMS_CRYPTO.HASH_SH256
    );
    
    -- Return as hex string
    RETURN LOWER(RAWTOHEX(l_hash));
  END hash_password;
  
  -- Verify password
  FUNCTION verify_password(
    p_password IN VARCHAR2,
    p_hash IN VARCHAR2
  ) RETURN BOOLEAN IS
    l_computed_hash VARCHAR2(64);
  BEGIN
    l_computed_hash := hash_password(p_password);
    RETURN l_computed_hash = LOWER(p_hash);
  END verify_password;
  
  -- Generate random token for sessions
  FUNCTION generate_token RETURN VARCHAR2 IS
    l_random RAW(32);
  BEGIN
    -- Generate 32 bytes of random data
    l_random := DBMS_CRYPTO.RANDOMBYTES(32);
    RETURN LOWER(RAWTOHEX(l_random));
  END generate_token;
  
END oan_pulse_auth_utils;
/

-- Verify package created successfully
SELECT 'Password utils package created!' AS status FROM dual;

-- ============================================================================
-- STEP 2: CREATE USER SESSIONS TABLE
-- ============================================================================
-- This table stores active user sessions/tokens
-- ============================================================================

CREATE TABLE oan_pulse_user_sessions (
  session_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL,
  session_token VARCHAR2(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT SYSTIMESTAMP,
  ip_address VARCHAR2(45),
  user_agent VARCHAR2(500),
  is_active NUMBER(1) DEFAULT 1,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) 
    REFERENCES oan_pulse_users(user_id) ON DELETE CASCADE
);

-- Create index for fast token lookup
CREATE INDEX idx_session_token ON oan_pulse_user_sessions(session_token);
CREATE INDEX idx_session_user ON oan_pulse_user_sessions(user_id);
CREATE INDEX idx_session_expires ON oan_pulse_user_sessions(expires_at);

-- Verify table created
SELECT 'User sessions table created!' AS status FROM dual;

-- ============================================================================
-- STEP 3: CREATE AUTHENTICATION PACKAGE
-- ============================================================================
-- This package handles login, logout, and session validation
-- ============================================================================

CREATE OR REPLACE PACKAGE oan_pulse_auth AS
  
  -- Login function - returns session token if successful
  FUNCTION login(
    p_email IN VARCHAR2,
    p_password IN VARCHAR2,
    p_ip_address IN VARCHAR2 DEFAULT NULL,
    p_user_agent IN VARCHAR2 DEFAULT NULL
  ) RETURN VARCHAR2;
  
  -- Validate session token
  FUNCTION validate_token(p_token IN VARCHAR2) RETURN NUMBER;
  
  -- Get user info from token
  FUNCTION get_user_from_token(p_token IN VARCHAR2) RETURN oan_pulse_users%ROWTYPE;
  
  -- Logout (invalidate token)
  PROCEDURE logout(p_token IN VARCHAR2);
  
  -- Clean up expired sessions (call periodically)
  PROCEDURE cleanup_expired_sessions;
  
END oan_pulse_auth;
/

CREATE OR REPLACE PACKAGE BODY oan_pulse_auth AS

  -- Login function
  FUNCTION login(
    p_email IN VARCHAR2,
    p_password IN VARCHAR2,
    p_ip_address IN VARCHAR2 DEFAULT NULL,
    p_user_agent IN VARCHAR2 DEFAULT NULL
  ) RETURN VARCHAR2 IS
    l_user_id NUMBER;
    l_password_hash VARCHAR2(64);
    l_is_active NUMBER;
    l_token VARCHAR2(64);
    l_expires_at TIMESTAMP;
  BEGIN
    -- Get user details
    BEGIN
      SELECT user_id, password_hash, is_active
      INTO l_user_id, l_password_hash, l_is_active
      FROM oan_pulse_users
      WHERE LOWER(email) = LOWER(p_email);
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RETURN NULL; -- User not found
    END;
    
    -- Check if user is active
    IF l_is_active = 0 THEN
      RETURN NULL; -- User is deactivated
    END IF;
    
    -- Verify password
    IF NOT oan_pulse_auth_utils.verify_password(p_password, l_password_hash) THEN
      RETURN NULL; -- Wrong password
    END IF;
    
    -- Generate session token
    l_token := oan_pulse_auth_utils.generate_token();
    
    -- Set expiration (2 hours from now)
    l_expires_at := SYSTIMESTAMP + INTERVAL '2' HOUR;
    
    -- Create session record
    INSERT INTO oan_pulse_user_sessions (
      user_id,
      session_token,
      expires_at,
      ip_address,
      user_agent,
      is_active
    ) VALUES (
      l_user_id,
      l_token,
      l_expires_at,
      p_ip_address,
      SUBSTR(p_user_agent, 1, 500),
      1
    );
    
    COMMIT;
    
    -- Return the token
    RETURN l_token;
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RETURN NULL;
  END login;
  
  -- Validate token and return user_id
  FUNCTION validate_token(p_token IN VARCHAR2) RETURN NUMBER IS
    l_user_id NUMBER;
    l_expires_at TIMESTAMP;
    l_is_active NUMBER;
  BEGIN
    SELECT user_id, expires_at, is_active
    INTO l_user_id, l_expires_at, l_is_active
    FROM oan_pulse_user_sessions
    WHERE session_token = p_token;
    
    -- Check if session is active and not expired
    IF l_is_active = 1 AND l_expires_at > SYSTIMESTAMP THEN
      -- Update last activity
      UPDATE oan_pulse_user_sessions
      SET last_activity = SYSTIMESTAMP
      WHERE session_token = p_token;
      COMMIT;
      
      RETURN l_user_id;
    ELSE
      RETURN NULL; -- Session expired or inactive
    END IF;
    
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN NULL; -- Token not found
  END validate_token;
  
  -- Get full user record from token
  FUNCTION get_user_from_token(p_token IN VARCHAR2) RETURN oan_pulse_users%ROWTYPE IS
    l_user_id NUMBER;
    l_user oan_pulse_users%ROWTYPE;
  BEGIN
    l_user_id := validate_token(p_token);
    
    IF l_user_id IS NOT NULL THEN
      SELECT * INTO l_user
      FROM oan_pulse_users
      WHERE user_id = l_user_id;
      
      RETURN l_user;
    ELSE
      RETURN NULL;
    END IF;
    
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN NULL;
  END get_user_from_token;
  
  -- Logout - invalidate session
  PROCEDURE logout(p_token IN VARCHAR2) IS
  BEGIN
    UPDATE oan_pulse_user_sessions
    SET is_active = 0
    WHERE session_token = p_token;
    
    COMMIT;
  END logout;
  
  -- Clean up expired sessions
  PROCEDURE cleanup_expired_sessions IS
  BEGIN
    DELETE FROM oan_pulse_user_sessions
    WHERE expires_at < SYSTIMESTAMP - INTERVAL '1' DAY;
    
    COMMIT;
  END cleanup_expired_sessions;
  
END oan_pulse_auth;
/

-- Verify package created
SELECT 'Authentication package created!' AS status FROM dual;

-- ============================================================================
-- STEP 4: UPDATE TEST USERS WITH PROPER PASSWORDS
-- ============================================================================
-- Update existing users with hashed passwords
-- Default password for all test users: "Password123!"
-- ============================================================================

-- Update admin user
UPDATE oan_pulse_users
SET password_hash = oan_pulse_auth_utils.hash_password('Password123!')
WHERE email = 'admin@oan_pulse.com';

-- Add more test users if needed
DECLARE
  l_admin_hash VARCHAR2(64);
  l_manager_hash VARCHAR2(64);
  l_employee_hash VARCHAR2(64);
BEGIN
  -- Hash passwords
  l_admin_hash := oan_pulse_auth_utils.hash_password('Password123!');
  l_manager_hash := oan_pulse_auth_utils.hash_password('Password123!');
  l_employee_hash := oan_pulse_auth_utils.hash_password('Password123!');
  
  -- Insert test manager (if not exists)
  BEGIN
    INSERT INTO oan_pulse_users (
      email, password_hash, first_name, last_name, 
      role, hourly_rate, is_active
    ) VALUES (
      'manager@oan_pulse.com', l_manager_hash, 'Test', 'Manager',
      'MANAGER', 75.00, 1
    );
  EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
      UPDATE oan_pulse_users
      SET password_hash = l_manager_hash
      WHERE email = 'manager@oan_pulse.com';
  END;
  
  -- Insert test employee (if not exists)
  BEGIN
    INSERT INTO oan_pulse_users (
      email, password_hash, first_name, last_name,
      role, hourly_rate, is_active
    ) VALUES (
      'employee@oan_pulse.com', l_employee_hash, 'Test', 'Employee',
      'EMPLOYEE', 50.00, 1
    );
  EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
      UPDATE oan_pulse_users
      SET password_hash = l_employee_hash
      WHERE email = 'employee@oan_pulse.com';
  END;
  
  COMMIT;
END;
/

-- Verify users created
SELECT 
  email, 
  first_name, 
  last_name, 
  role,
  CASE WHEN password_hash LIKE '%' THEN 'Password Set' END as password_status,
  is_active
FROM oan_pulse_users
ORDER BY user_id;

-- ============================================================================
-- STEP 5: CREATE REST API HELPER PROCEDURES
-- ============================================================================
-- These procedures will be called from APEX REST services
-- ============================================================================

-- Procedure for login (returns JSON)
CREATE OR REPLACE PROCEDURE oan_pulse_api_login(
  p_email IN VARCHAR2,
  p_password IN VARCHAR2,
  p_result OUT CLOB
) IS
  l_token VARCHAR2(64);
  l_user oan_pulse_users%ROWTYPE;
  l_json CLOB;
BEGIN
  -- Attempt login
  l_token := oan_pulse_auth.login(p_email, p_password);
  
  IF l_token IS NOT NULL THEN
    -- Get user details
    l_user := oan_pulse_auth.get_user_from_token(l_token);
    
    -- Build success JSON response
    l_json := '{' ||
      '"success": true,' ||
      '"token": "' || l_token || '",' ||
      '"user": {' ||
        '"user_id": ' || l_user.user_id || ',' ||
        '"email": "' || l_user.email || '",' ||
        '"first_name": "' || l_user.first_name || '",' ||
        '"last_name": "' || l_user.last_name || '",' ||
        '"role": "' || l_user.role || '",' ||
        '"hourly_rate": ' || NVL(l_user.hourly_rate, 0) ||
      '}' ||
    '}';
    
    p_result := l_json;
  ELSE
    -- Login failed
    p_result := '{"success": false, "message": "Invalid email or password"}';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    p_result := '{"success": false, "message": "Login error: ' || SQLERRM || '"}';
END oan_pulse_api_login;
/

-- Procedure for logout
CREATE OR REPLACE PROCEDURE oan_pulse_api_logout(
  p_token IN VARCHAR2,
  p_result OUT CLOB
) IS
BEGIN
  oan_pulse_auth.logout(p_token);
  p_result := '{"success": true, "message": "Logged out successfully"}';
EXCEPTION
  WHEN OTHERS THEN
    p_result := '{"success": false, "message": "Logout error: ' || SQLERRM || '"}';
END oan_pulse_api_logout;
/

-- Procedure to get current user from token
CREATE OR REPLACE PROCEDURE oan_pulse_api_get_user(
  p_token IN VARCHAR2,
  p_result OUT CLOB
) IS
  l_user oan_pulse_users%ROWTYPE;
  l_json CLOB;
BEGIN
  l_user := oan_pulse_auth.get_user_from_token(p_token);
  
  IF l_user.user_id IS NOT NULL THEN
    l_json := '{' ||
      '"success": true,' ||
      '"user": {' ||
        '"user_id": ' || l_user.user_id || ',' ||
        '"email": "' || l_user.email || '",' ||
        '"first_name": "' || l_user.first_name || '",' ||
        '"last_name": "' || l_user.last_name || '",' ||
        '"role": "' || l_user.role || '",' ||
        '"hourly_rate": ' || NVL(l_user.hourly_rate, 0) ||
      '}' ||
    '}';
    
    p_result := l_json;
  ELSE
    p_result := '{"success": false, "message": "Invalid or expired token"}';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    p_result := '{"success": false, "message": "Error: ' || SQLERRM || '"}';
END oan_pulse_api_get_user;
/

-- Verify procedures created
SELECT 'REST API procedures created!' AS status FROM dual;

-- ============================================================================
-- STEP 6: TEST THE AUTHENTICATION SYSTEM
-- ============================================================================
-- Run these tests to make sure everything works
-- ============================================================================

-- Test 1: Hash a password
SELECT oan_pulse_auth_utils.hash_password('TestPassword123') as password_hash
FROM dual;

-- Test 2: Login with admin user
DECLARE
  l_token VARCHAR2(64);
BEGIN
  l_token := oan_pulse_auth.login('admin@oan_pulse.com', 'Password123!');
  DBMS_OUTPUT.PUT_LINE('Login Token: ' || l_token);
  
  IF l_token IS NULL THEN
    DBMS_OUTPUT.PUT_LINE('Login FAILED!');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Login SUCCESS!');
  END IF;
END;
/

-- Test 3: Verify token
DECLARE
  l_token VARCHAR2(64);
  l_user_id NUMBER;
BEGIN
  -- First login
  l_token := oan_pulse_auth.login('admin@oan_pulse.com', 'Password123!');
  DBMS_OUTPUT.PUT_LINE('Token: ' || l_token);
  
  -- Validate token
  l_user_id := oan_pulse_auth.validate_token(l_token);
  DBMS_OUTPUT.PUT_LINE('User ID from token: ' || l_user_id);
END;
/

-- Test 4: View active sessions
SELECT 
  s.session_id,
  u.email,
  u.first_name || ' ' || u.last_name as user_name,
  s.session_token,
  s.created_at,
  s.expires_at,
  CASE WHEN s.expires_at > SYSTIMESTAMP THEN 'Active' ELSE 'Expired' END as status
FROM oan_pulse_user_sessions s
JOIN oan_pulse_users u ON s.user_id = u.user_id
ORDER BY s.created_at DESC;

-- ============================================================================
-- SUMMARY OF TEST USERS
-- ============================================================================
-- You can now log in with these credentials:
-- ============================================================================

SELECT 
  '=== TEST USER CREDENTIALS ===' as info,
  NULL as email,
  NULL as password,
  NULL as role
FROM dual
UNION ALL
SELECT 
  LPAD('-', 50, '-'),
  NULL,
  NULL,
  NULL
FROM dual
UNION ALL
SELECT 
  'Admin User:',
  'admin@oan_pulse.com',
  'Password123!',
  'ADMIN'
FROM dual
UNION ALL
SELECT 
  'Manager User:',
  'manager@oan_pulse.com',
  'Password123!',
  'MANAGER'
FROM dual
UNION ALL
SELECT 
  'Employee User:',
  'employee@oan_pulse.com',
  'Password123!',
  'EMPLOYEE'
FROM dual;

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS TO APEX (if needed)
-- ============================================================================
-- If you're using a different schema for APEX, grant permissions
-- Replace 'APEX_PUBLIC_USER' with your APEX schema if different
-- ============================================================================

-- GRANT EXECUTE ON oan_pulse_auth_utils TO APEX_PUBLIC_USER;
-- GRANT EXECUTE ON oan_pulse_auth TO APEX_PUBLIC_USER;
-- GRANT EXECUTE ON oan_pulse_api_login TO APEX_PUBLIC_USER;
-- GRANT EXECUTE ON oan_pulse_api_logout TO APEX_PUBLIC_USER;
-- GRANT EXECUTE ON oan_pulse_api_get_user TO APEX_PUBLIC_USER;

-- ============================================================================
-- COMPLETED!
-- ============================================================================
-- Next steps:
-- 1. Create REST services in APEX (see APEX_REST_SETUP.md)
-- 2. Test the REST endpoints
-- 3. Build React login page
-- ============================================================================

SELECT '✅ Authentication setup complete!' as status FROM dual;

