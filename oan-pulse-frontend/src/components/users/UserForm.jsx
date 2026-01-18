import React, { useState, useEffect } from "react";
import { createUser, updateUser } from "../../services/users";

const UserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "EMPLOYEE",
    hourly_rate: "",
    is_active: 1,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        password: "", // Don't populate password for security
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role: user.role || "EMPLOYEE",
        hourly_rate: user.hourly_rate || "",
        is_active: user.is_active ?? 1,
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!user && !formData.password) {
      newErrors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.first_name) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name) {
      newErrors.last_name = "Last name is required";
    }

    if (formData.hourly_rate && isNaN(formData.hourly_rate)) {
      newErrors.hourly_rate = "Hourly rate must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        is_active: Number(formData.is_active),
      };

      // Add optional fields
      if (formData.hourly_rate) {
        submitData.hourly_rate = Number(formData.hourly_rate);
      }

      // Add password only if provided (new user or password change)
      if (formData.password) {
        submitData.password = formData.password;
      }

      console.log("Submitting user data:", submitData);
      
      if (user) {
        // Update existing user
        await updateUser(user.user_id, submitData);
      } else {
        // Create new user
        await createUser(submitData);
      }

      onSave();
    } catch (error) {
      console.error("Error saving user:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save user";
      alert(`Failed to save user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formGrid}>
        {/* First Name */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            First Name <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            style={{
              ...styles.input,
              ...(errors.first_name ? styles.inputError : {})
            }}
            disabled={loading}
          />
          {errors.first_name && (
            <span style={styles.error}>{errors.first_name}</span>
          )}
        </div>

        {/* Last Name */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Last Name <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            style={{
              ...styles.input,
              ...(errors.last_name ? styles.inputError : {})
            }}
            disabled={loading}
          />
          {errors.last_name && (
            <span style={styles.error}>{errors.last_name}</span>
          )}
        </div>

        {/* Email */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Email <span style={styles.required}>*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              ...styles.input,
              ...(errors.email ? styles.inputError : {})
            }}
            disabled={loading}
          />
          {errors.email && (
            <span style={styles.error}>{errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Password {!user && <span style={styles.required}>*</span>}
            {user && <span style={styles.hint}>(leave blank to keep current)</span>}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={user ? "Enter new password to change" : "Minimum 8 characters"}
            style={{
              ...styles.input,
              ...(errors.password ? styles.inputError : {})
            }}
            disabled={loading}
          />
          {errors.password && (
            <span style={styles.error}>{errors.password}</span>
          )}
        </div>

        {/* Role */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Role <span style={styles.required}>*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={styles.select}
            disabled={loading}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <p style={styles.roleHint}>
            {formData.role === 'ADMIN' && '🔑 Full system access'}
            {formData.role === 'MANAGER' && '👔 Can manage team and projects'}
            {formData.role === 'EMPLOYEE' && '👤 Can track own time'}
          </p>
        </div>

        {/* Hourly Rate */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Hourly Rate ($/hr)
          </label>
          <input
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
            placeholder="e.g., 50"
            step="0.01"
            min="0"
            style={{
              ...styles.input,
              ...(errors.hourly_rate ? styles.inputError : {})
            }}
            disabled={loading}
          />
          {errors.hourly_rate && (
            <span style={styles.error}>{errors.hourly_rate}</span>
          )}
        </div>

        {/* Status */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <div style={styles.toggleContainer}>
            <label style={styles.toggle}>
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                disabled={loading}
                style={styles.checkbox}
              />
              <span style={styles.toggleLabel}>
                {formData.is_active === 1 ? '✅ Active' : '❌ Inactive'}
              </span>
            </label>
          </div>
          <p style={styles.hint}>Inactive users cannot log in</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          style={styles.cancelBtn}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            ...styles.submitBtn,
            ...(loading ? styles.submitBtnDisabled : {})
          }}
          disabled={loading}
        >
          {loading ? (user ? 'Updating...' : 'Creating...') : (user ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  required: {
    color: "#e53e3e",
  },
  hint: {
    fontSize: "12px",
    color: "var(--text-light)",
    fontWeight: "400",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border 0.2s",
  },
  inputError: {
    borderColor: "#e53e3e",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    background: "white",
  },
  error: {
    fontSize: "12px",
    color: "#e53e3e",
  },
  roleHint: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    margin: "4px 0 0 0",
  },
  toggleContainer: {
    display: "flex",
    alignItems: "center",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  toggleLabel: {
    fontSize: "14px",
    fontWeight: "500",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-light)",
  },
  cancelBtn: {
    padding: "10px 20px",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    background: "white",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  submitBtn: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    background: "var(--primary-color)",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};

export default UserForm;

