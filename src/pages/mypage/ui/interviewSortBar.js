// src/pages/mypage/ui/interviewSortBar.js
const STATUS_BTNS = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "ACCEPTED", label: "수락" },
  { value: "REJECTED", label: "거절" },
  { value: "COMPLETED", label: "완료" },
];

const SORT_BTNS = [
  { value: "CREATED_AT_DESC", label: "최신순" },
  { value: "CREATED_AT_ASC", label: "오래된순" },
];

function upper(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}

export function renderInterviewSortBar(
  container,
  {
    currentSort,
    onChangeSort,
    showStatus = false,
    currentStatus,
    onChangeStatus,
  }
) {
  if (!container) return;

  const sort = upper(currentSort) || "CREATED_AT_DESC";
  const status = upper(currentStatus) || "ALL";

  container.innerHTML = `
    <div class="mypage-sortbar" data-no-detail="true">
      <div class="mypage-sortbar-row mypage-sortbar-row--top">
        <div class="mypage-sortbar-left">
          ${
            showStatus
              ? STATUS_BTNS.map(
                  (b) => `
                    <button type="button"
                      class="mypage-filterbtn ${
                        upper(b.value) === status ? "is-active" : ""
                      }"
                      data-status="${b.value}"
                    >${b.label}</button>
                  `
                ).join("")
              : ""
          }
        </div>

        <div class="mypage-sortbar-right">
          ${SORT_BTNS.map(
            (b) => `
              <button type="button"
                class="mypage-sortbtn ${
                  upper(b.value) === sort ? "is-active" : ""
                }"
                data-sort="${b.value}"
              >${b.label}</button>
            `
          ).join("")}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".mypage-sortbtn").forEach((btn) => {
    btn.onclick = () => {
      const next = upper(btn.dataset.sort);
      if (!next) return;
      onChangeSort?.(next);
    };
  });

  if (showStatus) {
    container.querySelectorAll(".mypage-filterbtn").forEach((btn) => {
      btn.onclick = () => {
        const next = upper(btn.dataset.status);
        if (!next) return;
        onChangeStatus?.(next);
      };
    });
  }
}
