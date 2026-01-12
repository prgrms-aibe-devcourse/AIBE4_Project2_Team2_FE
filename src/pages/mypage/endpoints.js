// src/pages/mypage/endpoints.js
// 실제 서버 엔드포인트에 맞게 여기만 고치면 나머지는 그대로 쓸 수 있다
export const ENDPOINTS = {
  me: "/members/me",
  meUpdate: "/members/me",

  // 4개 탭
  reviewsWritten: "/members/me/reviews/written",
  qnaWritten: "/members/me/questions/written",
  interviewsApplied: "/members/me/interviews/applied",
  interviewsCompleted: "/members/me/interviews/completed",
};
