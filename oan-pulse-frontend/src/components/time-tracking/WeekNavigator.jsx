import React from "react";

const WeekNavigator = ({ selectedDate, onDateChange }) => {
  const getWeekDates = (date) => {
    const current = new Date(date);
    const week = [];
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(current.setDate(diff + i));
      week.push(new Date(weekDate));
    }
    
    return week;
  };

  const weekDates = getWeekDates(selectedDate);
  const today = new Date().toISOString().split("T")[0];

  const goToPreviousWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 7);
    onDateChange(current.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 7);
    onDateChange(current.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    onDateChange(today);
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  const isToday = (date) => {
    return date.toISOString().split("T")[0] === today;
  };

  const isSelected = (date) => {
    return date.toISOString().split("T")[0] === selectedDate;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.weekRange}>
          <button style={styles.navButton} onClick={goToPreviousWeek}>
            ‹
          </button>
          <span style={styles.weekText}>{formatWeekRange()}</span>
          <button style={styles.navButton} onClick={goToNextWeek}>
            ›
          </button>
        </div>
        <button style={styles.todayButton} onClick={goToToday}>
          Today
        </button>
      </div>
      
      <div style={styles.weekDays}>
        {weekDates.map((date, index) => {
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = date.getDate();
          const dateStr = date.toISOString().split("T")[0];
          
          return (
            <button
              key={index}
              style={{
                ...styles.dayButton,
                ...(isSelected(date) ? styles.dayButtonSelected : {}),
                ...(isToday(date) && !isSelected(date) ? styles.dayButtonToday : {}),
              }}
              onClick={() => onDateChange(dateStr)}
            >
              <div style={styles.dayName}>{dayName}</div>
              <div style={styles.dayNum}>{dayNum}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: "1px solid var(--border-light)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  weekRange: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  weekText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    minWidth: "200px",
    textAlign: "center",
  },
  navButton: {
    background: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    fontSize: "18px",
    cursor: "pointer",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  todayButton: {
    background: "transparent",
    color: "var(--primary-color)",
    border: "1px solid var(--primary-color)",
    padding: "6px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  weekDays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },
  dayButton: {
    background: "transparent",
    border: "1px solid var(--border-light)",
    borderRadius: "8px",
    padding: "12px 8px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  dayButtonSelected: {
    background: "var(--primary-color)",
    borderColor: "var(--primary-color)",
    color: "white",
  },
  dayButtonToday: {
    borderColor: "var(--primary-color)",
    borderWidth: "2px",
  },
  dayName: {
    fontSize: "11px",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    opacity: 0.7,
  },
  dayNum: {
    fontSize: "16px",
    fontWeight: "600",
  },
};

export default WeekNavigator;

