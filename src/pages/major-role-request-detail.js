import { navigate } from "../router.js";
import { api } from "../services/api.js";
import { showOverlayCheck, withOverlayLoading } from "../utils/overlay.js";

export async function renderMajorRequestDetail(root, params) {
  const requestId = params.id;

  const wrap = document.createElement("div");
  wrap.className = "request-detail-wrap only-content"; // 'only-content' 클래스 추가

  wrap.innerHTML = `
    <div class="detail-page-header">
      <h2 class="page-title">신청 상세 내역</h2>
      <button class="btn-close-window" onclick="window.close()">창 닫기</button>
    </div>
    <div class="detail-container" id="detailContainer">
      <div class="loading">불러오는 중...</div>
    </div>
  `;

  root.appendChild(wrap);
  const detailContainer = wrap.querySelector("#detailContainer");

  await withOverlayLoading(
    async () => {
      try {
        const response = await api.get(`/major-requests/${requestId}`);

        if (response?.success) {
          renderDetail(detailContainer, response.data);
        } else {
          detailContainer.innerHTML = `<div class="error">데이터 로드 실패: ${response?.message}</div>`;
        }
      } catch (error) {
        console.error("Error:", error);
        detailContainer.innerHTML = `<div class="error">서버 통신 오류가 발생했습니다.</div>`;
      }
    },
    { text: "신청 내역 상세 정보를 가져오고 있습니다..." }
  );
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
  
  <div class="detail-content text-section">
    ${detail.content}
  </div>

  <hr class="section-divider" />

  <div class="document-section">
    <p class="label">증빙 서류</p>
    <div class="document-box">
      ${
        detail.documentUrl
          ? `<img src="${detail.documentUrl}" alt="증빙 서류" class="document-img" />`
          : `<p class="pd-muted">검토가 완료되었거나 증빙 서류가 존재하지 않습니다.</p>`
      }
    </div>
  </div>
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
