# Testing Auth Endpoints - Step by Step

## Problem You Encountered
The token had **spaces** in it:
```
" c63 b55 1ee 941 539 d46 bdf 4f7 e9 a74 27b 7ae 321 94c a19 9ad"
```

This was caused by the `generate_token` function. I've fixed it in `fix_token_spaces.sql`.

---

## Fix Steps

### 1. Run the Fix
```sql
@fix_token_spaces.sql
```

This will:
- ✅ Fix the `generate_token` function (no more spaces!)
- ✅ Clear old sessions with spaces
- ✅ Test the new token generation

---

## Testing in Postman

### Test 1: Login (POST)

**URL:** `https://oracleapex.com/ords/oan_trial/auth/login`

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@oan_pulse.com",
  "password": "Password123!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6... (64 characters, NO SPACES)",
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

**COPY THE TOKEN!** You'll need it for the next test.

---

### Test 2: Get Current User (GET)

**URL:** `https://oracleapex.com/ords/oan_trial/auth/me`

**Method:** GET

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

⚠️ **IMPORTANT:** 
- Replace `YOUR_TOKEN_HERE` with the token from Test 1
- Make sure there's a **space** between `Bearer` and the token
- Remove any extra spaces or line breaks

**Example:**
```
Authorization: Bearer a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
```

**Expected Response:**
```json
{
  "success": true,
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

---

## Postman Setup Screenshots

### For Login (POST):
```
Method: POST
URL: https://oracleapex.com/ords/oan_trial/auth/login

Headers tab:
  Key: Content-Type
  Value: application/json

Body tab:
  ○ none
  ○ form-data
  ○ x-www-form-urlencoded
  ● raw        [Dropdown: JSON]
  
  {
    "email": "admin@oan_pulse.com",
    "password": "Password123!"
  }
```

### For Get User (GET):
```
Method: GET
URL: https://oracleapex.com/ords/oan_trial/auth/me

Headers tab:
  Key: Authorization
  Value: Bearer a1b2c3d4e5f67890... (paste your token here)
```

---

## Troubleshooting

### Problem: "Invalid or expired token"

**Check these:**

1. **Token has no spaces**
   - Run `fix_token_spaces.sql` first
   - Login again to get a new token
   - Verify token is 64 characters, no spaces

2. **Authorization header is correct**
   - Must be: `Bearer <token>`
   - Space between Bearer and token
   - No extra quotes or spaces

3. **Token hasn't expired**
   - Tokens expire after 2 hours
   - Login again to get a fresh token

4. **Check database**
   ```sql
   -- See your active sessions
   SELECT 
     session_token,
     LENGTH(session_token) as token_length,
     CASE WHEN INSTR(session_token, ' ') > 0 THEN 'HAS SPACES!' ELSE 'Clean' END as space_check,
     expires_at,
     CASE WHEN expires_at > SYSTIMESTAMP THEN 'Valid' ELSE 'Expired' END as status
   FROM oan_pulse_user_sessions
   ORDER BY created_at DESC;
   ```

---

## Browser Console Testing (After Fix)

```javascript
// Test 1: Login
let token;

fetch('https://oracleapex.com/ords/oan_trial/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@oan_pulse.com',
    password: 'Password123!'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login Response:', data);
  token = data.token;
  console.log('Token:', token);
  console.log('Token Length:', token.length);
  console.log('Has spaces?', token.includes(' ') ? 'YES - BAD!' : 'NO - Good!');
  
  // Test 2: Get current user
  return fetch('https://oracleapex.com/ords/oan_trial/auth/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
})
.then(r => r.json())
.then(data => {
  console.log('Get User Response:', data);
  if (data.success) {
    console.log('✅ Authentication working!');
  } else {
    console.log('❌ Error:', data.message);
  }
});
```

---

## Quick Test Checklist

After running `fix_token_spaces.sql`:

```
[ ] 1. Login via Postman
[ ] 2. Verify token has NO spaces
[ ] 3. Verify token is exactly 64 characters
[ ] 4. Copy the token
[ ] 5. Test /auth/me with Authorization header
[ ] 6. Should get user info back
[ ] 7. Test with wrong token (should fail)
[ ] 8. Test logout endpoint
```

---

## What Fixed?

**Before:**
```json
"token": " c63 b55 1ee 941 539..."  ← Spaces!
```

**After:**
```json
"token": "c63b551ee941539d46..."  ← No spaces!
```

The `generate_token` function now uses `RAWTOHEX` and `UTL_RAW.CAST_FROM_BINARY_INTEGER` which creates clean hex strings without spaces.

---

## Ready to Test!

1. Run `fix_token_spaces.sql`
2. Test login in Postman
3. Copy the token (should be 64 chars, no spaces)
4. Test `/auth/me` with the token
5. Should work! 🎉

