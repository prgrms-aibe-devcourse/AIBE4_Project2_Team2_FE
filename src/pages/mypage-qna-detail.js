// src/pages/mypage-qna-detail.js

export function renderMyQnaDetail(view, params = {}) {
  const id = params?.id ?? "";

  view.innerHTML = `
    <div class="card">
      <h2 class="card-title">내가 작성한 Q&A 상세</h2>
      <p class="card-sub">qnaId: ${escapeHtml(String(id))}</p>

      <div class="card-body">
        <p>여기에 Q&A 상세 화면 구현을 넣으면 된다.</p>
        <button class="mypage-mini-btn" type="button" id="btnBackToMyPage">목록으로</button>
      </div>
    </div>
  `;

  const backBtn = view.querySelector("#btnBackToMyPage");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/mypage";
    });
  }
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
