-- ============================================================================
-- COMPREHENSIVE TEST SCRIPT
-- Run each section separately or the whole thing
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- ============================================================================
-- Test 1: Check Users and Password Hashes
-- ============================================================================
SELECT '=== TEST 1: USERS ===' as test FROM dual;

SELECT 
  email,
  SUBSTR(password_hash, 1, 30) || '...' as hash,
  LENGTH(password_hash) as hash_length,
  is_active
FROM oan_pulse_users
ORDER BY user_id;

-- ============================================================================
-- Test 2: Test Password Hashing
-- ============================================================================
SELECT '=== TEST 2: PASSWORD HASHING ===' as test FROM dual;

DECLARE
  l_test_hash VARCHAR2(64);
  l_stored_hash VARCHAR2(64);
  l_match BOOLEAN;
BEGIN
  -- Hash the test password
  l_test_hash := oan_pulse_auth_utils.hash_password('Password123!');
  DBMS_OUTPUT.PUT_LINE('Generated Hash: ' || l_test_hash);
  
  -- Get stored hash from database
  SELECT password_hash INTO l_stored_hash
  FROM oan_pulse_users
  WHERE email = 'admin@oan_pulse.com';
  
  DBMS_OUTPUT.PUT_LINE('Stored Hash:    ' || l_stored_hash);
  DBMS_OUTPUT.PUT_LINE('Hashes Match:   ' || CASE WHEN l_test_hash = l_stored_hash THEN '✅ YES' ELSE '❌ NO' END);
  
  -- Test verification function
  l_match := oan_pulse_auth_utils.verify_password('Password123!', l_stored_hash);
  DBMS_OUTPUT.PUT_LINE('Verify Function: ' || CASE WHEN l_match THEN '✅ WORKS' ELSE '❌ FAILS' END);
END;
/

-- ============================================================================
-- Test 3: Test Login Function
-- ============================================================================
SELECT '=== TEST 3: LOGIN FUNCTION ===' as test FROM dual;

DECLARE
  l_token VARCHAR2(64);
BEGIN
  l_token := oan_pulse_auth.login('admin@oan_pulse.com', 'Password123!');
  
  IF l_token IS NULL THEN
    DBMS_OUTPUT.PUT_LINE('❌ Login FAILED');
    DBMS_OUTPUT.PUT_LINE('Possible reasons:');
    DBMS_OUTPUT.PUT_LINE('  - User not found');
    DBMS_OUTPUT.PUT_LINE('  - User is inactive');
    DBMS_OUTPUT.PUT_LINE('  - Password does not match');
  ELSE
    DBMS_OUTPUT.PUT_LINE('✅ Login SUCCESS!');
    DBMS_OUTPUT.PUT_LINE('Token: ' || l_token);
    DBMS_OUTPUT.PUT_LINE('Token Length: ' || LENGTH(l_token));
    DBMS_OUTPUT.PUT_LINE('Has Spaces: ' || CASE WHEN INSTR(l_token, ' ') > 0 THEN '❌ YES' ELSE '✅ NO' END);
  END IF;
END;
/

-- ============================================================================
-- Test 4: View Active Sessions
-- ============================================================================
SELECT '=== TEST 4: ACTIVE SESSIONS ===' as test FROM dual;

SELECT 
  s.session_id,
  u.email,
  s.session_token,
  LENGTH(s.session_token) as token_length,
  CASE WHEN INSTR(s.session_token, ' ') > 0 THEN '❌ HAS SPACES' ELSE '✅ Clean' END as space_check,
  s.created_at,
  s.expires_at,
  CASE WHEN s.expires_at > SYSTIMESTAMP THEN '✅ Active' ELSE '❌ Expired' END as status
FROM oan_pulse_user_sessions s
JOIN oan_pulse_users u ON s.user_id = u.user_id
ORDER BY s.created_at DESC;

-- ============================================================================
-- Test 5: Full Login and Validate Flow
-- ============================================================================
SELECT '=== TEST 5: FULL LOGIN & VALIDATE FLOW ===' as test FROM dual;

DECLARE
  l_token VARCHAR2(64);
  l_user_id NUMBER;
  l_user oan_pulse_users%ROWTYPE;
BEGIN
  DBMS_OUTPUT.PUT_LINE('Step 1: Login...');
  l_token := oan_pulse_auth.login('admin@oan_pulse.com', 'Password123!');
  
  IF l_token IS NULL THEN
    DBMS_OUTPUT.PUT_LINE('❌ Login failed - stopping test');
    RETURN;
  END IF;
  
  DBMS_OUTPUT.PUT_LINE('✅ Login successful');
  DBMS_OUTPUT.PUT_LINE('Token: ' || l_token);
  
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Step 2: Validate token...');
  l_user_id := oan_pulse_auth.validate_token(l_token);
  
  IF l_user_id IS NULL THEN
    DBMS_OUTPUT.PUT_LINE('❌ Token validation failed');
    RETURN;
  END IF;
  
  DBMS_OUTPUT.PUT_LINE('✅ Token validated');
  DBMS_OUTPUT.PUT_LINE('User ID: ' || l_user_id);
  
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Step 3: Get user from token...');
  l_user := oan_pulse_auth.get_user_from_token(l_token);
  
  IF l_user.user_id IS NULL THEN
    DBMS_OUTPUT.PUT_LINE('❌ Get user failed');
    RETURN;
  END IF;
  
  DBMS_OUTPUT.PUT_LINE('✅ User retrieved');
  DBMS_OUTPUT.PUT_LINE('User: ' || l_user.first_name || ' ' || l_user.last_name);
  DBMS_OUTPUT.PUT_LINE('Email: ' || l_user.email);
  DBMS_OUTPUT.PUT_LINE('Role: ' || l_user.role);
  
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('✅✅✅ ALL TESTS PASSED! ✅✅✅');
  DBMS_OUTPUT.PUT_LINE('The backend authentication is working correctly!');
END;
/

-- ============================================================================
-- Test 6: Test the REST API Procedure Directly
-- ============================================================================
SELECT '=== TEST 6: REST API LOGIN PROCEDURE ===' as test FROM dual;

DECLARE
  l_result CLOB;
BEGIN
  oan_pulse_api_login(
    p_email => 'admin@oan_pulse.com',
    p_password => 'Password123!',
    p_result => l_result
  );
  
  DBMS_OUTPUT.PUT_LINE('API Login Result:');
  DBMS_OUTPUT.PUT_LINE(l_result);
END;
/

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '========================================' as divider FROM dual;
SELECT 'If all tests passed above, the database is working!' as summary FROM dual;
SELECT 'If /auth/me still fails in Postman, the issue is:' as issue FROM dual;
SELECT '  1. How you are passing the token in Authorization header' as reason1 FROM dual;
SELECT '  2. The PL/SQL code in the /auth/me REST handler' as reason2 FROM dual;
SELECT '========================================' as divider FROM dual;

