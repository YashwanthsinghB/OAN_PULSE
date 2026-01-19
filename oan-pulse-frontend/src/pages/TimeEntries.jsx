import React, { useEffect, useState, useRef } from "react";
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from "../services/timeEntries";
import { getProjects } from "../services/projects";
import { getTasks } from "../services/tasks";
import Layout from "../components/common/Layout";
import { useAuth } from "../contexts/AuthContext";

const TimeEntries = () => {
  const { user } = useAuth(); // Get logged-in user
  const [timeEntries, setTimeEntries] = useState([]);
  const [weekEntries, setWeekEntries] = useState({}); // Store all week's entries
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Helper function to format date for Oracle (YYYY-MM-DDTHH:MM:SSZ)
  const formatDateForOracle = (dateString) => {
    if (!dateString) return null;
    // If already in timestamp format, return as is
    if (dateString.includes('T')) {
      // Ensure it ends with Z
      return dateString.endsWith('Z') ? dateString : dateString + 'Z';
    }
    // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SSZ
    return `${dateString}T00:00:00Z`;
  };
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // Track which entry is being edited
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projectFilter, setProjectFilter] = useState(""); // New: project filter
  const intervalRef = useRef(null);

  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    notes: "",
    hours: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchWeekData();
  }, []);

  useEffect(() => {
    fetchWeekData();
  }, [selectedDate]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
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
  }, [isRunning]);

  const fetchProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const tasksData = await getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      // Fetch entries for the entire week
      const weekDates = getWeekDates();
      const weekData = {};

      // Fetch all days in parallel
      await Promise.all(
        weekDates.map(async (date) => {
          const dateStr = date.toISOString().split("T")[0];
          try {
            const entries = await getTimeEntries({ date: dateStr });
            weekData[dateStr] = entries;
          } catch (error) {
            console.error(`Error fetching entries for ${dateStr}:`, error);
            weekData[dateStr] = [];
          }
        })
      );

      setWeekEntries(weekData);
      setTimeEntries(weekData[selectedDate] || []);
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = () => {
    if (!formData.project_id) {
      alert("Please select a project");
      return;
    }
    setIsTimerMode(true);
    setIsRunning(true);
    setElapsedTime(0);
  };

  const handleStopTimer = async () => {
    setIsRunning(false);
    const hours = (elapsedTime / 3600).toFixed(2);
    setFormData({ ...formData, hours });
    // Auto-save when timer stops
    await handleSave(hours);
  };

  const handleSave = async (timerHours = null) => {
    const hoursToSave = timerHours || formData.hours;

    if (!formData.project_id || !hoursToSave) {
      alert("Project and hours are required");
      return;
    }

    try {
      // Get selected project to determine billable status
      const selectedProject = projects.find(
        (p) => p.project_id === Number(formData.project_id)
      );
      const isBillable = selectedProject?.is_billable || 0;

      const entryData = {
        user_id: user?.user_id || 1, // Use logged-in user
        project_id: Number(formData.project_id),
        entry_date: formatDateForOracle(selectedDate),
        hours: Number(parseFloat(hoursToSave).toFixed(2)),
        is_billable: isBillable, // Inherited from project
        created_by: user?.user_id || 1, // Use logged-in user
      };

      if (formData.task_id) {
        entryData.task_id = Number(formData.task_id);
      }
      if (formData.notes) {
        entryData.notes = formData.notes;
      }

      if (editingEntry) {
        // Update existing entry
        await updateTimeEntry(editingEntry.time_entry_id, entryData);
        setEditingEntry(null);
      } else {
        // Create new entry
        await createTimeEntry(entryData);
      }

      resetForm();
      await fetchWeekData();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Error saving time entry");
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      project_id: entry.project_id,
      task_id: entry.task_id || "",
      notes: entry.notes || "",
      hours: entry.hours,
    });
    setShowAddForm(true);
    setIsTimerMode(false);
  };

  const handleDuplicate = async (entry) => {
    try {
      // Get project to determine billable status
      const selectedProject = projects.find(
        (p) => p.project_id === Number(entry.project_id)
      );
      const isBillable = selectedProject?.is_billable || 0;

      const entryData = {
        user_id: user?.user_id || 1, // Use logged-in user
        project_id: Number(entry.project_id),
        entry_date: formatDateForOracle(selectedDate),
        hours: Number(parseFloat(entry.hours).toFixed(2)),
        is_billable: isBillable, // Inherited from project
        created_by: user?.user_id || 1, // Use logged-in user
      };

      if (entry.task_id) {
        entryData.task_id = Number(entry.task_id);
      }
      if (entry.notes) {
        entryData.notes = entry.notes + " (copy)";
      }

      await createTimeEntry(entryData);
      await fetchWeekData();
    } catch (error) {
      console.error("Error duplicating entry:", error);
      alert("Error duplicating time entry");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this entry?")) {
      try {
        await deleteTimeEntry(id);
        await fetchWeekData();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ project_id: "", task_id: "", notes: "", hours: "" });
    setShowAddForm(false);
    setIsTimerMode(false);
    setIsRunning(false);
    setElapsedTime(0);
    setEditingEntry(null);
  };

  const getProjectName = (id) => {
    const project = projects.find((p) => p.project_id === id);
    return project?.name || "Unknown";
  };

  const getTaskName = (id) => {
    if (!id) return null;
    const task = tasks.find((t) => t.task_id === id);
    return task?.name || null;
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatHoursCompact = (hours) => {
    if (hours === 0) return "";
    return hours.toFixed(1);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getWeekDates = () => {
    const current = new Date(selectedDate);
    const week = [];
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(current);
      weekDate.setDate(diff + i);
      week.push(new Date(weekDate));
    }

    return week;
  };

  const getDayHours = (dateStr) => {
    const entries = weekEntries[dateStr] || [];
    return entries.reduce(
      (sum, entry) => sum + parseFloat(entry.hours || 0),
      0
    );
  };

  const navigateWeek = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction * 7);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const getMonthYear = () => {
    const date = new Date(selectedDate);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getSelectedDateLabel = () => {
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate === today) {
      return "Today";
    }

    const date = new Date(selectedDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (selectedDate === yesterdayStr) {
      return "Yesterday";
    }

    // Format as "Mon, Jan 15"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Filter entries by project if filter is set
  const filteredTimeEntries = projectFilter
    ? timeEntries.filter((entry) => entry.project_id === Number(projectFilter))
    : timeEntries;

  const totalHours = filteredTimeEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.hours || 0),
    0
  );
  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];
  const filteredTasks = tasks.filter(
    (t) => !formData.project_id || t.project_id === Number(formData.project_id)
  );

  // Calculate week total
  const weekTotal = Object.values(weekEntries).reduce((sum, entries) => {
    return (
      sum +
      entries.reduce(
        (daySum, entry) => daySum + parseFloat(entry.hours || 0),
        0
      )
    );
  }, 0);

  const TARGET_HOURS = 8;
  const isToday = selectedDate === today;

  return (
    <Layout>
      <div style={styles.container}>
        {/* Top Navigation Bar */}
        <div style={styles.navBar}>
          <div style={styles.monthSection}>
            <button style={styles.navArrow} onClick={() => navigateWeek(-1)}>
              ‹
            </button>
            <h1 style={styles.monthTitle}>{getMonthYear()}</h1>
            <button style={styles.navArrow} onClick={() => navigateWeek(1)}>
              ›
            </button>
          </div>

          <div style={styles.rightActions}>
            {!isToday && (
              <button style={styles.todayBtn} onClick={goToToday}>
                Go to Today
              </button>
            )}
            <div style={styles.statsGroup}>
              <div style={styles.statBadge}>
                <span style={styles.statLabel}>Week</span>
                <span style={styles.statValue}>{formatHours(weekTotal)}</span>
              </div>
              <div
                style={{
                  ...styles.totalBadge,
                  ...(totalHours > TARGET_HOURS
                    ? styles.totalBadgeOvertime
                    : {}),
                }}
              >
                <span style={styles.totalLabel}>{getSelectedDateLabel()}</span>
                <span style={styles.totalValue}>
                  {formatHours(totalHours)}
                  {totalHours > TARGET_HOURS && (
                    <span style={styles.overtimeIndicator}>
                      {" "}
                      +{formatHours(totalHours - TARGET_HOURS)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sleek Week Calendar */}
        <div style={styles.weekGrid}>
          {weekDates.map((date, idx) => {
            const dateStr = date.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dayNum = date.getDate();
            const dayHours = getDayHours(dateStr);
            const hasHours = dayHours > 0;
            const isOvertime = dayHours > TARGET_HOURS;
            const regularHours = Math.min(dayHours, TARGET_HOURS);
            const overtimeHours = Math.max(0, dayHours - TARGET_HOURS);
            const regularPercent = (regularHours / TARGET_HOURS) * 100;
            const overtimePercent = (overtimeHours / TARGET_HOURS) * 100;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  ...styles.dayCard,
                  ...(isSelected ? styles.dayCardActive : {}),
                  ...(isToday && !isSelected ? styles.dayCardToday : {}),
                }}
              >
                <div style={styles.dayHeader}>
                  <span style={styles.dayName}>{dayName}</span>
                  {hasHours && (
                    <span
                      style={{
                        ...styles.hoursChip,
                        ...(isSelected ? styles.hoursChipActive : {}),
                        ...(isOvertime && !isSelected
                          ? styles.hoursChipOvertime
                          : {}),
                      }}
                    >
                      {formatHoursCompact(dayHours)}h
                      {isOvertime && (
                        <span style={styles.overtimeIcon}>⚡</span>
                      )}
                    </span>
                  )}
                </div>
                <div style={styles.dayNumber}>{dayNum}</div>
                {hasHours && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      {/* Regular hours (up to 8) */}
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${regularPercent}%`,
                          ...(isSelected ? styles.progressFillActive : {}),
                        }}
                      />
                      {/* Overtime hours (beyond 8) */}
                      {isOvertime && (
                        <div
                          style={{
                            ...styles.progressFillOvertime,
                            width: `${Math.min(overtimePercent, 100)}%`,
                            ...(isSelected
                              ? styles.progressFillOvertimeActive
                              : {}),
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Add/Edit Entry Form */}
        {showAddForm && (
          <div style={styles.addCard}>
            <div style={styles.addHeader}>
              <h3 style={styles.addTitle}>
                {editingEntry
                  ? "Edit Time Entry"
                  : isTimerMode
                  ? isRunning
                    ? "Timer Running"
                    : "Timer"
                  : "Add Time"}
              </h3>
              {isTimerMode && isRunning && (
                <div style={styles.timerDisplay}>{formatTime(elapsedTime)}</div>
              )}
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formRow}>
                <select
                  value={formData.project_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project_id: e.target.value,
                      task_id: "",
                    })
                  }
                  style={styles.select}
                  disabled={isRunning}
                >
                  <option value="">Select project *</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.task_id}
                  onChange={(e) =>
                    setFormData({ ...formData, task_id: e.target.value })
                  }
                  style={styles.select}
                  disabled={!formData.project_id || isRunning}
                >
                  <option value="">Select task (optional)</option>
                  {filteredTasks.map((t) => (
                    <option key={t.task_id} value={t.task_id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="What did you work on?"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                style={styles.notesInput}
                disabled={isRunning}
              />

              {!isTimerMode && (
                <input
                  type="number"
                  placeholder="Hours (e.g., 2.5)"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                  style={styles.hoursInput}
                  step="0.25"
                  min="0"
                />
              )}

              <div style={styles.formActions}>
                {!isTimerMode || editingEntry ? (
                  <>
                    <button
                      style={styles.primaryBtn}
                      onClick={() => handleSave()}
                    >
                      {editingEntry ? "Update Entry" : "Save Entry"}
                    </button>
                    {!editingEntry && (
                      <button
                        style={styles.secondaryBtn}
                        onClick={handleStartTimer}
                      >
                        <span style={styles.btnIcon}>▶</span> Start Timer
                        Instead
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {isRunning ? (
                      <button style={styles.stopBtn} onClick={handleStopTimer}>
                        <span style={styles.btnIcon}>■</span> Stop & Save
                      </button>
                    ) : (
                      <button
                        style={styles.startBtn}
                        onClick={handleStartTimer}
                      >
                        <span style={styles.btnIcon}>▶</span> Start Timer
                      </button>
                    )}
                    <button
                      style={styles.secondaryBtn}
                      onClick={() => {
                        setIsTimerMode(false);
                        setIsRunning(false);
                        setElapsedTime(0);
                      }}
                      disabled={isRunning}
                    >
                      Switch to Manual
                    </button>
                  </>
                )}
                <button
                  style={styles.cancelBtn}
                  onClick={resetForm}
                  disabled={isRunning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div style={styles.entriesContainer}>
          <div style={styles.entriesHeader}>
            {!showAddForm && (
              <button
                style={styles.addBtn}
                onClick={() => setShowAddForm(true)}
              >
                <span style={styles.addIcon}>+</span>
                <span>Add time entry</span>
              </button>
            )}

            {/* Project Filter */}
            {timeEntries.length > 0 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
            </div>
          ) : filteredTimeEntries.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📝</div>
              <p style={styles.emptyText}>
                {projectFilter
                  ? "No entries for this project"
                  : "No time entries for this day"}
              </p>
              <p style={styles.emptyHint}>
                {projectFilter
                  ? "Try selecting a different project"
                  : "Click 'Add time entry' to get started"}
              </p>
            </div>
          ) : (
            <div style={styles.entriesList}>
              {filteredTimeEntries.map((entry) => (
                <div key={entry.time_entry_id} style={styles.entryCard}>
                  <div style={styles.entryMain}>
                    <div style={styles.entryInfo}>
                      <div style={styles.entryProjectLine}>
                        <span style={styles.projectDot} />
                        <span style={styles.projectName}>
                          {getProjectName(entry.project_id)}
                        </span>
                        {getTaskName(entry.task_id) && (
                          <>
                            <span style={styles.separator}>•</span>
                            <span style={styles.taskName}>
                              {getTaskName(entry.task_id)}
                            </span>
                          </>
                        )}
                        {entry.is_billable === 1 && (
                          <span style={styles.billableBadge}>💰 Billable</span>
                        )}
                        <span style={styles.timestamp}>
                          {formatDateTime(entry.created_at)}
                        </span>
                      </div>
                      {entry.notes && (
                        <div style={styles.entryNotes}>
                          {entry.notes
                            .replace(/\s*\[Start:.*?\]\s*/, "")
                            .replace(/\s*\(copy\)\s*$/, "")}
                          {entry.notes.includes("(copy)") && (
                            <span style={styles.copyBadge}> (copy)</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={styles.entryActions}>
                      <span style={styles.entryHours}>
                        {formatHours(entry.hours)}
                      </span>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleEdit(entry)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleDuplicate(entry)}
                          title="Duplicate"
                        >
                          📋
                        </button>
                        <button
                          style={styles.deleteIconBtn}
                          onClick={() => handleDelete(entry.time_entry_id)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    paddingBottom: "40px",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  monthSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  monthTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  navArrow: {
    background: "white",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    fontSize: "20px",
    cursor: "pointer",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    fontWeight: "300",
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  todayBtn: {
    background: "var(--primary-color)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    color: "white",
    transition: "all 0.2s",
  },
  statsGroup: {
    display: "flex",
    gap: "12px",
  },
  statBadge: {
    background: "white",
    border: "2px solid var(--border-color)",
    padding: "8px 16px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  statLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--text-primary)",
    fontFamily: "monospace",
  },
  totalBadge: {
    background:
      "linear-gradient(135deg, var(--primary-color) 0%, #ff8c42 100%)",
    padding: "8px 16px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    boxShadow: "0 4px 12px rgba(246, 130, 31, 0.25)",
    minWidth: "120px",
  },
  totalBadgeOvertime: {
    background: "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)",
    boxShadow: "0 4px 12px rgba(0, 188, 212, 0.3)",
  },
  totalLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "white",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  totalValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "white",
    fontFamily: "monospace",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  overtimeIndicator: {
    fontSize: "11px",
    opacity: 0.9,
  },
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    marginBottom: "32px",
  },
  dayCard: {
    background: "white",
    border: "2px solid var(--border-light)",
    borderRadius: "12px",
    padding: "16px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "8px",
    transition: "all 0.2s",
    minHeight: "100px",
    position: "relative",
  },
  dayCardActive: {
    background: "var(--primary-color)",
    borderColor: "var(--primary-color)",
    color: "white",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(246, 130, 31, 0.3)",
  },
  dayCardToday: {
    borderColor: "var(--primary-color)",
    borderWidth: "2px",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  dayName: {
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    opacity: 0.7,
  },
  hoursChip: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--primary-color)",
    background: "var(--primary-light)",
    padding: "3px 8px",
    borderRadius: "10px",
    fontFamily: "monospace",
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  hoursChipActive: {
    color: "white",
    background: "rgba(255, 255, 255, 0.3)",
  },
  hoursChipOvertime: {
    color: "#00bcd4",
    background: "#e0f7fa",
  },
  overtimeIcon: {
    fontSize: "10px",
  },
  dayNumber: {
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: 1,
  },
  progressContainer: {
    width: "100%",
    marginTop: "auto",
  },
  progressBar: {
    width: "100%",
    height: "4px",
    background: "var(--border-light)",
    borderRadius: "2px",
    overflow: "hidden",
    display: "flex",
  },
  progressFill: {
    height: "100%",
    background: "var(--primary-color)",
    transition: "width 0.3s ease",
  },
  progressFillActive: {
    background: "white",
  },
  progressFillOvertime: {
    height: "100%",
    background: "#00bcd4",
    transition: "width 0.3s ease",
  },
  progressFillOvertimeActive: {
    background: "rgba(255, 255, 255, 0.6)",
  },
  addCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    border: "2px solid var(--primary-color)",
  },
  addHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
  },
  timerDisplay: {
    fontSize: "28px",
    fontWeight: "700",
    fontFamily: "monospace",
    color: "var(--primary-color)",
    background: "var(--primary-light)",
    padding: "8px 20px",
    borderRadius: "12px",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  select: {
    padding: "12px 16px",
    border: "2px solid var(--border-color)",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "all 0.2s",
    backgroundColor: "white",
  },
  notesInput: {
    padding: "12px 16px",
    border: "2px solid var(--border-color)",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  hoursInput: {
    padding: "12px 16px",
    border: "2px solid var(--border-color)",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "monospace",
    transition: "all 0.2s",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  primaryBtn: {
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  secondaryBtn: {
    background: "white",
    color: "var(--text-primary)",
    border: "2px solid var(--border-color)",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  startBtn: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  stopBtn: {
    background: "#D32F2F",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cancelBtn: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer",
    marginLeft: "auto",
  },
  btnIcon: {
    fontSize: "12px",
  },
  entriesContainer: {
    minHeight: "300px",
  },
  entriesHeader: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px",
  },
  addBtn: {
    flex: 1,
    background: "white",
    border: "2px dashed var(--border-color)",
    borderRadius: "12px",
    padding: "20px",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  addIcon: {
    fontSize: "20px",
    fontWeight: "300",
  },
  filterSelect: {
    padding: "12px 16px",
    border: "2px solid var(--border-color)",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: "200px",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    padding: "48px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid var(--border-light)",
    borderTop: "3px solid var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: {
    textAlign: "center",
    padding: "64px 24px",
  },
  emptyIcon: {
    fontSize: "56px",
    marginBottom: "16px",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
  },
  emptyHint: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  entriesList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  entryCard: {
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: "1px solid var(--border-light)",
    transition: "all 0.2s",
  },
  entryMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  entryInfo: {
    flex: 1,
    minWidth: 0,
  },
  entryProjectLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
    flexWrap: "wrap",
  },
  projectDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--primary-color)",
    flexShrink: 0,
  },
  projectName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  separator: {
    fontSize: "12px",
    color: "var(--text-light)",
  },
  taskName: {
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  billableBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#4CAF50",
    background: "#e8f5e9",
    padding: "2px 8px",
    borderRadius: "8px",
  },
  timestamp: {
    fontSize: "11px",
    color: "var(--text-light)",
    marginLeft: "auto",
  },
  entryNotes: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    paddingLeft: "16px",
  },
  copyBadge: {
    fontSize: "11px",
    color: "var(--text-light)",
    fontStyle: "italic",
  },
  entryActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
  },
  entryHours: {
    fontSize: "16px",
    fontWeight: "700",
    fontFamily: "monospace",
    color: "var(--primary-color)",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "all 0.2s",
    lineHeight: 1,
  },
  deleteIconBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-light)",
    fontSize: "24px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "all 0.2s",
    lineHeight: 1,
  },
};

export default TimeEntries;
