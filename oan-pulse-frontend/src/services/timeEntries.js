import api from "./api";

export const getTimeEntries = async (filters = {}) => {
  // Build query string for filtering
  const params = new URLSearchParams();
  
  // Filter by specific date if provided
  if (filters.date) {
    // Oracle REST expects date in YYYY-MM-DD format for filtering
    // We'll fetch all and filter client-side, or use date range
    const dateStr = filters.date;
    params.append("q", JSON.stringify({ entry_date: { $gte: dateStr + "T00:00:00", $lte: dateStr + "T23:59:59" } }));
  } else {
    if (filters.userId) {
      params.append("q", JSON.stringify({ user_id: filters.userId }));
    }
    if (filters.projectId) {
      params.append("q", JSON.stringify({ project_id: filters.projectId }));
    }
    if (filters.startDate) {
      params.append("q", JSON.stringify({ entry_date: { $gte: filters.startDate } }));
    }
    if (filters.endDate) {
      params.append("q", JSON.stringify({ entry_date: { $lte: filters.endDate } }));
    }
  }

  const queryString = params.toString();
  const url = queryString ? `/time-entries/?${queryString}` : "/time-entries/";

  try {
    const response = await api.get(url);
    let entries = response.data.items || [];
    
    // If filtering by date, also filter client-side to be sure
    if (filters.date) {
      const filterDate = filters.date.split("T")[0];
      entries = entries.filter(entry => {
        const entryDate = entry.entry_date ? entry.entry_date.split("T")[0] : null;
        return entryDate === filterDate;
      });
    }
    
    return entries;
  } catch (error) {
    console.error("Error fetching time entries:", error);
    // If date filter fails, try without it and filter client-side
    if (filters.date) {
      try {
        const response = await api.get("/time-entries/");
        let entries = response.data.items || [];
        const filterDate = filters.date.split("T")[0];
        entries = entries.filter(entry => {
          const entryDate = entry.entry_date ? entry.entry_date.split("T")[0] : null;
          return entryDate === filterDate;
        });
        return entries;
      } catch (fallbackError) {
        console.error("Fallback fetch failed:", fallbackError);
        throw error;
      }
    }
    throw error;
  }
};

export const getTimeEntry = async (id) => {
  const response = await api.get(`/time-entries/${id}`);
  return response.data;
};

export const createTimeEntry = async (entryData) => {
  try {
    console.log("API Service - Creating time entry with data:", JSON.stringify(entryData, null, 2));
    console.log("API Service - Full URL:", `${api.defaults.baseURL}/time-entries/`);
    
    const response = await api.post("/time-entries/", entryData);
    console.log("API Service - Success response:", response.data);
    return response.data;
  } catch (error) {
    console.error("=== API SERVICE ERROR ===");
    console.error("Request URL:", error.config?.url || `${api.defaults.baseURL}/time-entries/`);
    console.error("Request method:", error.config?.method);
    console.error("Request headers:", error.config?.headers);
    console.error("Request data:", error.config?.data);
    console.error("Request data (parsed):", typeof error.config?.data === 'string' ? JSON.parse(error.config.data) : error.config?.data);
    console.error("Response status:", error.response?.status);
    console.error("Response status text:", error.response?.statusText);
    console.error("Response headers:", error.response?.headers);
    console.error("Response data (stringified):", JSON.stringify(error.response?.data, null, 2));
    console.error("Response data (raw):", error.response?.data);
    
    // Try to extract error message
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.message) {
        console.error("Error message:", errorData.message);
      }
      if (errorData.error) {
        console.error("Error:", errorData.error);
      }
      if (errorData.details) {
        console.error("Error details:", errorData.details);
      }
    }
    
    throw error;
  }
};

export const updateTimeEntry = async (id, entryData) => {
  const response = await api.put(`/time-entries/${id}`, entryData);
  return response.data;
};

export const deleteTimeEntry = async (id) => {
  const response = await api.delete(`/time-entries/${id}`);
  return response.data;
};

