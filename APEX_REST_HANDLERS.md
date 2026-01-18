# 🔧 APEX REST Handlers - Copy/Paste Code

## ⚠️ Important
The **bind variables** (`:body_text`, `:id`) only work inside APEX REST handlers.  
**DO NOT** try to compile these as standalone procedures!

---

## Step 1: Run Backend SQL First

Run **`user_api_backend.sql`** first to create the `oan_pulse_user_api` package.

---

## Step 2: Create REST Endpoints in APEX

### 📁 Create Module

1. Go to **SQL Workshop** → **RESTful Services**
2. Click **"Create Module"**

**Module Settings:**
```
Module Name: users
Base Path: /users
Protected: No
Publish: Yes
```

---

### 📄 Handler 1: Create User (POST)

1. Click on the **"users"** module
2. Click **"Create Template"**
   - URI Template: `create`
3. Click **"Create Handler"**
   - Method: **POST**
   - Source Type: **PL/SQL**
   - MIME Type: `application/json`

4. **Add Parameters:**
   - Click "Create Parameter"
   - Name: `body_text`
   - Bind Variable: `body_text`
   - Source Type: **HTTP Body**
   - Access Method: **IN**

5. **Source Code** (copy this exactly):

```sql
DECLARE
  v_body CLOB;
  v_email VARCHAR2(255);
  v_password VARCHAR2(255);
  v_first_name VARCHAR2(100);
  v_last_name VARCHAR2(100);
  v_role VARCHAR2(50);
  v_hourly_rate NUMBER;
  v_is_active NUMBER;
  v_user_id NUMBER;
  v_message VARCHAR2(500);
  v_success NUMBER;
BEGIN
  -- Get request body
  v_body := :body_text;
  
  -- Parse JSON
  v_email := JSON_VALUE(v_body, '$.email');
  v_password := JSON_VALUE(v_body, '$.password');
  v_first_name := JSON_VALUE(v_body, '$.first_name');
  v_last_name := JSON_VALUE(v_body, '$.last_name');
  v_role := NVL(JSON_VALUE(v_body, '$.role'), 'EMPLOYEE');
  
  BEGIN
    v_hourly_rate := TO_NUMBER(JSON_VALUE(v_body, '$.hourly_rate'));
  EXCEPTION
    WHEN OTHERS THEN v_hourly_rate := NULL;
  END;
  
  v_is_active := NVL(TO_NUMBER(JSON_VALUE(v_body, '$.is_active')), 1);
  
  -- Call package procedure
  oan_pulse_user_api.create_user(
    p_email => v_email,
    p_password => v_password,
    p_first_name => v_first_name,
    p_last_name => v_last_name,
    p_role => v_role,
    p_hourly_rate => v_hourly_rate,
    p_is_active => v_is_active,
    o_user_id => v_user_id,
    o_message => v_message,
    o_success => v_success
  );
  
  -- Return JSON response
  HTP.print('{');
  HTP.print('"success": ' || CASE WHEN v_success = 1 THEN 'true' ELSE 'false' END || ',');
  HTP.print('"message": "' || REPLACE(v_message, '"', '\"') || '"');
  
  IF v_user_id IS NOT NULL THEN
    HTP.print(',"user_id": ' || v_user_id);
  END IF;
  
  HTP.print('}');
  
  -- Set HTTP status
  IF v_success = 1 THEN
    :status_code := 201;
  ELSE
    :status_code := 400;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    :status_code := 500;
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || REPLACE(SQLERRM, '"', '\"') || '"');
    HTP.print('}');
END;
```

6. **Add Output Parameter** (if needed):
   - Name: `status_code`
   - Bind Variable: `status_code`
   - Source Type: **Response**
   - Access Method: **OUT**

---

### 📄 Handler 2: Update User (PUT)

1. Click on the **"users"** module
2. Click **"Create Template"**
   - URI Template: `:id`
3. Click **"Create Handler"**
   - Method: **PUT**
   - Source Type: **PL/SQL**
   - MIME Type: `application/json`

4. **Add Parameters:**
   
   **Parameter 1:**
   - Name: `id`
   - Bind Variable: `id`
   - Source Type: **URI**
   - Access Method: **IN**
   
   **Parameter 2:**
   - Name: `body_text`
   - Bind Variable: `body_text`
   - Source Type: **HTTP Body**
   - Access Method: **IN**

5. **Source Code** (copy this exactly):

```sql
DECLARE
  v_body CLOB;
  v_user_id NUMBER;
  v_email VARCHAR2(255);
  v_password VARCHAR2(255);
  v_first_name VARCHAR2(100);
  v_last_name VARCHAR2(100);
  v_role VARCHAR2(50);
  v_hourly_rate NUMBER;
  v_is_active NUMBER;
  v_message VARCHAR2(500);
  v_success NUMBER;
BEGIN
  -- Get user ID from URI
  v_user_id := TO_NUMBER(:id);
  
  -- Get request body
  v_body := :body_text;
  
  -- Parse JSON (all optional for updates)
  BEGIN v_email := JSON_VALUE(v_body, '$.email'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_password := JSON_VALUE(v_body, '$.password'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_first_name := JSON_VALUE(v_body, '$.first_name'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_last_name := JSON_VALUE(v_body, '$.last_name'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_role := JSON_VALUE(v_body, '$.role'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_hourly_rate := TO_NUMBER(JSON_VALUE(v_body, '$.hourly_rate')); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_is_active := TO_NUMBER(JSON_VALUE(v_body, '$.is_active')); EXCEPTION WHEN OTHERS THEN NULL; END;
  
  -- Call package procedure
  oan_pulse_user_api.update_user(
    p_user_id => v_user_id,
    p_email => v_email,
    p_password => v_password,
    p_first_name => v_first_name,
    p_last_name => v_last_name,
    p_role => v_role,
    p_hourly_rate => v_hourly_rate,
    p_is_active => v_is_active,
    o_message => v_message,
    o_success => v_success
  );
  
  -- Return JSON response
  HTP.print('{');
  HTP.print('"success": ' || CASE WHEN v_success = 1 THEN 'true' ELSE 'false' END || ',');
  HTP.print('"message": "' || REPLACE(v_message, '"', '\"') || '"');
  HTP.print('}');
  
  -- Set HTTP status
  IF v_success = 1 THEN
    :status_code := 200;
  ELSE
    :status_code := 400;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    :status_code := 500;
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || REPLACE(SQLERRM, '"', '\"') || '"');
    HTP.print('}');
END;
```

6. **Add Output Parameter** (if needed):
   - Name: `status_code`
   - Bind Variable: `status_code`
   - Source Type: **Response**
   - Access Method: **OUT**

---

## 🧪 Test Your Endpoints

### Test 1: Create User

**Using Postman:**
```
POST https://oracleapex.com/ords/oan_trial/users/create
Content-Type: application/json

{
  "email": "john.doe@oan-pulse.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "EMPLOYEE",
  "hourly_rate": 45,
  "is_active": 1
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user_id": 4
}
```

### Test 2: Update User

**Using Postman:**
```
PUT https://oracleapex.com/ords/oan_trial/users/4
Content-Type: application/json

{
  "first_name": "Jonathan",
  "hourly_rate": 50
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

## ✅ Checklist

- [ ] Run `user_api_backend.sql` - Package compiled
- [ ] Create "users" module in APEX
- [ ] Create "create" template with POST handler
- [ ] Create ":id" template with PUT handler
- [ ] Test POST /users/create
- [ ] Test PUT /users/:id
- [ ] Try creating user from React app

---

## 🐛 Troubleshooting

### "Procedure not found"
```sql
-- Check if package exists
SELECT object_name, status 
FROM user_objects 
WHERE object_name = 'OAN_PULSE_USER_API';
```

### "JSON parsing error"
- Make sure parameter names are exact: `body_text` (lowercase)
- Check Content-Type header is `application/json`

### "Token/Auth errors"
- Temporarily disable authentication on the module
- Test without token first

---

**Once you've completed these steps, user creation/editing will work in your React app!** 🎉

