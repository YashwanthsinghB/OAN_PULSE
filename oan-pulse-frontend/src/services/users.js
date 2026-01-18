import api from "./api";

export const getUsers = async () => {
  const response = await api.get("/users/");
  return response.data.items || [];
};

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  // Use custom endpoint that handles password hashing
  const response = await api.post("/users/create", userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  // Use custom endpoint that handles password hashing
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

