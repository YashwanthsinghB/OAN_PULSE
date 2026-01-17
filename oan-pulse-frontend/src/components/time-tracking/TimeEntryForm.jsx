import React, { useState, useEffect } from "react";
import { getProjects } from "../../services/projects";
import { getTasks } from "../../services/tasks";
import { getUsers } from "../../services/users";

const TimeEntryForm = ({ timeEntry, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    project_id: "",
    task_id: "",
    entry_date: new Date().toISOString().split("T")[0], // For display in date input
    hours: "",
    notes: "",
    is_billable: 1,
    hourly_rate: "",
    created_by: 1,
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
    if (timeEntry) {
      setFormData({
        user_id: timeEntry.user_id || "",
        project_id: timeEntry.project_id || "",
        task_id: timeEntry.task_id || "",
        entry_date: timeEntry.entry_date
          ? timeEntry.entry_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        hours: timeEntry.hours || "",
        notes: timeEntry.notes || "",
        is_billable: timeEntry.is_billable !== undefined ? timeEntry.is_billable : 1,
        hourly_rate: timeEntry.hourly_rate || "",
        created_by: timeEntry.created_by || 1,
      });
    }
  }, [timeEntry]);

  useEffect(() => {
    if (formData.project_id) {
      fetchTasks(formData.project_id);
    } else {
      setTasks([]);
    }
  }, [formData.project_id]);

  const fetchData = async () => {
    try {
      const [projectsData, usersData] = await Promise.all([
        getProjects(),
        getUsers(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const tasksData = await getTasks(projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.user_id) {
      newErrors.user_id = "User is required";
    }
    if (!formData.project_id) {
      newErrors.project_id = "Project is required";
    }
    if (!formData.entry_date) {
      newErrors.entry_date = "Date is required";
    }
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = "Valid hours are required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Build data object - don't include null values
      // Convert date to format Oracle REST expects
      // Oracle REST expects timestamp with timezone: YYYY-MM-DDTHH:MM:SSZ
      const entryDate = formData.entry_date 
        ? formData.entry_date.split("T")[0] + "T00:00:00Z"  // Format: YYYY-MM-DDTHH:MM:SSZ
        : new Date().toISOString().split(".")[0] + "Z";
      
      const submitData = {
        user_id: Number(formData.user_id),
        project_id: Number(formData.project_id),
        entry_date: entryDate, // Format: YYYY-MM-DDTHH:MM:SS
        hours: Number(parseFloat(formData.hours).toFixed(2)),
        is_billable: Number(formData.is_billable || 1),
        created_by: Number(formData.created_by),
      };
      
      // Only add optional fields if they have values
      if (formData.task_id && formData.task_id !== '' && formData.task_id !== null) {
        submitData.task_id = Number(formData.task_id);
      }
      if (formData.notes && formData.notes.trim() !== '') {
        submitData.notes = formData.notes.trim();
      }
      if (formData.hourly_rate && formData.hourly_rate !== '' && formData.hourly_rate !== null) {
        submitData.hourly_rate = Number(formData.hourly_rate);
      }

      console.log("TimeEntryForm - Submitting data:", JSON.stringify(submitData, null, 2));
      await onSave(submitData);
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            User <span style={styles.required}>*</span>
          </label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.user_id ? styles.inputError : {}),
            }}
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
          {errors.user_id && <span style={styles.error}>{errors.user_id}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Project <span style={styles.required}>*</span>
          </label>
          <select
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.project_id ? styles.inputError : {}),
            }}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project_id && (
            <span style={styles.error}>{errors.project_id}</span>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Task</label>
          <select
            name="task_id"
            value={formData.task_id}
            onChange={handleChange}
            style={styles.input}
            disabled={!formData.project_id || tasks.length === 0}
          >
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Date <span style={styles.required}>*</span>
          </label>
          <input
            type="date"
            name="entry_date"
            value={formData.entry_date}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.entry_date ? styles.inputError : {}),
            }}
          />
          {errors.entry_date && (
            <span style={styles.error}>{errors.entry_date}</span>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Hours <span style={styles.required}>*</span>
          </label>
          <input
            type="number"
            name="hours"
            value={formData.hours}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.hours ? styles.inputError : {}),
            }}
            placeholder="0.0"
            step="0.25"
            min="0"
          />
          {errors.hours && <span style={styles.error}>{errors.hours}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Hourly Rate ($)</label>
          <input
            type="number"
            name="hourly_rate"
            value={formData.hourly_rate}
            onChange={handleChange}
            style={styles.input}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_billable"
              checked={formData.is_billable === 1}
              onChange={handleChange}
              style={styles.checkbox}
            />
            Billable
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Created By</label>
          <select
            name="created_by"
            value={formData.created_by}
            onChange={handleChange}
            style={styles.input}
          >
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="What did you work on?"
            rows="4"
          />
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading
            ? "Saving..."
            : timeEntry
            ? "Update Entry"
            : "Create Entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={styles.cancelButton}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "0.25rem",
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  inputError: {
    borderColor: "#e74c3c",
    borderWidth: "2px",
  },
  textarea: {
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "100px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "var(--text-primary)",
    marginTop: "1.5rem",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  error: {
    color: "#e74c3c",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    paddingTop: "1rem",
    borderTop: "1px solid var(--border-color)",
  },
  submitButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "0.875rem 2rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
    transition: "all 0.3s ease",
  },
  cancelButton: {
    background: "white",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    padding: "0.875rem 2rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default TimeEntryForm;

