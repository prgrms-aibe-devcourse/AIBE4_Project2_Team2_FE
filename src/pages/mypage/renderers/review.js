// src/pages/mypage/renderers/review.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { renderStars } from "../utils/format.js";

export function renderWrittenReviewItem(item) {
  const major = item?.major || {};
  const review = item?.review || {};

  const reviewId = review?.reviewId;
  const interviewId = review?.interviewId;

  const profileImageUrl = String(major?.profileImageUrl || "").trim();

  const nick = safeText(major?.nickname, "-");
  const uniMajor = `${safeText(major?.university, "")}${
    major?.university && major?.major ? " / " : ""
  }${safeText(major?.major, "")}`.trim();

  const rating = clampInt(review?.rating, 0, 5);
  const content = safeText(review?.content, "");

  const createdAtRaw = item?.createdAt || "";
  const updatedAtRaw = item?.updatedAt || "";

  const createdDate = formatDateOnly(createdAtRaw);
  const updatedDate = formatDateOnly(updatedAtRaw);

  const edited = isEdited(createdAtRaw, updatedAtRaw);

  return `
    <div class="mypage-item mypage-review-item"
      data-action="open-review-detail"
      data-review-id="${escapeAttr(reviewId)}"
      role="button"
      tabindex="0"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left">
          <div class="mypage-review-avatar" style="${
            profileImageUrl
              ? `background-image:url('${escapeAttr(profileImageUrl)}')`
              : ""
          }"></div>

          <div class="mypage-review-head">
            <div class="mypage-item-title">${escapeHtml(nick)}${
    uniMajor
      ? ` <span class="mypage-review-sub">(${escapeHtml(uniMajor)})</span>`
      : ""
  }</div>
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
        >수정하기</button>
      </div>
    </div>
  `;
}

function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : fallback ?? "";
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function formatDateOnly(raw) {
  const s = String(raw || "").trim();
  if (!s) return "-";
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

function isEdited(createdAt, updatedAt) {
  const c = parseLocalDateTime(createdAt);
  const u = parseLocalDateTime(updatedAt);
  if (!c || !u) return false;
  return u.getTime() > c.getTime();
}

function parseLocalDateTime(s) {
  const str = String(s || "").trim();
  if (!str) return null;
  const d = new Date(str);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}
