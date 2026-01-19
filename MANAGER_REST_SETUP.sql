-- ============================================
-- MANAGER FEATURES: APEX REST HANDLER SETUP GUIDE
-- ============================================
-- Follow these steps to create REST endpoints in APEX
-- ============================================

/*
STEP 1: Compile the Manager API Package
========================================
First, run the manager_api_backend.sql file in SQL Workshop > SQL Commands
This creates the oan_pulse_manager_api package with all business logic.


STEP 2: Create REST Module "manager"
======================================
1. Go to SQL Workshop > RESTful Services
2. Click "Create Module"
3. Settings:
   - Module Name: manager
   - Base Path: /manager/
   - Pagination Size: (leave blank)
4. Click "Create Module"


STEP 3: Create Templates and Handlers
=======================================
Create the following templates and handlers:


TEMPLATE 1: team (GET team members)
------------------------------------
URI Template: team
Method: GET
Source Type: PL/SQL
Source:

*/

DECLARE
  l_manager_id NUMBER;
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Get token from query parameter or header
  l_token := :token;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get manager_id from session
  BEGIN
    SELECT u.user_id INTO l_manager_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.token = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"error":"Unauthorized"}');
      RETURN;
  END;
  
  -- Call API
  oan_pulse_manager_api.get_team_members(l_manager_id, l_result);
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;

/*

TEMPLATE 2: pending (GET pending approvals)
--------------------------------------------
URI Template: pending
Method: GET
Source Type: PL/SQL
Source:

*/

DECLARE
  l_manager_id NUMBER;
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Get token from query parameter or header
  l_token := :token;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get manager_id from session
  BEGIN
    SELECT u.user_id INTO l_manager_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.token = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"error":"Unauthorized"}');
      RETURN;
  END;
  
  -- Call API
  oan_pulse_manager_api.get_pending_approvals(l_manager_id, l_result);
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;

/*

TEMPLATE 3: time-entries (GET team time entries)
-------------------------------------------------
URI Template: time-entries
Method: GET
Source Type: PL/SQL
Source:

*/

DECLARE
  l_manager_id NUMBER;
  l_token VARCHAR2(64);
  l_result CLOB;
  l_start_date DATE;
  l_end_date DATE;
  l_status VARCHAR2(20);
BEGIN
  -- Get token from query parameter or header
  l_token := :token;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get manager_id from session
  BEGIN
    SELECT u.user_id INTO l_manager_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.token = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"error":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get optional query parameters
  BEGIN
    l_start_date := TO_DATE(:start_date, 'YYYY-MM-DD');
  EXCEPTION
    WHEN OTHERS THEN
      l_start_date := NULL;
  END;
  
  BEGIN
    l_end_date := TO_DATE(:end_date, 'YYYY-MM-DD');
  EXCEPTION
    WHEN OTHERS THEN
      l_end_date := NULL;
  END;
  
  l_status := :status;
  
  -- Call API
  oan_pulse_manager_api.get_team_time_entries(
    l_manager_id,
    l_start_date,
    l_end_date,
    l_status,
    l_result
  );
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;

/*

TEMPLATE 4: approve/:id (POST approve time entry)
--------------------------------------------------
URI Template: approve/:id
Method: POST
Source Type: PL/SQL
Source:

*/

DECLARE
  l_manager_id NUMBER;
  l_token VARCHAR2(64);
  l_time_entry_id NUMBER;
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get token from query parameter or header
  l_token := :token;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get manager_id from session
  BEGIN
    SELECT u.user_id INTO l_manager_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.token = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"success":false,"message":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get time_entry_id from URL parameter
  l_time_entry_id := TO_NUMBER(:id);
  
  -- Call API
  oan_pulse_manager_api.approve_time_entry(
    l_time_entry_id,
    l_manager_id,
    NULL, -- notes
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;

/*

TEMPLATE 5: reject/:id (POST reject time entry)
------------------------------------------------
URI Template: reject/:id
Method: POST
Source Type: PL/SQL
Source:

*/

DECLARE
  l_manager_id NUMBER;
  l_token VARCHAR2(64);
  l_body CLOB;
  l_time_entry_id NUMBER;
  l_reason VARCHAR2(500);
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get token from query parameter or header
  l_token := :token;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get manager_id from session
  BEGIN
    SELECT u.user_id INTO l_manager_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.token = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"success":false,"message":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get time_entry_id from URL parameter
  l_time_entry_id := TO_NUMBER(:id);
  
  -- Get reason from request body
  l_body := :body_text;
  APEX_JSON.parse(l_body);
  l_reason := APEX_JSON.get_varchar2('reason');
  
  -- Call API
  oan_pulse_manager_api.reject_time_entry(
    l_time_entry_id,
    l_manager_id,
    l_reason,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;

/*

TEMPLATE 6: stats (GET team statistics)
----------------------------------------
URI Template: stats
Method: GET
Source Type: PL/SQL
Source:

*/

DECLARE
  l_manager_id NUMBER;
  l_token VARCHAR2(64);
  l_result CLOB;
  l_start_date DATE;
  l_end_date DATE;
BEGIN
  -- Get token from query parameter or header
  l_token := :token;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get manager_id from session
  BEGIN
    SELECT u.user_id INTO l_manager_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.token = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"error":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get optional query parameters
  BEGIN
    l_start_date := TO_DATE(:start_date, 'YYYY-MM-DD');
  EXCEPTION
    WHEN OTHERS THEN
      l_start_date := NULL;
  END;
  
  BEGIN
    l_end_date := TO_DATE(:end_date, 'YYYY-MM-DD');
  EXCEPTION
    WHEN OTHERS THEN
      l_end_date := NULL;
  END;
  
  -- Call API
  oan_pulse_manager_api.get_team_stats(
    l_manager_id,
    l_start_date,
    l_end_date,
    l_result
  );
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;

/*

STEP 4: Test the Endpoints
===========================
Use these Postman/curl requests to test:

1. GET Team Members:
   GET https://oracleapex.com/ords/oan_trial/manager/team?token=YOUR_TOKEN
   
2. GET Pending Approvals:
   GET https://oracleapex.com/ords/oan_trial/manager/pending?token=YOUR_TOKEN
   
3. GET Team Time Entries:
   GET https://oracleapex.com/ords/oan_trial/manager/time-entries?token=YOUR_TOKEN&start_date=2026-01-01&end_date=2026-01-31
   
4. POST Approve Time Entry:
   POST https://oracleapex.com/ords/oan_trial/manager/approve/1?token=YOUR_TOKEN
   
5. POST Reject Time Entry:
   POST https://oracleapex.com/ords/oan_trial/manager/reject/1?token=YOUR_TOKEN
   Body: {"reason": "Incorrect project code"}
   
6. GET Team Stats:
   GET https://oracleapex.com/ords/oan_trial/manager/stats?token=YOUR_TOKEN&start_date=2026-01-01&end_date=2026-01-31


IMPORTANT NOTES:
================
1. For reject/:id endpoint, make sure to add a "body_text" parameter if using :body_text
2. All endpoints require authentication via token (query param or Authorization header)
3. All dates should be in YYYY-MM-DD format
4. Managers can only see/approve entries from their direct reports

*/

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
BEGIN
  DBMS_OUTPUT.PUT_LINE('✅ Manager REST Handler Setup Guide Ready!');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Next Steps:');
  DBMS_OUTPUT.PUT_LINE('1. Compile manager_api_backend.sql in SQL Workshop');
  DBMS_OUTPUT.PUT_LINE('2. Create "manager" module in RESTful Services');
  DBMS_OUTPUT.PUT_LINE('3. Create 6 templates with handlers as documented above');
  DBMS_OUTPUT.PUT_LINE('4. Test endpoints with Postman');
  DBMS_OUTPUT.PUT_LINE('');
  DBMS_OUTPUT.PUT_LINE('Endpoints to create:');
  DBMS_OUTPUT.PUT_LINE('- GET /manager/team');
  DBMS_OUTPUT.PUT_LINE('- GET /manager/pending');
  DBMS_OUTPUT.PUT_LINE('- GET /manager/time-entries');
  DBMS_OUTPUT.PUT_LINE('- POST /manager/approve/:id');
  DBMS_OUTPUT.PUT_LINE('- POST /manager/reject/:id');
  DBMS_OUTPUT.PUT_LINE('- GET /manager/stats');
END;
/

