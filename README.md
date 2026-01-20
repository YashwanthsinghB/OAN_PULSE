# OAN Pulse - Time Tracking Application

A modern, professional time tracking application built with React and Oracle Database, designed to replace costly solutions like Harvest.

## 🚀 Features

### ✅ **Implemented:**
- **User Authentication** - Login/logout with session management
- **Role-Based Access Control** - Admin, Manager, Employee roles
- **Time Tracking** - Manual entry and timer functionality
- **Project Management** - Create and manage projects
- **Client Management** - Track clients and their projects
- **Team Management** - Managers can approve/reject time entries
- **User Management** - Admin can create/edit users
- **Week Calendar View** - Modern week navigation
- **Approval Workflow** - Time entry approval system

### 🚧 **In Progress:**
- **Project Assignments** - Assign employees/managers to projects
- **Task Management** - Create tasks for projects
- **Filtered Views** - Employees see only assigned projects

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - Global state management

### Backend
- **Oracle Database** - Enterprise-grade database
- **Oracle APEX** - REST Data Services
- **PL/SQL** - Database logic and business rules

## 📦 Project Structure

```
OAN_PULSE/
├── database_setup.sql              # Core database schema
├── auth_setup.sql                  # Authentication tables & functions
├── user_api_backend.sql           # User management API
├── manager_features_schema.sql     # Manager approval workflow
├── manager_api_backend.sql        # Manager team API
├── project_assignments_schema.sql  # Project team assignments
├── project_team_api_backend.sql   # Project team management API
├── CURRENT_SYSTEM_GUIDE.md         # Current system documentation
├── PROJECT_ASSIGNMENTS_GUIDE.md    # Project assignments guide
├── AUTHENTICATION_COMPLETE.md     # Auth implementation details
├── USER_MANAGEMENT_COMPLETE.md    # User management details
├── oan-pulse-frontend/            # React frontend application
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API services
│   │   ├── contexts/              # React contexts
│   │   └── hooks/                 # Custom hooks
│   └── package.json
└── README.md
```

## 🚦 Quick Start

### 1. Database Setup

Run these SQL scripts in order in **APEX SQL Workshop**:

```sql
-- 1. Core schema
@database_setup.sql

-- 2. Authentication
@auth_setup.sql

-- 3. User management API
@user_api_backend.sql

-- 4. Manager features
@manager_features_schema.sql
@manager_api_backend.sql

-- 5. Project assignments (new)
@project_assignments_schema.sql
@project_team_api_backend.sql
```

### 2. APEX REST Services

Create REST modules in APEX:
- `auth` - Authentication endpoints
- `users` - User management
- `manager` - Manager team features
- `projects`, `clients`, `time-entries`, `tasks` - Auto-REST enabled

See `CURRENT_SYSTEM_GUIDE.md` for detailed setup.

### 3. Frontend Setup

```bash
cd oan-pulse-frontend
npm install
npm run dev
```

Configure `.env`:
```
VITE_API_BASE_URL=https://oracleapex.com/ords/oan_trial
VITE_APP_NAME=OAN Pulse
```

## 👥 User Roles

### **Admin**
- Full system access
- User management
- Project/client management
- View all time entries
- Team management features

### **Manager**
- View team members
- Approve/reject time entries
- View team statistics
- Project/client management
- Log own time

### **Employee**
- Log time entries
- View own entries
- See assigned projects only (coming soon)
- Edit/delete own entries

## 📊 Database Schema

### Core Tables
- `oan_pulse_users` - Users with roles
- `oan_pulse_clients` - Clients
- `oan_pulse_projects` - Projects with manager assignments
- `oan_pulse_tasks` - Tasks for projects
- `oan_pulse_time_entries` - Time entries with approval status
- `oan_pulse_project_team_members` - Project assignments
- `oan_pulse_user_sessions` - Authentication sessions
- `oan_pulse_approval_history` - Approval audit trail

### Key Relationships
- Users → Managers (manager_id)
- Projects → Managers (project_manager_id)
- Projects → Team Members (project_team_members table)
- Time Entries → Approval Status (PENDING/APPROVED/REJECTED)

## 🔒 Security

- ✅ Session-based authentication
- ✅ Password hashing (DBMS_UTILITY.GET_HASH_VALUE)
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Token-based API authentication

## 📚 Documentation

- **CURRENT_SYSTEM_GUIDE.md** - Complete system overview
- **PROJECT_ASSIGNMENTS_GUIDE.md** - Project team management
- **AUTHENTICATION_COMPLETE.md** - Auth implementation
- **USER_MANAGEMENT_COMPLETE.md** - User management details

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to hosting service
```

### Backend
Oracle Database and APEX are production-ready. Configure APEX REST services for production.

## 📝 Next Steps

1. ✅ Complete project assignments UI
2. ✅ Task management UI
3. ✅ Filter projects/tasks for employees
4. ⏳ Reports and analytics
5. ⏳ Export functionality
6. ⏳ Email notifications

---

**OAN Pulse** - Modern time tracking, built to replace Harvest.
