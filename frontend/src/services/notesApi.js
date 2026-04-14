import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
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
