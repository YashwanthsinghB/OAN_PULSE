import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getClients } from "../../services/clients";
import { getUsers } from "../../services/users";

const ProjectForm = ({ project, onSave, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    code: "",
    description: "",
    start_date: "",
    end_date: "",
    budget_hours: "",
    budget_amount: "",
    hourly_rate: "",
    is_billable: 1,
    status: "ACTIVE",
    created_by: user?.user_id || null,
  });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
    if (project) {
      setFormData({
        name: project.name || "",
        client_id: project.client_id || "",
        code: project.code || "",
        description: project.description || "",
        start_date: project.start_date ? project.start_date.split("T")[0] : "",
        end_date: project.end_date ? project.end_date.split("T")[0] : "",
        budget_hours: project.budget_hours || "",
        budget_amount: project.budget_amount || "",
        hourly_rate: project.hourly_rate || "",
        is_billable: project.is_billable !== undefined ? project.is_billable : 1,
        status: project.status || "ACTIVE",
        created_by: project.created_by || user?.user_id || null,
      });
    } else if (user?.user_id) {
      // Set created_by for new projects
      setFormData(prev => ({
        ...prev,
        created_by: user.user_id,
      }));
    }
  }, [project, user]);

  const fetchData = async () => {
    try {
      const [clientsData, usersData] = await Promise.all([
        getClients(),
        getUsers(),
      ]);
      setClients(clientsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!formData.client_id) {
      newErrors.client_id = "Client is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Ensure created_by is set to logged-in user
    if (!user?.user_id) {
      setErrors({ form: "You must be logged in to create a project" });
      return;
    }

    setLoading(true);
    try {
      // Convert date strings to ISO timestamp format for Oracle
      const formatDateForOracle = (dateString) => {
        if (!dateString) return null;
        // Convert 'YYYY-MM-DD' to 'YYYY-MM-DDTHH:MM:SSZ'
        return `${dateString}T00:00:00Z`;
      };

      const submitData = {
        ...formData,
        client_id: Number(formData.client_id),
        created_by: Number(user.user_id), // Always use logged-in user
        budget_hours: formData.budget_hours ? Number(formData.budget_hours) : null,
        budget_amount: formData.budget_amount ? Number(formData.budget_amount) : null,
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : null,
        start_date: formatDateForOracle(formData.start_date),
        end_date: formatDateForOracle(formData.end_date),
      };

      await onSave(submitData);
    } catch (error) {
      console.error("Error saving project:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save project";
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {errors.form && (
        <div style={styles.formError}>
          {errors.form}
        </div>
      )}
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Project Name <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.name ? styles.inputError : {}),
            }}
            placeholder="Enter project name"
          />
          {errors.name && <span style={styles.error}>{errors.name}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Client <span style={styles.required}>*</span>
          </label>
          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.client_id ? styles.inputError : {}),
            }}
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <span style={styles.error}>{errors.client_id}</span>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Project Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            style={styles.input}
            placeholder="Optional project code"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            style={styles.input}
          />
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
          <label style={styles.label}>Budget Hours</label>
          <input
            type="number"
            name="budget_hours"
            value={formData.budget_hours}
            onChange={handleChange}
            style={styles.input}
            placeholder="0"
            step="0.5"
            min="0"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Budget Amount ($)</label>
          <input
            type="number"
            name="budget_amount"
            value={formData.budget_amount}
            onChange={handleChange}
            style={styles.input}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
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

        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_billable"
              checked={formData.is_billable === 1}
              onChange={handleChange}
              style={styles.checkbox}
            />
            Billable Project
          </label>
        </div>

        <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Project description..."
            rows="4"
          />
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? "Saving..." : project ? "Update Project" : "Create Project"}
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
  formError: {
    background: "#ffebee",
    color: "#c62828",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "500",
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

export default ProjectForm;

