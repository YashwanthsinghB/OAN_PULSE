import React, { useEffect, useState } from "react";
import { getUsers } from "../services/users";
import { getClients } from "../services/clients";
import { getProjects } from "../services/projects";

const TestConnection = () => {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, clientsData, projectsData] = await Promise.all([
          getUsers(),
          getClients(),
          getProjects(),
        ]);
        setUsers(usersData);
        setClients(clientsData);
        setProjects(projectsData);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h2>Error: {error}</h2>
        <p>Check console for details</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>OAN Pulse - API Connection Test</h1>
      <div style={{ 
        padding: "15px", 
        backgroundColor: "#4CAF50", 
        color: "white", 
        borderRadius: "5px",
        marginBottom: "30px"
      }}>
        <h2>✅ Connection Successful!</h2>
        <p>All endpoints are working correctly</p>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ marginBottom: "10px" }}>Users ({users.length})</h3>
        <div style={{ 
          backgroundColor: "white", 
          padding: "15px", 
          borderRadius: "5px",
          border: "1px solid #ddd"
        }}>
          <pre style={{ 
            overflow: "auto", 
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ marginBottom: "10px" }}>Clients ({clients.length})</h3>
        <div style={{ 
          backgroundColor: "white", 
          padding: "15px", 
          borderRadius: "5px",
          border: "1px solid #ddd"
        }}>
          <pre style={{ 
            overflow: "auto", 
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {JSON.stringify(clients, null, 2)}
          </pre>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ marginBottom: "10px" }}>Projects ({projects.length})</h3>
        <div style={{ 
          backgroundColor: "white", 
          padding: "15px", 
          borderRadius: "5px",
          border: "1px solid #ddd"
        }}>
          <pre style={{ 
            overflow: "auto", 
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {JSON.stringify(projects, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;

