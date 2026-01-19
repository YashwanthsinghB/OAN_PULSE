import api from "./api";

// Helper to add token to query params
const addTokenToParams = (params) => {
  const token = localStorage.getItem("token");
  if (token) {
    params.append("token_in", token);
  }
  return params;
};

// Get team members
export const getTeamMembers = async () => {
  const params = new URLSearchParams();
  addTokenToParams(params);
  const response = await api.get(`/manager/team?${params.toString()}`);
  return response.data.team_members || [];
};

// Get pending approvals
export const getPendingApprovals = async () => {
  const params = new URLSearchParams();
  addTokenToParams(params);
  const response = await api.get(`/manager/pending?${params.toString()}`);
  return response.data.pending_approvals || [];
};

// Get team time entries (with optional filters)
export const getTeamTimeEntries = async (filters = {}) => {
  const params = new URLSearchParams();
  addTokenToParams(params);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.status) params.append("status", filters.status);
  
  const response = await api.get(`/manager/time-entries?${params.toString()}`);
  return response.data;
};

// Approve time entry
export const approveTimeEntry = async (timeEntryId) => {
  const params = new URLSearchParams();
  addTokenToParams(params);
  const response = await api.post(`/manager/approve/${timeEntryId}?${params.toString()}`);
  return response.data;
};

// Reject time entry
export const rejectTimeEntry = async (timeEntryId, reason) => {
  const params = new URLSearchParams();
  addTokenToParams(params);
  const response = await api.post(`/manager/reject/${timeEntryId}?${params.toString()}`, { reason });
  return response.data;
};

// Get team statistics
export const getTeamStats = async (filters = {}) => {
  const params = new URLSearchParams();
  addTokenToParams(params);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  
  const response = await api.get(`/manager/stats?${params.toString()}`);
  return response.data;
};

