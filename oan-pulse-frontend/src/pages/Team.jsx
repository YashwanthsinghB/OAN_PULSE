import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import usePermissions from "../hooks/usePermissions";
import {
  getTeamMembers,
  getPendingApprovals,
  getTeamTimeEntries,
  approveTimeEntry,
  rejectTimeEntry,
  getTeamStats,
} from "../services/manager";
import Layout from "../components/common/Layout";

const Team = () => {
  const { user } = useAuth();
  const { canManageTeam } = usePermissions();
  
  const [activeTab, setActiveTab] = useState("pending"); // pending, all, stats
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Last 7 days
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingEntry, setRejectingEntry] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check permissions
  if (!canManageTeam()) {
    return (
      <Layout>
        <div style={styles.accessDenied}>
          <h2>Access Denied</h2>
          <p>Only Managers and Admins can access this page.</p>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    fetchData();
  }, [activeTab, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Always fetch team members and pending
      const [members, pending] = await Promise.all([
        getTeamMembers(),
        getPendingApprovals(),
      ]);
      setTeamMembers(members);
      setPendingApprovals(pending);

      // Fetch additional data based on active tab
      if (activeTab === "all") {
        const entries = await getTeamTimeEntries({
          start_date: startDate,
          end_date: endDate,
        });
        setAllEntries(entries.time_entries || []);
      } else if (activeTab === "stats") {
        const statsData = await getTeamStats({
          start_date: startDate,
          end_date: endDate,
        });
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError("Failed to load team data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId) => {
    if (!window.confirm("Approve this time entry?")) return;

    try {
      const result = await approveTimeEntry(entryId);
      if (result.success) {
        alert("Time entry approved successfully!");
        fetchData(); // Refresh data
      } else {
        alert(result.message || "Failed to approve entry");
      }
    } catch (err) {
      console.error("Error approving entry:", err);
      alert("Failed to approve entry. Please try again.");
    }
  };

  const handleReject = (entry) => {
    setRejectingEntry(entry);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const result = await rejectTimeEntry(rejectingEntry.time_entry_id, rejectionReason);
      if (result.success) {
        alert("Time entry rejected successfully!");
        setRejectModalOpen(false);
        setRejectingEntry(null);
        setRejectionReason("");
        fetchData(); // Refresh data
      } else {
        alert(result.message || "Failed to reject entry");
      }
    } catch (err) {
      console.error("Error rejecting entry:", err);
      alert("Failed to reject entry. Please try again.");
    }
  };

  const renderPendingTab = () => (
    <div>
      <h2 style={styles.sectionTitle}>
        Pending Approvals ({pendingApprovals.length})
      </h2>
      
      {pendingApprovals.length === 0 ? (
        <div style={styles.emptyState}>
          <p>🎉 No pending approvals! All caught up.</p>
        </div>
      ) : (
        <div style={styles.entriesList}>
          {pendingApprovals.map((entry) => (
            <div key={entry.time_entry_id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <div>
                  <h3 style={styles.employeeName}>{entry.employee_name}</h3>
                  <p style={styles.entryDate}>
                    {new Date(entry.entry_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div style={styles.entryHours}>{entry.hours}h</div>
              </div>
              
              <div style={styles.entryDetails}>
                <p style={styles.projectName}>
                  📁 {entry.project_name || "No Project"}
                </p>
                {entry.notes && <p style={styles.notes}>📝 {entry.notes}</p>}
                {entry.is_billable === 1 && (
                  <span style={styles.billableBadge}>💰 Billable</span>
                )}
              </div>
              
              <div style={styles.actionButtons}>
                <button
                  onClick={() => handleApprove(entry.time_entry_id)}
                  style={{ ...styles.button, ...styles.approveButton }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(entry)}
                  style={{ ...styles.button, ...styles.rejectButton }}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAllEntriesTab = () => (
    <div>
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.filterInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.filterInput}
          />
        </div>
      </div>

      <h2 style={styles.sectionTitle}>
        All Team Time Entries ({allEntries.length})
      </h2>

      {allEntries.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No time entries found for this period.</p>
        </div>
      ) : (
        <div style={styles.entriesList}>
          {allEntries.map((entry) => (
            <div key={entry.time_entry_id} style={styles.entryCard}>
              <div style={styles.entryHeader}>
                <div>
                  <h3 style={styles.employeeName}>{entry.employee_name}</h3>
                  <p style={styles.entryDate}>
                    {new Date(entry.entry_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <div style={styles.entryHours}>{entry.hours}h</div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(entry.approval_status === "APPROVED"
                        ? styles.approvedBadge
                        : entry.approval_status === "REJECTED"
                        ? styles.rejectedBadge
                        : styles.pendingBadge),
                    }}
                  >
                    {entry.approval_status}
                  </span>
                </div>
              </div>

              <div style={styles.entryDetails}>
                <p style={styles.projectName}>
                  📁 {entry.project_name || "No Project"}
                </p>
                {entry.notes && <p style={styles.notes}>📝 {entry.notes}</p>}
                {entry.rejection_reason && (
                  <p style={styles.rejectionReason}>
                    ❌ Rejected: {entry.rejection_reason}
                  </p>
                )}
              </div>

              {entry.approval_status === "PENDING" && (
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => handleApprove(entry.time_entry_id)}
                    style={{ ...styles.button, ...styles.approveButton }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(entry)}
                    style={{ ...styles.button, ...styles.rejectButton }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => {
    if (!stats) return <div style={styles.loading}>Loading stats...</div>;

    return (
      <div>
        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.filterInput}
            />
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Team Statistics</h2>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total_hours}h</div>
            <div style={styles.statLabel}>Total Hours</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: "#4CAF50" }}>
              {stats.approved_hours}h
            </div>
            <div style={styles.statLabel}>Approved Hours</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: "#FF9800" }}>
              {stats.pending_hours}h
            </div>
            <div style={styles.statLabel}>Pending Hours</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: "#2196F3" }}>
              {stats.billable_hours}h
            </div>
            <div style={styles.statLabel}>Billable Hours</div>
          </div>
        </div>

        <h3 style={styles.subsectionTitle}>By Employee</h3>
        
        {stats.by_employee && stats.by_employee.length > 0 ? (
          <div style={styles.employeeStats}>
            {stats.by_employee.map((emp) => (
              <div key={emp.user_id} style={styles.employeeStatCard}>
                <h4 style={styles.employeeStatName}>{emp.employee_name}</h4>
                <div style={styles.employeeStatGrid}>
                  <div>
                    <span style={styles.employeeStatLabel}>Total:</span>
                    <span style={styles.employeeStatValue}>{emp.total_hours}h</span>
                  </div>
                  <div>
                    <span style={styles.employeeStatLabel}>Pending:</span>
                    <span style={{ ...styles.employeeStatValue, color: "#FF9800" }}>
                      {emp.pending_count}
                    </span>
                  </div>
                  <div>
                    <span style={styles.employeeStatLabel}>Approved:</span>
                    <span style={{ ...styles.employeeStatValue, color: "#4CAF50" }}>
                      {emp.approved_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p>No time entries for this period.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Team</h1>
          <p style={styles.subtitle}>
            Team Size: {teamMembers.length} • Pending: {pendingApprovals.length}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("pending")}
            style={{
              ...styles.tab,
              ...(activeTab === "pending" ? styles.activeTab : {}),
            }}
          >
            Pending ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            style={{
              ...styles.tab,
              ...(activeTab === "all" ? styles.activeTab : {}),
            }}
          >
            All Entries
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            style={{
              ...styles.tab,
              ...(activeTab === "stats" ? styles.activeTab : {}),
            }}
          >
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <>
              {activeTab === "pending" && renderPendingTab()}
              {activeTab === "all" && renderAllEntriesTab()}
              {activeTab === "stats" && renderStatsTab()}
            </>
          )}
        </div>

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div style={styles.modalOverlay} onClick={() => setRejectModalOpen(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Reject Time Entry</h2>
              <p style={styles.modalDescription}>
                Rejecting time entry for <strong>{rejectingEntry?.employee_name}</strong>
              </p>
              <p style={styles.modalSubtext}>
                {rejectingEntry?.hours}h on{" "}
                {new Date(rejectingEntry?.entry_date).toLocaleDateString()}
              </p>
              
              <label style={styles.label}>Reason for rejection:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                style={styles.textarea}
                rows={4}
                required
              />

              <div style={styles.modalActions}>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  style={{ ...styles.button, ...styles.cancelButton }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  style={{ ...styles.button, ...styles.rejectButton }}
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  accessDenied: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--error-color)",
  },
  error: {
    background: "#ffebee",
    color: "#c62828",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    borderBottom: "2px solid var(--border-light)",
    marginBottom: "30px",
  },
  tab: {
    padding: "12px 24px",
    background: "transparent",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    transition: "all 0.2s",
  },
  activeTab: {
    color: "var(--primary-color)",
    borderBottom: "2px solid var(--primary-color)",
  },
  tabContent: {
    minHeight: "400px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "20px",
  },
  subsectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginTop: "30px",
    marginBottom: "16px",
  },
  filterBar: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    background: "white",
    borderRadius: "8px",
    border: "1px solid var(--border-light)",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  filterInput: {
    padding: "8px 12px",
    border: "1px solid var(--border-light)",
    borderRadius: "6px",
    fontSize: "14px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-secondary)",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text-secondary)",
    background: "white",
    borderRadius: "12px",
    border: "1px solid var(--border-light)",
  },
  entriesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  entryCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid var(--border-light)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  employeeName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  entryDate: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  entryHours: {
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--primary-color)",
    fontFamily: "monospace",
  },
  entryDetails: {
    marginBottom: "16px",
  },
  projectName: {
    fontSize: "14px",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  notes: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    fontStyle: "italic",
    marginBottom: "8px",
  },
  billableBadge: {
    display: "inline-block",
    padding: "4px 8px",
    background: "#e8f5e9",
    color: "#4CAF50",
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "6px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "6px",
    marginTop: "4px",
  },
  approvedBadge: {
    background: "#e8f5e9",
    color: "#4CAF50",
  },
  rejectedBadge: {
    background: "#ffebee",
    color: "#c62828",
  },
  pendingBadge: {
    background: "#fff3e0",
    color: "#e65100",
  },
  rejectionReason: {
    fontSize: "13px",
    color: "#c62828",
    marginTop: "8px",
    padding: "8px",
    background: "#ffebee",
    borderRadius: "6px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  approveButton: {
    background: "#4CAF50",
    color: "white",
  },
  rejectButton: {
    background: "#f44336",
    color: "white",
  },
  cancelButton: {
    background: "var(--border-light)",
    color: "var(--text-primary)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "30px",
  },
  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid var(--border-light)",
    textAlign: "center",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "var(--primary-color)",
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  employeeStats: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  employeeStatCard: {
    background: "white",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid var(--border-light)",
  },
  employeeStatName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "12px",
  },
  employeeStatGrid: {
    display: "flex",
    gap: "24px",
  },
  employeeStatLabel: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginRight: "8px",
  },
  employeeStatValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--text-primary)",
    marginBottom: "12px",
  },
  modalDescription: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "4px",
  },
  modalSubtext: {
    fontSize: "13px",
    color: "var(--text-light)",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid var(--border-light)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "20px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
};

export default Team;

