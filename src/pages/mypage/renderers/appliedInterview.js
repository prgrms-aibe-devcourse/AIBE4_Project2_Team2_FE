// src/pages/mypage/renderers/appliedInterview.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";

export function renderAppliedInterviewItem(item) {
  const major = item?.peer || {};
  const interview = item?.interview || {};

  const interviewId = item?.interviewId;

  const profileImageUrl = String(major?.profileImageUrl || "").trim();

  const nick = safeText(major?.nickname, "-");
  const uniMajor = `${safeText(major?.university, "")}${
    major?.university && major?.major ? " / " : ""
  }${safeText(major?.major, "")}`.trim();

  const title = safeText(interview?.title, "-");

  const statusRaw = String(item?.status || "").trim();
  const statusUpper = statusRaw.toUpperCase();
  const chipTone = statusTone(statusUpper);

  const createdAtRaw = item?.createdAt || "";
  const updatedAtRaw = item?.updatedAt || "";

  const createdDate = formatDateOnly(createdAtRaw);
  const updatedDate = formatDateOnly(updatedAtRaw);

  const responded = hasMeaningfulUpdate(createdAtRaw, updatedAtRaw);
  const endLabel = statusUpper === "COMPLETED" ? "완료일" : "응답일";

  return `
    <div class="mypage-item mypage-review-item mypage-applied-item"
      data-action="open-applied-interview-detail"
      data-interview-id="${escapeAttr(interviewId)}"
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
          </div>
        </div>

        <!-- 기존 날짜 자리: status 칩 배치 -->
        <div class="mypage-review-meta">
          <span
            class="mm-badge mypage-status-chip"
            data-tone="${escapeAttr(chipTone)}"
            data-no-detail="true"
          >${escapeHtml(statusRaw || "-")}</span>
        </div>
      </div>

      <!-- 기존 스니펫/버튼 자리: 제목 + 신청일/응답일(또는 완료일) 배치 -->
      <div class="mypage-review-bottom mypage-applied-bottom">
        <div class="mypage-review-snippet mypage-applied-snippet" data-no-detail="true">
          ${escapeHtml(title)}
        </div>

        <div class="mypage-applied-dates" data-no-detail="true">
          <div class="mypage-date">
            <span class="mypage-date-label">신청일</span>
            <span class="mypage-date-value">${escapeHtml(createdDate)}</span>
          </div>

          ${
            responded
              ? `<div class="mypage-date mypage-date--edited">
                   <span class="mypage-date-label">${escapeHtml(
                     endLabel
                   )}</span>
                   <span class="mypage-date-value">${escapeHtml(
                     updatedDate
                   )}</span>
                 </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function statusTone(statusUpper) {
  const s = String(statusUpper || "")
    .trim()
    .toUpperCase();
  if (s === "ACCEPTED") return "accepted";
  if (s === "REJECT" || s === "REJECTED") return "rejected";
  if (s === "PENDING") return "pending";
  if (s === "COMPLETED") return "dark";
  return "soft";
}

function safeText(v, fallback) {
  const s = String(v ?? "").trim();
  return s ? s : fallback ?? "";
}

function formatDateOnly(raw) {
  const s = String(raw || "").trim();
  if (!s) return "-";
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function hasMeaningfulUpdate(createdAt, updatedAt) {
  const cKey = toComparableKey(createdAt);
  const uKey = toComparableKey(updatedAt);
  if (!uKey) return false;
  if (!cKey) return true;
  return uKey !== cKey;
}

function toComparableKey(dt) {
  const s = String(dt || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);
  if (!m) return s;
  const base = m[1];
  const fracRaw = m[2] || "";
  const frac = fracRaw.replace(/0+$/, "");
  return frac ? `${base}.${frac}` : base;
}
