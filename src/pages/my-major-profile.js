import { navigate } from "../router.js";
import { api } from "../services/api.js";
import { getSession } from "../auth/auth.js"; // 세션 가져오기

export async function renderMyMajorProfile(root) {
  // 로컬 스토리지 데이터 가져오기
  const session = getSession();
  const user = session?.user;

  const wrap = document.createElement("div");
  wrap.className = "my-profile-wrap";

  // 상단 유저 기본 정보 바 보강
  wrap.innerHTML = `
    <div class="profile-page-header">
      <div class="title-section">
        <h2 class="page-title">내 전공자 프로필</h2>
        <p class="page-subtitle">인증된 전공자 정보를 관리하고 업데이트하세요.</p>
      </div>
      
      ${
        user
          ? `
        <div class="user-info-card">
          <div class="profile-avatar-wrapper">
        <div class="main-avatar" style="background-image: url('${
          user.profileImageUrl || ""
        }');">
          ${
            !user.profileImageUrl || user.profileImageUrl === ""
            ? `<span class="avatar-placeholder">👤</span>`
            : ""
          }
            </div>
          </div>

          <div class="profile-details">
            <div class="name-row">
              <h3 class="user-name">${user.name}</h3>
              <span class="user-nickname">@${user.nickname}</span>
            </div>
            
            <div class="info-badges">
              <div class="info-item">
                <span class="info-label">소속 학교</span>
                <span class="info-value badge-university">${
                  user.university
                }</span>
              </div>
              <div class="info-item">
                <span class="info-label">전공 학과</span>
                <span class="info-value badge-major">${user.major}</span>
              </div>
            </div>
          </div>
        </div>
      `
          : ""
      }
    </div>

    <div id="contentArea" class="content-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>프로필 정보를 불러오는 중입니다...</p>
      </div>
    </div>
  `;

  root.appendChild(wrap);
  const contentArea = wrap.querySelector("#contentArea");

  if (!user) {
    alert("로그인이 필요합니다.");
    navigate("/login");
    return;
  }

  try {
    const result = await api.get("/major-profiles/me");

    if (result?.success) {
      const profile = result.data;
      if (profile) {
        renderViewMode(contentArea, profile, user);
      } else {
        // 프로필이 없는 경우 유저 데이터를 생성 폼으로 전달
        renderEditMode(contentArea, null, user);
      }
    } else {
      contentArea.innerHTML = `<div class="error">불러오기 실패: ${
        result?.message || ""
      }</div>`;
    }
  } catch (error) {
    console.error(error);
    contentArea.innerHTML = `<div class="error">서버 오류가 발생했습니다.</div>`;
  }
}

function renderViewMode(container, profile, user) {
  container.innerHTML = `
    <div class="profile-card content-card">
      <div class="card-status-layer">
        <div class="status-indicator">
          <span class="status-dot ${
            profile.isActive ? "active" : "inactive"
          }"></span>
          <span class="status-label">${
            profile.isActive ? "현재 공개 중" : "현재 비공개"
          }</span>
        </div>
        <div class="toggle-wrapper">
          <label class="switch">
            <input type="checkbox" id="activeToggle" ${
              profile.isActive ? "checked" : ""
            }>
            <span class="slider round"></span>
          </label>
        </div>
      </div>

      <div class="card-main-content">
        <h3 class="profile-display-title">
          <span class="quote-icon">"</span>
          ${profile.title}
          <span class="quote-icon">"</span>
        </h3>
        
        <div class="profile-description">
          ${
            profile.content
              ? profile.content.replace(/\n/g, "<br>")
              : "등록된 상세 소개 내용이 없습니다."
          }
        </div>
      </div>

      <div class="card-footer-layer">
        <div class="tags-container">
          ${
            profile.tags && profile.tags.length > 0
              ? profile.tags
                  .map(
                    (tag) =>
                      `<span class="display-tag">${
                        tag.startsWith("#") ? tag : "#" + tag
                      }</span>`
                  )
                  .join("")
              : "<span class='no-tag'>#전공자 #인증완료</span>"
          }
        </div>
        
        <div class="action-buttons">
          <button class="btn-primary-outline" id="editBtn">
            <i class="icon-edit"></i> 프로필 수정하기
          </button>
          <button class="btn-ghost" id="backBtn">메인 화면으로</button>
        </div>
      </div>
    </div>
  `;

  // 이벤트 리스너 로직은 동일하게 유지
  container
    .querySelector("#editBtn")
    .addEventListener("click", () => renderEditMode(container, profile, user));
  container
    .querySelector("#backBtn")
    .addEventListener("click", () => navigate("/"));

  const toggle = container.querySelector("#activeToggle");
  const label = container.querySelector(".status-label");
  const dot = container.querySelector(".status-dot");

  toggle.addEventListener("change", async (e) => {
    const isActive = e.target.checked;
    label.textContent = isActive ? "현재 공개 중" : "현재 비공개";
    dot.className = `status-dot ${isActive ? "active" : "inactive"}`;
    try {
      await api.patch("/major-profiles/status", { isActive });
    } catch (err) {
      alert("상태 변경 실패");
      e.target.checked = !isActive;
      label.textContent = !isActive ? "현재 공개 중" : "현재 비공개";
      dot.className = `status-dot ${!isActive ? "active" : "inactive"}`;
    }
  });
}

function renderEditMode(container, profile, user) {
  const isEdit = !!profile;

  container.innerHTML = `
    <div class="profile-card edit-card">
      <div class="card-header-layer">
        <h3 class="edit-title">${
          isEdit ? "프로필 수정하기" : "새 프로필 생성하기"
        }</h3>
        <p class="edit-description">💡 ${
          user.name
        }님의 전공 지식과 경험이 잘 드러나도록 작성해주세요.</p>
      </div>

      <form id="editForm" class="edit-form-content">
        <div class="form-group">
          <label class="form-label">한 줄 소개</label>
          <div class="input-wrapper">
            <input class="form-input" id="title" 
              value="${
                isEdit
                  ? profile.title
                  : `${user.major} 전공자 ${user.name}입니다.`
              }" 
              placeholder="예: 컴퓨터공학과 취업 멘토입니다." required />
            <span class="input-focus-line"></span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">상세 소개</label>
          <div class="input-wrapper">
            <textarea class="form-textarea" id="content" rows="10" 
              placeholder="학생들에게 도움이 될 수 있는 구체적인 경험을 적어주세요." required>${
                isEdit ? profile.content : ""
              }</textarea>
            <span class="input-focus-line"></span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">전문 분야 태그 (최대 5개)</label>
          <div class="tag-input-container">
            <input class="form-input" id="tagInput" placeholder="태그 입력 후 엔터" />
            <button type="button" class="btn-add-tag" id="addTagBtn">추가</button>
          </div>
          <div class="tags-list" id="tagsList"></div>
        </div>

        <div class="edit-actions">
          <button type="submit" class="btn-save">${
            isEdit ? "변경사항 저장" : "프로필 등록"
          }</button>
          ${
            isEdit
              ? `<button type="button" class="btn-cancel-edit" id="cancelEditBtn">수정 취소</button>`
              : ""
          }
        </div>
      </form>
    </div>
  `;

  // --- 로직 부분 (태그 관리 및 이벤트) ---
  let tags = isEdit ? [...profile.tags] : [];
  const tagsList = container.querySelector("#tagsList");
  const tagInput = container.querySelector("#tagInput");

  function renderTags() {
    tagsList.innerHTML = tags
      .map((tag, idx) => {
        const displayTag = tag.startsWith("#") ? tag : `#${tag}`;
        return `
        <span class="edit-tag-item">
          ${displayTag} 
          <button type="button" data-idx="${idx}" class="btn-tag-remove">×</button>
        </span>
      `;
      })
      .join("");

    tagsList.querySelectorAll(".btn-tag-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        tags.splice(e.target.dataset.idx, 1);
        renderTags();
      });
    });
  }
  const addTag = () => {
    let val = tagInput.value.trim();
    if (!val) return;
    if (!val.startsWith("#")) val = `#${val}`;

    if (!tags.includes(val) && tags.length < 5) {
      tags.push(val);
      renderTags();
      tagInput.value = "";
    } else if (tags.length >= 5) {
      alert("태그는 최대 5개까지 등록 가능합니다.");
    }
    tagInput.focus();
  };

  container.querySelector("#addTagBtn").addEventListener("click", addTag);
  tagInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  });

  if (isEdit) {
    container.querySelector("#cancelEditBtn").addEventListener("click", () => {
      renderViewMode(container, profile, user);
    });
  }

  // 폼 제출 로직 (api 호출 부분은 기존과 동일)
  container.querySelector("#editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: container.querySelector("#title").value,
      content: container.querySelector("#content").value,
      tags: tags,
    };

    try {
      const result = isEdit
        ? await api.patch("/major-profiles", payload)
        : await api.post("/major-profiles", payload);

      if (result?.success) {
        alert(isEdit ? "프로필이 수정되었습니다." : "프로필이 생성되었습니다.");
        location.reload();
      } else {
        alert("저장 실패: " + (result?.message || ""));
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  });
}
