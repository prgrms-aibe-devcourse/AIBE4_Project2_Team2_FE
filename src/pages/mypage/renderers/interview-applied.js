// src/pages/mypage/renderers/interviewApplied.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { formatDateTime } from "../utils/format.js";

export function renderInterviewAppliedItem(item) {
  // 기대 구조 예시(요약)
  // { major: {...}, interview: { interviewId, title, preferredDatetime }, status, createdAt }
  const interview = item?.interview || {};
  const id = interview?.interviewId;

  const major = item?.major || {};
  const title = safeText(interview?.title, "-");
  const nick = safeText(major?.nickname, "-");
  const uniMajor = `${safeText(major?.university, "")}${
    major?.university && major?.major ? " " : ""
  }${safeText(major?.major, "")}`.trim();

  const status = safeText(item?.status, "");
  const dt = formatDateTime(interview?.preferredDatetime);
  const createdAt = formatDateTime(item?.createdAt);

  return `
    <div class="mypage-item">
      <div class="mypage-item-top">
        <div>
          <div class="mypage-item-title">${escapeHtml(title)}</div>
          <div class="mypage-item-sub">${escapeHtml(
            [nick, uniMajor].filter(Boolean).join(" · ") || "-"
          )}</div>
          <div class="mypage-item-sub">${escapeHtml(
            [status, dt].filter(Boolean).join(" · ") || ""
          )}</div>
        </div>
        <div class="mypage-date">${escapeHtml(createdAt || "")}</div>
      </div>

      <div class="mypage-item-actions">
        <button class="mypage-mini-btn" type="button"
          data-action="open-interview-detail"
          data-id="${escapeAttr(id)}"
        >상세보기</button>
      </div>
    </div>
  `;
}

function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : fallback ?? "";
}
