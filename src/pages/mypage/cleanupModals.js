// src/pages/mypage/cleanupModals.js

// 마이페이지 모달 DOM 정리 목적
export function cleanupMyPageModals() {
  const ids = [
    "reviewCreateModal",
    "reviewEditModal",
    "reviewDetailModal",
    "qnaEditModal",
    "appliedInterviewDetailModal",
  ];

  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  document.body.classList.remove("mm-modal-open");
}
