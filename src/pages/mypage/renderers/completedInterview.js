// src/pages/mypage/renderers/completedInterview.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";

export function renderCompletedInterviewItem(item) {
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

  const createdDate = formatDateOnly(item?.createdAt || "");
  const updatedDate = formatDateOnly(item?.updatedAt || "");
  const responded = hasMeaningfulUpdate(
    item?.createdAt || "",
    item?.updatedAt || ""
  );
  const endLabel = statusUpper === "COMPLETED" ? "완료일" : "응답일";

  const reviewWritten = Boolean(item?.reviewWritten);

  return `
    <div class="mypage-item mypage-review-item"
      data-action="open-completed-interview-detail"
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
            <div class="mypage-item-sub" data-no-detail="true">
              <span
                class="mm-badge mypage-status-chip"
                data-tone="${escapeAttr(chipTone)}"
              >${escapeHtml(statusRaw || "-")}</span>
            </div>

            <div class="mypage-item-title">${escapeHtml(nick)}${
    uniMajor
      ? ` <span class="mypage-review-sub">(${escapeHtml(uniMajor)})</span>`
      : ""
  }</div>
          </div>
        </div>

        <div class="mypage-review-meta">
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

      <div class="mypage-review-bottom">
        <div class="mypage-review-snippet" data-no-detail="true">${escapeHtml(
          title
        )}</div>

        <button
          class="mypage-mini-btn mypage-review-write-btn"
          type="button"
          data-action="write-review"
          data-interview-id="${escapeAttr(interviewId)}"
          data-no-detail="true"
          ${reviewWritten ? "disabled aria-disabled='true'" : ""}
        >${reviewWritten ? "후기 작성 완료" : "후기 작성하기"}</button>
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
