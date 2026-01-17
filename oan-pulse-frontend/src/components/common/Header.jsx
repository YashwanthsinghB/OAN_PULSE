import React from "react";

const Header = () => {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <h1 style={styles.logo}>OAN Pulse</h1>
        <nav style={styles.nav}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>AU</div>
            <span style={styles.userName}>Admin User</span>
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
    gap: "10px",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "500",
  },
  userName: {
    fontSize: "14px",
    color: "var(--text-primary)",
    fontWeight: "400",
  },
};

export default Header;

