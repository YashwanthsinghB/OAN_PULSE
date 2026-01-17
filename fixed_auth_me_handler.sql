-- ============================================================================
-- FIXED /auth/me REST Handler Code
-- ============================================================================
-- The issue might be in how the REST handler reads the Authorization header
-- This version has better error handling and debugging
-- ============================================================================

-- Replace the PL/SQL code in your /auth/me GET handler with this:

DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
  l_auth_header VARCHAR2(500);
BEGIN
  -- Try to get token from Authorization header
  l_auth_header := OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION');
  
  -- Log what we received (for debugging)
  HTP.P('<!-- Auth Header: ' || l_auth_header || ' -->');
  
  -- Remove 'Bearer ' prefix if present
  IF l_auth_header IS NOT NULL THEN
    l_token := TRIM(REPLACE(l_auth_header, 'Bearer ', ''));
    l_token := TRIM(REPLACE(l_token, 'bearer ', ''));
  END IF;
  
  -- If still null, return error
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

