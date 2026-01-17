import React, { useState, useEffect, useRef } from "react";
import { getProjects } from "../../services/projects";
import { getTasks } from "../../services/tasks";

const CompactTimer = ({ onStop }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    } else {
      setTasks([]);
    }
  }, [projectId]);

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

  const handleStart = () => {
    if (!projectId) {
      alert("Please select a project first");
      return;
    }
    setIsRunning(true);
    setShowDetails(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (onStop && elapsedTime > 0) {
      const hours = (elapsedTime / 3600).toFixed(2);
      onStop({
        project_id: Number(projectId),
        task_id: taskId ? Number(taskId) : null,
        hours: parseFloat(hours),
        notes: notes,
      });
    }
    setElapsedTime(0);
    setNotes("");
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setNotes("");
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const hours = (elapsedTime / 3600).toFixed(2);

  const selectedProject = projects.find((p) => p.project_id === Number(projectId));

  return (
    <div style={styles.container}>
      {!isRunning ? (
        <div style={styles.inactiveState}>
          <div style={styles.leftSection}>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={styles.projectSelect}
              placeholder="Select project"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.name}
                </option>
              ))}
            </select>
            {selectedProject && (
              <span style={styles.projectInfo}>
                {selectedProject.name}
              </span>
            )}
          </div>
          <button
            style={{
              ...styles.trackButton,
              ...(!projectId ? styles.trackButtonDisabled : {}),
            }}
            onClick={handleStart}
            disabled={!projectId}
          >
            Track time
          </button>
        </div>
      ) : (
        <div style={styles.activeState}>
          <div style={styles.timerDisplay}>
            <span style={styles.timeValue}>{formatTime(elapsedTime)}</span>
            <span style={styles.hoursLabel}>{hours} hours</span>
          </div>
          <div style={styles.timerInfo}>
            <span style={styles.projectName}>{selectedProject?.name || "No project"}</span>
            {taskId && (
              <span style={styles.taskName}>
                • {tasks.find((t) => t.task_id === Number(taskId))?.name}
              </span>
            )}
          </div>
          <div style={styles.timerControls}>
            <button style={styles.stopButton} onClick={handleStop}>
              Stop
            </button>
            <button style={styles.resetButton} onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      )}

      {showDetails && !isRunning && (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsRow}>
            <label style={styles.label}>Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              style={styles.select}
              disabled={!projectId || tasks.length === 0}
            >
              <option value="">No task</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.detailsRow}>
            <label style={styles.label}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={styles.textarea}
              placeholder="What are you working on?"
              rows="2"
            />
          </div>
        </div>
      )}

      {!isRunning && projectId && (
        <button
          style={styles.toggleDetails}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide details" : "Add task & notes"}
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "4px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
    marginBottom: "24px",
  },
  inactiveState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  projectSelect: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
    minWidth: "200px",
    backgroundColor: "white",
  },
  projectInfo: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  trackButton: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
  },
  trackButtonDisabled: {
    background: "var(--bg-tertiary)",
    color: "var(--text-light)",
    cursor: "not-allowed",
  },
  activeState: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  timerDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    minWidth: "120px",
  },
  timeValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "var(--text-primary)",
    fontFamily: "monospace",
    lineHeight: 1.2,
  },
  hoursLabel: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "2px",
  },
  timerInfo: {
    flex: 1,
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  projectName: {
    fontWeight: "500",
  },
  taskName: {
    color: "var(--text-secondary)",
  },
  timerControls: {
    display: "flex",
    gap: "8px",
  },
  stopButton: {
    background: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  resetButton: {
    background: "white",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "400",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  toggleDetails: {
    marginTop: "12px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
    padding: "4px 0",
    fontSize: "12px",
    cursor: "pointer",
    textDecoration: "underline",
  },
  detailsPanel: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  detailsRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "60px",
  },
};

export default CompactTimer;

