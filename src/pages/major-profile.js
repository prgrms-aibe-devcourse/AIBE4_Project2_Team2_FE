import { navigate } from "../router.js";
import { api } from "../services/api.js";
import { getSession } from "../auth/auth.js";

function getStatusDisplay(status) {
  switch (status) {
    case "PENDING":
      return { label: "대기중", className: "mj-badge--pending" };
    case "ACCEPTED":
      return { label: "인증됨", className: "mj-badge--accepted" };
    case "REJECTED":
      return { label: "반려됨", className: "mj-badge--rejected" };
    case "RESUBMITTED":
      return { label: "재심사중", className: "mj-badge--resubmitted" };
    default:
      return { label: status || "미신청", className: "mj-badge--none" };
  }
}

export async function renderMajorProfile(root) {
  const session = getSession();
  const user = session?.user;

  if (!user) {
    alert("로그인이 필요합니다.");
    navigate("/login");
    return;
  }

  // 상태 정보 가져오기
  const statusInfo = getStatusDisplay(user.applicationStatus);
  const isAccepted = user.applicationStatus === "ACCEPTED";

  const wrap = document.createElement("div");
  wrap.className = "mj-container";

  wrap.innerHTML = `
    <header class="mj-header">
      <div class="mj-header__main">
        <div class="mj-avatar" style="background-image: url('${
          user.profileImageUrl || ""
        }');">
          ${
            !user.profileImageUrl
              ? `<span class="mj-avatar-empty">👤</span>`
              : ""
          }
        </div>
        <div class="mj-info">
          <div class="mj-info__top">
            <span class="mj-info__name">${user.nickname || user.name}</span>
            <span class="mj-info__badge ${statusInfo.className}">${
    statusInfo.label
  }</span>
          </div>
          <div class="mj-info__sub">${user.university} · ${user.major}</div>
        </div>
      </div>
    </header>

    <nav class="mj-tabs">
      <button class="mj-tab ${
        isAccepted ? "is-active" : "is-disabled"
      }" data-tab="profile">내 프로필</button>
      <button class="mj-tab ${
        !isAccepted ? "is-active" : ""
      }" data-tab="request">인증 현황</button>
      <button class="mj-tab" data-tab="qna">Q&A 관리</button>
      <button class="mj-tab" data-tab="review">리뷰</button>
    </nav>

    <div id="contentArea" class="mj-content-wrapper"></div>
  `;

  root.appendChild(wrap);
  const contentArea = wrap.querySelector("#contentArea");
  const tabs = wrap.querySelectorAll(".mj-tab");

  tabs.forEach((tab) => {
    tab.onclick = () => {
      const target = tab.dataset.tab;

      // [핵심 로직] 인증된 경우만 프로필 탭 접근 허용
      if (target === "profile" && !isAccepted) {
        alert("전공자 인증이 완료된 후에 프로필 설정이 가능합니다.");
        return;
      }

      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      loadTabData(target, contentArea, user);
    };
  });

  // 초기 로드: 인증됨 -> 프로필, 그 외 -> 인증 현황
  const initialTab = isAccepted ? "profile" : "request";
  loadTabData(initialTab, contentArea, user);
}

async function loadTabData(tab, container, user) {
  container.innerHTML = `<div class="mj-loading">데이터를 불러오는 중...</div>`;

  try {
    if (tab === "profile") {
      const res = await api.get("/major-profiles/me");
      if (res.success && res.data) renderViewMode(container, res.data, user);
      else renderEditMode(container, null, user);
    } else if (tab === "request") {
      const res = await api.get("/major-requests/me"); // 인증 현황 API
      renderRequestDetail(container, res.data);
    } else if (tab === "qna") {
      container.innerHTML = `<div class="mj-empty-box">준비 중인 서비스입니다. (Q&A)</div>`;
    } else if (tab === "review") {
      container.innerHTML = `<div class="mj-empty-box">준비 중인 서비스입니다. (Review)</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div class="mj-error">데이터 로드 실패</div>`;
  }
}

function renderViewMode(container, profile, user) {
  // 상태에 따른 버튼 텍스트와 스타일 결정
  const statusBtnText = profile.active
    ? "프로필 비공개로 전환"
    : "프로필 공개로 전환";
  const statusBtnClass = profile.active
    ? "mj-btn--status-off"
    : "mj-btn--status-on";

  container.innerHTML = `
    <div class="mj-card mj-card--view">
      <div class="mj-status-indicator">
        <span class="mj-status-dot ${profile.active ? "active" : ""}"></span>
        <span class="mj-status-label">${
          profile.active ? "현재 공개 중" : "현재 비공개"
        }</span>
      </div>

      <div class="mj-body">
        <h2 class="mj-display-title">"${profile.title}"</h2>
        <div class="mj-display-content">${
          profile.content
            ? profile.content.replace(/\n/g, "<br>")
            : "소개 내용이 없습니다."
        }</div>
        
        <div class="mj-tags">
          ${(profile.tags || [])
            .map(
              (tag) =>
                `<span class="mj-tag-item">${
                  tag.startsWith("#") ? tag : "#" + tag
                }</span>`
            )
            .join("")}
        </div>
      </div>

      <div class="mj-actions mj-actions--separated">
        <div class="mj-actions-row">
          <button class="mj-btn ${statusBtnClass}" id="statusToggleBtn">${statusBtnText}</button>
          <button class="mj-btn mj-btn--primary" id="editBtn">프로필 수정하기</button>
        </div>
        <button class="mj-btn mj-btn--ghost" id="backBtn">메인 화면으로 돌아가기</button>
      </div>
    </div>
  `;
  // 상태 전환 버튼 이벤트
  container.querySelector("#statusToggleBtn").onclick = async () => {
    const btn = container.querySelector("#statusToggleBtn");

    try {
      btn.disabled = true;
      btn.style.opacity = "0.5";

      const res = await api.patch("/major-profiles/status");

      if (res.success) {
        const newStatus = !profile.active;

        renderViewMode(container, { ...profile, active: newStatus }, user);

        console.log(`상태 변경 성공: ${newStatus ? "공개" : "비공개"}`);
      } else {
        alert("상태 변경 실패: " + (res.message || "알 수 없는 오류"));
        btn.disabled = false;
        btn.style.opacity = "1";
      }
    } catch (err) {
      console.error("Toggle Error:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  };

  container.querySelector("#editBtn").onclick = () =>
    renderEditMode(container, profile, user);
  container.querySelector("#backBtn").onclick = () => navigate("/");
}

// --- [수정/생성 모드] ---
function renderEditMode(container, profile, user) {
  const isEdit = !!profile;
  let tags = isEdit ? [...profile.tags] : [];

  // 1. HTML 구조를 먼저 완벽하게 삽입합니다.
  container.innerHTML = `
    <div class="mj-card mj-card--edit">
      <div class="mj-edit-header">
        <h3 class="mj-edit-title">${
          isEdit ? "프로필 수정" : "전공자 프로필 등록"
        }</h3>
      </div>

      <form id="editForm" class="mj-form">
        <div class="mj-form-group">
          <label class="mj-label">한 줄 소개</label>
          <input type="text" id="title" class="mj-input" 
            value="${isEdit ? profile.title || "" : ""}" 
            placeholder="예: 소통하는 개발자 OOO입니다." required>
        </div>

        <div class="mj-form-group">
          <label class="mj-label">상세 내용</label>
          <textarea id="content" class="mj-textarea" rows="8" 
            placeholder="학생들에게 도움이 될 수 있는 내용을 적어주세요.">${
              isEdit ? profile.content || "" : ""
            }</textarea>
        </div>

        <div class="mj-form-group">
          <label class="mj-label">태그 (최대 5개)</label>
          <div class="mj-tag-input-row">
            <input type="text" id="tagInput" class="mj-input" placeholder="태그 입력 후 추가 버튼 클릭">
            <button type="button" id="addTagBtn" class="mj-btn-add">추가</button>
          </div>
          <div id="tagsList" class="mj-tags-editable"></div>
        </div>

        <div class="mj-actions mj-actions--separated">
          <div class="mj-actions-row">
            ${
              isEdit
                ? `<button type="button" id="cancelBtn" class="mj-btn mj-btn--primary">수정 취소</button>`
                : "<div></div>"
            }
            <button type="submit" class="mj-btn mj-btn--save">${
              isEdit ? "변경사항 저장" : "프로필 등록"
            }</button>
          </div>
        </div>
      </form>
    </div>
  `;

  // 2. innerHTML 할당 직후 요소를 찾습니다.
  const tagsList = container.querySelector("#tagsList");
  const tagInput = container.querySelector("#tagInput");
  const addTagBtn = container.querySelector("#addTagBtn");
  const editForm = container.querySelector("#editForm");

  // 3. 태그 렌더링 함수
  const updateTagsUI = () => {
    if (!tagsList) return;
    tagsList.innerHTML = tags
      .map(
        (t, i) => `
      <span class="mj-tag-edit">
        ${t.startsWith("#") ? t : "#" + t} 
        <button type="button" class="mj-tag-remove" data-idx="${i}">×</button>
      </span>
    `
      )
      .join("");

    tagsList.querySelectorAll(".mj-tag-remove").forEach((btn) => {
      btn.onclick = (e) => {
        const idx = e.target.dataset.idx;
        tags.splice(idx, 1);
        updateTagsUI();
      };
    });
  };

  // 4. 이벤트 바인딩 (null 체크 포함으로 안전하게)
  if (addTagBtn && tagInput) {
    addTagBtn.onclick = () => {
      const val = tagInput.value.trim();
      if (val && tags.length < 5 && !tags.includes(val)) {
        tags.push(val);
        tagInput.value = "";
        updateTagsUI();
      } else if (tags.length >= 5) {
        alert("태그는 최대 5개까지 가능합니다.");
      }
    };
  }

  // 초기 태그 렌더링
  updateTagsUI();

  // 폼 제출 로직
  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: container.querySelector("#title").value,
        content: container.querySelector("#content").value,
        tags,
      };

      try {
        const res = isEdit
          ? await api.patch("/major-profiles", payload)
          : await api.post("/major-profiles", payload);

        if (res.success) {
          alert("저장되었습니다.");
          location.reload();
        }
      } catch (err) {
        alert("저장 중 오류가 발생했습니다.");
      }
    };
  }

  // 취소 버튼 (있을 경우만)
  const cancelBtn = container.querySelector("#cancelBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => renderViewMode(container, profile, user);
  }
}

// --- [인증 현황 탭 렌더링] ---
function renderRequestDetail(container, request) {
  if (!request || request.length === 0) {
    container.innerHTML = `
      <div class="mj-card mj-empty-card">
        <p class="mj-empty-msg">인증 신청 내역이 없습니다.</p>
        <button class="mj-btn mj-btn--primary" onclick="navigate('/major-role-request')">인증 신청하러 가기</button>
      </div>`;
    return;
  }

  const data = request[0];
  const statusInfo = getStatusDisplay(data.applicationStatus);
  const isRejected = data.applicationStatus === "REJECTED";

  container.innerHTML = `
    <div class="mj-card mj-card--clickable" id="requestCard">
      <div class="mj-status-bar">
        <span class="mj-label">현재 신청 상태</span>
        <span class="mj-info__badge ${statusInfo.className}">${
    statusInfo.label
  }</span>
      </div>
      
      <div class="mj-detail-list">
        <div class="mj-detail-item">
          <label>신청 일시</label>
          <p>${new Date(data.createdAt).toLocaleString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
        </div>

        <div class="mj-detail-item">
          <label>지원 내용</label>
          <div class="mj-comment-box">${
            data.comment ? data.comment.replace(/\n/g, "<br>") : "내용 없음"
          }</div>
        </div>

        ${
          data.reason
            ? `
          <div class="mj-detail-item mj-reject-section">
            <label>반려 사유</label>
            <div class="mj-reject-reason">
              <span class="mj-icon-warn">⚠️</span>
              ${data.reason}
            </div>
          </div>
        `
            : ""
        }
      </div>

      ${
        isRejected
          ? `
        <div class="mj-card-footer">
          <button class="mj-btn mj-btn--reapply" id="reapplyBtn">수정 후 재제출하기</button>
        </div>
      `
          : ""
      }
    </div>
  `;

  const card = container.querySelector("#requestCard");

  // 카드 클릭 시 상세 내역 팝업
  card.onclick = () => {
    const requestId = data.id || data.requestId;
    const url = `${window.location.origin}${window.location.pathname}#/major-role-request-detail/${requestId}`;
    const width = 600;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      "RequestDetail",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  // 재제출 버튼 클릭 이벤트 (버블링 방지)
  const reapplyBtn = container.querySelector("#reapplyBtn");
  if (reapplyBtn) {
    reapplyBtn.onclick = (e) => {
      e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
      sessionStorage.setItem("resubmitData", JSON.stringify(data));
      navigate("/apply");
    };
  }
}
