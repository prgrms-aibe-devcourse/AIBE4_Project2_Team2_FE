import { APPLICATIONS } from "../data/managerMockData.js";

export function renderManager(root) {
  const state = {
    applications: [...APPLICATIONS],
  };

  const { wrap, render } = buildManager();
  root.appendChild(wrap);
  render();

  function buildManager() {
    const wrap = document.createElement("div");
    wrap.className = "manager-wrap";

    wrap.innerHTML = `
      <h2 class="manager-title">전공자 지원서 관리</h2>
      <section class="card manager-card">
        <table class="manager-table" id="applicationsTable">
          <thead>
            <tr>
              <th>이름</th>
              <th>학교/전공</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </section>
    `;

    const tableBody = wrap.querySelector("#applicationsTable tbody");

    tableBody.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;
      const appId = actionBtn.dataset.id;
      if (!action || !appId) return;

      const appIndex = state.applications.findIndex(app => app.id === appId);
      if (appIndex === -1) return;

      if (action === 'approve') {
        state.applications[appIndex].status = 'approved';
      } else if (action === 'reject') {
        state.applications[appIndex].status = 'rejected';
      }
      
      render();
    });

    function render() {
      const apps = state.applications;
      tableBody.innerHTML = "";

      if (apps.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="empty">지원서가 없습니다.</td></tr>`;
        return;
      }

      for (const app of apps) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>
            <div class="user-info">
              <div class="user-avatar"></div>
              <span class="user-name">${escapeHtml(app.name)}</span>
            </div>
          </td>
          <td>${escapeHtml(app.school)}<br />${escapeHtml(app.major)}</td>
          <td><span class="status-${app.status}">${getStatusText(app.status)}</span></td>
          <td>
            <div class="btn-group">
              <button class="action-btn approve" data-action="approve" data-id="${app.id}" ${app.status !== 'pending' ? 'disabled' : ''}>승인</button>
              <button class="action-btn reject" data-action="reject" data-id="${app.id}" ${app.status !== 'pending' ? 'disabled' : ''}>거절</button>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      }
    }

    return { wrap, render };
  }

  function getStatusText(status) {
    if (status === 'pending') return '대기중';
    if (status === 'approved') return '승인됨';
    if (status === 'rejected') return '거절됨';
    return '';
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
