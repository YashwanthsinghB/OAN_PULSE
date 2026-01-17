-- ============================================================================
-- DEBUG VERSION - Shows ALL headers received
-- ============================================================================
-- This will help us see exactly what ORDS is receiving
-- Replace your /auth/me GET handler with this temporarily
-- ============================================================================

DECLARE
  l_auth_header VARCHAR2(500);
  l_all_headers VARCHAR2(4000);
BEGIN
  -- Try different ways to get the Authorization header
  l_auth_header := OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION');
  
  -- Build debug info
  l_all_headers := '{"debug": {' ||
    '"HTTP_AUTHORIZATION": "' || NVL(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'NULL') || '",' ||
    '"AUTHORIZATION": "' || NVL(OWA_UTIL.get_cgi_env('AUTHORIZATION'), 'NULL') || '",' ||
    '"HTTP_BEARER": "' || NVL(OWA_UTIL.get_cgi_env('HTTP_BEARER'), 'NULL') || '",' ||
    '"REQUEST_HEADERS": "' || NVL(OWA_UTIL.get_cgi_env('REQUEST_HEADERS'), 'NULL') || '",' ||
    '"CONTENT_TYPE": "' || NVL(OWA_UTIL.get_cgi_env('CONTENT_TYPE'), 'NULL') || '",' ||
    '"REQUEST_METHOD": "' || NVL(OWA_UTIL.get_cgi_env('REQUEST_METHOD'), 'NULL') || '",' ||
    '"REMOTE_ADDR": "' || NVL(OWA_UTIL.get_cgi_env('REMOTE_ADDR'), 'NULL') || '"' ||
    '}}';
  
  HTP.P(l_all_headers);
  
END;

