import React, { useState } from "react";

const ClientForm = ({ client, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    is_active: 1,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        contact_email: client.contact_email || "",
        contact_phone: client.contact_phone || "",
        address: client.address || "",
        is_active: client.is_active !== undefined ? client.is_active : 1,
      });
    }
  }, [client]);

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
    if (!formData.name.trim()) {
      newErrors.name = "Client name is required";
    }
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Client Name <span style={styles.required}>*</span>
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
            placeholder="Enter client name"
          />
          {errors.name && <span style={styles.error}>{errors.name}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Contact Email</label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.contact_email ? styles.inputError : {}),
            }}
            placeholder="client@example.com"
          />
          {errors.contact_email && (
            <span style={styles.error}>{errors.contact_email}</span>
          )}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Contact Phone</label>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            style={styles.input}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active === 1}
              onChange={handleChange}
              style={styles.checkbox}
            />
            Active Client
          </label>
        </div>

        <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Client address..."
            rows="3"
          />
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? "Saving..." : client ? "Update Client" : "Create Client"}
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
    minHeight: "80px",
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

export default ClientForm;

