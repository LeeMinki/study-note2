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

function toFriendlyGroupError(error) {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.error || error.message;

  if (status === 409 || serverMessage === "Group already exists.") {
    return new Error("이미 같은 이름의 그룹이 있습니다. 다른 이름을 입력해주세요.");
  }

  if (serverMessage === "Group name is required.") {
    return new Error("그룹 이름을 입력해주세요.");
  }

  if (serverMessage === "Group name is too long.") {
    return new Error("그룹 이름은 40자 이하로 입력해주세요.");
  }

  return new Error(serverMessage || "그룹 작업 중 문제가 발생했습니다.");
}

async function requestGroup(action) {
  try {
    return unwrapResponse(await action());
  } catch (error) {
    throw toFriendlyGroupError(error);
  }
}

export async function fetchGroups() {
  return requestGroup(() => apiClient.get("/api/groups"));
}

export async function createGroup(groupInput) {
  return requestGroup(() => apiClient.post("/api/groups", groupInput));
}

export async function updateGroup(groupId, groupInput) {
  return requestGroup(() => apiClient.patch(`/api/groups/${groupId}`, groupInput));
}

export async function deleteGroup(groupId) {
  return requestGroup(() => apiClient.delete(`/api/groups/${groupId}`));
}
