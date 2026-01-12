import { navigate } from "../router.js";
import { api } from "../services/api.js";

export async function renderMyMajorProfile(root) {
  const wrap = document.createElement("div");
  wrap.className = "my-profile-wrap";

  wrap.innerHTML = `
    <h2 class="page-title">내 전공자 프로필</h2>
    <div id="contentArea">
      <div class="loading">불러오는 중...</div>
    </div>
  `;

  root.appendChild(wrap);
  const contentArea = wrap.querySelector("#contentArea");

  try {
    const result = await api.get("/major-profiles/me");

    if (result?.success) {
      const profile = result.data;

      if (profile) {
        // 프로필 있음 -> 조회 모드
        renderViewMode(contentArea, profile);
      } else {
        // 프로필 없음 -> 생성 모드 (폼 바로 노출)
        renderEditMode(contentArea, null);
      }
    } else {
      // 에러 처리
      contentArea.innerHTML = `<div class="error">불러오기 실패: ${result?.message || ""}</div>`;
    }
  } catch (error) {
    console.error(error);
    contentArea.innerHTML = `<div class="error">서버 오류</div>`;
  }
}

// 1. 조회 모드 (View Mode)
function renderViewMode(container, profile) {
  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <div class="header-left">
          <span class="university-badge">${profile.university} ${profile.major}</span>
          <h3 class="profile-title">${profile.title}</h3>
        </div>
        <div class="header-right">
          <label class="switch">
            <input type="checkbox" id="activeToggle" ${profile.isActive ? "checked" : ""}>
            <span class="slider round"></span>
          </label>
          <span class="status-text">${profile.isActive ? "공개중" : "비공개"}</span>
        </div>
      </div>

      <div class="profile-content">
        ${profile.content.replace(/\n/g, "<br>")}
      </div>

      <div class="profile-tags">
        ${profile.tags.map(tag => `<span class="tag">#${tag}</span>`).join("")}
      </div>

      <div class="profile-actions">
        <button class="btn-edit" id="editBtn">수정하기</button>
        <button class="btn-back" id="backBtn">메인으로</button>
      </div>
    </div>
  `;

  // 수정 버튼 -> 편집 모드로 전환
  container.querySelector("#editBtn").addEventListener("click", () => {
    renderEditMode(container, profile);
  });

  container.querySelector("#backBtn").addEventListener("click", () => navigate("/"));

  // 토글 이벤트
  const toggle = container.querySelector("#activeToggle");
  const statusText = container.querySelector(".status-text");
  
  toggle.addEventListener("change", async (e) => {
    const isActive = e.target.checked;
    statusText.textContent = isActive ? "공개중" : "비공개";
    try {
      await api.patch("/major-profiles/status");
    } catch (err) {
      alert("상태 변경 실패");
      e.target.checked = !isActive;
    }
  });
}

// 2. 편집 모드 (Edit Mode - 생성/수정 공용)
function renderEditMode(container, profile) {
  const isEdit = !!profile; // profile이 있으면 수정 모드

  container.innerHTML = `
    <div class="edit-container">
      <h3 class="section-title">${isEdit ? "프로필 수정" : "프로필 생성"}</h3>
      <form id="editForm" class="edit-form">
        <div class="form-group">
          <label class="form-label">한 줄 소개</label>
          <input class="form-input" id="title" value="${isEdit ? profile.title : ""}" placeholder="예: 컴퓨터공학과 멘토입니다." required />
        </div>

        <div class="form-group">
          <label class="form-label">상세 소개</label>
          <textarea class="form-textarea" id="content" rows="8" required>${isEdit ? profile.content : ""}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">태그</label>
          <div class="tag-input-box">
            <input class="form-input" id="tagInput" placeholder="태그 입력 후 엔터" />
            <button type="button" class="btn-add" id="addTagBtn">추가</button>
          </div>
          <div class="tags-list" id="tagsList"></div>
        </div>

        <div class="btn-row">
          <button type="submit" class="btn-submit">${isEdit ? "수정 완료" : "생성하기"}</button>
          ${isEdit ? `<button type="button" class="btn-cancel" id="cancelEditBtn">취소</button>` : ""}
        </div>
      </form>
    </div>
  `;

  // 태그 관리 로직
  let tags = isEdit ? [...profile.tags] : [];
  const tagsList = container.querySelector("#tagsList");
  const tagInput = container.querySelector("#tagInput");

  function renderTags() {
    tagsList.innerHTML = tags.map((tag, idx) => `
      <span class="tag-item">#${tag} <button type="button" data-idx="${idx}" class="btn-rm">×</button></span>
    `).join("");
    
    tagsList.querySelectorAll(".btn-rm").forEach(btn => {
      btn.addEventListener("click", (e) => {
        tags.splice(e.target.dataset.idx, 1);
        renderTags();
      });
    });
  }
  renderTags();

  container.querySelector("#addTagBtn").addEventListener("click", () => {
    const val = tagInput.value.trim();
    if(val && !tags.includes(val)) { tags.push(val); renderTags(); tagInput.value=""; }
  });

  tagInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter") { e.preventDefault(); container.querySelector("#addTagBtn").click(); }
  });

  // 취소 버튼 (수정 모드일 때만)
  if (isEdit) {
    container.querySelector("#cancelEditBtn").addEventListener("click", () => {
      renderViewMode(container, profile); // 다시 조회 모드로 복귀
    });
  }

  // 폼 제출
  container.querySelector("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: container.querySelector("#title").value,
      content: container.querySelector("#content").value,
      tags: tags
    };

    try {
      const result = isEdit
        ? await api.patch("/major-profiles", payload)
        : await api.post("/major-profiles", payload);

      if (result?.success) {
        alert(isEdit ? "수정되었습니다." : "생성되었습니다.");
        location.reload();
      } else {
        alert("저장 실패: " + (result?.message || ""));
      }
    } catch (err) {
      console.error(err);
      alert("오류 발생");
    }
  });
}