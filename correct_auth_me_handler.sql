-- ============================================================================
-- SOLUTION: Use :authorization bind variable instead of OWA_UTIL
-- ============================================================================
-- ORDS/APEX provides the Authorization header via bind variable
-- This is the correct way to access it
-- ============================================================================

-- VERSION 1: Using :authorization bind variable (RECOMMENDED)
DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
  l_auth_header VARCHAR2(500);
BEGIN
  -- ORDS provides Authorization header as bind variable
  l_auth_header := :authorization;
  
  -- Remove 'Bearer ' prefix
  IF l_auth_header IS NOT NULL THEN
    l_token := TRIM(REPLACE(REPLACE(l_auth_header, 'Bearer ', ''), 'bearer ', ''));
  END IF;
  
  -- If no token, return error
  IF l_token IS NULL OR LENGTH(l_token) = 0 THEN
    HTP.P('{"success": false, "message": "No token provided. Add Authorization: Bearer <token> header"}');
    RETURN;
  END IF;
  
  -- Call get user procedure
  oan_pulse_api_get_user(
    p_token => l_token,
    p_result => l_result
  );
  
  -- Return result
  HTP.P(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "Error: ' || SQLERRM || '"}');
END;


-- ============================================================================
-- VERSION 2: Alternative using APEX_UTIL (if version 1 doesn't work)
-- ============================================================================

DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
  l_auth_header VARCHAR2(500);
BEGIN
  -- Try to get from APEX web service context
  BEGIN
    SELECT value INTO l_auth_header
    FROM apex_web_service.g_headers
    WHERE name = 'Authorization';
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      l_auth_header := NULL;
  END;
  
  -- Fallback to bind variable
  IF l_auth_header IS NULL THEN
    l_auth_header := :authorization;
  END IF;
  
  -- Remove 'Bearer ' prefix
  IF l_auth_header IS NOT NULL THEN
    l_token := TRIM(REPLACE(REPLACE(l_auth_header, 'Bearer ', ''), 'bearer ', ''));
  END IF;
  
  -- If no token, return error
  IF l_token IS NULL OR LENGTH(l_token) = 0 THEN
    HTP.P('{"success": false, "message": "No Authorization header found"}');
    RETURN;
  END IF;
  
  -- Call get user procedure
  oan_pulse_api_get_user(
    p_token => l_token,
    p_result => l_result
  );
  
  -- Return result
  HTP.P(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "Error: ' || SQLERRM || '"}');
END;


-- ============================================================================
-- VERSION 3: Using Request Headers Parameter (ORDS 20.2+)
-- ============================================================================
-- In APEX REST handler, add a parameter:
--   Name: Authorization
--   Bind Variable: authorization
--   Source Type: HTTP Header
--   Access Method: IN
--   Data Type: STRING
-- Then use it like this:

DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- The authorization parameter is automatically populated from HTTP header
  l_token := TRIM(REPLACE(REPLACE(:authorization, 'Bearer ', ''), 'bearer ', ''));
  
  IF l_token IS NULL OR LENGTH(l_token) = 0 THEN
    HTP.P('{"success": false, "message": "No token provided"}');
    RETURN;
  END IF;
  
  oan_pulse_api_get_user(
    p_token => l_token,
    p_result => l_result
  );
  
  HTP.P(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "Error: ' || SQLERRM || '"}');
END;

