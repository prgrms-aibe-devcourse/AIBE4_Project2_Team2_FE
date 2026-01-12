// src/pages/mypage/renderers/interviewCompleted.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { formatDateTime } from "../utils/format.js";

export function renderInterviewCompletedItem(item) {
  // 완료된 인터뷰 탭은 "후기 작성" 진입점이 핵심이다
  // 기대 구조 예시
  // { major: {...}, interview: { interviewId, title, preferredDatetime }, status: "COMPLETED", createdAt }
  const interview = item?.interview || {};
  const id = interview?.interviewId;

  const major = item?.major || {};
  const title = safeText(interview?.title, "-");
  const nick = safeText(major?.nickname, "-");
  const uniMajor = `${safeText(major?.university, "")}${
    major?.university && major?.major ? " " : ""
  }${safeText(major?.major, "")}`.trim();

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
          <div class="mypage-item-sub">${escapeHtml(dt || "")}</div>
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
