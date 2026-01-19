import api from "./api";

// Get team members
export const getTeamMembers = async () => {
  const response = await api.get("/manager/team");
  return response.data.team_members || [];
};

// Get pending approvals
export const getPendingApprovals = async () => {
  const response = await api.get("/manager/pending");
  return response.data.pending_approvals || [];
};

// Get team time entries (with optional filters)
export const getTeamTimeEntries = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.status) params.append("status", filters.status);
  
  const response = await api.get(`/manager/time-entries?${params.toString()}`);
  return response.data;
};

// Approve time entry
export const approveTimeEntry = async (timeEntryId) => {
  const response = await api.post(`/manager/approve/${timeEntryId}`);
  return response.data;
};

// Reject time entry
export const rejectTimeEntry = async (timeEntryId, reason) => {
  const response = await api.post(`/manager/reject/${timeEntryId}`, { reason });
  return response.data;
};

// Get team statistics
export const getTeamStats = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  
  const response = await api.get(`/manager/stats?${params.toString()}`);
  return response.data;
};

