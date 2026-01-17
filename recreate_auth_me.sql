-- ============================================================================
-- STEP-BY-STEP: Recreate /auth/me Endpoint Correctly
-- ============================================================================
-- Let's start fresh and make sure everything is set up correctly
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Your Module and Template Exist
-- ============================================================================
-- Run this in SQL to check what REST endpoints you have:

SELECT 
  m.name as module_name,
  m.base_path as module_base,
  t.uri_template,
  h.method,
  h.source_type,
  'https://oracleapex.com/ords/oan_trial' || m.base_path || t.uri_template as full_url
FROM user_ords_modules m
JOIN user_ords_templates t ON m.id = t.module_id
LEFT JOIN user_ords_handlers h ON t.id = h.template_id
WHERE m.name = 'auth'
ORDER BY m.name, t.uri_template, h.method;

-- This will show you what endpoints exist and their URLs

-- ============================================================================
-- STEP 2: Simple Working Version (No Authorization Yet)
-- ============================================================================
-- First, let's get a basic GET endpoint working
-- Use this code for your /auth/me GET handler:

BEGIN
  HTP.P('{"success": true, "message": "Endpoint is working!"}');
END;

-- Test in Postman:
-- GET https://oracleapex.com/ords/oan_trial/auth/me
-- Should return: {"success": true, "message": "Endpoint is working!"}

-- ============================================================================
-- STEP 3: Add Token from Query Parameter (Temporary)
-- ============================================================================
-- Once basic GET works, try getting token from query parameter first
-- This is easier to debug than headers

DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Get token from query parameter
  l_token := :token;
  
  IF l_token IS NULL THEN
    HTP.P('{"success": false, "message": "No token parameter. Use ?token=your-token"}');
    RETURN;
  END IF;
  
  -- Call get user procedure
  oan_pulse_api_get_user(
    p_token => l_token,
    p_result => l_result
  );
  
  HTP.P(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "Error: ' || SQLERRM || '"}');
END;

-- Test in Postman:
-- GET https://oracleapex.com/ords/oan_trial/auth/me?token=489b432591ebfe1fe0630311a8c05048489b432591ecfe1fe0630311a8c05048
-- (Use actual token from login)

-- ============================================================================
-- STEP 4: Final Version with Header (After query param works)
-- ============================================================================
-- Once Step 3 works, we know the function works
-- Then we can tackle the Authorization header

-- In APEX, you need to manually define parameters for GET handlers
-- Here's the complete setup:

-- 4A. In APEX REST Handler, click "Create Parameter":
--     Name: authorization
--     Bind Variable: authorization
--     Access Method: IN
--     Source Type: HEADER
--     Parameter Type: STRING
--     Required: No

-- 4B. Use this code:
DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
  l_auth VARCHAR2(500);
BEGIN
  -- Try to get from header parameter
  l_auth := :authorization;
  
  -- If null, try query parameter as fallback
  IF l_auth IS NULL THEN
    l_auth := :token;
  END IF;
  
  -- Remove Bearer prefix
  IF l_auth IS NOT NULL THEN
    l_token := TRIM(REPLACE(REPLACE(l_auth, 'Bearer ', ''), 'bearer ', ''));
  END IF;
  
  IF l_token IS NULL THEN
    HTP.P('{"success": false, "message": "No token. Use Authorization: Bearer <token> header or ?token= parameter"}');
    RETURN;
  END IF;
  
  oan_pulse_api_get_user(l_token, l_result);
  HTP.P(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "' || SQLERRM || '"}');
END;

-- ============================================================================
-- Troubleshooting 404 Error
-- ============================================================================

-- If you're getting 404, check:
-- 1. Is the module published? (Check in APEX)
-- 2. Is the template URI exactly "me" (no leading slash)?
-- 3. Is there a GET handler on that template?
-- 4. Are you calling GET not POST?
-- 5. Is the full URL correct?

-- Common mistakes:
-- ❌ https://oracleapex.com/ords/oan_trial/auth/me/     (extra slash)
-- ❌ https://oracleapex.com/ords/oan_trial/auth//me     (double slash)
-- ❌ POST https://oracleapex.com/ords/oan_trial/auth/me (wrong method)
-- ✅ GET https://oracleapex.com/ords/oan_trial/auth/me  (correct)

