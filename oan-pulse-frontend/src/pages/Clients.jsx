import React, { useEffect, useState } from "react";
import { getClients, createClient, updateClient } from "../services/clients";
import Layout from "../components/common/Layout";
import ClientForm from "../components/clients/ClientForm";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>Loading clients...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Clients</h1>
            <p style={styles.subtitle}>Manage your client relationships</p>
          </div>
          <button
            style={styles.addButton}
            onClick={() => setShowForm(!showForm)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
            }}
          >
            <span style={styles.buttonIcon}>+</span>
            New Client
          </button>
        </div>

        {(showForm || editingClient) && (
          <div style={styles.formCard}>
            <ClientForm
              client={editingClient}
              onSave={async (clientData) => {
                try {
                  if (editingClient) {
                    await updateClient(editingClient.client_id, clientData);
                  } else {
                    await createClient(clientData);
                  }
                  await fetchClients();
                  setShowForm(false);
                  setEditingClient(null);
                } catch (error) {
                  console.error("Error saving client:", error);
                  alert("Error saving client. Please try again.");
                }
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingClient(null);
              }}
            />
          </div>
        )}

        <div style={styles.clientsGrid}>
          {clients.length === 0 ? (
            <div style={styles.emptyState}>
              <h3>No clients yet</h3>
              <p>Create your first client to get started</p>
            </div>
          ) : (
            clients.map((client) => (
              <div
                key={client.client_id}
                style={styles.clientCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
                }}
              >
                <div style={styles.clientHeader}>
                  <div style={styles.clientInfo}>
                    <h3 style={styles.clientName}>{client.name}</h3>
                    {client.is_active === 1 ? (
                      <span style={styles.activeBadge}>Active</span>
                    ) : (
                      <span style={styles.inactiveBadge}>Inactive</span>
                    )}
                  </div>
                </div>
                <div style={styles.clientDetails}>
                  {client.contact_email && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Email:</span>
                      <span style={styles.detailText}>{client.contact_email}</span>
                    </div>
                  )}
                  {client.contact_phone && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Phone:</span>
                      <span style={styles.detailText}>{client.contact_phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Address:</span>
                      <span style={styles.detailText}>{client.address}</span>
                    </div>
                  )}
                </div>
                <div style={styles.clientActions}>
                  <button
                    style={styles.editButton}
                    onClick={() => {
                      setEditingClient(client);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    margin: 0,
    color: "var(--text-primary)",
    fontWeight: "600",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  addButton: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background 0.2s",
  },
  buttonIcon: {
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  formCard: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "16px",
    marginBottom: "2rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    border: "1px solid var(--border-color)",
  },
  formTitle: {
    margin: "0 0 1rem 0",
    color: "var(--text-primary)",
  },
  comingSoon: {
    color: "var(--text-secondary)",
    fontStyle: "italic",
    marginBottom: "1rem",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
    color: "var(--text-secondary)",
  },
  clientsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  clientCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "4px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
    transition: "box-shadow 0.2s",
  },
  clientHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  clientInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  clientName: {
    margin: 0,
    fontSize: "16px",
    color: "var(--text-primary)",
    fontWeight: "500",
  },
  activeBadge: {
    padding: "4px 8px",
    background: "#e8f5e9",
    color: "#2e7d32",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "500",
    alignSelf: "flex-start",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  inactiveBadge: {
    padding: "4px 8px",
    background: "#ffebee",
    color: "#c62828",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "500",
    alignSelf: "flex-start",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  clientDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailRow: {
    display: "flex",
    gap: "8px",
    fontSize: "13px",
  },
  detailLabel: {
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  detailText: {
    color: "var(--text-primary)",
    fontWeight: "400",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "48px 24px",
    backgroundColor: "white",
    borderRadius: "4px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    fontSize: "1.2rem",
    color: "var(--text-secondary)",
  },
  clientActions: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    gap: "0.5rem",
  },
  editButton: {
    padding: "6px 12px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "400",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default Clients;

