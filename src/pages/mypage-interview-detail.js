export function renderMyInterviewDetail(view, { id }) {
  view.innerHTML = `
    <div class="card">
      <h2 class="mypage-title">인터뷰 상세</h2>
      <div class="card-body">interviewId: ${escapeHtml(id)}</div>
      <div class="card-body">여기에 인터뷰 상세 API 호출 결과를 렌더링하면 된다</div>
      <div class="mypage-item-actions">
        <button class="mypage-mini-btn" type="button" onclick="history.back()">뒤로</button>
      </div>
    </div>
  `;
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
