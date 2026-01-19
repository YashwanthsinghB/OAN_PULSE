import React, { useEffect, useState } from "react";
import { getProjects, createProject, updateProject } from "../services/projects";
import { getClients } from "../services/clients";
import Layout from "../components/common/Layout";
import ProjectForm from "../components/projects/ProjectForm";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsData, clientsData] = await Promise.all([
        getProjects(),
        getClients(),
      ]);
      setProjects(projectsData);
      setClients(clientsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.client_id === clientId);
    return client ? client.name : "Unknown";
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>Loading projects...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Projects</h1>
            <p style={styles.subtitle}>Manage and track your projects</p>
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
            New Project
          </button>
        </div>

        {(showForm || editingProject) && (
          <div style={styles.formCard}>
            <ProjectForm
              project={editingProject}
              onSave={async (projectData) => {
                try {
                  if (editingProject) {
                    await updateProject(editingProject.project_id, projectData);
                  } else {
                    await createProject(projectData);
                  }
                  await fetchData();
                  setShowForm(false);
                  setEditingProject(null);
                } catch (error) {
                  console.error("Error saving project:", error);
                  const errorMessage = error.response?.data?.message || 
                                     error.response?.data?.error || 
                                     error.message || 
                                     "Error saving project. Please check the console for details.";
                  alert(errorMessage);
                  throw error; // Re-throw so form can show error
                }
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingProject(null);
              }}
            />
          </div>
        )}

        <div style={styles.projectsGrid}>
          {projects.length === 0 ? (
            <div style={styles.emptyState}>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.project_id}
                style={styles.projectCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
                }}
              >
                <div style={styles.projectHeader}>
                  <div style={styles.projectInfo}>
                    <h3 style={styles.projectName}>{project.name}</h3>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(project.status === "ACTIVE"
                          ? styles.activeBadge
                          : styles.inactiveBadge),
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
                <div style={styles.projectDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Client:</span>
                    <span style={styles.detailValue}>
                      {getClientName(project.client_id)}
                    </span>
                  </div>
                  {project.hourly_rate && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Rate:</span>
                      <span style={styles.detailValue}>
                        ${project.hourly_rate}/hr
                      </span>
                    </div>
                  )}
                </div>
                {project.is_billable === 1 && (
                  <div style={styles.billableBadge}>Billable</div>
                )}
                <div style={styles.projectActions}>
                  <button
                    style={styles.editButton}
                    onClick={() => {
                      setEditingProject(project);
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
  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  projectCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "4px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
    transition: "box-shadow 0.2s",
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  projectInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  projectName: {
    margin: 0,
    fontSize: "16px",
    color: "var(--text-primary)",
    fontWeight: "500",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "500",
    alignSelf: "flex-start",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  activeBadge: {
    background: "#e8f5e9",
    color: "#2e7d32",
  },
  inactiveBadge: {
    background: "#ffebee",
    color: "#c62828",
  },
  projectDetails: {
    marginBottom: "1rem",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
  },
  detailLabel: {
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  detailValue: {
    color: "var(--text-primary)",
    fontWeight: "600",
  },
  billableBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    background: "var(--primary-light)",
    color: "var(--primary-color)",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "500",
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
  projectActions: {
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

export default Projects;

