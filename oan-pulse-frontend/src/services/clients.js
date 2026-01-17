import api from "./api";

export const getClients = async () => {
  const response = await api.get("/clients/");
  return response.data.items || [];
};

export const getClient = async (id) => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await api.post("/clients/", clientData);
  return response.data;
};

export const updateClient = async (id, clientData) => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

