import React, { useState, useEffect } from "react";
import { getProjects } from "../../services/projects";
import { getTasks } from "../../services/tasks";
import { getUsers } from "../../services/users";

const EditTimeEntryModal = ({ timeEntry, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    project_id: "",
    task_id: "",
    entry_date: "",
    start_time: "",
    end_time: "",
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
    if (isOpen) {
      fetchData();
      if (timeEntry) {
        const entryDate = timeEntry.entry_date ? timeEntry.entry_date.split("T")[0] : new Date().toISOString().split("T")[0];
        // Extract start/end time from notes if stored there
        let startTime = "09:00";
        let endTime = "17:00";
        let notesText = timeEntry.notes || "";
        
        if (timeEntry.notes) {
          const startMatch = timeEntry.notes.match(/\[Start: (\d{2}:\d{2})/);
          const endMatch = timeEntry.notes.match(/End: (\d{2}:\d{2})\]/);
          if (startMatch) startTime = startMatch[1];
          if (endMatch) endTime = endMatch[1];
          // Remove time info from notes
          notesText = timeEntry.notes.replace(/\s*\[Start: \d{2}:\d{2}, End: \d{2}:\d{2}\]\s*/, "").trim();
        } else {
          startTime = timeEntry.start_time || "09:00";
          const hours = timeEntry.hours || 0;
          endTime = timeEntry.end_time || calculateEndTime(startTime, hours);
        }
        
        setFormData({
          user_id: timeEntry.user_id || "",
          project_id: timeEntry.project_id || "",
          task_id: timeEntry.task_id || "",
          entry_date: entryDate,
          start_time: startTime,
          end_time: endTime,
          hours: timeEntry.hours || "",
          notes: notesText,
          is_billable: timeEntry.is_billable !== undefined ? timeEntry.is_billable : 1,
          hourly_rate: timeEntry.hourly_rate || "",
          created_by: timeEntry.created_by || 1,
        });
      } else {
        // New entry - set defaults
        const today = new Date().toISOString().split("T")[0];
        setFormData({
          user_id: "",
          project_id: "",
          task_id: "",
          entry_date: today,
          start_time: "09:00",
          end_time: "17:00",
          hours: "8.00",
          notes: "",
          is_billable: 1,
          hourly_rate: "",
          created_by: 1,
        });
      }
    }
  }, [timeEntry, isOpen]);

  useEffect(() => {
    if (formData.project_id) {
      fetchTasks(formData.project_id);
    } else {
      setTasks([]);
    }
  }, [formData.project_id]);

  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const hours = calculateHours(formData.start_time, formData.end_time);
      setFormData((prev) => ({ ...prev, hours: hours.toFixed(2) }));
    }
  }, [formData.start_time, formData.end_time]);

  const calculateEndTime = (startTime, hours) => {
    if (!startTime || !hours) return "17:00";
    const [startHours, startMins] = startTime.split(":").map(Number);
    const totalMinutes = startHours * 60 + startMins + Math.round(hours * 60);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
  };

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [startHours, startMins] = startTime.split(":").map(Number);
    const [endHours, endMins] = endTime.split(":").map(Number);
    const startTotal = startHours * 60 + startMins;
    const endTotal = endHours * 60 + endMins;
    const diffMinutes = endTotal - startTotal;
    return Math.max(0, diffMinutes / 60);
  };

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
    if (!formData.start_time || !formData.end_time) {
      newErrors.time = "Start and end times are required";
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
      const entryDate = formData.entry_date + "T00:00:00Z";
      
      const submitData = {
        user_id: Number(formData.user_id),
        project_id: Number(formData.project_id),
        entry_date: entryDate,
        hours: Number(parseFloat(formData.hours).toFixed(2)),
        is_billable: Number(formData.is_billable || 1),
        created_by: Number(formData.created_by),
        notes: formData.notes || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
      };

      if (formData.task_id) {
        submitData.task_id = Number(formData.task_id);
      }
      if (formData.hourly_rate) {
        submitData.hourly_rate = Number(formData.hourly_rate);
      }

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{timeEntry ? "Edit Time Entry" : "New Time Entry"}</h2>
          <button style={styles.closeButton} onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
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
              {errors.entry_date && <span style={styles.error}>{errors.entry_date}</span>}
            </div>

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
                Start Time <span style={styles.required}>*</span>
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.time ? styles.inputError : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                End Time <span style={styles.required}>*</span>
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.time ? styles.inputError : {}),
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Duration <span style={styles.required}>*</span>
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
                readOnly
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

            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="What did you work on?"
                rows="3"
              />
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? "Saving..." : timeEntry ? "Update Entry" : "Create Entry"}
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
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "4px",
    padding: "24px",
    maxWidth: "700px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "var(--shadow-lg)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid var(--border-color)",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "var(--text-secondary)",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  inputError: {
    borderColor: "#e74c3c",
    borderWidth: "2px",
  },
  textarea: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "80px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-primary)",
    marginTop: "24px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  error: {
    color: "#e74c3c",
    fontSize: "12px",
    marginTop: "2px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
  },
  submitButton: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  cancelButton: {
    background: "white",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    padding: "10px 20px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default EditTimeEntryModal;

