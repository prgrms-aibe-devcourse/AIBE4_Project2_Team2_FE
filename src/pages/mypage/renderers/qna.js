// src/pages/mypage/renderers/qna.js
import { escapeHtml, escapeAttr } from "../utils/dom.js";
import { formatDateTime } from "../utils/format.js";

export function renderQnaItem(item) {
  // 기대 구조 예시
  // { questionId, title, content, answer: { content }, createdAt }
  const id = item?.questionId ?? item?.id;
  const title = safeText(item?.title, "질문");
  const content = safeText(item?.content, "");
  const answer = safeText(
    item?.answer?.content || item?.answerContent || "",
    ""
  );
  const createdAt = formatDateTime(item?.createdAt);

  const sub = answer ? "답변 완료" : "답변 대기";

  return `
    <div class="mypage-item">
      <div class="mypage-item-top">
        <div>
          <div class="mypage-item-title">${escapeHtml(title)}</div>
          <div class="mypage-item-sub">${escapeHtml(sub)}</div>
        </div>
        <div class="mypage-date">${escapeHtml(createdAt || "")}</div>
      </div>

      <div class="mypage-item-content">${escapeHtml(content)}</div>
      ${
        answer
          ? `<div class="mypage-item-content">${escapeHtml(answer)}</div>`
          : ""
      }

      <div class="mypage-item-actions">
        <button class="mypage-mini-btn" type="button"
          data-action="open-qna-detail"
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
