-- ============================================================================
-- FIX: Remove spaces from token generation
-- ============================================================================
-- The generate_token function was creating tokens with spaces
-- This fixes it to create clean hex strings without spaces
-- ============================================================================

CREATE OR REPLACE PACKAGE BODY oan_pulse_auth_utils AS

  -- Hash password using UTL_RAW (available to everyone)
  FUNCTION hash_password(p_password IN VARCHAR2) RETURN VARCHAR2 IS
    l_hash_value NUMBER;
    l_raw_input RAW(2000);
    l_hash_string VARCHAR2(2000);
  BEGIN
    -- Method 1: Use DBMS_UTILITY.GET_HASH_VALUE (always available)
    l_hash_value := DBMS_UTILITY.GET_HASH_VALUE(
      name => p_password,
      base => 1000000000,
      hash_size => POWER(2, 30)
    );
    
    -- Convert to hex string and pad
    l_hash_string := LPAD(TO_CHAR(l_hash_value, 'FM0XXXXXXX'), 16, '0');
    
    -- Add more entropy by hashing with different bases
    FOR i IN 1..3 LOOP
      l_hash_value := DBMS_UTILITY.GET_HASH_VALUE(
        name => l_hash_string || p_password || i,
        base => 1000000000 + (i * 1000000),
        hash_size => POWER(2, 30)
      );
      l_hash_string := l_hash_string || LPAD(TO_CHAR(l_hash_value, 'FM0XXXXXXX'), 16, '0');
    END LOOP;
    
    -- Return 64 character hash (no spaces!)
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
  
  -- Generate random token WITHOUT SPACES
  FUNCTION generate_token RETURN VARCHAR2 IS
    l_token VARCHAR2(64);
    l_random_num NUMBER;
    l_hex_segment VARCHAR2(16);
  BEGIN
    l_token := '';
    
    -- Generate 64 character hex string using DBMS_RANDOM
    -- Fixed: Use RAWTOHEX to avoid spaces
    FOR i IN 1..8 LOOP
      l_random_num := TRUNC(DBMS_RANDOM.VALUE(0, 4294967296)); -- 2^32
      
      -- Convert to RAW then to HEX (no spaces)
      l_hex_segment := LOWER(RAWTOHEX(
        UTL_RAW.CAST_FROM_BINARY_INTEGER(l_random_num)
      ));
      
      -- Pad to 8 characters and append
      l_token := l_token || LPAD(l_hex_segment, 8, '0');
    END LOOP;
    
    -- Return exactly 64 characters, no spaces
    RETURN SUBSTR(l_token, 1, 64);
    
  END generate_token;
  
END oan_pulse_auth_utils;
/

-- Test the fix
SET SERVEROUTPUT ON;

DECLARE
  l_token VARCHAR2(64);
BEGIN
  l_token := oan_pulse_auth_utils.generate_token();
  
  DBMS_OUTPUT.PUT_LINE('Token: ' || l_token);
  DBMS_OUTPUT.PUT_LINE('Length: ' || LENGTH(l_token));
  DBMS_OUTPUT.PUT_LINE('Has spaces? ' || CASE WHEN INSTR(l_token, ' ') > 0 THEN 'YES - BAD!' ELSE 'NO - GOOD!' END);
  
  IF INSTR(l_token, ' ') = 0 AND LENGTH(l_token) = 64 THEN
    DBMS_OUTPUT.PUT_LINE('✅ Token generation FIXED!');
  ELSE
    DBMS_OUTPUT.PUT_LINE('❌ Still has issues');
  END IF;
END;
/

-- Clear old sessions with spaces
DELETE FROM oan_pulse_user_sessions;
COMMIT;

SELECT '✅ Package fixed! Old sessions cleared.' as status FROM dual;
SELECT 'Try logging in again via Postman' as next_step FROM dual;

