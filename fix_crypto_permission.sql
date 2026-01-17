-- ============================================================================
-- OPTION 1: GRANT DBMS_CRYPTO PERMISSION (RECOMMENDED)
-- ============================================================================
-- Run this as ADMIN or a user with GRANT privileges
-- If you can't run this, use Option 2 below
-- ============================================================================

-- Connect as ADMIN and run:
GRANT EXECUTE ON SYS.DBMS_CRYPTO TO OAN_TRIAL;

-- Then try running auth_setup.sql again

-- ============================================================================
-- OPTION 2: ALTERNATIVE PASSWORD HASHING (No special privileges needed)
-- ============================================================================
-- If you can't grant DBMS_CRYPTO, use this instead
-- This uses standard Oracle functions available to everyone
-- ============================================================================

-- Drop the old package if it exists
DROP PACKAGE oan_pulse_auth_utils;
/

-- Create new package with alternative hashing
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

  -- Hash a password using DBMS_OBFUSCATION_TOOLKIT (available to all users)
  FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2 IS
    l_hash VARCHAR2(2000);
    l_input RAW(2000);
  BEGIN
    -- Convert password to RAW
    l_input := UTL_RAW.CAST_TO_RAW(p_password);
    
    -- Use MD5 hash (available to all users)
    l_hash := LOWER(RAWTOHEX(DBMS_OBFUSCATION_TOOLKIT.MD5(
      input => l_input
    )));
    
    RETURN l_hash;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Fallback: simple hash using standard_hash (Oracle 12c+)
      BEGIN
        RETURN LOWER(STANDARD_HASH(p_password, 'SHA256'));
      EXCEPTION
        WHEN OTHERS THEN
          -- Last resort: use Oracle's native checksum
          RETURN LOWER(TO_CHAR(DBMS_UTILITY.GET_HASH_VALUE(
            p_password, 
            1000000000, 
            POWER(2, 30)
          )));
      END;
  END hash_password;
  
  -- Verify password
  FUNCTION verify_password(
    p_password IN VARCHAR2,
    p_hash IN VARCHAR2
  ) RETURN BOOLEAN IS
    l_computed_hash VARCHAR2(2000);
  BEGIN
    l_computed_hash := hash_password(p_password);
    RETURN l_computed_hash = LOWER(p_hash);
  END verify_password;
  
  -- Generate random token
  FUNCTION generate_token RETURN VARCHAR2 IS
    l_random RAW(32);
    l_timestamp VARCHAR2(50);
    l_sequence NUMBER;
  BEGIN
    -- Try using DBMS_CRYPTO first
    BEGIN
      l_random := DBMS_CRYPTO.RANDOMBYTES(32);
      RETURN LOWER(RAWTOHEX(l_random));
    EXCEPTION
      WHEN OTHERS THEN
        -- Fallback: use timestamp + sequence + session
        l_timestamp := TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MISSFF6');
        SELECT oan_pulse_users_seq.NEXTVAL INTO l_sequence FROM dual;
        
        -- Create a pseudo-random string
        RETURN LOWER(RAWTOHEX(UTL_RAW.CAST_TO_RAW(
          l_timestamp || 
          '_' || 
          l_sequence || 
          '_' || 
          SYS_GUID() ||
          '_' ||
          DBMS_SESSION.UNIQUE_SESSION_ID
        )));
    END;
  END generate_token;
  
END oan_pulse_auth_utils;
/

-- Test the new package
SELECT 'Testing hash_password...' as status FROM dual;
SELECT oan_pulse_auth_utils.hash_password('TestPassword123') as password_hash FROM dual;

SELECT 'Testing generate_token...' as status FROM dual;
SELECT oan_pulse_auth_utils.generate_token() as token FROM dual;

SELECT 'Package created successfully!' as status FROM dual;

-- ============================================================================
-- UPDATE TEST USERS WITH NEW HASHES
-- ============================================================================

-- Update users with new password hashes
UPDATE oan_pulse_users
SET password_hash = oan_pulse_auth_utils.hash_password('Password123!')
WHERE email = 'admin@oan_pulse.com';

-- Update or insert manager
MERGE INTO oan_pulse_users u
USING (SELECT 'manager@oan_pulse.com' as email FROM dual) s
ON (u.email = s.email)
WHEN MATCHED THEN
  UPDATE SET password_hash = oan_pulse_auth_utils.hash_password('Password123!')
WHEN NOT MATCHED THEN
  INSERT (email, password_hash, first_name, last_name, role, hourly_rate, is_active)
  VALUES ('manager@oan_pulse.com', 
          oan_pulse_auth_utils.hash_password('Password123!'),
          'Test', 'Manager', 'MANAGER', 75.00, 1);

-- Update or insert employee
MERGE INTO oan_pulse_users u
USING (SELECT 'employee@oan_pulse.com' as email FROM dual) s
ON (u.email = s.email)
WHEN MATCHED THEN
  UPDATE SET password_hash = oan_pulse_auth_utils.hash_password('Password123!')
WHEN NOT MATCHED THEN
  INSERT (email, password_hash, first_name, last_name, role, hourly_rate, is_active)
  VALUES ('employee@oan_pulse.com',
          oan_pulse_auth_utils.hash_password('Password123!'),
          'Test', 'Employee', 'EMPLOYEE', 50.00, 1);

COMMIT;

-- Verify users
SELECT 
  email, 
  first_name || ' ' || last_name as name,
  role,
  CASE WHEN LENGTH(password_hash) > 0 THEN '✅ Password Set' ELSE '❌ No Password' END as password_status,
  is_active
FROM oan_pulse_users
ORDER BY user_id;

-- ============================================================================
-- COMPLETE! Now continue with the rest of auth_setup.sql
-- ============================================================================
-- Skip lines 1-152 in auth_setup.sql (the package body we just fixed)
-- Start from line 153 (CREATE TABLE oan_pulse_user_sessions)
-- ============================================================================

SELECT '✅ Fixed! Now run the rest of auth_setup.sql starting from line 153' as status FROM dual;

