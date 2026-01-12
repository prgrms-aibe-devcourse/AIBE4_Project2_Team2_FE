import { navigate } from "../router.js";
import { api } from "../services/api.js";

export async function renderMajorRoleRequest(root) {
  const wrap = document.createElement("div");
  wrap.className = "major-role-request-wrap";

  wrap.innerHTML = `
    <h2 class="page-title">내 전공자 인증 신청 내역</h2>
    <div class="request-list" id="requestList">
      <div class="loading">불러오는 중...</div>
    </div>
    <div class="btn-row">
        <button class="btn-back" id="backBtn">뒤로 가기</button>
    </div>
  `;

  root.appendChild(wrap);

  const requestList = wrap.querySelector("#requestList");
  const backBtn = wrap.querySelector("#backBtn");

  backBtn.addEventListener("click", () => navigate("/"));

  try {
    const token = localStorage.getItem("mm_session");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const response = await api.get("/major-requests/me");

    if (!response?.success) {
      requestList.innerHTML = `<div class="error">조회 실패: ${errorText}</div>`;
      return { ok: false, message: result?.message || "불러오기 실패" };
    }
    renderList(requestList, response);
  } catch (error) {
    console.error("Error:", error);
    requestList.innerHTML = `<div class="error">서버 통신 오류</div>`;
  }
}

function renderList(container, response) {
  if (!response || response.length === 0) {
    container.innerHTML = `<div class="empty-message">신청 내역이 없습니다.</div>`;
    return;
  }

  // HTML 생성
  container.innerHTML = response.data
    .map((res) => {
      const statusInfo = getStatusInfo(res.applicationStatus);
      const date = new Date(res.createdAt).toLocaleDateString();

      // data-id 속성 추가 (이벤트 위임용)
      return `
      <div class="request-card" data-id="${res.id}" style="cursor: pointer;">
        <div class="card-header">
          <span class="request-date">${date}</span>
          <span class="status-badge ${statusInfo.className}">${
        statusInfo.label
      }</span>
        </div>
        
        <div class="card-body">
          <div class="info-row">
            <span class="label">학교/전공:</span>
            <span class="value">${res.university} / ${res.major}</span>
          </div>
          <div class="info-row">
            <span class="label">신청 내용:</span>
            <span class="value">${res.comment}</span>
          </div>
          
          ${
            res.reason
              ? `
            <div class="reject-reason">
              <span class="label">반려 사유:</span>
              <span class="value">${res.reason}</span>
            </div>
          `
              : ""
          }
        </div>

        ${
          res.applicationStatus === "REJECTED"
            ? `
          <div class="card-footer">
            <button class="btn-resubmit" data-id="${res.id}">재신청 하기</button>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  // 1. 카드 클릭 이벤트 (상세 보기 이동)
  container.querySelectorAll(".request-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // 재신청 버튼 클릭 시에는 상세 이동 방지
      if (e.target.classList.contains("btn-resubmit")) return;

      const requestId = card.dataset.id;
      // 상세 페이지로 이동 (라우터 설정 필요: /major-request/:id)
      navigate(`/major-role-request-detail/${requestId}`);
    });
  });

  // 2. 재신청 버튼 이벤트
  container.querySelectorAll(".btn-resubmit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

      const requestId = e.target.dataset.id;
      const targetRequest = requests.find((r) => r.id == requestId);

      if (targetRequest) {
        sessionStorage.setItem("resubmitData", JSON.stringify(targetRequest));
        navigate("/apply-major");
      }
    });
  });
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
