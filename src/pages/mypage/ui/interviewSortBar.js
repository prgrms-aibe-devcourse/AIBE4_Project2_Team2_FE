// src/pages/mypage/ui/interviewSortBar.js
/*
  인터뷰 목록 정렬/필터 바 렌더링
  - applied 탭에서만 상태 필터 버튼 노출
  - 정렬 버튼은 모든 목록 탭에서 공통 사용
  - 클릭 시 onChangeSort/onChangeStatus 콜백 호출
*/

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

/*
  대문자 정규화
*/
function upper(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}

/*
  정렬/필터 바 렌더링
  - container: 삽입 대상
  - currentSort/currentStatus: 현재 선택 값
  - showStatus: 상태 필터 표시 여부
*/
export function renderInterviewSortBar(
  container,
  {
    currentSort,
    onChangeSort,
    showStatus = false,
    currentStatus,
    onChangeStatus,
  } = {}
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
              ? STATUS_BTNS.map((b) => {
                  const active = upper(b.value) === status ? "is-active" : "";
                  return `
                    <button type="button"
                      class="mypage-filterbtn ${active}"
                      data-status="${b.value}"
                    >${b.label}</button>
                  `;
                }).join("")
              : ""
          }
        </div>

        <div class="mypage-sortbar-right">
          ${SORT_BTNS.map((b) => {
            const active = upper(b.value) === sort ? "is-active" : "";
            return `
              <button type="button"
                class="mypage-sortbtn ${active}"
                data-sort="${b.value}"
              >${b.label}</button>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  // 정렬 버튼 클릭 처리
  container.querySelectorAll(".mypage-sortbtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = upper(btn.dataset.sort);
      if (!next) return;
      if (typeof onChangeSort === "function") onChangeSort(next);
    });
  });

  // 상태 필터 버튼 클릭 처리(showStatus=true일 때만)
  if (showStatus) {
    container.querySelectorAll(".mypage-filterbtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = upper(btn.dataset.status);
        if (!next) return;
        if (typeof onChangeStatus === "function") onChangeStatus(next);
      });
    });
  }
}
