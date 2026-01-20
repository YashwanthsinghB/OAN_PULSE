# 📋 Project Team REST Endpoints Setup Guide

## 🎯 **Overview**

This guide shows how to create REST endpoints for:
- Project team management (assign/remove users, assign manager)
- Task management (create/update/delete tasks)
- Get user's assigned projects
- Get project tasks

---

## 📝 **Step 1: Create "projects" REST Module**

1. Go to **SQL Workshop** → **RESTful Services**
2. Check if **"projects"** module exists
3. If not, click **"Create Module"**:
   - **Module Name:** `projects`
   - **Base Path:** `/projects/`
   - Click **"Create Module"**

---

## 📝 **Step 2: Create Project Team Endpoints**

### **Template 1: team/:id (GET project team members)**

1. In **"projects"** module, click **"Create Template"**
2. **URI Template:** `team/:id`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `GET`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_project_id NUMBER;
  l_result CLOB;
BEGIN
  -- Get project_id from URL parameter
  l_project_id := TO_NUMBER(:id);
  
  -- Call API
  oan_pulse_project_team_api.get_project_team(l_project_id, l_result);
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameter:**
   - **Name:** `id`
   - **Bind Variable:** `id`
   - **Access Method:** `IN`
   - **Source Type:** `URL`
   - **Parameter Type:** `STRING`
10. Click **"Apply Changes"**

---

### **Template 2: assign/:id (POST assign user to project)**

1. In **"projects"** module, click **"Create Template"**
2. **URI Template:** `assign/:id`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `POST`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_project_id NUMBER;
  l_user_id NUMBER;
  l_role VARCHAR2(20);
  l_assigned_by NUMBER;
  l_token VARCHAR2(64);
  l_body CLOB;
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get token
  l_token := :token_in;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get assigned_by from session
  BEGIN
    SELECT u.user_id INTO l_assigned_by
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.SESSION_TOKEN = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"success":false,"message":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get project_id from URL
  l_project_id := TO_NUMBER(:id);
  
  -- Get request body
  l_body := :body_text;
  APEX_JSON.parse(l_body);
  l_user_id := APEX_JSON.get_number('user_id');
  l_role := APEX_JSON.get_varchar2('role');
  
  -- Call API
  oan_pulse_project_team_api.assign_user_to_project(
    l_project_id,
    l_user_id,
    l_role,
    l_assigned_by,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameters:**
   - `id` (IN, URL, STRING)
   - `token_in` (IN, URL, STRING)
   - `body_text` (IN, BODY, STRING)
10. Click **"Apply Changes"**

---

### **Template 3: remove/:id/team/:userId (DELETE remove user from project)**

1. In **"projects"** module, click **"Create Template"**
2. **URI Template:** `remove/:id/team/:userId`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `DELETE`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_project_id NUMBER;
  l_user_id NUMBER;
  l_removed_by NUMBER;
  l_token VARCHAR2(64);
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get token
  l_token := :token_in;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get removed_by from session
  BEGIN
    SELECT u.user_id INTO l_removed_by
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.SESSION_TOKEN = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"success":false,"message":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get IDs from URL
  l_project_id := TO_NUMBER(:id);
  l_user_id := TO_NUMBER(:userId);
  
  -- Call API
  oan_pulse_project_team_api.remove_user_from_project(
    l_project_id,
    l_user_id,
    l_removed_by,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameters:**
   - `id` (IN, URL, STRING)
   - `userId` (IN, URL, STRING)
   - `token_in` (IN, URL, STRING)
10. Click **"Apply Changes"**

---

### **Template 4: manager/:id (PUT assign manager to project)**

1. In **"projects"** module, click **"Create Template"**
2. **URI Template:** `manager/:id`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `PUT`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_project_id NUMBER;
  l_manager_id NUMBER;
  l_assigned_by NUMBER;
  l_token VARCHAR2(64);
  l_body CLOB;
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get token
  l_token := :token_in;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get assigned_by from session
  BEGIN
    SELECT u.user_id INTO l_assigned_by
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.SESSION_TOKEN = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"success":false,"message":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get project_id from URL
  l_project_id := TO_NUMBER(:id);
  
  -- Get manager_id from request body
  l_body := :body_text;
  APEX_JSON.parse(l_body);
  l_manager_id := APEX_JSON.get_number('manager_id');
  
  -- Call API
  oan_pulse_project_team_api.assign_manager_to_project(
    l_project_id,
    l_manager_id,
    l_assigned_by,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameters:**
   - `id` (IN, URL, STRING)
   - `token_in` (IN, URL, STRING)
   - `body_text` (IN, BODY, STRING)
10. Click **"Apply Changes"**

---

### **Template 5: my-projects (GET user's assigned projects)**

1. In **"projects"** module, click **"Create Template"**
2. **URI Template:** `my-projects`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `GET`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_user_id NUMBER;
  l_token VARCHAR2(64);
  l_result CLOB;
BEGIN
  -- Get token
  l_token := :token_in;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get user_id from session
  BEGIN
    SELECT u.user_id INTO l_user_id
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.SESSION_TOKEN = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"error":"Unauthorized"}');
      RETURN;
  END;
  
  -- Call API
  oan_pulse_project_team_api.get_user_projects(l_user_id, l_result);
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameter:**
   - `token_in` (IN, URL, STRING)
10. Click **"Apply Changes"**

---

### **Template 6: tasks/:id (GET project tasks)**

1. In **"projects"** module, click **"Create Template"**
2. **URI Template:** `tasks/:id`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `GET`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_project_id NUMBER;
  l_active_only NUMBER;
  l_result CLOB;
BEGIN
  -- Get project_id from URL
  l_project_id := TO_NUMBER(:id);
  
  -- Get active_only parameter (default to 1)
  BEGIN
    l_active_only := TO_NUMBER(:active_only);
  EXCEPTION
    WHEN OTHERS THEN
      l_active_only := 1;
  END;
  
  -- Call API
  oan_pulse_project_team_api.get_project_tasks(
    l_project_id,
    l_active_only,
    l_result
  );
  HTP.print(l_result);
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"error":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameters:**
   - `id` (IN, URL, STRING)
   - `active_only` (IN, URL, STRING) - optional
10. Click **"Apply Changes"**

---

## 📝 **Step 3: Create "tasks" REST Module**

1. Go to **SQL Workshop** → **RESTful Services**
2. Click **"Create Module"**
3. **Module Name:** `tasks`
4. **Base Path:** `/tasks/`
5. Click **"Create Module"**

---

## 📝 **Step 4: Create Task Management Endpoints**

### **Template 1: / (POST create task)**

1. In **"tasks"** module, click **"Create Template"**
2. **URI Template:** `/` (or leave blank)
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `POST`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_project_id NUMBER;
  l_name VARCHAR2(255);
  l_description VARCHAR2(2000);
  l_is_billable NUMBER;
  l_hourly_rate NUMBER;
  l_created_by NUMBER;
  l_token VARCHAR2(64);
  l_body CLOB;
  l_task_id NUMBER;
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get token
  l_token := :token_in;
  IF l_token IS NULL THEN
    l_token := REPLACE(OWA_UTIL.get_cgi_env('HTTP_AUTHORIZATION'), 'Bearer ', '');
  END IF;
  
  -- Get created_by from session
  BEGIN
    SELECT u.user_id INTO l_created_by
    FROM oan_pulse_user_sessions s
    INNER JOIN oan_pulse_users u ON s.user_id = u.user_id
    WHERE s.SESSION_TOKEN = l_token
    AND s.expires_at > SYSTIMESTAMP
    AND s.is_active = 1;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      HTP.print('{"success":false,"message":"Unauthorized"}');
      RETURN;
  END;
  
  -- Get request body
  l_body := :body_text;
  APEX_JSON.parse(l_body);
  l_project_id := APEX_JSON.get_number('project_id');
  l_name := APEX_JSON.get_varchar2('name');
  l_description := APEX_JSON.get_varchar2('description');
  l_is_billable := APEX_JSON.get_number('is_billable');
  l_hourly_rate := APEX_JSON.get_number('hourly_rate');
  
  -- Call API
  oan_pulse_project_team_api.create_task(
    l_project_id,
    l_name,
    l_description,
    NVL(l_is_billable, 1),
    l_hourly_rate,
    l_created_by,
    l_task_id,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"');
  IF l_task_id IS NOT NULL THEN
    HTP.print(',"task_id":' || l_task_id);
  END IF;
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameters:**
   - `token_in` (IN, URL, STRING)
   - `body_text` (IN, BODY, STRING)
10. Click **"Apply Changes"**

---

### **Template 2: :id (PUT update task)**

1. In **"tasks"** module, click **"Create Template"**
2. **URI Template:** `:id`
3. Click **"Create Template"**
4. Click **"Create Handler"**
5. **Method:** `PUT`
6. **Source Type:** `PL/SQL`
7. **Source Code:**

```sql
DECLARE
  l_task_id NUMBER;
  l_name VARCHAR2(255);
  l_description VARCHAR2(2000);
  l_is_billable NUMBER;
  l_hourly_rate NUMBER;
  l_is_active NUMBER;
  l_body CLOB;
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get task_id from URL
  l_task_id := TO_NUMBER(:id);
  
  -- Get request body
  l_body := :body_text;
  APEX_JSON.parse(l_body);
  l_name := APEX_JSON.get_varchar2('name');
  l_description := APEX_JSON.get_varchar2('description');
  l_is_billable := APEX_JSON.get_number('is_billable');
  l_hourly_rate := APEX_JSON.get_number('hourly_rate');
  l_is_active := APEX_JSON.get_number('is_active');
  
  -- Call API
  oan_pulse_project_team_api.update_task(
    l_task_id,
    l_name,
    l_description,
    l_is_billable,
    l_hourly_rate,
    l_is_active,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"}');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

8. Click **"Create Handler"**
9. **Add Parameters:**
   - `id` (IN, URL, STRING)
   - `body_text` (IN, BODY, STRING)
10. Click **"Apply Changes"**

---

### **Template 3: :id (DELETE task)**

1. In **"tasks"** module, click **"Create Template"**
2. **URI Template:** `:id`
3. Click **"Create Handler"** (on existing template)
4. **Method:** `DELETE`
5. **Source Type:** `PL/SQL`
6. **Source Code:**

```sql
DECLARE
  l_task_id NUMBER;
  l_success NUMBER;
  l_message VARCHAR2(500);
BEGIN
  -- Get task_id from URL
  l_task_id := TO_NUMBER(:id);
  
  -- Call API
  oan_pulse_project_team_api.delete_task(
    l_task_id,
    l_success,
    l_message
  );
  
  -- Return response
  HTP.print('{');
  HTP.print('"success":' || CASE WHEN l_success=1 THEN 'true' ELSE 'false' END);
  HTP.print(',"message":"' || REPLACE(l_message, '"', '\"') || '"}');
  HTP.print('}');
  
EXCEPTION
  WHEN OTHERS THEN
    HTP.print('{"success":false,"message":"' || REPLACE(SQLERRM, '"', '\"') || '"}');
END;
```

7. Click **"Create Handler"**
8. **Add Parameter:**
   - `id` (IN, URL, STRING)
9. Click **"Apply Changes"**

---

## ✅ **Summary of Endpoints Created**

### **Projects Module:**
- `GET /projects/team/:id` - Get project team
- `POST /projects/assign/:id` - Assign user to project
- `DELETE /projects/remove/:id/team/:userId` - Remove user from project
- `PUT /projects/manager/:id` - Assign manager to project
- `GET /projects/my-projects` - Get user's assigned projects
- `GET /projects/tasks/:id` - Get project tasks

### **Tasks Module:**
- `POST /tasks/` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

---

## 🧪 **Testing**

After creating all endpoints, test them in Postman:

```
# Get user's projects
GET /projects/my-projects?token_in=YOUR_TOKEN

# Get project team
GET /projects/team/1?token_in=YOUR_TOKEN

# Assign user to project
POST /projects/assign/1?token_in=YOUR_TOKEN
Body: {"user_id": 41, "role": "MEMBER"}

# Get project tasks
GET /projects/tasks/1?token_in=YOUR_TOKEN

# Create task
POST /tasks/?token_in=YOUR_TOKEN
Body: {"project_id": 1, "name": "Development", "description": "Software development tasks"}
```

---

**Create all endpoints following this guide, then we'll build the frontend UI!** 🚀

