# Simple APEX Visual Check for /auth/me Endpoint

## Since SQL queries might have version differences, let's check visually in APEX

### Step 1: Open APEX RESTful Services
1. Log in to Oracle APEX
2. Click **SQL Workshop** (top menu)
3. Click **RESTful Services** (left menu)
4. Click **Modules** (if not already there)

### Step 2: Find Your auth Module
- You should see a module called **auth** in the list
- Click on it

### Step 3: Check Templates
You should see these templates:
- ✅ **login** (with POST handler)
- ✅ **logout** (with POST handler)
- ❓ **me** (should have GET handler)

### Step 4: Check the "me" Template

**If "me" template EXISTS:**
1. Click on **me**
2. Look for handlers section
3. You should see: **GET** handler
4. If GET handler exists, click on it
5. Check the PL/SQL code

**If "me" template DOES NOT EXIST:**
You need to create it! That's why you get 404.

---

## How to Create "me" Template (If Missing)

### Create the Template:
1. In your **auth** module page
2. Click **"Create Template"** button
3. Fill in:
   - **URI Template:** `me` (just the word "me", no slashes)
4. Click **Create**

### Create the GET Handler:
1. Click on your new **me** template
2. Click **"Create Handler"** button
3. Fill in:
   - **Method:** `GET`
   - **Source Type:** `PL/SQL`
   - **MIME Type:** `application/json`
4. In the **Source** box, paste:

```sql
DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Try to get token from query parameter first (easier to test)
  l_token := :token;
  
  IF l_token IS NULL THEN
    HTP.P('{"success": false, "message": "Add ?token=your-token to URL"}');
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

5. Click **Create Handler**

### Test It:
```
GET https://oracleapex.com/ords/oan_trial/auth/me?token=YOUR_TOKEN_HERE
```

Replace YOUR_TOKEN_HERE with a token from login.

---

## Quick Troubleshooting

### "404 Not Found"
→ Template doesn't exist or module isn't published

### "Template exists but still 404"
→ Check module is **Published** (checkbox in module settings)

### "No GET handler"
→ Create one following steps above

### "Wrong method"
→ Make sure Postman is set to **GET** not POST

---

## Screenshot Checklist

When you open APEX → SQL Workshop → RESTful Services → auth module, you should see:

```
┌──────────────────────────────────────┐
│ Module: auth                        │
│ URI Prefix: /auth/                  │
│ Published: ✓                        │
├──────────────────────────────────────┤
│ Templates:                          │
│                                     │
│ □ login                             │
│   └─ POST (handler exists)         │
│                                     │
│ □ logout                            │
│   └─ POST (handler exists)         │
│                                     │
│ □ me                                │
│   └─ GET (handler should exist)    │
└──────────────────────────────────────┘
```

If you DON'T see the "me" template, that's the problem!

---

## Next Steps

1. **Check if "me" template exists** in APEX
2. **If NO:** Create it using steps above
3. **If YES:** Check if it has a GET handler
4. **Test with simple code first**
5. **Then add query parameter version**
6. **Finally tackle Authorization header**

---

**Go to APEX now and check if the "me" template exists!** Take a screenshot if you can, or just tell me:
- Does "me" template exist? (yes/no)
- If yes, does it have a GET handler? (yes/no)
- Is the auth module Published? (yes/no)

