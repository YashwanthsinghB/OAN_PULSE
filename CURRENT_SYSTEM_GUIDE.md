# 📋 OAN Pulse - Current System Guide

## ✅ What You Have Now (Working System)

### **User Roles & Permissions**

| Role | Can Do |
|------|--------|
| **Admin** | • Create/Edit/Delete users<br>• Create/Edit/Delete projects<br>• Create/Edit/Delete clients<br>• View all time entries<br>• Access Team page (manager features) |
| **Manager** | • View team members<br>• Approve/Reject team time entries<br>• View team statistics<br>• Create/Edit projects & clients<br>• Log own time |
| **Employee** | • Log time entries<br>• View own time entries<br>• Edit/Delete own entries<br>• View projects & clients (read-only) |

---

## 🔄 Current Workflow

### **1. Admin Setup (One-Time)**
```
1. Login as Admin (admin@oan-pulse.com)
2. Go to Users → Create Manager
3. Go to Users → Create Employees
4. Go to Projects → Create Projects
5. Go to Clients → Create Clients
```

### **2. Daily Operations**

**As Employee:**
```
1. Login → Time Entries page
2. Click "+ Add Time" or use Timer
3. Select Project, enter hours, add notes
4. Save → Entry is automatically PENDING
```

**As Manager:**
```
1. Login → Team page
2. See "Pending" tab with team entries
3. Click "✓ Approve" or "✗ Reject"
4. If rejecting, provide reason
5. View "Statistics" tab for team overview
```

**As Admin:**
```
1. Can do everything Manager can do
2. Plus: User management
3. Plus: View all time entries across all users
```

---

## 📊 Current Features

### **✅ Time Tracking**
- Manual time entry (hours + notes)
- Timer functionality
- Weekly calendar view
- Edit/Delete own entries
- Billable hours tracking

### **✅ Project Management**
- Create projects with clients
- Project codes, descriptions
- Budget tracking (hours/amount)
- Project status (Active/Archived/Completed)

### **✅ Team Management (Managers)**
- View team members
- Pending approvals list
- Approve/Reject with reason
- Team statistics dashboard
- Date range filters

### **✅ User Management (Admin)**
- Create/Edit/Delete users
- Set roles (Admin/Manager/Employee)
- Set hourly rates
- Activate/Deactivate users

---

## 🎯 Current Limitations (To Be Enhanced Later)

| Limitation | Impact | Future Enhancement |
|------------|--------|-------------------|
| No project assignments | Employees can log time on any project | Add project-team assignments |
| No "Submit Week" button | Entries auto-pending immediately | Add batch submission |
| Single-level approval | Manager approves, no admin review | Add two-level approval (Manager → Admin) |
| Simple manager hierarchy | One manager per employee | Add project-specific managers |
| No time entry drafts | All entries are pending | Add DRAFT status before submission |

---

## 🚀 Quick Start Guide

### **For Admins:**
1. **Create Users:**
   - Go to Users page
   - Click "Create User"
   - Fill in details, set role
   - Save

2. **Create Projects:**
   - Go to Projects page
   - Click "Create Project"
   - Select client, enter details
   - Save

3. **Assign Managers:**
   - Currently: Set `manager_id` in database
   - Or: Create employees, then update their manager_id
   - Future: UI for manager assignment

### **For Managers:**
1. **View Team:**
   - Go to Team page
   - See team members in sidebar
   - View pending approvals

2. **Approve Time:**
   - Click "Pending" tab
   - Review each entry
   - Approve or Reject with reason

3. **Track Statistics:**
   - Click "Statistics" tab
   - See team hours breakdown
   - Filter by date range

### **For Employees:**
1. **Log Time:**
   - Go to Time Entries page
   - Click "+ Add Time"
   - Select project, enter hours
   - Add notes (optional)
   - Save

2. **Use Timer:**
   - Click "Start Timer"
   - Select project
   - Timer runs in background
   - Click "Stop" when done

3. **View History:**
   - See all your time entries
   - Filter by date
   - Edit/Delete your entries

---

## 📈 Future Enhancement Roadmap

### **Phase 2: Project Assignments** (Next Priority)
- ✅ Assign employees to specific projects
- ✅ Restrict project selection in time entry
- ✅ Project team management UI
- ✅ Manager sees only assigned projects

**Estimated Time:** 3-4 hours

### **Phase 3: Submit Week Feature**
- ✅ Add "DRAFT" status to time entries
- ✅ "Submit Week" button for batch submission
- ✅ Better UX for weekly time submission
- ✅ Submission history

**Estimated Time:** 1-2 hours

### **Phase 4: Two-Level Approval**
- ✅ Manager approval (first level)
- ✅ Admin/CEO approval (second level)
- ✅ Approval routing logic
- ✅ Executive dashboard

**Estimated Time:** 3-4 hours

### **Phase 5: Advanced Features**
- ✅ Project-specific managers
- ✅ Multiple managers per project
- ✅ Timesheet export (PDF/CSV)
- ✅ Email notifications
- ✅ Reports & analytics

**Estimated Time:** 8-10 hours

---

## 🔧 Current Database Structure

### **Key Tables:**
- `oan_pulse_users` - Users with roles
- `oan_pulse_projects` - Projects
- `oan_pulse_clients` - Clients
- `oan_pulse_time_entries` - Time entries with approval status
- `oan_pulse_approval_history` - Audit trail

### **Key Relationships:**
- Users have `manager_id` (who they report to)
- Time entries have `approval_status` (PENDING/APPROVED/REJECTED)
- Time entries linked to users and projects

---

## 📝 Notes

- **Current System is Production-Ready** for small to medium teams
- **All data is secure** with role-based access
- **Approval workflow works** for single-level approval
- **Can be enhanced incrementally** without breaking existing functionality

---

## 🆘 Support

If you need help:
1. Check browser console (F12) for errors
2. Verify user roles in database
3. Check API endpoints in Postman
4. Review this guide for workflow questions

---

**Last Updated:** January 2026  
**System Version:** 1.0 (MVP)

