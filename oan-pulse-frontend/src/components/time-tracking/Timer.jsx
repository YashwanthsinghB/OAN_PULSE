import React, { useState, useEffect, useRef } from "react";
import { getProjects } from "../../services/projects";
import { getTasks } from "../../services/tasks";

const Timer = ({ onStop }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
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

  return (
    <div style={styles.timerCard}>
      <div style={styles.timerHeader}>
        <div>
          <h3 style={styles.timerTitle}>Time Tracker</h3>
          <p style={styles.timerSubtitle}>
            {isRunning ? "Timer is running..." : "Start tracking your time"}
          </p>
        </div>
      </div>

      <div style={styles.timerDisplay}>
        <div style={styles.timeValue}>{formatTime(elapsedTime)}</div>
        <div style={styles.timeHours}>{hours} hours</div>
      </div>

      <div style={styles.timerControls}>
        {!isRunning ? (
          <button
            style={styles.startButton}
            onClick={handleStart}
            disabled={!projectId}
          >
            ▶ Start Timer
          </button>
        ) : (
          <button style={styles.stopButton} onClick={handleStop}>
            ⏹ Stop & Save
          </button>
        )}
        {elapsedTime > 0 && !isRunning && (
          <button style={styles.resetButton} onClick={handleReset}>
            ↻ Reset
          </button>
        )}
      </div>

      <div style={styles.timerForm}>
        <div style={styles.formRow}>
          <label style={styles.label}>Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              ...styles.select,
              ...(isRunning ? styles.disabled : {}),
            }}
            disabled={isRunning}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>Task</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            style={{
              ...styles.select,
              ...(isRunning ? styles.disabled : {}),
            }}
            disabled={isRunning || !projectId || tasks.length === 0}
          >
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            placeholder="What are you working on?"
            rows="3"
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  timerCard: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "4px",
    marginBottom: "24px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
  },
  timerHeader: {
    marginBottom: "20px",
  },
  timerTitle: {
    margin: 0,
    fontSize: "18px",
    color: "var(--text-primary)",
    fontWeight: "500",
  },
  timerSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  timerDisplay: {
    textAlign: "center",
    padding: "24px",
    background: "var(--bg-secondary)",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  timeValue: {
    fontSize: "48px",
    fontWeight: "600",
    color: "var(--text-primary)",
    fontFamily: "monospace",
    letterSpacing: "1px",
    marginBottom: "8px",
  },
  timeHours: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: "400",
  },
  timerControls: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "20px",
  },
  startButton: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  stopButton: {
    background: "#e74c3c",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  resetButton: {
    background: "white",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    padding: "12px 24px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  timerForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid var(--border-color)",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  select: {
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "80px",
  },
  disabled: {
    backgroundColor: "#f5f5f5",
    cursor: "not-allowed",
    opacity: 0.6,
  },
};

export default Timer;

