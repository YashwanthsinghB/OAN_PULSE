# 🔧 Fix Authorization Header in APEX REST

## The Problem
The Authorization header isn't reaching your PL/SQL code because ORDS needs to be told to pass it through.

## Solution: Add Authorization as a Parameter

### Step 1: Edit the GET Handler

1. Go to **SQL Workshop** → **RESTful Services**
2. Click **Modules** → **auth** → **me** template
3. Click on your **GET** handler
4. Look for a section called **"Parameters"** or **"Handler Parameters"**

### Step 2: Add Authorization Parameter

Click **"Create Parameter"** or **"Add Parameter"** and fill in:

```
Name: Authorization
Bind Variable: authorization  (lowercase!)
Source Type: HTTP Header
Access Method: IN
Data Type: STRING
Required: Yes
```

**Important:** 
- Name = `Authorization` (capital A)
- Bind Variable = `authorization` (lowercase a)
- Source Type = `HTTP Header` (not Query String or Body)

### Step 3: Update the PL/SQL Code

Replace your handler code with **VERSION 3** from `correct_auth_me_handler.sql`:

```sql
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
```

### Step 4: Save and Test

1. Click **Apply Changes**
2. Test in Postman:
   - GET `https://oracleapex.com/ords/oan_trial/auth/me`
   - Header: `Authorization: Bearer <your-token>`

---

## Alternative: If Parameters Section Doesn't Exist

Some APEX versions don't have a separate Parameters section. In that case:

### Try VERSION 1 (Simplest)

Just use `:authorization` directly:

```sql
DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  l_token := TRIM(REPLACE(REPLACE(:authorization, 'Bearer ', ''), 'bearer ', ''));
  
  IF l_token IS NULL OR LENGTH(l_token) = 0 THEN
    HTP.P('{"success": false, "message": "No token in :authorization bind variable"}');
    RETURN;
  END IF;
  
  oan_pulse_api_get_user(
    p_token => l_token,
    p_result => l_result
  );
  
  HTP.P(l_result);
END;
```

If that gives an error about `:authorization` not existing, use **VERSION 2**.

---

## Debug: See What Headers Are Received

If still not working, temporarily use the debug version:

1. Replace handler code with code from `debug_headers.sql`
2. Call the endpoint in Postman
3. You'll see all headers ORDS received
4. Send me the output

---

## Visual Guide

### What It Should Look Like in APEX:

```
┌─────────────────────────────────────────────┐
│ Handler: GET                                │
├─────────────────────────────────────────────┤
│ Source Type: PL/SQL                         │
│ MIME Type: application/json                 │
│                                             │
│ Parameters:                                 │
│ ┌─────────────┬─────────────┬──────────┐   │
│ │ Name        │ Type        │ Source   │   │
│ ├─────────────┼─────────────┼──────────┤   │
│ │Authorization│ STRING      │ Header   │   │
│ │             │ (IN)        │          │   │
│ └─────────────┴─────────────┴──────────┘   │
│                                             │
│ Source:                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ DECLARE                                 │ │
│ │   l_token VARCHAR2(64);                 │ │
│ │   l_result CLOB;                        │ │
│ │ BEGIN                                   │ │
│ │   l_token := TRIM(REPLACE(              │ │
│ │     REPLACE(:authorization,             │ │
│ │       'Bearer ', ''),                   │ │
│ │       'bearer ', ''));                  │ │
│ │   ...                                   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Quick Test Checklist

After making changes:

```
[ ] 1. Added Authorization parameter (if section exists)
[ ] 2. Updated PL/SQL code to use :authorization
[ ] 3. Saved changes
[ ] 4. Got fresh token from /auth/login
[ ] 5. Tested /auth/me in Postman
[ ] 6. Authorization header: Bearer <token>
[ ] 7. Should return user info!
```

---

## What to Try (In Order)

1. **First:** Try VERSION 3 with parameter
2. **If no parameters section:** Try VERSION 1 with `:authorization`
3. **If bind variable error:** Try VERSION 2 with APEX_WEB_SERVICE
4. **If still failing:** Use debug version and send me output

---

## Common Issues

### "bind variable does not exist"
→ Use VERSION 2 instead

### "No token provided" even with correct header
→ Need to add Authorization parameter (Step 2 above)

### "Authorization header not found"
→ Check Postman header format: `Authorization: Bearer <token>`

---

**Try adding the Authorization parameter first, then use VERSION 3 code!**

