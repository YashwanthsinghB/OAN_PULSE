import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <Sidebar />
        <main style={styles.main}>
          <div style={styles.contentWrapper}>{children}</div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8f9fa",
  },
  content: {
    display: "flex",
    minHeight: "calc(100vh - 64px)",
  },
  main: {
    flex: 1,
    padding: "32px",
    overflow: "auto",
  },
  contentWrapper: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
};

export default Layout;

