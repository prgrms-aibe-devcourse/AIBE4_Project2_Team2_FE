// src/pages/mypage/profile.js
/*
  마이페이지 프로필 탭 렌더링 및 이벤트 바인딩
  - state.me 기반 폼 렌더링 처리
  - 저장 시 클라이언트 검증 후 PATCH 요청 처리
  - 프로필 이미지 업로드/삭제 처리
  - 로컬/소셜 계정 구분에 따른 비밀번호 UI 및 검증 처리
  - 저장 성공 시 로컬 사용자 캐시(mm_user) 및 헤더 동기화 이벤트 발행 처리
*/

import { ApiError } from "../../../services/api.js";
import {
  showOverlayCheck,
  startOverlayLoading,
  endOverlayLoading,
} from "../../../utils/overlay.js";
import {
  validateProfileUpdate,
  getNicknameRuleMessage,
  getPasswordRuleMessage,
  getNewPasswordConfirmMessage,
} from "../utils/validation.js";
import { updateMe, uploadProfileImage, deleteProfileImage } from "../api.js";

const USER_KEY = "mm_user";

const STATUS_OPTIONS = [
  { value: "ENROLLED", label: "재학생" },
  { value: "GRADUATED", label: "졸업생" },
  { value: "HIGH_SCHOOL", label: "고등학생" },
  { value: "ETC", label: "기타" },
];

function isWishStatus(status) {
  return status === "HIGH_SCHOOL" || status === "ETC";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeUser(user) {
  try {
    if (!user) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

function dispatchUserUpdated(user) {
  try {
    window.dispatchEvent(
      new CustomEvent("mm:user-updated", { detail: { user } })
    );
  } catch {}
}

function applyAvatar(el, url) {
  if (!el) return;

  const u = String(url || "").trim();
  if (!u) {
    el.style.removeProperty("background-image");
    el.style.removeProperty("background-size");
    el.style.removeProperty("background-position");
    el.style.removeProperty("background-repeat");
    return;
  }

  el.style.backgroundImage = `url("${u}")`;
  el.style.backgroundSize = "cover";
  el.style.backgroundPosition = "center";
  el.style.backgroundRepeat = "no-repeat";
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message ? String(message) : "";
}

function setInvalid(id, on) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("is-invalid", Boolean(on));
}

function clearErrors() {
  const ids = [
    "err_form",
    "err_nickname",
    "err_status",
    "err_university",
    "err_major",
    "err_currentPassword",
    "err_newPassword",
    "err_newPasswordConfirm",
  ];
  for (const id of ids) setError(id, "");

  const inputs = [
    "nickname",
    "statusSelect",
    "university",
    "major",
    "currentPassword",
    "newPassword",
    "newPasswordConfirm",
  ];
  for (const id of inputs) setInvalid(id, false);
}

function applyValidationErrors(errData) {
  const map = {
    nickname: ["err_nickname", "nickname"],
    status: ["err_status", "statusSelect"],
    university: ["err_university", "university"],
    major: ["err_major", "major"],
    currentPassword: ["err_currentPassword", "currentPassword"],
    newPassword: ["err_newPassword", "newPassword"],
    newPasswordConfirm: ["err_newPasswordConfirm", "newPasswordConfirm"],
  };

  const msg =
    errData?.error?.message || errData?.message || "요청 값을 확인해 주세요.";

  const fieldErrors =
    errData?.error?.fieldErrors ||
    errData?.fieldErrors ||
    errData?.errors ||
    null;

  if (Array.isArray(fieldErrors)) {
    let applied = false;

    for (const fe of fieldErrors) {
      const field = String(fe?.field || fe?.name || "").trim();
      const message = String(fe?.message || "").trim();
      if (!field || !message) continue;

      const pair = map[field];
      if (!pair) continue;

      setError(pair[0], message);
      setInvalid(pair[1], true);
      applied = true;
    }

    if (!applied) setError("err_form", msg);
    return;
  }

  if (fieldErrors && typeof fieldErrors === "object") {
    let applied = false;

    for (const [field, message] of Object.entries(fieldErrors)) {
      const key = String(field || "").trim();
      const val = String(message || "").trim();
      if (!key || !val) continue;

      const pair = map[key];
      if (!pair) continue;

      setError(pair[0], val);
      setInvalid(pair[1], true);
      applied = true;
    }

    if (!applied) setError("err_form", msg);
    return;
  }

  const singleField =
    errData?.error?.field ||
    errData?.error?.target ||
    errData?.field ||
    errData?.target ||
    null;

  if (singleField) {
    const key = String(singleField).trim();
    const pair = map[key];
    if (pair) {
      setError(pair[0], msg);
      setInvalid(pair[1], true);
      return;
    }
  }

  setError("err_form", msg);
}

function applyClientFieldErrors(fieldErrors, fallbackMessage) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    const msg = fallbackMessage || "입력값을 확인해 주세요.";
    setError("err_nickname", msg);
    setInvalid("nickname", true);
    return;
  }

  const map = {
    nickname: ["err_nickname", "nickname"],
    status: ["err_status", "statusSelect"],
    university: ["err_university", "university"],
    major: ["err_major", "major"],
    currentPassword: ["err_currentPassword", "currentPassword"],
    newPassword: ["err_newPassword", "newPassword"],
    newPasswordConfirm: ["err_newPasswordConfirm", "newPasswordConfirm"],
  };

  let applied = false;

  for (const [field, message] of Object.entries(fieldErrors)) {
    const pair = map[field];
    if (!pair) continue;

    const msg = String(message || "").trim();
    if (!msg) continue;

    setError(pair[0], msg);
    setInvalid(pair[1], true);
    applied = true;
  }

  if (!applied) {
    const msg = fallbackMessage || "입력값을 확인해 주세요.";
    setError("err_nickname", msg);
    setInvalid("nickname", true);
  }
}

function syncWishLabels(status) {
  const uniLabel = document.getElementById("labelUniversity");
  const majorLabel = document.getElementById("labelMajor");

  const wish = isWishStatus(status);
  if (uniLabel) uniLabel.textContent = wish ? "희망 대학교" : "대학교";
  if (majorLabel) majorLabel.textContent = wish ? "희망 학과" : "학과";
}

function ensureStatusOptions(selectEl) {
  if (!selectEl) return;
  if (selectEl.options && selectEl.options.length > 0) return;

  for (const opt of STATUS_OPTIONS) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    selectEl.appendChild(o);
  }
}

function mergeUser(prev, updated) {
  const p = prev && typeof prev === "object" ? prev : {};
  const u = updated && typeof updated === "object" ? updated : {};

  return {
    ...p,
    memberId: u.memberId ?? p.memberId,
    name: u.name ?? p.name,
    username: u.username ?? p.username,
    nickname: u.nickname ?? p.nickname,
    email: u.email ?? p.email,
    profileImageUrl: u.profileImageUrl ?? p.profileImageUrl ?? "",
    status: u.status ?? p.status,
    university: u.university ?? p.university,
    major: u.major ?? p.major,
    role: u.role ?? p.role,
    authProvider: u.authProvider ?? p.authProvider,
  };
}

function formatAcademicLine(status, university, major) {
  const u = String(university || "").trim();
  const m = String(major || "").trim();
  const base = [u, m].filter(Boolean).join("/");

  if (!base) return "-";
  if (status === "ENROLLED") return `${base} 재학`;
  if (status === "GRADUATED") return `${base} 졸업`;
  return `${base} 희망`;
}

function updateProfileSummaryFromState(me) {
  const el = document.getElementById("mypageSummary");
  if (!el) return;
  el.textContent = formatAcademicLine(me?.status, me?.university, me?.major);
}

function isLocalUser(me) {
  const provider = me?.authProvider ?? null;

  if (provider) {
    return String(provider).toUpperCase() === "LOCAL";
  }

  const username = me?.username ?? "";
  const userStr = String(username).toLowerCase();

  if (
    userStr.startsWith("google_") ||
    userStr.startsWith("github_") ||
    userStr.startsWith("kakao_") ||
    userStr.startsWith("naver_")
  ) {
    return false;
  }

  return true;
}

function template(me) {
  const safeName = escapeHtml(me?.name || "");
  const safeUsername = escapeHtml(me?.username || "");
  const safeNick = escapeHtml(me?.nickname || "");
  const safeEmail = escapeHtml(me?.email || "");
  const safeUni = escapeHtml(me?.university || "");
  const safeMajor = escapeHtml(me?.major || "");

  const isLocal = isLocalUser(me);

  return `
  <div class="mypage-profile" aria-label="내 정보 수정">
    <div class="mypage-profile-head">
      <div class="mypage-head-left">
        <div class="mypage-avatar mypage-avatar--lg" id="mypageAvatar" aria-hidden="true"></div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="mypage-head-text">
            <div class="mypage-nickname" id="mypageNickname">${
              safeNick || "사용자"
            }</div>
            <div class="mypage-major" id="mypageSummary"></div>
          </div>

          <div style="display:flex; gap:8px; align-items:center;">
            <button class="mypage-mini-btn" type="button" id="btnProfileImageChange">이미지 변경</button>
            <button class="mypage-mini-btn" type="button" id="btnProfileImageDelete">이미지 삭제</button>
            <input type="file" id="profileImageFile" accept="image/*" style="display:none;" />
          </div>
        </div>
      </div>
    </div>

    <div class="mypage-divider"></div>

    <form class="mypage-form" id="mypageForm" novalidate>
      <div class="mypage-error mypage-error--form" id="err_form" aria-live="polite"></div>

      <div class="mypage-grid mypage-grid-2">
        <div class="mypage-field">
          <label class="mypage-label" for="name">이름</label>
          <input class="mypage-input" id="name" name="name" type="text" value="${safeName}" disabled />
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="username">아이디</label>
          <input class="mypage-input" id="username" name="username" type="text" value="${safeUsername}" disabled />
        </div>
      </div>

      <div class="mypage-grid mypage-grid-2">
        <div class="mypage-field">
          <label class="mypage-label mypage-label--required" for="nickname">닉네임</label>
          <input class="mypage-input" id="nickname" name="nickname" type="text" value="${safeNick}" autocomplete="nickname" />
          <div class="mypage-error" id="err_nickname" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="email">이메일</label>
          <input class="mypage-input" id="email" name="email" type="email" value="${safeEmail}" autocomplete="email" disabled />
          <div class="mypage-error" id="err_email" aria-live="polite"></div>
        </div>
      </div>

      <div class="mypage-grid mypage-grid-3">
        <div class="mypage-field">
          <label class="mypage-label" for="statusSelect">신분</label>
          <select class="mypage-input" id="statusSelect" name="status"></select>
          <div class="mypage-error" id="err_status" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" id="labelUniversity" for="university">대학교</label>
          <input class="mypage-input" id="university" name="university" type="text" value="${safeUni}" />
          <div class="mypage-error" id="err_university" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" id="labelMajor" for="major">학과</label>
          <input class="mypage-input" id="major" name="major" type="text" value="${safeMajor}" />
          <div class="mypage-error" id="err_major" aria-live="polite"></div>
        </div>
      </div>

      <div class="mypage-divider mypage-divider--dashed" aria-hidden="true"></div>

      ${
        isLocal
          ? `
      <div class="mypage-grid mypage-grid-3">
        <div class="mypage-field">
          <label class="mypage-label mypage-label--required" for="currentPassword">현재 비밀번호</label>
          <input class="mypage-input" id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" />
          <div class="mypage-error" id="err_currentPassword" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="newPassword">새 비밀번호</label>
          <input class="mypage-input" id="newPassword" name="newPassword" type="password" autocomplete="new-password" />
          <div class="mypage-error" id="err_newPassword" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="newPasswordConfirm">새 비밀번호 확인</label>
          <input class="mypage-input" id="newPasswordConfirm" name="newPasswordConfirm" type="password" autocomplete="new-password" />
          <div class="mypage-error" id="err_newPasswordConfirm" aria-live="polite"></div>
        </div>
      </div>
      `
          : `
      <div class="mypage-field">
        <div class="mypage-label">비밀번호</div>
        <div style="padding: 12px; background-color: #f8f9fa; border-radius: 4px; color: #6c757d; font-size: 14px;">
          소셜 로그인 계정은 비밀번호 변경이 불가능합니다.
        </div>
      </div>
      `
      }

      <div class="mypage-btn-row">
        <button class="mypage-save-btn" type="submit" id="btnSave">저장</button>
      </div>
    </form>
  </div>
  `;
}

export function renderProfileTab(state) {
  const listEl = document.getElementById("mypageList");
  const pagerEl = document.getElementById("mypagePagination");

  if (!listEl) return;
  if (pagerEl) pagerEl.innerHTML = "";

  const me = state?.me ?? {};
  listEl.innerHTML = template(me);

  const avatarEl = document.getElementById("mypageAvatar");
  applyAvatar(avatarEl, me?.profileImageUrl);

  const statusSelect = document.getElementById("statusSelect");
  ensureStatusOptions(statusSelect);

  const initialStatus = me?.status || "ENROLLED";
  if (statusSelect) statusSelect.value = initialStatus;

  syncWishLabels(initialStatus);
  updateProfileSummaryFromState(me);

  if (statusSelect) {
    statusSelect.addEventListener("change", () => {
      syncWishLabels(statusSelect.value);
      updateProfileSummaryFromState({
        ...me,
        status: statusSelect.value,
        university:
          document.getElementById("university")?.value ?? me.university,
        major: document.getElementById("major")?.value ?? me.major,
      });
    });
  }

  bindProfileForm(state);
  bindProfileImage(state);
  bindLiveValidation(state);
}

function bindProfileForm(state) {
  const form = document.getElementById("mypageForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const nickname = String(
      document.getElementById("nickname")?.value || ""
    ).trim();
    const status = String(
      document.getElementById("statusSelect")?.value || ""
    ).trim();

    const university = String(
      document.getElementById("university")?.value ?? ""
    ).trim();
    const major = String(document.getElementById("major")?.value ?? "").trim();

    const currentPassword = String(
      document.getElementById("currentPassword")?.value || ""
    ).trim();
    const newPassword = String(
      document.getElementById("newPassword")?.value || ""
    ).trim();
    const newPasswordConfirm = String(
      document.getElementById("newPasswordConfirm")?.value || ""
    ).trim();

    const payload = {
      nickname,
      currentPassword,
      newPassword: newPassword ? newPassword : null,
      status: status || null,
      university: university,
      major: major,
    };

    const validatePayload = { ...payload, newPasswordConfirm };
    const v = validateProfileUpdate(validatePayload, state?.me);

    if (!v.ok) {
      applyClientFieldErrors(v.fieldErrors, v.message);
      return;
    }

    try {
      startOverlayLoading();

      const updated = await updateMe(payload);

      state.me = updated;

      const nickEl = document.getElementById("mypageNickname");
      if (nickEl) nickEl.textContent = updated?.nickname || "사용자";

      updateProfileSummaryFromState(updated);

      const statusSelect = document.getElementById("statusSelect");
      const uniInput = document.getElementById("university");
      const majorInput = document.getElementById("major");

      const savedStatus = updated?.status || "ENROLLED";
      if (statusSelect) statusSelect.value = savedStatus;
      if (uniInput) uniInput.value = String(updated?.university ?? "");
      if (majorInput) majorInput.value = String(updated?.major ?? "");

      syncWishLabels(savedStatus);

      const prev = readUser();
      const next = mergeUser(prev, updated);
      writeUser(next);
      dispatchUserUpdated(next);

      const cp = document.getElementById("currentPassword");
      const np = document.getElementById("newPassword");
      const npc = document.getElementById("newPasswordConfirm");
      if (cp) cp.value = "";
      if (np) np.value = "";
      if (npc) npc.value = "";

      endOverlayLoading();
      showOverlayCheck({ durationMs: 1000 });
    } catch (err) {
      endOverlayLoading();

      if (err instanceof ApiError) {
        applyValidationErrors(err.data);
        return;
      }

      setError("err_form", "서버 통신에 실패했습니다.");
    }
  });
}

function bindProfileImage(state) {
  const btnChange = document.getElementById("btnProfileImageChange");
  const btnDelete = document.getElementById("btnProfileImageDelete");
  const fileInput = document.getElementById("profileImageFile");

  if (btnChange && fileInput) {
    btnChange.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      try {
        startOverlayLoading();

        const updated = await uploadProfileImage(file);

        state.me = updated;

        const avatarEl = document.getElementById("mypageAvatar");
        applyAvatar(avatarEl, updated?.profileImageUrl);

        const prev = readUser();
        const next = mergeUser(prev, updated);
        writeUser(next);
        dispatchUserUpdated(next);

        endOverlayLoading();
        showOverlayCheck({ durationMs: 900 });
      } catch (err) {
        endOverlayLoading();

        if (err instanceof ApiError) {
          applyValidationErrors(err.data);
          return;
        }

        setError("err_form", "이미지 업로드에 실패했습니다.");
      } finally {
        fileInput.value = "";
      }
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener("click", async () => {
      const ok = confirm("프로필 이미지를 삭제하시겠습니까?");
      if (!ok) return;

      try {
        startOverlayLoading();

        const updated = await deleteProfileImage();

        if (
          updated &&
          (updated.profileImageUrl === null ||
            updated.profileImageUrl === undefined)
        ) {
          updated.profileImageUrl = "";
        }

        state.me = updated;

        const avatarEl = document.getElementById("mypageAvatar");
        applyAvatar(avatarEl, updated?.profileImageUrl);

        const prev = readUser();
        const next = mergeUser(prev, updated);
        next.profileImageUrl = updated?.profileImageUrl
          ? String(updated.profileImageUrl)
          : "";

        writeUser(next);
        dispatchUserUpdated(next);

        endOverlayLoading();
        showOverlayCheck({ durationMs: 1000 });
      } catch (err) {
        endOverlayLoading();

        if (err instanceof ApiError) {
          applyValidationErrors(err.data);
          return;
        }

        setError("err_form", "이미지 삭제에 실패했습니다.");
      }
    });
  }
}

function bindLiveValidation(state) {
  const nick = document.getElementById("nickname");
  if (!nick) return;

  const cp = document.getElementById("currentPassword");
  const np = document.getElementById("newPassword");
  const npc = document.getElementById("newPasswordConfirm");

  const isLocal = isLocalUser(state?.me);

  const touched = {
    nickname: false,
    currentPassword: false,
    newPassword: false,
    newPasswordConfirm: false,
  };

  const render = () => {
    const nickVal = String(nick.value || "");
    const nickMsg = touched.nickname ? getNicknameRuleMessage(nickVal) : "";

    setError("err_nickname", nickMsg);
    setInvalid("nickname", Boolean(nickMsg));

    if (!cp || !np || !npc) return;

    if (!isLocal) {
      setError("err_currentPassword", "");
      setInvalid("currentPassword", false);
      setError("err_newPassword", "");
      setInvalid("newPassword", false);
      setError("err_newPasswordConfirm", "");
      setInvalid("newPasswordConfirm", false);
      return;
    }

    const curVal = String(cp.value || "");
    const newVal = String(np.value || "");
    const cfmVal = String(npc.value || "");

    const curMsg =
      touched.currentPassword && curVal.trim()
        ? getPasswordRuleMessage(curVal)
        : "";
    const newMsg =
      touched.newPassword && newVal.trim()
        ? getPasswordRuleMessage(newVal)
        : "";
    const cfmMsg =
      touched.newPasswordConfirm || touched.newPassword
        ? getNewPasswordConfirmMessage(newVal, cfmVal)
        : "";

    setError("err_currentPassword", curMsg);
    setInvalid("currentPassword", Boolean(curMsg));

    setError("err_newPassword", newMsg);
    setInvalid("newPassword", Boolean(newMsg));

    setError("err_newPasswordConfirm", cfmMsg);
    setInvalid("newPasswordConfirm", Boolean(cfmMsg));
  };

  nick.addEventListener("focus", () => {
    touched.nickname = true;
    render();
  });

  nick.addEventListener("input", () => {
    touched.nickname = true;
    render();
  });

  if (cp) {
    cp.addEventListener("focus", () => {
      touched.currentPassword = true;
      render();
    });
    cp.addEventListener("input", () => {
      touched.currentPassword = true;
      render();
    });
  }

  if (np) {
    np.addEventListener("focus", () => {
      touched.newPassword = true;
      render();
    });
    np.addEventListener("input", () => {
      touched.newPassword = true;
      render();
    });
  }

  if (npc) {
    npc.addEventListener("focus", () => {
      touched.newPasswordConfirm = true;
      render();
    });
    npc.addEventListener("input", () => {
      touched.newPasswordConfirm = true;
      render();
    });
  }
}
