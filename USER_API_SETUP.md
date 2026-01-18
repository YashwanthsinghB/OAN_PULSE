# 🔧 User Management API Setup Guide

## Problem
The default ORDS REST endpoints don't handle password hashing, so we need custom endpoints.

## Solution
I've created custom PL/SQL procedures that:
1. Hash passwords before storing
2. Handle user creation with proper validation
3. Handle user updates (including optional password changes)

---

## Step 1: Run the SQL Script

Execute the script: `user_management_api.sql` in your Oracle database.

This creates:
- `oan_pulse_user_api` package (business logic)
- `oan_pulse_api_create_user` procedure (REST handler)
- `oan_pulse_api_update_user` procedure (REST handler)

---

## Step 2: Create REST Endpoints in APEX

### Option A: Create in "users" module

1. Go to **SQL Workshop** → **RESTful Services**
2. Click **"Modules"** in left panel
3. Click **"Create Module"**

**Module Details:**
```
Module Name: users
Base Path: /users
Protected By Privilege: (leave empty)
```

4. Click **"Create Module"**

### Create Template 1: "create"

1. Under the "users" module, click **"Create Template"**
2. **URI Template:** `create`
3. Click **"Create Template"**
4. Click **"Create Handler"**

**Handler Details:**
```
Method: POST
Source Type: PL/SQL
MIME Type: application/json
```

**Source Code:**
```sql
BEGIN
  oan_pulse_api_create_user;
END;
```

5. Add these **Parameters**:
   - Name: `body_text`
   - Bind Variable Name: `body_text`
   - Source Type: `HTTP Body`
   - Access Method: `IN`

6. Click **"Create Handler"**

### Create Template 2: ":id"

1. Under the "users" module, click **"Create Template"**
2. **URI Template:** `:id`
3. Click **"Create Template"**
4. Click **"Create Handler"**

**Handler Details:**
```
Method: PUT
Source Type: PL/SQL
MIME Type: application/json
```

**Source Code:**
```sql
BEGIN
  oan_pulse_api_update_user;
END;
```

5. Add these **Parameters**:
   - Parameter 1:
     - Name: `id`
     - Bind Variable Name: `id`
     - Source Type: `URI`
     - Access Method: `IN`
   
   - Parameter 2:
     - Name: `body_text`
     - Bind Variable Name: `body_text`
     - Source Type: `HTTP Body`
     - Access Method: `IN`

6. Click **"Create Handler"**

---

## Step 3: Test the Endpoints

### Test Create User (POST)

**URL:** `https://oracleapex.com/ords/oan_trial/users/create`

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "test.user@oan-pulse.com",
  "password": "TestPass123!",
  "first_name": "Test",
  "last_name": "User",
  "role": "EMPLOYEE",
  "hourly_rate": 50,
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

### Test Update User (PUT)

**URL:** `https://oracleapex.com/ords/oan_trial/users/4`

**Method:** PUT

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "first_name": "Updated",
  "hourly_rate": 60,
  "is_active": 1
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

## Step 4: Update React App (Already Done!)

I've already updated the React code to use these endpoints:
- `POST /users/create` for creating users
- `PUT /users/:id` for updating users

---

## Quick Visual Guide

```
APEX REST Services Structure:

📁 Modules
  📁 auth (existing)
    📄 login
    📄 logout
    📄 me
  
  📁 users (NEW!)
    📄 create     → POST /users/create
    📄 :id        → PUT /users/:id
```

---

## Troubleshooting

### "Procedure not found"
- Make sure you ran `user_management_api.sql`
- Check if procedures exist:
  ```sql
  SELECT object_name FROM user_procedures 
  WHERE object_name LIKE 'OAN_PULSE_API%';
  ```

### "401 Unauthorized"
- Make sure module is published
- Check if authentication is disabled

### "JSON parsing error"
- Verify parameter names match exactly
- Check bind variable names are lowercase

---

## After Setup

Once you've created the REST endpoints:

1. **Refresh your React app**
2. **Login as Admin**
3. **Go to Users page**
4. **Try creating a user**
5. **Should work!** ✅

---

Let me know when you've created the REST endpoints and I'll help test!

