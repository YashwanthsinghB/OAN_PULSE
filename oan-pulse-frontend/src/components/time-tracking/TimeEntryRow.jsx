import React, { useState, useEffect, useRef } from "react";
import { getProjects } from "../../services/projects";
import { getTasks } from "../../services/tasks";

const TimeEntryRow = ({ entry, onUpdate, onDelete, onDuplicate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    project_id: entry.project_id || "",
    task_id: entry.task_id || "",
    notes: extractNotes(entry.notes) || "",
    hours: entry.hours || "",
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showActions, setShowActions] = useState(false);
  const rowRef = useRef(null);

  useEffect(() => {
    fetchProjects();
    if (entry.project_id) {
      fetchTasks(entry.project_id);
    }
  }, [entry.project_id]);

  function extractNotes(notesString) {
    if (!notesString) return "";
    return notesString.replace(/\s*\[Start: \d{2}:\d{2}, End: \d{2}:\d{2}\]\s*/, "").trim();
  }

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

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.project_id === projectId);
    return project ? project.name : "Select project";
  };

  const getTaskName = (taskId) => {
    if (!taskId) return "No task";
    const task = tasks.find((t) => t.task_id === taskId);
    return task ? task.name : "No task";
  };

  const getProjectColor = (projectId) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];
    return colors[projectId % colors.length];
  };

  const handleSave = async () => {
    if (!editData.project_id || !editData.hours) {
      alert("Project and hours are required");
      return;
    }

    const updatedEntry = {
      ...entry,
      project_id: Number(editData.project_id),
      task_id: editData.task_id ? Number(editData.task_id) : null,
      notes: editData.notes || null,
      hours: Number(parseFloat(editData.hours).toFixed(2)),
    };

    await onUpdate(updatedEntry);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      project_id: entry.project_id || "",
      task_id: entry.task_id || "",
      notes: extractNotes(entry.notes) || "",
      hours: entry.hours || "",
    });
    setIsEditing(false);
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  if (isEditing) {
    return (
      <div style={styles.editRow} ref={rowRef}>
        <div style={styles.editContent}>
          <div style={styles.editSection}>
            <select
              value={editData.project_id}
              onChange={(e) => {
                setEditData({ ...editData, project_id: e.target.value });
                fetchTasks(e.target.value);
              }}
              style={styles.select}
              autoFocus
            >
              <option value="">Select project...</option>
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={editData.task_id}
              onChange={(e) => setEditData({ ...editData, task_id: e.target.value })}
              style={styles.selectSmall}
              disabled={!editData.project_id}
            >
              <option value="">No task</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            placeholder="What did you work on?"
            style={styles.notesInput}
          />
          <div style={styles.editActions}>
            <input
              type="number"
              value={editData.hours}
              onChange={(e) => setEditData({ ...editData, hours: e.target.value })}
              step="0.25"
              min="0"
              style={styles.hoursInput}
              placeholder="0"
            />
            <span style={styles.hoursLabel}>hours</span>
            <button style={styles.saveButton} onClick={handleSave}>
              Save
            </button>
            <button style={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={styles.row}
      ref={rowRef}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={{ ...styles.colorBar, backgroundColor: getProjectColor(entry.project_id) }} />
      <div style={styles.content}>
        <div style={styles.mainInfo}>
          <div style={styles.projectTask}>
            <span style={styles.projectName}>{getProjectName(entry.project_id)}</span>
            {entry.task_id && <span style={styles.taskName}>• {getTaskName(entry.task_id)}</span>}
            {entry.is_billable === 1 && <span style={styles.billableDot} title="Billable">💰</span>}
          </div>
          {extractNotes(entry.notes) && (
            <div style={styles.notes}>{extractNotes(entry.notes)}</div>
          )}
        </div>
        <div style={styles.rightSection}>
          <div style={styles.hours}>{formatHours(entry.hours)}</div>
          {showActions && (
            <div style={styles.actions}>
              <button
                style={styles.actionButton}
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                ✏️
              </button>
              <button
                style={styles.actionButton}
                onClick={() => onDuplicate(entry)}
                title="Duplicate"
              >
                📋
              </button>
              <button
                style={styles.actionButton}
                onClick={() => onDelete(entry.time_entry_id)}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  row: {
    display: "flex",
    backgroundColor: "white",
    borderRadius: "8px",
    marginBottom: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: "1px solid var(--border-light)",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  editRow: {
    display: "flex",
    backgroundColor: "#FFFBEA",
    borderRadius: "8px",
    marginBottom: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    border: "2px solid var(--primary-color)",
  },
  colorBar: {
    width: "4px",
    flexShrink: 0,
  },
  content: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    flex: 1,
    gap: "16px",
  },
  editContent: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  editSection: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  mainInfo: {
    flex: 1,
    minWidth: 0,
  },
  projectTask: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
    flexWrap: "wrap",
  },
  projectName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  taskName: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  billableDot: {
    fontSize: "12px",
  },
  notes: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: "1.4",
    marginTop: "4px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  hours: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    fontFamily: "monospace",
    minWidth: "60px",
    textAlign: "right",
  },
  actions: {
    display: "flex",
    gap: "4px",
    opacity: 1,
  },
  actionButton: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    flex: "1",
    minWidth: "200px",
  },
  selectSmall: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    minWidth: "150px",
  },
  notesInput: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    flex: 1,
  },
  editActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  hoursInput: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    width: "80px",
  },
  hoursLabel: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  saveButton: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  cancelButton: {
    background: "white",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-color)",
    padding: "8px 20px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "400",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

export default TimeEntryRow;

