import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/login');
    }
  };

  // Get initials from user name
  const getInitials = () => {
    if (!user) return "U";
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <h1 style={styles.logo}>OAN Pulse</h1>
        <nav style={styles.nav}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{getInitials()}</div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>
                {user?.first_name} {user?.last_name}
              </span>
              <span style={styles.userRole}>{user?.role}</span>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

const styles = {
  header: {
    background: "#ffffff",
    borderBottom: "1px solid var(--border-color)",
    padding: "0",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "64px",
  },
  logo: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "6px 12px",
    borderRadius: "4px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  userName: {
    fontSize: "14px",
    color: "var(--text-primary)",
    fontWeight: "500",
  },
  userRole: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: "500",
  },
};

export default Header;

