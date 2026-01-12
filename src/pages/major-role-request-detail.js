import { navigate } from "../router.js";
import { api } from "../services/api.js";

export async function renderMajorRequestDetail(root, params) {
  const requestId = params.id;

  const wrap = document.createElement("div");
  wrap.className = "request-detail-wrap";

  wrap.innerHTML = `
    <h2 class="page-title">신청 상세 내역</h2>
    <div class="detail-container" id="detailContainer">
      <div class="loading">불러오는 중...</div>
    </div>
    <div class="btn-row">
        <button class="btn-back" id="backBtn">목록으로</button>
    </div>
  `;

  root.appendChild(wrap);

  const detailContainer = wrap.querySelector("#detailContainer");
  const backBtn = wrap.querySelector("#backBtn");

  backBtn.addEventListener("click", () => navigate("/major-role-request")); // 목록 페이지로 이동

  try {
    const token = localStorage.getItem("mm_session");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const response = await api.get(`/major-requests/${requestId}`);

    if (!response?.success && response.data) {
      detailContainer.innerHTML = `<div class="error">조회 실패: ${errorText}</div>`;
      return { ok: false, message: result?.message || "불러오기 실패" };
    }
    renderDetail(detailContainer, response.data);
  } catch (error) {
    console.error("Error:", error);
    detailContainer.innerHTML = `<div class="error">서버 통신 오류</div>`;
  }
}

function renderDetail(container, detail) {
  const statusInfo = getStatusInfo(detail.applicationStatus);
  const date = new Date(detail.createdAt).toLocaleDateString();

  container.innerHTML = `
    <!-- 1. 기본 정보 카드 -->
    <div class="detail-card">
      <div class="detail-header">
        <span class="detail-date">${date}</span>
        <span class="status-badge ${statusInfo.className}">${
    statusInfo.label
  }</span>
      </div>
      <div class="detail-row">
        <span class="label">이름</span>
        <span class="value">${detail.name} (${detail.nickname})</span>
      </div>
      <div class="detail-row">
        <span class="label">학교/전공</span>
        <span class="value">${detail.universityName} / ${
    detail.majorName
  }</span>
      </div>
    </div>

    <!-- 2. 신청 내용 카드 -->
    <div class="detail-card">
      <h3 class="card-title">신청 내용</h3>
      <div class="detail-content">
        ${detail.content}
      </div>
      
      ${
        detail.documentUrl
          ? `
        <div class="document-area">
          <p class="label">증빙 서류</p>
          <img src="${detail.documentUrl}" alt="증빙 서류" class="document-img" />
        </div>
      `
          : ""
      }
    </div>

    <!-- 3. 히스토리 (타임라인) -->
<div class="detail-card">
  <h3 class="card-title">진행 이력</h3>
  <ul class="history-timeline">
    ${
      (detail.histories || []).length > 0
        ? detail.histories
            .map((history) => {
              const hDate = new Date(history.changedAt).toLocaleString();

              // 상태 정보 객체 가져오기
              const oldStatusInfo = history.oldStatus
                ? getStatusInfo(history.oldStatus)
                : null;
              const newStatusInfo = getStatusInfo(history.newStatus);

              return `
            <li class="history-item">
              <div class="history-marker ${newStatusInfo.className}"></div>
              
              <div class="history-content">
                <div class="history-header">
                  <div class="history-status-flow">
                    ${
                      oldStatusInfo
                        ? `<span class="status-old">${oldStatusInfo.label}</span>
                         <span class="status-arrow">→</span>`
                        : `<span class="status-tag-new">최초 신청</span>`
                    }
                    <span class="history-status ${newStatusInfo.className}">${
                newStatusInfo.label
              }</span>
                  </div>
                  <span class="history-date">${hDate}</span>
                </div>
                
                <div class="history-actor">
                  <i class="icon-user"></i> 처리자: <strong>${
                    history.changedBy
                  }</strong>
                </div>

                ${
                  history.reason
                    ? `<div class="history-reason">
                         <strong>처리 사유</strong>
                         <p>${history.reason}</p>
                       </div>`
                    : ""
                }
              </div>
            </li>
          `;
            })
            .join("")
        : '<li class="history-empty">기록된 진행 이력이 없습니다.</li>'
    }
  </ul>
</div>
  `;
}

function getStatusInfo(status) {
  switch (status) {
    case "PENDING":
      return { label: "심사 대기중", className: "status-pending" };
    case "ACCEPTED":
      return { label: "승인됨", className: "status-accepted" };
    case "REJECTED":
      return { label: "반려됨", className: "status-rejected" };
    case "RESUBMITTED":
      return { label: "재제출됨", className: "status-resubmitted" };
    default:
      return { label: status, className: "" };
  }
}
