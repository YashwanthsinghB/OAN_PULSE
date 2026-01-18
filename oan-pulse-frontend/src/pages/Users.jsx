import React, { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import { usePermissions } from "../hooks/usePermissions";
import { getUsers, updateUser } from "../services/users";
import { useAuth } from "../contexts/AuthContext";
import UserForm from "../components/users/UserForm";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const { canManageUsers } = usePermissions();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Access control
  if (!canManageUsers()) {
    return (
      <Layout>
        <div style={styles.accessDenied}>
          <div style={styles.accessIcon}>🔒</div>
          <h2 style={styles.accessTitle}>Access Denied</h2>
          <p style={styles.accessText}>You don't have permission to view this page.</p>
          <p style={styles.accessHint}>Only administrators can manage users.</p>
        </div>
      </Layout>
    );
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role) => {
    const baseStyle = { ...styles.roleBadge };
    switch (role) {
      case 'ADMIN':
        return { ...baseStyle, background: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2' };
      case 'MANAGER':
        return { ...baseStyle, background: '#fffaf0', color: '#dd6b20', border: '1px solid #fbd38d' };
      case 'EMPLOYEE':
        return { ...baseStyle, background: '#f0fff4', color: '#38a169', border: '1px solid #9ae6b4' };
      default:
        return baseStyle;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive === 1 ? (
      <span style={styles.statusActive}>● Active</span>
    ) : (
      <span style={styles.statusInactive}>● Inactive</span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>User Management</h1>
            <p style={styles.subtitle}>Manage system users and permissions</p>
          </div>
          <button 
            style={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <span style={styles.btnIcon}>+</span>
            Create User
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div style={styles.statsBox}>
            <span style={styles.statLabel}>Total Users:</span>
            <span style={styles.statValue}>{filteredUsers.length}</span>
          </div>
        </div>

        {/* Users Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Hourly Rate</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyCell}>
                    <div style={styles.empty}>
                      <span style={styles.emptyIcon}>👤</span>
                      <p style={styles.emptyText}>No users found</p>
                      <p style={styles.emptyHint}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.userAvatar}>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <div style={styles.userName}>
                            {user.first_name} {user.last_name}
                            {user.user_id === currentUser?.user_id && (
                              <span style={styles.youBadge}>(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.email}>{user.email}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={getRoleBadgeStyle(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.rate}>
                        ${user.hourly_rate || 0}/hr
                      </span>
                    </td>
                    <td style={styles.td}>
                      {getStatusBadge(user.is_active)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => setEditingUser(user)}
                          title="Edit user"
                        >
                          ✏️
                        </button>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleToggleStatus(user)}
                          title={user.is_active === 1 ? "Deactivate" : "Activate"}
                          disabled={user.user_id === currentUser?.user_id}
                        >
                          {user.is_active === 1 ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingUser) && (
          <div style={styles.modalOverlay} onClick={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <UserForm
                user={editingUser}
                onSave={() => {
                  loadUsers();
                  setShowCreateModal(false);
                  setEditingUser(null);
                }}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );

  function handleToggleStatus(user) {
    if (user.user_id === currentUser?.user_id) {
      alert("You cannot deactivate your own account!");
      return;
    }
    
    const action = user.is_active === 1 ? "deactivate" : "activate";
    const newStatus = user.is_active === 1 ? 0 : 1;
    
    if (window.confirm(`Are you sure you want to ${action} ${user.first_name} ${user.last_name}?`)) {
      updateUser(user.user_id, { is_active: newStatus })
        .then(() => {
          loadUsers();
        })
        .catch((error) => {
          console.error("Error updating user status:", error);
          alert("Failed to update user status");
        });
    }
  }
};

const styles = {
  container: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  createBtn: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  btnIcon: {
    fontSize: "18px",
  },
  filters: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    position: "relative",
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 40px",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  filterSelect: {
    padding: "10px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  statsBox: {
    padding: "10px 16px",
    background: "var(--bg-secondary)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statLabel: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--primary-color)",
  },
  tableContainer: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    background: "var(--bg-secondary)",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid var(--border-light)",
    transition: "background 0.2s",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "var(--primary-color)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
  },
  userName: {
    fontWeight: "500",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  youBadge: {
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "4px",
    background: "var(--primary-light)",
    color: "var(--primary-color)",
    fontWeight: "600",
  },
  email: {
    color: "var(--text-secondary)",
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  rate: {
    fontWeight: "500",
    color: "var(--text-primary)",
  },
  statusActive: {
    color: "#38a169",
    fontSize: "13px",
    fontWeight: "500",
  },
  statusInactive: {
    color: "#e53e3e",
    fontSize: "13px",
    fontWeight: "500",
  },
  date: {
    color: "var(--text-secondary)",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    background: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s",
  },
  emptyCell: {
    padding: "60px 20px",
  },
  empty: {
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "16px",
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
    fontWeight: "500",
  },
  emptyHint: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--border-light)",
    borderTop: "4px solid var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  accessDenied: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    textAlign: "center",
  },
  accessIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  accessTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: "0 0 12px 0",
  },
  accessText: {
    fontSize: "16px",
    color: "var(--text-secondary)",
    margin: "0 0 8px 0",
  },
  accessHint: {
    fontSize: "14px",
    color: "var(--text-light)",
    margin: 0,
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
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: "0 0 16px 0",
  },
  modalText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "24px",
  },
  closeBtn: {
    background: "var(--border-color)",
    color: "var(--text-primary)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Users;

