// src/pages/mypage/api.js
import { api } from "../../services/api.js";

function buildPageQuery({ page, size }) {
  const p = Number.isFinite(Number(page)) ? Number(page) : 0;
  const s = Number.isFinite(Number(size)) ? Number(size) : 5;
  return `?page=${encodeURIComponent(p)}&size=${encodeURIComponent(s)}`;
}

// members/me/interviews 전용 쿼리 빌더(정렬 포함)
function buildMeInterviewsQuery({ type, status, reviewed, sort, page, size }) {
  const sp = new URLSearchParams();

  sp.set("page", String(Number.isFinite(Number(page)) ? Number(page) : 0));
  sp.set("size", String(Number.isFinite(Number(size)) ? Number(size) : 5));

  if (type) sp.set("type", String(type).trim());
  if (status) sp.set("status", String(status).trim());
  if (reviewed !== undefined && reviewed !== null)
    sp.set("reviewed", String(reviewed));
  if (sort) sp.set("sort", String(sort).trim());

  return `?${sp.toString()}`;
}

function buildMyReviewsQuery({ type, sort, page, size }) {
  const sp = new URLSearchParams();

  sp.set("type", String(type || "").trim());
  sp.set("page", String(Number.isFinite(Number(page)) ? Number(page) : 0));
  sp.set("size", String(Number.isFinite(Number(size)) ? Number(size) : 5));
  if (sort) sp.set("sort", String(sort).trim());

  return `?${sp.toString()}`;
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

/* =========================
   리뷰: 신규 URL (통합)
   ========================= */

// 내가 작성한 후기 목록(페이지)
// GET /api/members/me/reviews?type=WRITTEN&page=0&size=5&sort=CREATED_AT_DESC
export async function fetchMyWrittenReviewsPage({
  page,
  size,
  sort = "CREATED_AT_DESC",
} = {}) {
  return api.get(
    `/members/me/reviews${buildMyReviewsQuery({
      type: "WRITTEN",
      sort,
      page,
      size,
    })}`
  );
}

// (내가 작성한/나에게 작성된) 후기 상세(통합)
// GET /api/members/me/reviews/{reviewId}
export async function fetchMyReviewDetail(reviewId) {
  const id = encodeURIComponent(String(reviewId));
  return api.get(`/members/me/reviews/${id}`);
}

/* =========================
   인터뷰: 통합 URL
   ========================= */

export async function fetchAppliedInterviewPage({
  page,
  size,
  sort = "CREATED_AT_DESC",
  status,
} = {}) {
  return api.get(
    `/members/me/interviews${buildMeInterviewsQuery({
      type: "APPLIED",
      status,
      sort,
      page,
      size,
    })}`
  );
}

export async function fetchMyInterviewDetail(interviewId) {
  const id = encodeURIComponent(String(interviewId));
  return api.get(`/members/me/interviews/${id}`);
}

export async function fetchAppliedInterviewDetail(interviewId) {
  return fetchMyInterviewDetail(interviewId);
}

export async function fetchCompletedInterviewPage({
  page,
  size,
  sort = "CREATED_AT_DESC",
} = {}) {
  return api.get(
    `/members/me/interviews${buildMeInterviewsQuery({
      type: "APPLIED",
      status: "COMPLETED",
      reviewed: false,
      sort,
      page,
      size,
    })}`
  );
}

export async function fetchReceivedInterviewPage({ page, size, sort } = {}) {
  return api.get(
    `/members/me/interviews${buildMeInterviewsQuery({
      type: "RECEIVED",
      sort,
      page,
      size,
    })}`
  );
}

export async function updateInterviewStatus(interviewId, payload) {
  const id = encodeURIComponent(String(interviewId));
  return api.patch(`/interviews/${id}/status`, payload);
}

export async function createInterviewReview(interviewId, payload = {}) {
  const id = encodeURIComponent(String(interviewId));
  return api.post(`/interviews/${id}/reviews`, payload);
}

// 내가 작성한 질문 목록(페이지)
export async function fetchMyQuestionsPage({ page, size }) {
  return api.get(`/members/me/questions${buildPageQuery({ page, size })}`);
}

export async function updateQuestion(questionId, payload) {
  const id = encodeURIComponent(String(questionId));
  return api.patch(`/questions/${id}`, payload);
}

export function deleteMyQuestion(questionId) {
  return api.delete(`/questions/${encodeURIComponent(questionId)}`);
}
