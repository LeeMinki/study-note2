import { buildApiUrl } from "./apiBase";

const TOKEN_KEY = "study-note-token";

// 이미지 파일을 서버에 업로드하고 절대 URL을 반환한다.
// 프론트엔드와 백엔드가 다른 포트에서 실행되므로 상대 URL은 이미지를 로드할 수 없다.
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const headers = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl("/api/images"), {
    method: "POST",
    headers,
    body: formData,
  });

  const json = await response.json();

  // 백엔드가 반환한 상대 URL을 절대 URL로 변환한다
  if (json.success && json.data?.url) {
    json.data.url = buildApiUrl(json.data.url);
  }

  return json;
}
