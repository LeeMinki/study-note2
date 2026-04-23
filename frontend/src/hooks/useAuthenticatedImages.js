import { useEffect } from 'react';

export function useAuthenticatedImages(containerRef) {
  useEffect(() => {
    if (!containerRef.current) return;
    const token = sessionStorage.getItem('study-note-token');
    const imgs = containerRef.current.querySelectorAll('img[src*="/uploads/"]');
    const objectUrls = [];

    imgs.forEach((img) => {
      fetch(img.src, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          img.src = url;
        })
        .catch(() => {});
    });

    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  });
}
