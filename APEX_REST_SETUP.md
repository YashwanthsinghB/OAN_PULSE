# 🔐 APEX REST Services Setup Guide - Authentication

## Prerequisites

✅ You've run `auth_setup.sql` successfully in your database
✅ You're logged into Oracle APEX
✅ You're in the `OAN_TRIAL` workspace

---

## Step 1: Create REST Module for Authentication

### 1.1 Navigate to RESTful Services

1. Log in to **Oracle APEX**
2. Go to **SQL Workshop** → **RESTful Services**
3. Click **Modules** (left side menu)

### 1.2 Create Authentication Module

1. Click **Create Module** button
2. Fill in the details:
   - **Module Name:** `auth`
   - **Base Path:** `/auth/`
   - **Pagination Size:** 25
   - **Origins Allowed:** `*` (for development) or `http://localhost:3000`
   - **Requires Authentication:** NO (for login endpoint)
   - **Is Published:** YES
3. Click **Create Module**

---

## Step 2: Create Login Endpoint

### 2.1 Create Resource Template

1. Under your `auth` module, click **Create Template**
2. Fill in:
   - **URI Template:** `login`
   - Click **Create**

### 2.2 Create POST Handler for Login

1. Click on the `login` template you just created
2. Click **Create Handler**
3. Fill in:

   - **Method:** `POST`
   - **Source Type:** `PL/SQL`
   - **Requires Authentication:** NO
   - **MIME Type:** `application/json`

4. **Source (PL/SQL code):**

```sql
DECLARE
  l_body CLOB;
  l_email VARCHAR2(200);
  l_password VARCHAR2(200);
  l_result CLOB;
BEGIN
  -- Get request body
  l_body := :body_text;

  -- Parse JSON input
  l_email := JSON_VALUE(l_body, '$.email');
  l_password := JSON_VALUE(l_body, '$.password');

  -- Call login procedure
  oan_pulse_api_login(
    p_email => l_email,
    p_password => l_password,
    p_result => l_result
  );

  -- Return result
  HTP.P(l_result);

EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "' || SQLERRM || '"}');
END;
```

5. Click **Create Handler**

---

## Step 3: Create Logout Endpoint

### 3.1 Create Resource Template

1. Under `auth` module, click **Create Template**
2. Fill in:
   - **URI Template:** `logout`
   - Click **Create**

### 3.2 Create POST Handler for Logout

1. Click on the `logout` template
2. Click **Create Handler**
3. Fill in:

   - **Method:** `POST`
   - **Source Type:** `PL/SQL`
   - **Requires Authentication:** NO
   - **MIME Type:** `application/json`

4. **Source (PL/SQL code):**

```sql
DECLARE
  l_body CLOB;
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Get request body
  l_body := :body_text;

  -- Parse JSON input (get token from body or header)
  l_token := JSON_VALUE(l_body, '$.token');

  -- If not in body, check Authorization header
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;

  -- Call logout procedure
  oan_pulse_api_logout(
    p_token => l_token,
    p_result => l_result
  );

  -- Return result
  HTP.P(l_result);

EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "' || SQLERRM || '"}');
END;
```

5. Click **Create Handler**

---

## Step 4: Create "Get Current User" Endpoint

### 4.1 Create Resource Template

1. Under `auth` module, click **Create Template**
2. Fill in:
   - **URI Template:** `me`
   - Click **Create**

### 4.2 Create GET Handler

1. Click on the `me` template
2. Click **Create Handler**
3. Fill in:

   - **Method:** `GET`
   - **Source Type:** `PL/SQL`
   - **Requires Authentication:** NO (we handle it manually)
   - **MIME Type:** `application/json`

4. **Source (PL/SQL code):**

```sql
DECLARE
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Get token from Authorization header
  l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');

  -- Call get user procedure
  oan_pulse_api_get_user(
    p_token => l_token,
    p_result => l_result
  );

  -- Return result
  HTP.P(l_result);

EXCEPTION
  WHEN OTHERS THEN
    HTP.P('{"success": false, "message": "' || SQLERRM || '"}');
END;
```

5. Click **Create Handler**

---

## Step 5: Update CORS Settings (Important!)

To allow your React app to call these endpoints:

### 5.1 Enable CORS on Module

1. Go back to your `auth` module
2. Click **Edit Module**
3. Find **Origins Allowed**
4. Set to: `http://localhost:3000` (for development)
   - For production, use your actual domain
   - For testing multiple origins: `http://localhost:3000,https://yourdomain.com`
5. **Save**

---

## Step 6: Test Your Endpoints

### Test 1: Login Endpoint

**Using cURL:**

```bash
curl -X POST https://oracleapex.com/ords/oan_trial/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@oan_pulse.com", "password": "Password123!"}'
```

**Expected Response:**

```json
{
  "success": true,
  "token": "abc123def456...",
  "user": {
    "user_id": 1,
    "email": "admin@oan_pulse.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN",
    "hourly_rate": 100
  }
}
```

**Using Browser Console:**

```javascript
fetch("https://oracleapex.com/ords/oan_trial/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@oan_pulse.com",
    password: "Password123!",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Test 2: Get Current User (using token from login)

**Using cURL:**

```bash
# Replace YOUR_TOKEN_HERE with actual token from login
curl https://oracleapex.com/ords/oan_trial/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Using Browser Console:**

```javascript
// First, login and get token
let token;
fetch("https://oracleapex.com/ords/oan_trial/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@oan_pulse.com",
    password: "Password123!",
  }),
})
  .then((r) => r.json())
  .then((data) => {
    token = data.token;
    console.log("Token:", token);

    // Now get user info
    return fetch("https://oracleapex.com/ords/oan_trial/auth/me", {
      headers: { Authorization: "Bearer " + token },
    });
  })
  .then((r) => r.json())
  .then(console.log);
```

### Test 3: Logout

**Using Browser Console:**

```javascript
fetch("https://oracleapex.com/ords/oan_trial/auth/logout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN_HERE",
  },
})
  .then((r) => r.json())
  .then(console.log);
```

---

## Step 7: View All Your REST Endpoints

You should now have:

### Module: `auth` (`/auth/`)

| Endpoint | Method | URL            | Purpose          |
| -------- | ------ | -------------- | ---------------- |
| `login`  | POST   | `/auth/login`  | User login       |
| `logout` | POST   | `/auth/logout` | User logout      |
| `me`     | GET    | `/auth/me`     | Get current user |

**Full URLs:**

- Login: `https://oracleapex.com/ords/oan_trial/auth/login`
- Logout: `https://oracleapex.com/ords/oan_trial/auth/logout`
- Get User: `https://oracleapex.com/ords/oan_trial/auth/me`

---

## Troubleshooting

### Problem 1: "404 Not Found"

**Solution:**

- Make sure module is **Published** (check module settings)
- Verify Base Path is `/auth/` (with trailing slash)
- Check URI Template spelling

### Problem 2: "CORS Error" in browser

**Solution:**

- Edit module → Set **Origins Allowed** to `*` or `http://localhost:3000`
- Make sure to save changes

### Problem 3: "Invalid JSON" or parsing errors

**Solution:**

- Make sure `Content-Type: application/json` header is sent
- Check JSON syntax in request body
- Look at APEX error logs (SQL Workshop → Monitor Activity → Recent Sessions)

### Problem 4: "Procedure not found"

**Solution:**

- Verify `auth_setup.sql` ran successfully
- Check if procedures exist:
  ```sql
  SELECT object_name, object_type, status
  FROM user_objects
  WHERE object_name LIKE 'OAN_PULSE%'
  ORDER BY object_name;
  ```

### Problem 5: "Token validation fails"

**Solution:**

- Check if session exists in database:
  ```sql
  SELECT * FROM oan_pulse_user_sessions
  WHERE session_token = 'YOUR_TOKEN'
  AND expires_at > SYSTIMESTAMP;
  ```
- Tokens expire after 2 hours
- Make sure token is passed correctly in Authorization header

---

## Security Notes

### For Production:

1. **Change Default Passwords**

   - Update all test user passwords
   - Require strong passwords

2. **CORS Settings**

   - Set specific domain instead of `*`
   - Example: `https://yourapp.com`

3. **HTTPS Only**

   - Never use HTTP in production
   - Oracle APEX Cloud provides HTTPS by default

4. **Token Expiration**

   - Current: 2 hours (configurable in `auth_setup.sql`)
   - Adjust in the `oan_pulse_auth.login` function

5. **Rate Limiting**
   - Consider adding rate limiting on login endpoint
   - Prevent brute force attacks

---

## What's Next?

Once your endpoints are working:

1. ✅ Test all endpoints (login, logout, get user)
2. ⏭️ Build React Login Page
3. ⏭️ Create AuthContext in React
4. ⏭️ Add Protected Routes
5. ⏭️ Replace hardcoded `user_id = 1` with actual user

I'll help you with the React implementation next! 🚀

---

## Quick Reference

### Test User Credentials:

- **Admin:** admin@oan_pulse.com / Password123!
- **Manager:** manager@oan_pulse.com / Password123!
- **Employee:** employee@oan_pulse.com / Password123!

### REST Endpoints Base URL:

```
https://oracleapex.com/ords/oan_trial/auth/
```

### Token Format:

```
Authorization: Bearer <your-token-here>
```
