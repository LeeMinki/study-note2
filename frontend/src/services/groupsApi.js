import axios from "axios";
import { getApiBase } from "./apiBase.js";

const TOKEN_KEY = "study-note-token";

const apiClient = axios.create({
  baseURL: getApiBase(),
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrapResponse(response) {
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Request failed.");
  }

  return response.data.data;
}

export async function fetchGroups() {
  const response = await apiClient.get("/api/groups");
  return unwrapResponse(response);
}

export async function createGroup(groupInput) {
  const response = await apiClient.post("/api/groups", groupInput);
  return unwrapResponse(response);
}

export async function updateGroup(groupId, groupInput) {
  const response = await apiClient.patch(`/api/groups/${groupId}`, groupInput);
  return unwrapResponse(response);
}

export async function deleteGroup(groupId) {
  const response = await apiClient.delete(`/api/groups/${groupId}`);
  return unwrapResponse(response);
}
