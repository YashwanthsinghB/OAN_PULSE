import React, { useEffect, useState } from "react";
import { getUsers } from "../services/users";
import { getProjects } from "../services/projects";
import { getTimeEntries } from "../services/timeEntries";
import Layout from "../components/common/Layout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTimeEntries: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, projects, timeEntries] = await Promise.all([
          getUsers(),
          getProjects(),
          getTimeEntries(),
        ]);

        const totalHours = timeEntries.reduce(
          (sum, entry) => sum + (entry.hours || 0),
          0
        );

        setStats({
          totalUsers: users.length,
          totalProjects: projects.length,
          totalTimeEntries: timeEntries.length,
          totalHours: totalHours.toFixed(2),
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
        </div>

        <div style={styles.statsGrid}>
          <StatCard title="Users" value={stats.totalUsers} />
          <StatCard title="Projects" value={stats.totalProjects} />
          <StatCard title="Time Entries" value={stats.totalTimeEntries} />
          <StatCard title="Total Hours" value={stats.totalHours} />
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value }) => {
  return (
    <div style={styles.statCard}>
      <div style={styles.statContent}>
        <h3 style={styles.statTitle}>{title}</h3>
        <p style={styles.statValue}>{value}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    margin: 0,
    color: "var(--text-primary)",
    fontWeight: "600",
    letterSpacing: "-0.3px",
  },
  loading: {
    textAlign: "center",
    padding: "48px",
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "4px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
    transition: "box-shadow 0.2s",
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    margin: 0,
    fontSize: "12px",
    color: "var(--text-secondary)",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  statValue: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "600",
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
};

export default Dashboard;

