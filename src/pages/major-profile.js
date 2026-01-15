import { navigate } from "../router.js";
import { api } from "../services/api.js";
import { getSession } from "../auth/auth.js";
import { showOverlayCheck, withOverlayLoading } from "../utils/overlay.js";

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

const pageState = {
  interviews: 0,
  review: 0,
  qna: 0,
};

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
            !user.profileImageUrl ? `<span class="mj-avatar-empty"></span>` : ""
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
        isAccepted ? "" : "is-disabled"
      }" data-tab="interviews">받은 인터뷰</button>

      <button class="mj-tab ${
        isAccepted ? "" : "is-disabled"
      }" data-tab="qna">Q&A 관리</button>

      <button class="mj-tab ${
        isAccepted ? "" : "is-disabled"
      }" data-tab="review">인터뷰 후기</button>

      <button class="mj-tab ${
        !isAccepted ? "is-active" : ""
      }" data-tab="request">인증 현황</button>

    </nav>

    <div id="contentArea" class="mj-content-wrapper"></div>
  `;

  root.appendChild(wrap);
  const contentArea = wrap.querySelector("#contentArea");
  const tabs = wrap.querySelectorAll(".mj-tab");

  tabs.forEach((tab) => {
    tab.onclick = async () => {
      const target = tab.dataset.tab;

      const protectedTabs = ["profile", "interviews", "qna", "review"];
      if (protectedTabs.includes(target) && !isAccepted) {
        alert("전공자 인증이 완료된 후에 이용 가능합니다.");
        return;
      }

      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");

      await withOverlayLoading(
        async () => {
          await loadTabData(target, contentArea, user);
        },
        { text: "데이터를 불러오는 중..." }
      );
    };
  });

  const initialTab = isAccepted ? "profile" : "request";

  // 초기 로드: 인증됨 -> 프로필, 그 외 -> 인증 현황
  await withOverlayLoading(
    async () => {
      await loadTabData(initialTab, contentArea, user);
    },
    { text: "정보를 불러오고 있습니다..." }
  );
}

async function loadTabData(tab, container, user, isMore = false) {
  try {
    const size = 10;
    // 페이지 번호 관리
    if (isMore) pageState[tab]++;
    else pageState[tab] = 0;

    const page = pageState[tab];
    // 기본 파라미터 설정
    const params = new URLSearchParams({
      page: page,
      size: size,
    });

    if (tab === "profile") {
      const res = await api.get("/major-profiles/me");
      if (res.success && res.data) renderViewMode(container, res.data, user);
      else renderEditMode(container, null, user);
    } else if (tab === "request") {
      const res = await api.get("/major-requests/me");
      renderRequestDetail(container, res.data);
    } else {
      let endpoint = "";

      if (tab === "interviews") {
        endpoint = "/members/me/interviews";
        params.append("type", "RECEIVED"); // 백엔드 필수 파라미터
        params.append("sort", "CREATED_AT_DESC");
      } else if (tab === "review") {
        // 기존 엔드포인트 유지 혹은 변경된 구조에 맞춰 수정
        endpoint = `/members/me/reviews`;
        params.append("type", "RECEIVED");
      } else if (tab === "qna") {
        endpoint = `/majors/${user.memberId}/qna`;
      }

      // 최종 URL 조립: endpoint?page=0&size=10&type=RECEIVED...
      const res = await api.get(`${endpoint}?${params.toString()}`);

      const renderMap = {
        interviews: renderReceivedInterviews,
        review: renderReceivedReviews,
        qna: renderMajorQnaList,
      };

      renderMap[tab](
        container,
        {
          items: res.data,
          meta: res.meta,
        },
        user,
        isMore
      );
    }
  } catch (err) {
    console.error("데이터 로드 에러:", err);
    if (!isMore)
      container.innerHTML = `<div class="mj-error">데이터를 불러오지 못했습니다.</div>`;
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
    await withOverlayLoading(
      async () => {
        try {
          const res = await api.patch("/major-profiles/status");
          if (res.success) {
            const newStatus = !profile.active;
            renderViewMode(container, { ...profile, active: newStatus }, user);
            showOverlayCheck({
              text: newStatus
                ? "공개로 전환되었습니다."
                : "비공개로 전환되었습니다.",
              durationMs: 800,
            });
          }
        } catch (err) {
          alert("상태 변경 중 오류가 발생했습니다.");
        }
      },
      { text: "상태 변경 중..." }
    );
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

      await withOverlayLoading(
        async () => {
          try {
            const res = profile
              ? await api.patch("/major-profiles", payload)
              : await api.post("/major-profiles", payload);

            if (res.success) {
              showOverlayCheck({
                text: "프로필이 저장되었습니다!",
                durationMs: 1000,
              });
              // 저장 후 1초 뒤에 뷰 모드로 전환하거나 새로고침
              setTimeout(() => location.reload(), 1000);
            }
          } catch (err) {
            alert("저장 중 오류가 발생했습니다.");
          }
        },
        { text: "프로필 정보를 저장하고 있습니다..." }
      );
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

function renderReceivedInterviews(container, pageData, user, isMore = false) {
  const items = pageData?.items || [];
  const meta = pageData?.meta || {};
  const totalCount = meta.totalElements || 0;
  const isLast = meta.last;

  if (!isMore) {
    container.innerHTML = `
      <div class="mj-interview-list">
        <div class="mj-list-header">
          <span class="mj-list-count">나에게 온 인터뷰 요청 총 <strong class="mj-text-highlight">${totalCount}</strong>건</span>
        </div>
        <div id="interviewItems"></div>
        <div id="moreBtnArea" class="mj-more-area" style="text-align:center; margin-top:20px;"></div>
      </div>
    `;
  }

  if (items.length === 0 && !isMore) {
    container.innerHTML = `<div class="mj-card mj-empty-card"><p>신청 내역이 없습니다.</p></div>`;
    return;
  }

  const listArea = container.querySelector("#interviewItems");

  items.forEach((item) => {
    const { status, createdAt, interview, interviewId, peer } = item;
    const card = document.createElement("div");
    card.className = "mj-card mj-card--interview-accordion pg-theme"; // 파스텔 그린 테마 클래스

    const statusMap = {
      PENDING: { label: "신규 요청", class: "pg-badge--pending" },
      ACCEPTED: { label: "수락함", class: "pg-badge--accepted" },
      REJECTED: { label: "거절함", class: "pg-badge--rejected" },
      COMPLETED: { label: "진행 완료", class: "pg-badge--completed" },
    };
    const currentStatus = statusMap[status] || { label: status, class: "" };

    const dateStr = createdAt
      ? new Date(createdAt).toLocaleDateString("ko-KR")
      : "-";
    const preferredDate = interview?.preferredDatetime
      ? new Date(interview.preferredDatetime).toLocaleString("ko-KR", {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    card.innerHTML = `
      <div class="mj-interview-summary">
        <div class="mj-summary-top">
          <div class="mj-student-profile">
            <div class="mj-student-avatar" style="background-image: url('${
              peer?.profileImageUrl || ""
            }');">
              ${!peer?.profileImageUrl ? "👤" : ""}
            </div>
            <div class="mj-student-meta">
              <span class="mj-student-nick">${escapeHtml(
                peer?.nickname || "-"
              )}</span>
              <span class="mj-student-univ">${escapeHtml(
                peer?.university || "-"
              )} · ${escapeHtml(peer?.major || "-")}</span>
            </div>
          </div>
          <span class="mj-info__badge ${currentStatus.class}">${
      currentStatus.label
    }</span>
        </div>
        
        <div class="mj-summary-body">
          <p class="mj-summary-title">"${escapeHtml(
            interview?.title || "제목 없음"
          )}"</p>
          <span class="mj-summary-date">${dateStr}</span>
        </div>

        <div class="mj-accordion-arrow-bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      <div class="mj-interview-detail" style="display: none;">
        <div class="mj-detail-divider"></div>
        
        <div class="mj-detail-section">
          <label>📝 인터뷰 신청 상세 내용</label>
          <div class="mj-detail-text">
            ${
              interview?.content
                ? escapeHtml(interview.content).replace(/\n/g, "<br>")
                : "상세 내용이 없습니다."
            }
          </div>
        </div>

        <div class="mj-detail-grid">
          <div class="mj-detail-section">
            <label>💬 진행 방식</label>
            <div class="mj-method-tag">${escapeHtml(
              interview?.interviewMethod || "미지정"
            )}</div>
          </div>
          <div class="mj-detail-section">
            <label>📅 희망 시간</label>
            <div class="mj-time-display">${preferredDate}</div>
          </div>
        </div>

        ${
          status === "PENDING"
            ? `
          <div class="mj-response-area">
            <textarea class="mj-response-input" placeholder="학생에게 수락/거절 메시지를 남겨주세요."></textarea>
            <div class="mj-item-actions">
              <button class="mj-btn-pg mj-btn-pg--accept">수락하기</button>
              <button class="mj-btn-pg mj-btn-pg--reject">거절</button>
            </div>
          </div>
        `
            : ""
        }

        ${
          status === "ACCEPTED"
            ? `
          <div class="mj-item-actions" style="margin-top: 15px;">
            <button class="mj-btn-pg mj-btn-pg--complete" style="width:100%;">인터뷰 진행 완료</button>
          </div>
        `
            : ""
        }
      </div>
    `;

    // 토글 및 버튼 이벤트 로직은 이전과 동일 (e.stopPropagation() 포함)
    const summary = card.querySelector(".mj-interview-summary");
    const detail = card.querySelector(".mj-interview-detail");
    summary.onclick = () => {
      const isOpen = detail.style.display === "block";
      detail.style.display = isOpen ? "none" : "block";
      card.classList.toggle("is-open", !isOpen);
    };

    if (status === "PENDING") {
      const msgInput = card.querySelector(".mj-response-input");
      card.querySelector(".mj-btn-pg--accept").onclick = (e) => {
        e.stopPropagation();
        handleInterviewStatus(interviewId, "ACCEPTED", msgInput?.value || "");
      };
      card.querySelector(".mj-btn-pg--reject").onclick = (e) => {
        e.stopPropagation();
        handleInterviewStatus(interviewId, "REJECTED", msgInput?.value || "");
      };
    } else if (status === "ACCEPTED") {
      card.querySelector(".mj-btn-pg--complete").onclick = (e) => {
        e.stopPropagation();
        handleInterviewStatus(interviewId, "COMPLETED");
      };
    }

    listArea.appendChild(card);
  });

  moreBtnArea.innerHTML = ""; // 기존 버튼 제거
  if (!isLast) {
    const moreBtn = document.createElement("button");
    moreBtn.className = "mj-btn mj-btn--ghost";
    moreBtn.textContent = "더보기 ↓";
    moreBtn.onclick = () => loadTabData("interviews", container, user, true);
    moreBtnArea.appendChild(moreBtn);
  }
}

// 인터뷰 상태 변경 처리 함수 (메시지 인자 추가)
async function handleInterviewStatus(interviewId, newStatus, message = "") {
  if (!interviewId) {
    alert("인터뷰 ID가 없어 처리할 수 없습니다.");
    return;
  }

  const actionText =
    { ACCEPTED: "수락", REJECTED: "거절", COMPLETED: "완료" }[newStatus] ||
    "처리";

  if (newStatus === "ACCEPTED" || newStatus === "REJECTED") {
    if (!String(message || "").trim()) {
      alert("메시지를 입력해 주세요.");
      return;
    }
  }

  const confirmMsg =
    newStatus === "COMPLETED"
      ? "실제로 인터뷰를 완료하셨나요?\n완료 후에는 상태 변경이 불가능합니다."
      : `이 인터뷰 요청을 ${actionText}하시겠습니까?`;

  if (!confirm(confirmMsg)) return;

  await withOverlayLoading(
    async () => {
      try {
        const res = await api.patch(`/interviews/${interviewId}/status`, {
          majorMessage: message.trim(),
          status: newStatus,
        });

        if (res.success) {
          showOverlayCheck({
            text: `${actionText} 처리가 완료되었습니다.`,
            durationMs: 800,
          });

          setTimeout(() => {
            const interviewTabBtn = document.querySelector(
              '.mj-tab[data-tab="interviews"]'
            );
            if (interviewTabBtn) interviewTabBtn.click();
          }, 800);
        }
      } catch (err) {
        console.log(err.message);
        alert("서버 통신 오류가 발생했습니다.");
      }
    },
    { text: "처리 중입니다..." }
  );
}

function renderReceivedReviews(container, pageData, user, isMore = false) {
  const items = pageData?.items || []; // res.data 부분
  const meta = pageData?.meta || {}; // res.meta 부분
  const totalCount = meta.totalElements || 0;
  const isLast = meta.last;

  if (!isMore) {
    container.innerHTML = `
    <div class="mj-review-list">
      <div class="mj-list-header">
        <span class="mj-list-count">학생들의 소중한 후기 <strong>${totalCount}</strong>건</span>
      </div>
      <div id="reviewItems"></div>
      <div id="moreBtnArea" class="mj-more-area" style="text-align:center; margin-top:20px;"></div>
    </div>
  `;
  }

  if (items.length === 0) {
    container.innerHTML = `<div class="mj-card mj-empty-card"><p>후기가 없습니다.</p></div>`;
    return;
  }

  const listArea = container.querySelector("#reviewItems");
  const moreBtnArea = container.querySelector("#moreBtnArea");

  items.forEach((item) => {
    const { peer, review, createdAt } = item;
    const card = document.createElement("div");
    card.className = "mj-card mj-card--review";

    const rating = Number(review?.rating) || 0;
    const stars = "⭐".repeat(Math.max(0, Math.min(5, rating)));

    const dateStr = createdAt
      ? new Date(createdAt).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "-";

    const profileImageUrl = String(peer?.profileImageUrl || "").trim();
    const nickname = String(peer?.nickname || "-");
    const university = String(peer?.university || "-");
    const major = String(peer?.major || "-");
    const content = String(review?.content || "");

    card.innerHTML = `
      <div class="mj-review-item">
        <div class="mj-review-top">
          <div class="mj-review-student">
            <div class="mj-student-avatar" style="background-image: url('${
              peer.profileImageUrl || ""
            }');">
            </div>
            <div class="mj-student-meta">
              <span class="mj-student-nick">${escapeHtml(nickname)}</span>
              <span class="mj-student-univ">${escapeHtml(
                university
              )} · ${escapeHtml(major)}</span>
            </div>
          </div>
          <span class="mj-review-date">${escapeHtml(dateStr)}</span>
        </div>

        <div class="mj-review-body">
          <div class="mj-rating-box">${stars} <span class="mj-rating-num">${Math.max(
      0,
      Math.min(5, rating)
    )}.0</span></div>
          <p class="mj-review-text">"${escapeHtml(content)}"</p>
        </div>
      </div>
    `;

    listArea.appendChild(card);
  });

  moreBtnArea.innerHTML = ""; // 기존 버튼 제거
  if (!isLast) {
    const moreBtn = document.createElement("button");
    moreBtn.className = "mj-btn mj-btn--ghost";
    moreBtn.textContent = "질문 더보기 ↓";
    moreBtn.onclick = () => loadTabData("review", container, user, true);
    moreBtnArea.appendChild(moreBtn);
  }
}

function renderMajorQnaList(container, pageData, user, isMore = false) {
  const items = pageData?.items || [];
  const meta = pageData?.meta || {};
  const totalCount = meta.totalElements || 0;
  const isLast = meta.last;

  if (!isMore) {
    if (!items || items.length === 0) {
      container.innerHTML = `
      <div class="mj-card mj-empty-card">
        <p class="mj-empty-msg">아직 등록된 질문이 없습니다.</p>
      </div>`;
      return;
    }

    container.innerHTML = `
    <div class="mj-qna-list">
      <div class="mj-list-header">
        <span class="mj-list-count">받은 질문 총 <strong class="mj-text-highlight">${totalCount}</strong>건</span>
      </div>
      <div id="qnaItems"></div>
      <div id="moreBtnArea" class="mj-more-area" style="text-align:center; margin-top:20px;"></div>
    </div>
  `;
  }

  const listArea = container.querySelector("#qnaItems");

  items.forEach((item) => {
    // 백엔드 데이터 구조에 맞춰 변수 추출 수정
    // item.question, item.answer, item.student 객체에서 가져옴
    const qId = item.questionId;
    const studentNick = item.student?.nickname || "익명";
    const qContent = item.question?.content || "";
    const aContent = item.answer?.content || "";
    const createdAt = item.question?.createdAt || item.createdAt;

    // 답변 여부: answer 객체가 존재하고 그 안에 content가 있는지 확인
    const isAnswered = !!(item.answer && item.answer.content);

    const card = document.createElement("div");
    card.className = `mj-card mj-card--qna-accordion pg-theme ${
      isAnswered ? "is-answered" : ""
    }`;

    // 미리보기 텍스트 처리 (에러 방지용 safeContent 적용)
    const previewText = qContent.substring(0, 40);
    const ellipsis = qContent.length > 40 ? "..." : "";

    card.innerHTML = `
      <div class="mj-qna-summary">
        <div class="mj-summary-top">
          <div class="mj-student-profile">
            <div class="mj-student-avatar" style="background-image: url('${
              item.student?.profileImageUrl || ""
            }');">
              ${!item.student?.profileImageUrl ? "👤" : ""}
            </div>
            <div class="mj-student-meta">
              <span class="mj-student-nick">${escapeHtml(
                studentNick
              )} 학생의 질문</span>
              <span class="mj-summary-date">${
                createdAt ? new Date(createdAt).toLocaleDateString() : "-"
              }</span>
            </div>
          </div>
          <span class="mj-info__badge ${
            isAnswered ? "pg-badge--accepted" : "pg-badge--pending"
          }">
            ${isAnswered ? "답변완료" : "답변대기"}
          </span>
        </div>
        
        <div class="mj-summary-body">
          <p class="mj-qna-preview">"${escapeHtml(previewText)}${ellipsis}"</p>
        </div>

        <div class="mj-accordion-arrow-bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      <div class="mj-qna-detail" style="display: none;">
        <div class="mj-detail-divider"></div>
        
        <div class="mj-detail-section">
          <label>❓ 질문 상세 내용</label>
          <div class="mj-detail-text">
            ${escapeHtml(qContent).replace(/\n/g, "<br>")}
          </div>
        </div>

        <div class="mj-qna-answer-section" id="answerArea-${qId}">
          <label>✅ 나의 답변</label>
          ${
            isAnswered
              ? `
                <div class="mj-detail-text mj-answer-text">
                  ${escapeHtml(aContent).replace(/\n/g, "<br>")}
                </div>
                <div class="mj-item-actions">
                   <button class="mj-btn-text" id="editAnsBtn-${qId}">답변 수정하기</button>
                </div>`
              : `
                <div class="mj-item-actions">
                   <button class="mj-btn-pg mj-btn-pg--accept" style="width:100%" id="writeAnsBtn-${qId}">답변 작성하기</button>
                </div>`
          }
        </div>
      </div>
    `;

    // 토글 이벤트
    const summary = card.querySelector(".mj-qna-summary");
    const detail = card.querySelector(".mj-qna-detail");
    summary.onclick = () => {
      const isOpen = detail.style.display === "block";
      detail.style.display = isOpen ? "none" : "block";
      card.classList.toggle("is-open", !isOpen);
    };

    // 버튼 이벤트
    const actionBtn = isAnswered
      ? card.querySelector(`#editAnsBtn-${qId}`)
      : card.querySelector(`#writeAnsBtn-${qId}`);

    if (actionBtn) {
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        renderAnswerForm(qId, isAnswered ? aContent : "", container);
      };
    }

    listArea.appendChild(card);
  });

  // 더보기 버튼 영역
  const moreBtnArea = container.querySelector("#moreBtnArea");
  if (moreBtnArea) {
    moreBtnArea.innerHTML = "";
    if (!isLast) {
      const moreBtn = document.createElement("button");
      moreBtn.className = "mj-btn mj-btn--ghost";
      moreBtn.textContent = "질문 더보기 ↓";
      moreBtn.onclick = () => loadTabData("qna", container, user, true);
      moreBtnArea.appendChild(moreBtn);
    }
  }
}

function renderAnswerForm(qnaId, existingAnswer, container) {
  const answerArea = container.querySelector(`#answerArea-${qnaId}`);
  const isEdit = !!existingAnswer;

  answerArea.innerHTML = `
    <div class="mj-answer-form" style="margin-top:10px;">
      <label>${isEdit ? "답변 수정" : "답변 작성"}</label>
      <textarea class="mj-textarea" id="ansInput-${qnaId}" rows="4" placeholder="학생에게 도움이 될 상세한 답변을 남겨주세요.">${
    existingAnswer || ""
  }</textarea>
      <div class="mj-form-actions">
        <button class="mj-btn-text" id="cancelAnsBtn-${qnaId}">취소</button>
        <button class="mj-btn-pg mj-btn-pg--accept" id="saveAnsBtn-${qnaId}">${
    isEdit ? "수정완료" : "답변등록"
  }</button>
      </div>
    </div>
  `;

  answerArea.querySelector(`#cancelAnsBtn-${qnaId}`).onclick = (e) => {
    e.stopPropagation();
    // 새로고침 없이 탭 다시 클릭 효과
    document.querySelector('.mj-tab[data-tab="qna"]').click();
  };

  answerArea.querySelector(`#saveAnsBtn-${qnaId}`).onclick = async (e) => {
    e.stopPropagation();
    const content = document.getElementById(`ansInput-${qnaId}`).value.trim();
    if (!content) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    await withOverlayLoading(
      async () => {
        try {
          const res = await api.post(`/questions/${qnaId}/answer`, { content });
          if (res.success) {
            showOverlayCheck({
              text: "답변이 저장되었습니다.",
              durationMs: 800,
            });
            setTimeout(
              () => document.querySelector('.mj-tab[data-tab="qna"]').click(),
              800
            );
          }
        } catch (err) {
          alert("답변 저장 중 오류가 발생했습니다.");
        }
      },
      { text: "답변 저장 중..." }
    );
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
