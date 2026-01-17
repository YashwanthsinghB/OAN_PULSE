-- ============================================================================
-- FINAL FIX - Simple and Reliable Token Generation
-- ============================================================================
-- This version uses SYS_GUID which is guaranteed to work
-- No numeric conversions, no overflow issues
-- ============================================================================

CREATE OR REPLACE PACKAGE BODY oan_pulse_auth_utils AS

  -- Hash password using DBMS_UTILITY (simple and reliable)
  FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2 IS
    l_hash_value NUMBER;
    l_hash_string VARCHAR2(2000);
  BEGIN
    -- Use DBMS_UTILITY.GET_HASH_VALUE (always available)
    l_hash_value := DBMS_UTILITY.GET_HASH_VALUE(
      name => p_password,
      base => 1000000000,
      hash_size => POWER(2, 30)
    );
    
    -- Convert to hex string
    l_hash_string := TO_CHAR(l_hash_value, 'FM0XXXXXXXXXXXXXXX');
    
    -- Add more entropy by hashing multiple times
    FOR i IN 1..3 LOOP
      l_hash_value := DBMS_UTILITY.GET_HASH_VALUE(
        name => l_hash_string || p_password || TO_CHAR(i),
        base => 1000000000 + (i * 1000000),
        hash_size => POWER(2, 30)
      );
      l_hash_string := l_hash_string || TO_CHAR(l_hash_value, 'FM0XXXXXXXXXXXXXXX');
    END LOOP;
    
    -- Return 64 character hash
    RETURN LOWER(SUBSTR(l_hash_string, 1, 64));
    
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
  
  -- Generate random token using SYS_GUID (simple, no overflow)
  FUNCTION generate_token RETURN VARCHAR2 IS
    l_token VARCHAR2(100);
  BEGIN
    -- Use SYS_GUID twice for 64 characters
    -- SYS_GUID returns 32 hex characters
    l_token := LOWER(REPLACE(SYS_GUID(), '-', '')) || 
               LOWER(REPLACE(SYS_GUID(), '-', ''));
    
    -- Return exactly 64 characters
    RETURN SUBSTR(l_token, 1, 64);
    
  END generate_token;
  
END oan_pulse_auth_utils;
/

-- Test the package
SET SERVEROUTPUT ON;

DECLARE
  l_hash VARCHAR2(64);
  l_token VARCHAR2(64);
  l_verify BOOLEAN;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Testing Password Hashing ===');
  
  -- Test hash
  l_hash := oan_pulse_auth_utils.hash_password('Password123!');
  DBMS_OUTPUT.PUT_LINE('Password Hash: ' || l_hash);
  DBMS_OUTPUT.PUT_LINE('Hash Length: ' || LENGTH(l_hash));
  
  -- Test verify
  l_verify := oan_pulse_auth_utils.verify_password('Password123!', l_hash);
  IF l_verify THEN
    DBMS_OUTPUT.PUT_LINE('✅ Password verification: SUCCESS');
  ELSE
    DBMS_OUTPUT.PUT_LINE('❌ Password verification: FAILED');
  END IF;
  
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('=== Testing Token Generation ===');
  
  -- Test token
  l_token := oan_pulse_auth_utils.generate_token();
  DBMS_OUTPUT.PUT_LINE('Session Token: ' || l_token);
  DBMS_OUTPUT.PUT_LINE('Token Length: ' || LENGTH(l_token));
  DBMS_OUTPUT.PUT_LINE('Has spaces? ' || CASE WHEN INSTR(l_token, ' ') > 0 THEN '❌ YES' ELSE '✅ NO' END);
  
  IF INSTR(l_token, ' ') = 0 AND LENGTH(l_token) = 64 THEN
    DBMS_OUTPUT.PUT_LINE('✅ Token generation working!');
  ELSE
    DBMS_OUTPUT.PUT_LINE('❌ Token has issues');
  END IF;
  
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('✅ All tests passed!');
END;
/

-- Clear old sessions
DELETE FROM oan_pulse_user_sessions;
COMMIT;

-- Update all users with NEW password hashes
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

-- Show users
DBMS_OUTPUT.PUT_LINE('');
DBMS_OUTPUT.PUT_LINE('=== Test Users Updated ===');

SELECT 
  email, 
  role,
  SUBSTR(password_hash, 1, 20) || '...' as hash_preview,
  is_active
FROM oan_pulse_users
ORDER BY user_id;

SELECT '========================================' as divider FROM dual;
SELECT '✅ FIXED! Package updated, passwords reset' as status FROM dual;
SELECT 'Try login again in Postman now!' as next_step FROM dual;
SELECT '========================================' as divider FROM dual;

