// src/pages/mypage/api.js
/*
  마이페이지 전용 API 모듈
  - 공통 API 클라이언트(api) 기반 호출 구성
  - 목록 API: 페이지네이션 메타(meta) 사용 전제에 따른 응답 전체 반환
  - 상세/수정/삭제 API: data 중심 사용 전제에 따른 data 반환
  - 성공 여부(res.success) 검증 및 실패 시 예외 발생
*/

import { api } from "../../services/api.js";

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 5;
const DEFAULT_SORT = "CREATED_AT_DESC";

/*
  숫자 변환 및 기본값 처리
*/
function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/*
  경로 파라미터 인코딩 처리
*/
function enc(v) {
  return encodeURIComponent(String(v ?? "").trim());
}

/*
  응답 성공 검증 및 예외 처리
*/
function assertSuccess(res, fallbackMessage) {
  if (!res?.success) {
    throw new Error(res?.message || fallbackMessage || "요청에 실패했습니다");
  }
  return res;
}

/*
  공통 페이지 쿼리 빌더
  - page: 0-based 처리
*/
function buildPageQuery({ page, size } = {}) {
  const p = toInt(page, DEFAULT_PAGE);
  const s = toInt(size, DEFAULT_SIZE);
  return `?page=${encodeURIComponent(p)}&size=${encodeURIComponent(s)}`;
}

/*
  /members/me/interviews 전용 쿼리 빌더(필터 + 정렬)
  - reviewed: true/false 모두 전송 허용
*/
function buildMeInterviewsQuery({
  type,
  status,
  reviewed,
  sort,
  page,
  size,
} = {}) {
  const sp = new URLSearchParams();

  sp.set("page", String(toInt(page, DEFAULT_PAGE)));
  sp.set("size", String(toInt(size, DEFAULT_SIZE)));

  const t = String(type ?? "").trim();
  const st = String(status ?? "").trim();
  const so = String(sort ?? "").trim();

  if (t) sp.set("type", t);
  if (st) sp.set("status", st);
  if (reviewed !== undefined && reviewed !== null)
    sp.set("reviewed", String(reviewed));
  if (so) sp.set("sort", so);

  return `?${sp.toString()}`;
}

/*
  /members/me/reviews 전용 쿼리 빌더(타입 + 정렬)
*/
function buildMyReviewsQuery({ type, sort, page, size } = {}) {
  const sp = new URLSearchParams();

  const t = String(type ?? "").trim();
  const so = String(sort ?? "").trim();

  if (t) sp.set("type", t);
  sp.set("page", String(toInt(page, DEFAULT_PAGE)));
  sp.set("size", String(toInt(size, DEFAULT_SIZE)));
  if (so) sp.set("sort", so);

  return `?${sp.toString()}`;
}

/* =========================
   내 정보 API
   ========================= */

/*
  내 정보 조회
*/
export async function fetchMe() {
  const res = await api.get("/members/me");
  return assertSuccess(res, "내 정보 조회에 실패했습니다").data;
}

/*
  내 정보 수정
*/
export async function updateMe(payload) {
  const res = await api.patch("/members/me", payload);
  return assertSuccess(res, "내 정보 수정에 실패했습니다").data;
}

/*
  프로필 이미지 업로드
  - FormData 전송 처리(api.putForm 사용)
*/
export async function uploadProfileImage(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await api.putForm("/members/me/profile-image", fd, {
    headers: {}, // Content-Type 자동 설정 전제
  });

  return assertSuccess(res, "프로필 이미지 업로드에 실패했습니다").data;
}

export async function deleteProfileImage() {
  const res = await api.delete("/members/me/profile-image");
  return assertSuccess(res, "프로필 이미지 삭제에 실패했습니다").data;
}

/* =========================
   인터뷰 API
   ========================= */

/*
  신청한 인터뷰 목록 조회(페이지)
  - meta 사용 전제에 따른 응답 전체 반환
*/
export async function fetchAppliedInterviewPage({
  page,
  size,
  sort = DEFAULT_SORT,
  status,
} = {}) {
  const res = await api.get(
    `/members/me/interviews${buildMeInterviewsQuery({
      type: "APPLIED",
      status,
      sort,
      page,
      size,
    })}`
  );
  return assertSuccess(res, "신청한 인터뷰 목록 조회에 실패했습니다");
}

/*
  인터뷰 상세 조회
*/
export async function fetchMyInterviewDetail(interviewId) {
  const res = await api.get(`/members/me/interviews/${enc(interviewId)}`);
  return assertSuccess(res, "인터뷰 상세 조회에 실패했습니다").data;
}

/*
  완료된 인터뷰 목록 조회(페이지)
  - reviewed=false: 후기 작성 필요 필터 용도
  - meta 사용 전제에 따른 응답 전체 반환
*/
export async function fetchCompletedInterviewPage({
  page,
  size,
  sort = DEFAULT_SORT,
} = {}) {
  const res = await api.get(
    `/members/me/interviews${buildMeInterviewsQuery({
      type: "APPLIED",
      status: "COMPLETED",
      reviewed: false,
      sort,
      page,
      size,
    })}`
  );
  return assertSuccess(res, "완료된 인터뷰 목록 조회에 실패했습니다");
}

/*
  인터뷰 후기 생성
*/
export async function createInterviewReview(interviewId, payload = {}) {
  const res = await api.post(
    `/interviews/${enc(interviewId)}/reviews`,
    payload
  );
  return assertSuccess(res, "인터뷰 후기 생성에 실패했습니다").data;
}

/* =========================
   후기 API
   ========================= */

/*
  내가 작성한 후기 목록 조회(페이지)
  - meta 사용 전제에 따른 응답 전체 반환
*/
export async function fetchMyWrittenReviewsPage({
  page,
  size,
  sort = DEFAULT_SORT,
} = {}) {
  const res = await api.get(
    `/members/me/reviews${buildMyReviewsQuery({
      type: "WRITTEN",
      sort,
      page,
      size,
    })}`
  );
  return assertSuccess(res, "작성한 후기 목록 조회에 실패했습니다");
}

/*
  후기 상세 조회
*/
export async function fetchMyReviewDetail(reviewId) {
  const res = await api.get(`/members/me/reviews/${enc(reviewId)}`);
  return assertSuccess(res, "후기 상세 조회에 실패했습니다").data;
}

/* =========================
   Q&A API
   ========================= */

/*
  내가 작성한 질문 목록 조회(페이지)
  - meta 사용 전제에 따른 응답 전체 반환
*/
export async function fetchMyQuestionsPage({ page, size } = {}) {
  const res = await api.get(
    `/members/me/questions${buildPageQuery({ page, size })}`
  );
  return assertSuccess(res, "질문 목록 조회에 실패했습니다");
}

/*
  질문 수정
*/
export async function updateQuestion(questionId, payload) {
  const res = await api.patch(`/questions/${enc(questionId)}`, payload);
  return assertSuccess(res, "질문 수정에 실패했습니다").data;
}

/*
  질문 삭제
*/
export async function deleteMyQuestion(questionId) {
  const res = await api.delete(`/questions/${enc(questionId)}`);
  return assertSuccess(res, "질문 삭제에 실패했습니다").data;
}
