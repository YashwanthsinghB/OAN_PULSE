-- ============================================================================
-- QUICK FIX: Check Your Oracle Version and Try This First
-- ============================================================================
-- Run this to check what's available to you
-- ============================================================================

-- Check Oracle version
SELECT * FROM v$version;

-- Check if you have STANDARD_HASH (Oracle 12c+)
SELECT STANDARD_HASH('test', 'SHA256') as test_hash FROM dual;

-- If the above works, we can use STANDARD_HASH instead!
-- If it fails, we'll use the DBMS_OBFUSCATION_TOOLKIT approach

-- ============================================================================
-- BEST SOLUTION: Use STANDARD_HASH (Oracle 12c+)
-- ============================================================================
-- This is built-in and requires no special permissions
-- ============================================================================

CREATE OR REPLACE PACKAGE BODY oan_pulse_auth_utils AS

  -- Hash a password using STANDARD_HASH (Oracle 12c+)
  FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    -- Use SHA256 via STANDARD_HASH (no special permissions needed)
    RETURN LOWER(STANDARD_HASH(p_password, 'SHA256'));
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
  
  -- Generate random token using SYS_GUID
  FUNCTION generate_token RETURN VARCHAR2 IS
    l_timestamp VARCHAR2(50);
  BEGIN
    -- Combine timestamp + GUID for uniqueness
    l_timestamp := TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MISSFF6');
    
    -- Generate token using built-in functions
    RETURN LOWER(
      STANDARD_HASH(
        l_timestamp || 
        SYS_GUID() || 
        DBMS_RANDOM.STRING('X', 20),
        'SHA256'
      )
    );
  END generate_token;
  
END oan_pulse_auth_utils;
/

-- Test it
SELECT oan_pulse_auth_utils.hash_password('Password123!') as hash FROM dual;
SELECT oan_pulse_auth_utils.generate_token() as token FROM dual;

SELECT '✅ Package body fixed with STANDARD_HASH!' as status FROM dual;

