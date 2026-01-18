# 🔧 Simple APEX REST Setup (Root Template Method)

## Why This is Easier
Instead of creating a "create" template, we'll use the **root template** which is simpler and less error-prone.

---

## Step-by-Step Setup

### 1️⃣ Create Module

1. Go to **SQL Workshop** → **RESTful Services**
2. Click **"Create Module"**

```
Module Name: users
Base Path: /users
Items Per Page: 25
Origins Allowed: (leave blank)
```

3. Click **"Create Module"**

---

### 2️⃣ Use the Auto-Created Root Template

When you create a module, APEX automatically creates a root template (`/`).

1. Click on the **"users"** module
2. You should see a template with URI: **`/`** (blank or slash)
3. Click on that template

---

### 3️⃣ Create POST Handler

1. Click **"Create Handler"**
2. Set these values:

```
Method: POST
Source Type: PL/SQL
MIME Type: application/json
```

3. **Create Parameter:**
   - Click "Create Parameter"
   - Name: `body_text`
   - Bind Variable Name: `body_text`
   - Source Type: **HTTP Body**
   - Access Method: **IN**

4. **Paste this Source Code:**

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
  v_body := :body_text;
  
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
  
  HTP.print('{');
  HTP.print('"success": ' || CASE WHEN v_success = 1 THEN 'true' ELSE 'false' END || ',');
  HTP.print('"message": "' || REPLACE(v_message, '"', '\"') || '"');
  
  IF v_user_id IS NOT NULL THEN
    HTP.print(',"user_id": ' || v_user_id);
  END IF;
  
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || REPLACE(SQLERRM, '"', '\"') || '"');
    HTP.print('}');
END;
```

5. Click **"Create Handler"**

---

### 4️⃣ Create PUT Handler for Updates

1. Still on the **root template** (`/`)
2. Click **"Create Handler"** again
3. Set these values:

```
Method: PUT
Source Type: PL/SQL
MIME Type: application/json
```

4. **Create Parameters:**

   **Parameter 1:**
   - Name: `id`
   - Bind Variable Name: `id`
   - Source Type: **URI**
   - Access Method: **IN**
   
   **Parameter 2:**
   - Name: `body_text`
   - Bind Variable Name: `body_text`
   - Source Type: **HTTP Body**
   - Access Method: **IN**

5. **Paste this Source Code:**

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
  v_user_id := TO_NUMBER(:id);
  v_body := :body_text;
  
  BEGIN v_email := JSON_VALUE(v_body, '$.email'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_password := JSON_VALUE(v_body, '$.password'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_first_name := JSON_VALUE(v_body, '$.first_name'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_last_name := JSON_VALUE(v_body, '$.last_name'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_role := JSON_VALUE(v_body, '$.role'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_hourly_rate := TO_NUMBER(JSON_VALUE(v_body, '$.hourly_rate')); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN v_is_active := TO_NUMBER(JSON_VALUE(v_body, '$.is_active')); EXCEPTION WHEN OTHERS THEN NULL; END;
  
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
  
  HTP.print('{');
  HTP.print('"success": ' || CASE WHEN v_success = 1 THEN 'true' ELSE 'false' END || ',');
  HTP.print('"message": "' || REPLACE(v_message, '"', '\"') || '"');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{');
    HTP.print('"success": false,');
    HTP.print('"message": "' || REPLACE(SQLERRM, '"', '\"') || '"');
    HTP.print('}');
END;
```

6. Click **"Create Handler"**

---

### 5️⃣ Publish the Module

1. Go back to the module view
2. Make sure **"Published"** is set to **Yes**

---

## 🧪 Test with Postman

### Create User
```
POST https://oracleapex.com/ords/oan_trial/users/
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

### Update User
```
PUT https://oracleapex.com/ords/oan_trial/users/4
Content-Type: application/json

{
  "first_name": "Jonathan",
  "hourly_rate": 50
}
```

---

## 📝 Summary

**Endpoints created:**
- `POST /users/` - Create user
- `PUT /users/:id` - Update user
- `GET /users/` - List users (already works via auto-REST)
- `GET /users/:id` - Get single user (already works via auto-REST)

**React code already points to:**
- `POST /users/create` ← We need to change this to `/users/`
- `PUT /users/:id` ← This stays the same

---

Let me know if this setup works better! 🎯

