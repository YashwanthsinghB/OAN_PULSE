import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Dashboard" },
    { path: "/time-entries", label: "Time" },
    { path: "/projects", label: "Projects" },
    { path: "/clients", label: "Clients" },
  ];

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
              <span style={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
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
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "0 8px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    color: "var(--text-secondary)",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "400",
    transition: "all 0.2s ease",
  },
  activeMenuItem: {
    background: "var(--primary-light)",
    color: "var(--primary-color)",
    fontWeight: "500",
  },
  label: {
    flex: 1,
  },
};

export default Sidebar;

