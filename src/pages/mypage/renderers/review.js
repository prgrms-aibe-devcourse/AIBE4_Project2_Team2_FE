// src/pages/mypage/renderers/review.js
/*
  작성 후기 아이템 렌더링
  - ReviewResponse(viewType, peer, review, interview, createdAt, updatedAt) 기반 렌더링
  - 목록 클릭 시 상세 모달 오픈을 위한 data-action/data-review-id 설정
  - 수정 버튼 클릭 시 수정 모달 오픈을 위한 data-action/data-interview-id 설정
  - 날짜는 YYYY-MM-DD 형식으로 표시
*/

import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { renderStars } from "../utils/format.js";

/*
  작성 후기 목록 아이템 HTML 생성
*/
export function renderWrittenReviewItem(item) {
  const peer = item?.peer ?? {};
  const review = item?.review ?? {};
  const interview = item?.interview ?? {};

  const reviewId = safeId(review?.reviewId);
  const interviewId = safeId(interview?.interviewId);

  const profileImageUrl = safeText(peer?.profileImageUrl, "");

  const nick = safeText(peer?.nickname, "-");
  const uni = safeText(peer?.university, "");
  const major = safeText(peer?.major, "");
  const uniMajor = formatUniMajor(uni, major);

  const rating = clampInt(review?.rating, 0, 5);
  const content = safeText(review?.content, "");

  const createdAtRaw = safeText(item?.createdAt, "");
  const updatedAtRaw = safeText(item?.updatedAt, "");

  const createdDate = formatDateOnly(createdAtRaw);
  const updatedDate = formatDateOnly(updatedAtRaw);

  const edited = isEdited(createdAtRaw, updatedAtRaw);

  const avatarStyle = profileImageUrl
    ? `background-image:url('${escapeAttr(profileImageUrl)}')`
    : "";

  return `
    <div class="mypage-item mypage-review-item"
      data-action="open-review-detail"
      data-review-id="${escapeAttr(reviewId)}"
      role="button"
      tabindex="0"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left">
          <div class="mypage-review-avatar" style="${avatarStyle}"></div>

          <div class="mypage-review-head">
            <div class="mypage-item-title">
              ${escapeHtml(nick)}${
    uniMajor
      ? ` <span class="mypage-review-sub">(${escapeHtml(uniMajor)})</span>`
      : ""
  }
            </div>
            <div class="mypage-stars">${renderStars(rating)}</div>
          </div>
        </div>

        <div class="mypage-review-meta">
          <div class="mypage-date">
            <span class="mypage-date-label">작성일</span>
            <span class="mypage-date-value">${escapeHtml(createdDate)}</span>
          </div>

          ${
            edited
              ? `<div class="mypage-date mypage-date--edited">
                   <span class="mypage-date-label">수정일</span>
                   <span class="mypage-date-value">${escapeHtml(
                     updatedDate
                   )}</span>
                 </div>`
              : ""
          }
        </div>
      </div>

      <div class="mypage-review-bottom">
        <div class="mypage-review-snippet" data-no-detail="true">${escapeHtml(
          content
        )}</div>

        <button
          class="mypage-mini-btn mypage-review-edit-btn"
          type="button"
          data-action="open-review-edit"
          data-review-id="${escapeAttr(reviewId)}"
          data-interview-id="${escapeAttr(interviewId)}"
          data-no-detail="true"
          ${interviewId ? "" : "disabled"}
        >수정하기</button>
      </div>
    </div>
  `;
}

/*
  안전한 문자열 처리
*/
function safeText(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

/*
  data-*에 넣을 id 문자열 정규화
*/
function safeId(v) {
  const s = String(v ?? "").trim();
  return s;
}

/*
  대학교/학과 표시 문자열 생성
*/
function formatUniMajor(university, major) {
  const u = String(university ?? "").trim();
  const m = String(major ?? "").trim();
  if (!u && !m) return "";
  if (u && m) return `${u} / ${m}`;
  return u || m;
}

/*
  정수 범위 보정
*/
function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/*
  날짜(YYYY-MM-DD)만 표시
*/
function formatDateOnly(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "-";
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/*
  수정 여부 판정
*/
function isEdited(createdAt, updatedAt) {
  const c = parseDate(createdAt);
  const u = parseDate(updatedAt);
  if (!c || !u) return false;
  return u.getTime() > c.getTime();
}

/*
  Date 파싱
*/
function parseDate(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}
