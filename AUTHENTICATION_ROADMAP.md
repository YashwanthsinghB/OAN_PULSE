# 🔐 Authentication & Authorization Roadmap - OAN Pulse

## Current State

- ✅ Time tracking functionality complete
- ✅ Modern, professional UI
- ⚠️ **Hardcoded user_id = 1** (no login)
- ⚠️ No role-based access control
- ⚠️ Billable status now inherited from project ✓

---

## Phase 1: Authentication Foundation (Login/Logout)

**Goal:** Allow users to log in and secure the application

### 1.1 Database Preparation ✅ (Already Done)

Our `OAN_PULSE_USERS` table has:

- `email` (username)
- `password_hash` (for storing hashed passwords)
- `role` (ADMIN, MANAGER, EMPLOYEE)
- `is_active` (to enable/disable users)

### 1.2 Backend: Create Authentication API Endpoints

**Location:** Oracle APEX REST Services

**Endpoints to Create:**

#### A. **POST `/auth/login`**

- **Input:** `{ email, password }`
- **Process:**
  - Validate credentials against `OAN_PULSE_USERS`
  - Check `is_active = 1`
  - Generate JWT token or session token
  - Return user info + token
- **Output:**
  ```json
  {
    "user_id": 1,
    "email": "admin@oan_pulse.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "ADMIN",
    "token": "eyJhbGc..."
  }
  ```

#### B. **POST `/auth/logout`**

- **Input:** `{ token }`
- **Process:** Invalidate session/token
- **Output:** `{ "message": "Logged out successfully" }`

#### C. **GET `/auth/me`**

- **Input:** `Authorization: Bearer <token>` (header)
- **Process:** Validate token and return current user
- **Output:** User object

**Implementation Options:**

1. **Oracle APEX Built-in Authentication** (Recommended)

   - Use APEX's session management
   - Create custom REST endpoints
   - Secure and well-tested

2. **Custom JWT Token** (Advanced)
   - Implement PL/SQL functions for JWT generation/validation
   - More flexible but requires more work

### 1.3 Frontend: Login Page

**File:** `oan-pulse-frontend/src/pages/Login.jsx`

**Features:**

- Email/password form
- "Remember me" checkbox
- Error handling (invalid credentials, inactive account)
- Redirect to dashboard after login
- Modern, clean design matching current UI

**Protected Routes:**

- Wrap all routes with authentication check
- Redirect to `/login` if not authenticated
- Store token in localStorage or sessionStorage

### 1.4 Frontend: Authentication Context

**File:** `oan-pulse-frontend/src/contexts/AuthContext.jsx`

**Features:**

- Store current user globally
- `login()`, `logout()`, `isAuthenticated()`
- Auto-logout on token expiration
- Attach token to all API requests

---

## Phase 2: Role-Based Access Control (RBAC)

**Goal:** Different permissions for different roles

### 2.1 Define Role Permissions

| Feature             | EMPLOYEE | MANAGER       | ADMIN    |
| ------------------- | -------- | ------------- | -------- |
| **Time Entries**    |
| View own entries    | ✅       | ✅            | ✅       |
| View team entries   | ❌       | ✅ (own team) | ✅ (all) |
| Edit own entries    | ✅       | ✅            | ✅       |
| Edit team entries   | ❌       | ✅            | ✅       |
| Delete own entries  | ✅       | ✅            | ✅       |
| Delete team entries | ❌       | ✅            | ✅       |
| **Projects**        |
| View projects       | ✅       | ✅            | ✅       |
| Create projects     | ❌       | ✅            | ✅       |
| Edit projects       | ❌       | ✅ (own)      | ✅       |
| Delete projects     | ❌       | ❌            | ✅       |
| Set billable status | ❌       | ✅            | ✅       |
| **Clients**         |
| View clients        | ✅       | ✅            | ✅       |
| Create clients      | ❌       | ✅            | ✅       |
| Edit clients        | ❌       | ✅            | ✅       |
| Delete clients      | ❌       | ❌            | ✅       |
| **Users**           |
| View own profile    | ✅       | ✅            | ✅       |
| View all users      | ❌       | ✅ (own team) | ✅       |
| Create users        | ❌       | ❌            | ✅       |
| Edit users          | ❌       | ❌            | ✅       |
| Deactivate users    | ❌       | ❌            | ✅       |
| **Reports**         |
| View own reports    | ✅       | ✅            | ✅       |
| View team reports   | ❌       | ✅            | ✅       |
| View all reports    | ❌       | ❌            | ✅       |
| Export reports      | ❌       | ✅            | ✅       |

### 2.2 Frontend: Permission Checks

**File:** `oan-pulse-frontend/src/hooks/usePermissions.js`

```javascript
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    canEditProject: (project) => {
      if (user.role === "ADMIN") return true;
      if (user.role === "MANAGER" && project.created_by === user.user_id)
        return true;
      return false;
    },
    canViewTeamTime: () => ["ADMIN", "MANAGER"].includes(user.role),
    canManageUsers: () => user.role === "ADMIN",
    // ... more permission checks
  };
};
```

### 2.3 Backend: Row-Level Security

**Oracle Database Implementation:**

```sql
-- Create policy function
CREATE OR REPLACE FUNCTION check_time_entry_access(
  p_user_id IN NUMBER,
  p_role IN VARCHAR2
) RETURN BOOLEAN IS
BEGIN
  IF p_role = 'ADMIN' THEN
    RETURN TRUE;
  ELSIF p_role = 'MANAGER' THEN
    -- Manager can see their team's entries
    RETURN TRUE; -- Add team membership check
  ELSE
    -- Employee can only see their own
    RETURN TRUE; -- Filter by user_id
  END IF;
END;
```

---

## Phase 3: User Management (Admin Features)

**Goal:** Admin can manage users, projects, and clients

### 3.1 Users Page

**Features:**

- List all users (searchable, filterable)
- Create new user
- Edit user (name, email, role, hourly rate)
- Activate/deactivate user
- Reset password

### 3.2 Projects Management Enhancement

**Add:**

- **Billable toggle** (Admin/Manager only)
- Project owner assignment
- Team member assignment
- Budget tracking
- Project status (Active/Archived/Completed)

### 3.3 Clients Management Enhancement

**Add:**

- Primary contact
- Phone number
- Address
- Active/Inactive status
- Associated projects list

---

## Phase 4: Advanced Features

### 4.1 Password Management

- Change password (own)
- Forgot password (email reset link)
- Password strength requirements
- Password expiry (optional)

### 4.2 Team Management

- Create teams
- Assign managers
- Add team members
- Team-based reporting

### 4.3 Approval Workflow (Optional)

- Submit timesheet for approval
- Manager approves/rejects
- Lock approved entries (prevent editing)

### 4.4 Audit Trail

- Track who changed what and when
- Use existing `created_by`, `created_at`, `updated_at`
- Add `updated_by` column

---

## Implementation Order (Step-by-Step)

### ✅ **Step 0:** Fix Billable Logic (JUST COMPLETED)

- Remove billable checkbox from form
- Inherit billable status from project
- Show billable badge on entries

### 🔄 **Step 1:** Database Setup for Auth (NEXT)

1. Create password hashing function in PL/SQL
2. Update test users with proper password hashes
3. Create REST endpoint for login

### 🔄 **Step 2:** Frontend Login Page

1. Create Login.jsx
2. Create AuthContext
3. Add protected routes
4. Store and use JWT token

### 🔄 **Step 3:** Replace Hardcoded user_id

1. Get user_id from authenticated user
2. Update all API calls
3. Filter time entries by logged-in user

### 🔄 **Step 4:** Role-Based UI

1. Show/hide features based on role
2. Add permission checks to components
3. Disable actions user can't perform

### 🔄 **Step 5:** Admin Dashboard

1. User management page
2. Enhanced project/client forms
3. Team management

### 🔄 **Step 6:** Reports & Analytics

1. Personal time reports
2. Team time reports (Manager/Admin)
3. Project profitability (Admin)
4. Export to CSV/Excel

---

## Security Best Practices

### 1. Password Security

- Hash passwords with bcrypt or PBKDF2
- Never store plain-text passwords
- Minimum password length: 8 characters
- Require mix of letters, numbers, symbols

### 2. Token Security

- Short expiry time (1-2 hours)
- Refresh token mechanism
- Secure token storage (httpOnly cookies preferred)
- HTTPS only in production

### 3. API Security

- Validate all inputs
- Parameterized queries (prevent SQL injection)
- Rate limiting on login endpoint
- CORS configuration

### 4. Frontend Security

- Never expose sensitive data in localStorage
- Sanitize user inputs
- XSS protection
- CSRF protection for state-changing operations

---

## Estimated Timeline

| Phase       | Task                               | Time Estimate |
| ----------- | ---------------------------------- | ------------- |
| **Phase 1** | Database prep + REST endpoints     | 2-3 days      |
|             | Frontend login page                | 1 day         |
|             | Auth context + protected routes    | 1 day         |
|             | Testing & bug fixes                | 1 day         |
| **Phase 2** | Define & implement RBAC            | 2-3 days      |
|             | UI permission checks               | 1-2 days      |
|             | Backend row-level security         | 1-2 days      |
| **Phase 3** | User management UI                 | 2-3 days      |
|             | Enhanced project/client management | 2-3 days      |
| **Phase 4** | Password management                | 1-2 days      |
|             | Team management                    | 2-3 days      |
|             | Approval workflow (optional)       | 3-5 days      |
| **Testing** | End-to-end testing                 | 2-3 days      |

**Total:** ~3-4 weeks for full authentication & authorization system

---

## Next Immediate Steps

1. **Remove billable checkbox** from time entry form ✅ (DONE)
2. **Create PL/SQL password hashing function** (I can provide the code)
3. **Create login REST endpoint in APEX**
4. **Build React login page**
5. **Implement AuthContext**

---

## Questions to Consider

1. **Token Type:** Should we use Oracle APEX session management or custom JWT?
2. **Password Reset:** Email-based or admin-only password reset?
3. **Session Timeout:** How long should users stay logged in? (default: 1 hour)
4. **Team Structure:** Do you need hierarchical teams or simple assignment?
5. **Approval Workflow:** Required for your use case or skip for now?

Let me know which step you'd like to start with! 🚀
