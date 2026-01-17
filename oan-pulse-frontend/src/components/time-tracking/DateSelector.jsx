import React from "react";

const DateSelector = ({ selectedDate, onDateChange }) => {
  const today = new Date().toISOString().split("T")[0];

  const handleDateChange = (e) => {
    onDateChange(e.target.value);
  };

  const goToToday = () => {
    onDateChange(today);
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    onDateChange(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    onDateChange(date.toISOString().split("T")[0]);
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const isToday = selectedDate === today;

  return (
    <div style={styles.container}>
      <div style={styles.dateNavigation}>
        <button style={styles.navButton} onClick={goToPreviousDay} title="Previous day">
          ←
        </button>
        <div style={styles.dateSelector}>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={styles.dateInput}
          />
          <div style={styles.dateDisplay}>
            {formatDateDisplay(selectedDate)}
            {isToday && <span style={styles.todayBadge}>Today</span>}
          </div>
        </div>
        <button style={styles.navButton} onClick={goToNextDay} title="Next day">
          →
        </button>
      </div>
      {!isToday && (
        <button style={styles.todayButton} onClick={goToToday}>
          Return to today
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "4px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--border-color)",
  },
  dateNavigation: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  navButton: {
    background: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "16px",
    cursor: "pointer",
    color: "var(--text-primary)",
    transition: "all 0.2s",
    minWidth: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dateSelector: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dateInput: {
    padding: "8px 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "inherit",
  },
  dateDisplay: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  todayBadge: {
    padding: "2px 8px",
    backgroundColor: "var(--primary-light)",
    color: "var(--primary-color)",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },
  todayButton: {
    background: "transparent",
    border: "none",
    color: "var(--primary-color)",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "8px",
  },
};

export default DateSelector;

