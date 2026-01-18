import React from "react";
import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";

const Sidebar = () => {
  const location = useLocation();
  const { canManageUsers, canManageTeam, isAdmin, isManager } = usePermissions();

  // Base menu items for all users
  const menuItems = [
    { path: "/", label: "Dashboard", icon: "📊", roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: "/time-entries", label: "Time", icon: "⏱️", roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: "/projects", label: "Projects", icon: "📁", roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: "/clients", label: "Clients", icon: "👥", roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  // Admin-only items
  if (canManageUsers()) {
    menuItems.push({
      path: "/users",
      label: "Users",
      icon: "👤",
      roles: ['ADMIN'],
      badge: 'Admin'
    });
  }

  // Manager and Admin items
  if (canManageTeam()) {
    menuItems.push({
      path: "/team",
      label: "Team",
      icon: "👔",
      roles: ['ADMIN', 'MANAGER'],
      badge: isAdmin() ? null : 'Manager'
    });
  }

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.menuItem,
                ...(isActive ? styles.activeMenuItem : {}),
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.label}>{item.label}</span>
              {item.badge && (
                <span style={styles.badge}>{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Role indicator at bottom */}
      <div style={styles.roleSection}>
        <div style={styles.roleIndicator}>
          {isAdmin() && <span style={styles.roleAdmin}>🔑 Admin Access</span>}
          {isManager() && !isAdmin() && <span style={styles.roleManager}>👔 Manager</span>}
        </div>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: "200px",
    background: "#ffffff",
    minHeight: "calc(100vh - 64px)",
    padding: "16px 0",
    borderRight: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "0 8px",
    flex: 1,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    color: "var(--text-secondary)",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "400",
    transition: "all 0.2s ease",
  },
  activeMenuItem: {
    background: "var(--primary-light)",
    color: "var(--primary-color)",
    fontWeight: "500",
  },
  icon: {
    fontSize: "18px",
  },
  label: {
    flex: 1,
  },
  badge: {
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "4px",
    background: "var(--primary-light)",
    color: "var(--primary-color)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  roleSection: {
    padding: "16px",
    borderTop: "1px solid var(--border-light)",
  },
  roleIndicator: {
    padding: "8px 12px",
    borderRadius: "6px",
    background: "var(--bg-secondary)",
    textAlign: "center",
  },
  roleAdmin: {
    fontSize: "12px",
    color: "var(--primary-color)",
    fontWeight: "600",
  },
  roleManager: {
    fontSize: "12px",
    color: "var(--secondary-color)",
    fontWeight: "600",
  },
};

export default Sidebar;

