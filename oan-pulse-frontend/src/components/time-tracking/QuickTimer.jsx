import React, { useState, useEffect, useRef } from "react";
import { getProjects } from "../../services/projects";
import { getTasks } from "../../services/tasks";

const QuickTimer = ({ onSave }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    notes: "",
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchTasks(formData.project_id);
    } else {
      setTasks([]);
    }
  }, [formData.project_id]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, elapsedTime]);

  const fetchProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const tasksData = await getTasks(projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleStart = () => {
    if (!formData.project_id) {
      alert("Please select a project");
      return;
    }
    setIsRunning(true);
    setIsExpanded(false);
  };

  const handleStop = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
      const totalHours = elapsedTime / 3600;
      
      // Format date for Oracle (YYYY-MM-DDTHH:MM:SSZ)
      const formatDateForOracle = (dateString) => {
        if (!dateString) return null;
        // If already in timestamp format, return as is
        if (dateString.includes('T')) {
          return dateString.endsWith('Z') ? dateString : dateString + 'Z';
        }
        // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SSZ
        return `${dateString}T00:00:00Z`;
      };
      
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // Get YYYY-MM-DD
      const entryDate = formatDateForOracle(todayStr);

      const entryData = {
        project_id: Number(formData.project_id),
        hours: parseFloat(totalHours.toFixed(2)),
        notes: formData.notes || null,
        entry_date: entryDate,
        approval_status: 'PENDING', // Required: Set approval status
      };
      
      if (formData.task_id) {
        entryData.task_id = Number(formData.task_id);
      }

      await onSave(entryData);
      
      setElapsedTime(0);
      setFormData({ project_id: formData.project_id, task_id: "", notes: "" });
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.project_id === Number(projectId));
    return project ? project.name : "";
  };

  if (isRunning) {
    return (
      <div style={styles.runningContainer}>
        <div style={styles.runningContent}>
          <div style={styles.timerSection}>
            <div style={styles.runningTimer}>{formatTime(elapsedTime)}</div>
            <div style={styles.runningProject}>{getProjectName(formData.project_id)}</div>
          </div>
          <button style={styles.stopButton} onClick={handleStop}>
            Stop
          </button>
        </div>
      </div>
    );
  }

  if (isExpanded) {
    return (
      <div style={styles.expandedContainer}>
        <div style={styles.expandedContent}>
          <input
            type="text"
            placeholder="What are you working on?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={styles.notesInput}
            autoFocus
          />
          <div style={styles.selectRow}>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              style={styles.select}
            >
              <option value="">Select project...</option>
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={formData.task_id}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
              style={styles.select}
              disabled={!formData.project_id}
            >
              <option value="">No task</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.actions}>
            <button
              style={styles.startButton}
              onClick={handleStart}
              disabled={!formData.project_id}
            >
              Start Timer
            </button>
            <button style={styles.collapseButton} onClick={() => setIsExpanded(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.collapsedContainer} onClick={() => setIsExpanded(true)}>
      <div style={styles.collapsedContent}>
        <span style={styles.placeholder}>What are you working on?</span>
        <div style={styles.playIcon}>▶</div>
      </div>
    </div>
  );
};

const styles = {
  collapsedContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "16px 20px",
    marginBottom: "20px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: "2px dashed var(--border-color)",
    transition: "all 0.2s",
  },
  collapsedContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  placeholder: {
    fontSize: "14px",
    color: "var(--text-light)",
  },
  playIcon: {
    fontSize: "16px",
    color: "var(--primary-color)",
  },
  expandedContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    border: "2px solid var(--primary-color)",
  },
  expandedContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  notesInput: {
    padding: "12px 16px",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  selectRow: {
    display: "flex",
    gap: "12px",
  },
  select: {
    padding: "10px 14px",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    flex: 1,
    backgroundColor: "white",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  startButton: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  collapseButton: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
  },
  runningContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: "8px",
    padding: "16px 20px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(76, 175, 80, 0.2)",
    border: "2px solid #4CAF50",
  },
  runningContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  runningTimer: {
    fontSize: "24px",
    fontWeight: "600",
    fontFamily: "monospace",
    color: "#2E7D32",
  },
  runningProject: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#2E7D32",
  },
  stopButton: {
    background: "#D32F2F",
    color: "white",
    border: "none",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};

export default QuickTimer;

