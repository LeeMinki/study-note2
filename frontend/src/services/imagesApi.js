const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// 이미지 파일을 서버에 업로드하고 URL을 반환한다
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/api/images`, {
    method: "POST",
    body: formData,
  });

  const json = await response.json();
  return json;
}
