// src/pages/mypage/api.js
import { api } from "../../services/api.js";

function buildPageQuery({ page, size }) {
  const p = Number.isFinite(Number(page)) ? Number(page) : 0;
  const s = Number.isFinite(Number(size)) ? Number(size) : 10;
  return `?page=${encodeURIComponent(p)}&size=${encodeURIComponent(s)}`;
}

// 내 정보
export async function fetchMe() {
  const res = await api.get("/members/me");
  if (!res?.success) throw new Error(res?.message || "fetchMe failed");
  return res.data;
}

// 내 정보 수정
export async function updateMe(payload) {
  const res = await api.patch("/members/me", payload);
  if (!res?.success) throw new Error(res?.message || "updateMe failed");
  return res.data;
}

export async function uploadProfileImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/members/me/profile-image", fd, { headers: {} });
}

// 내가 작성한 후기 목록(페이지)
export async function fetchWrittenReviewsPage({ page, size }) {
  return api.get(`/members/me/reviews/written${buildPageQuery({ page, size })}`);
}

// 내가 작성한 후기 상세
export async function fetchWrittenReviewDetail(reviewId) {
  const id = encodeURIComponent(String(reviewId));
  return api.get(`/members/me/reviews/written/${id}`);
}
