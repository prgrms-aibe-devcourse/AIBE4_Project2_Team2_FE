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
        !isAccepted ? "is-active" : ""
      }" data-tab="request">인증 현황</button>
      <button class="mj-tab ${
        isAccepted ? "" : "is-disabled"
      }" data-tab="interviews">받은 인터뷰</button>
      <button class="mj-tab ${
        isAccepted ? "" : "is-disabled"
      }" data-tab="qna">Q&A 관리</button>
      <button class="mj-tab ${
        isAccepted ? "" : "is-disabled"
      }" data-tab="review">리뷰</button>
    </nav>

    <div id="contentArea" class="mj-content-wrapper"></div>
  `;

  root.appendChild(wrap);
  const contentArea = wrap.querySelector("#contentArea");
  const tabs = wrap.querySelectorAll(".mj-tab");

  tabs.forEach((tab) => {
    tab.onclick = async () => {
      const target = tab.dataset.tab;

      // [핵심 로직] 인증된 경우만 프로필 탭 접근 허용
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

async function loadTabData(tab, container, user) {
  try {
    if (tab === "profile") {
      const res = await api.get("/major-profiles/me");
      if (res.success && res.data) renderViewMode(container, res.data, user);
      else renderEditMode(container, null, user);
    } else if (tab === "request") {
      const res = await api.get("/major-requests/me");
      renderRequestDetail(container, res.data);
    } else if (tab === "interviews") {
      // type은 Enum 바인딩 안정성을 위해 대문자 권장
      const res = await api.get(`/members/me/interviews?type=RECEIVED`);
      renderReceivedInterviews(container, res.data || []);
    } else if (tab === "review") {
      const res = await api.get(`/members/me/reviews?type=RECEIVED`);
      renderReceivedReviews(container, res.data || []);
    } else {
      container.innerHTML = `<div class="mj-empty-box">준비 중인 서비스입니다.</div>`;
    }
  } catch (err) {
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

function renderReceivedInterviews(container, interviews) {
  if (!interviews || interviews.length === 0) {
    container.innerHTML = `
      <div class="mj-card mj-empty-card">
        <p class="mj-empty-msg">아직 들어온 인터뷰 신청이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="mj-interview-list">
      <div class="mj-list-header" style="margin-bottom: 16px;">
        <span class="mj-list-count">나에게 온 요청 총 <strong>${interviews.length}</strong>건</span>
      </div>
      <div id="interviewItems"></div>
    </div>
  `;

  const listArea = container.querySelector("#interviewItems");

  interviews.forEach((item) => {
    const interviewId = item?.interviewId; // 루트에 존재
    const status = item?.status;
    const createdAt = item?.createdAt;

    const interview = item?.interview || {};
    const student = item?.peer || {}; // 기존 student가 아니라 peer로 옴(viewType=RECEIVED에서 peer는 학생)

    const card = document.createElement("div");
    card.className = "mj-card mj-card--interview";

    const statusMap = {
      PENDING: { label: "신규 요청", class: "mj-badge--pending" },
      ACCEPTED: { label: "수락함", class: "mj-badge--accepted" },
      REJECTED: { label: "거절함", class: "mj-badge--rejected" },
      COMPLETED: { label: "진행 완료", class: "mj-badge--none" },
    };
    const currentStatus = statusMap[status] || { label: status, class: "" };

    const preferredDate = interview?.preferredDatetime
      ? new Date(interview.preferredDatetime).toLocaleString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-";

    card.innerHTML = `
      <div class="mj-interview-item">
        <div class="mj-item-top">
          <span class="mj-info__badge ${currentStatus.class}">${
      currentStatus.label
    }</span>
          <span class="mj-item-date">신청일: ${
            createdAt ? new Date(createdAt).toLocaleDateString() : "-"
          }</span>
        </div>

        <div class="mj-item-mid">
          <div class="mj-student-info">
            <strong>${student?.nickname ?? "-"}</strong>
            <span class="mj-sub-text">${student?.university ?? "-"}</span>
          </div>
          <p class="mj-item-title">${interview?.title ?? "-"}</p>
          <div class="mj-time-box">
            <p class="mj-time-label">📅 인터뷰 희망 시간</p>
            <p class="mj-time-value">${preferredDate}</p>
          </div>
        </div>

        ${
          status === "PENDING"
            ? `
              <div class="mj-response-area">
                <textarea class="mj-response-input" placeholder="학생에게 메시지를 남겨주세요."></textarea>
                <div class="mj-item-actions">
                  <button class="mj-btn-mm mj-btn-mm--accept">인터뷰 수락</button>
                  <button class="mj-btn-mm mj-btn-mm--reject">거절</button>
                </div>
              </div>
            `
            : ""
        }

        ${
          status === "ACCEPTED"
            ? `
              <div class="mj-item-actions" style="margin-top: 12px;">
                <button class="mj-btn-mm mj-btn-mm--complete" style="width: 100%; background: var(--pastel-green-strong); color: var(--dark-text);">
                  인터뷰 진행 완료
                </button>
              </div>
            `
            : ""
        }
      </div>
    `;

    if (status === "PENDING") {
      const msgInput = card.querySelector(".mj-response-input");

      card.querySelector(".mj-btn-mm--accept").onclick = () =>
        handleInterviewStatus(interviewId, "ACCEPTED", msgInput?.value ?? "");

      card.querySelector(".mj-btn-mm--reject").onclick = () =>
        handleInterviewStatus(interviewId, "REJECTED", msgInput?.value ?? "");
    } else if (status === "ACCEPTED") {
      card.querySelector(".mj-btn-mm--complete").onclick = () =>
        handleInterviewStatus(interviewId, "COMPLETED");
    }

    listArea.appendChild(card);
  });
}

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
        // 서버의 updateStatus(memberId, interviewId, request) 전제에 맞춤
        const id = encodeURIComponent(String(interviewId));
        const res = await api.patch(`/interviews/${id}/status`, {
          status: newStatus,
          majorMessage: message,
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
        alert("서버 통신 오류가 발생했습니다.");
      }
    },
    { text: "처리 중입니다..." }
  );
}

function renderReceivedReviews(container, reviews) {
  const items = Array.isArray(reviews) ? reviews : [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="mj-card mj-empty-card">
        <p class="mj-empty-msg">아직 작성된 인터뷰 리뷰가 없습니다.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="mj-review-list">
      <div class="mj-list-header" style="margin-bottom: 16px;">
        <span class="mj-list-count">학생들의 소중한 후기 <strong>${items.length}</strong>건</span>
      </div>
      <div id="reviewItems"></div>
    </div>
  `;

  const listArea = container.querySelector("#reviewItems");
  if (!listArea) return;

  items.forEach((item) => {
    const peer = item?.peer || {}; // 학생 정보(Received면 학생)
    const review = item?.review || {};
    const createdAt = item?.createdAt;

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
            <div class="mj-student-avatar" style="${
              profileImageUrl
                ? `background-image:url('${profileImageUrl}')`
                : ""
            }">
              ${!profileImageUrl ? "👤" : ""}
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

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
