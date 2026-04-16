import axios from "axios";
import { getApiBase } from "./apiBase";

const TOKEN_KEY = "study-note-token";

const apiClient = axios.create({
  baseURL: getApiBase(),
  headers: {
    "Content-Type": "application/json",
  },
});

// 모든 요청에 저장된 JWT 토큰을 Authorization 헤더로 자동 첨부한다
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
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

function buildQueryParams(searchText, activeTag) {
  const params = {};

  if (searchText?.trim()) {
    params.search = searchText.trim();
  }

  if (activeTag?.trim()) {
    params.tag = activeTag.trim().toLowerCase();
  }

  return params;
}

export async function fetchNotes({ searchText = "", activeTag = "" } = {}) {
  const response = await apiClient.get("/api/notes", {
    params: buildQueryParams(searchText, activeTag),
  });

  return unwrapResponse(response);
}

export async function createNote(noteInput) {
  const response = await apiClient.post("/api/notes", noteInput);
  return unwrapResponse(response);
}

export async function updateNote(noteId, noteInput) {
  const response = await apiClient.patch(`/api/notes/${noteId}`, noteInput);
  return unwrapResponse(response);
}

export async function deleteNote(noteId) {
  const response = await apiClient.delete(`/api/notes/${noteId}`);
  return unwrapResponse(response);
}
