import { api } from "../services/api.js";

const PAGE_SIZE = 5;

const TABS = [
  { key: "reviews", label: "작성한 후기" },
  { key: "qna", label: "Q&A" },
  { key: "teacher", label: "신청한 인터뷰" },
  { key: "major", label: "완료된 인터뷰" },
];

const STATUS_OPTIONS = [
  { value: "ENROLLED", label: "재학생" },
  { value: "GRADUATED", label: "졸업생" },
  { value: "HIGH_SCHOOL", label: "고등학생" },
  { value: "ETC", label: "기타" },
];

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const API_BASE_URL = normalizeBaseUrl(RAW_BASE_URL);

function normalizeBaseUrl(v) {
  const base = String(v || "").trim();
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function joinUrl(base, endpoint) {
  const ep = String(endpoint || "");
  if (!ep) return base;
  if (ep.startsWith("/")) return `${base}${ep}`;
  return `${base}/${ep}`;
}

function getSession() {
  try {
    const raw = localStorage.getItem("mm_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(nextSession) {
  try {
    localStorage.setItem("mm_session", JSON.stringify(nextSession));
  } catch {}
}

function mergeSessionUser(patch) {
  const s = getSession() || {};
  const next = {
    ...s,
    user: {
      ...(s.user || {}),
      ...patch,
    },
  };
  setSession(next);
  return next;
}

function injectMyPageStylesOnce() {
  if (document.getElementById("mypage-inline-style")) return;

  const style = document.createElement("style");
  style.id = "mypage-inline-style";
  style.textContent = `
    /* 12칸 그리드: 1행 4개(3칸씩), 2~3행 3개(4칸씩) 배치 */
    .mypage-form-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 12px 16px;
      align-items: start;
    }

    .mypage-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      position: relative;
    }

    .field-error-text {
      color: #d00000;
      font-size: 12px;
      line-height: 1.2;
      min-height: 14px;
    }

    .mypage-input.input-error {
      border: 1px solid #d00000;
      box-shadow: 0 0 0 3px rgba(208, 0, 0, 0.18);
      outline: none;
    }

    .mypage-activity-empty {
      padding: 16px 0;
    }

    /* 모바일에서는 한 줄로 쌓이도록 */
    @media (max-width: 720px) {
      .mypage-form-grid {
        grid-template-columns: 1fr;
      }
      .mypage-row {
        grid-column: auto !important;
      }
    }

    /* 드롭다운 */
    .mypage-dropdown {
      position: relative;
    }

    .mypage-dropdown-input {
      cursor: pointer;
      user-select: none;
      background-color: #fff;
    }

    .mypage-dropdown-list {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(100% + 6px);
      z-index: 50;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 6px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      display: none;
      max-height: 220px;
      overflow: auto;
    }

    .mypage-dropdown.open .mypage-dropdown-list {
      display: block;
    }

    .mypage-dropdown-item {
      width: 100%;
      border: 0;
      background: transparent;
      text-align: left;
      padding: 10px 10px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .mypage-dropdown-item:hover,
    .mypage-dropdown-item[aria-selected="true"] {
      background: #f3f4f6;
    }
  `;
  document.head.appendChild(style);
}

function emptyUser() {
  return {
    memberId: "",
    name: "",
    nickname: "",
    email: "",
    username: "",
    profileImageUrl: "",
    status: "",
    role: "",
    university: "",
    major: "",
  };
}

function mapUserFromApi(apiData) {
  const d = apiData || {};
  return {
    memberId: d.memberId ?? "",
    name: d.name ?? "",
    nickname: d.nickname ?? "",
    email: d.email ?? "",
    username: d.username ?? "",
    profileImageUrl: d.profileImageUrl ?? "",
    status: d.status ?? "",
    role: d.role ?? "",
    university: d.university ?? "",
    major: d.major ?? "",
  };
}

async function fetchMyDetail() {
  const json = await api.get("/members/me/detail");
  if (!json || json.success !== true) throw new Error("API success=false");
  return mapUserFromApi(json.data);
}

async function fetchWrittenReviews() {
  const json = await api.get("/members/me/reviews/written");
  if (!json || json.success !== true) throw new Error("API success=false");

  const items = Array.isArray(json.data) ? json.data : [];
  const message = typeof json.message === "string" ? json.message : "";
  return { items, message };
}

async function patchMyDetailWithFallback(payload) {
  if (typeof api.patch === "function") {
    const json = await api.patch("/members/me/detail", payload);
    if (!json || json.success !== true)
      throw new Error(json?.message || "API success=false");
    return json.data;
  }

  const token = getSession()?.accessToken;
  const tokenType = getSession()?.tokenType || "Bearer";

  const res = await fetch(joinUrl(API_BASE_URL, "/members/me/detail"), {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await safeParseJson(res);
  if (!res.ok || !data?.success)
    throw new Error(data?.message || "요청에 실패했습니다.");
  return data.data;
}

async function safeParseJson(res) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusLabel(value) {
  const v = String(value || "").trim();
  const found = STATUS_OPTIONS.find((x) => x.value === v);
  return found ? found.label : v;
}

function formatDateOnly(dt) {
  if (!dt) return "";
  const s = String(dt);
  return (s.split("T")[0] || s).trim();
}

function reviewTargetTitle(item) {
  const nick = item?.major?.nickname ? String(item.major.nickname) : "상대방";
  return nick;
}

function reviewTargetSub(item) {
  const uni = item?.major?.university ? String(item.major.university) : "";
  const major = item?.major?.major ? String(item.major.major) : "";
  const parts = [];
  if (uni) parts.push(uni);
  if (major) parts.push(major);
  return parts.join(" ");
}

function validateEmail(v) {
  const s = String(v || "").trim();
  if (!s) return { ok: false, msg: "이메일을 입력하세요." };
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  return ok
    ? { ok: true, msg: "" }
    : { ok: false, msg: "이메일 형식이 올바르지 않습니다." };
}

function validateNickname(v) {
  const s = String(v || "").trim();
  if (!s) return { ok: false, msg: "닉네임을 입력하세요." };
  if (s.length < 2 || s.length > 50) {
    return { ok: false, msg: "닉네임은 2자 이상 50자 이하여야 합니다." };
  }
  const ok = /^[가-힣a-zA-Z0-9_-]{2,50}$/.test(s);
  return ok
    ? { ok: true, msg: "" }
    : {
        ok: false,
        msg: "닉네임은 한글, 영문, 숫자, _ - 만 사용할 수 있습니다.",
      };
}

function validateCurrentPassword(v) {
  const s = String(v || "");
  if (!s)
    return {
      ok: false,
      msg: "정보를 수정하려면 현재 비밀번호를 입력하세요.",
    };
  if (s.length < 8)
    return { ok: false, msg: "현재 비밀번호는 8자 이상이어야 합니다." };
  if (s.length > 20)
    return { ok: false, msg: "현재 비밀번호는 20자 이하여야 합니다." };
  return { ok: true, msg: "" };
}

function passwordIssues(v) {
  const s = String(v || "");
  const issues = [];
  if (s.length < 8) issues.push("8자 이상으로 입력하세요.");
  if (s.length > 20) issues.push("20자 이하로 입력하세요.");

  const hasLetter = /[A-Za-z]/.test(s);
  const hasDigit = /[0-9]/.test(s);
  const hasSpecial = /[^A-Za-z0-9]/.test(s);

  if (!hasLetter) issues.push("영문을 포함하세요.");
  if (!hasDigit) issues.push("숫자를 포함하세요.");
  if (!hasSpecial) issues.push("특수문자를 포함하세요.");

  return issues;
}

export function renderMyPage(root) {
  injectMyPageStylesOnce();

  const state = {
    activeTab: "reviews",
    pageByTab: { reviews: 1, qna: 1, teacher: 1, major: 1 },

    user: emptyUser(),

    validationActive: false,
    touched: {
      nickname: false,
      email: false,
      status: false,
      currentPassword: false,
      newPassword: false,
      newPasswordConfirm: false,
      university: false,
      major: false,
    },

    reviews: {
      loaded: false,
      loading: false,
      items: [],
      message: "",
    },
  };

  const wrap = document.createElement("div");
  wrap.className = "mypage-wrap";

  wrap.appendChild(renderTitle("마이페이지"));

  const profileCard = renderProfileCard();
  wrap.appendChild(profileCard);

  const tabsCard = renderTabsCard();
  wrap.appendChild(tabsCard);

  root.appendChild(wrap);

  loadAndApplyUser();
  loadReviewsIfNeeded();

  async function loadAndApplyUser() {
    try {
      const me = await fetchMyDetail();
      state.user = { ...state.user, ...me };
      applyUserToProfileCard(profileCard, state.user);
      applyUserToForm(profileCard, state.user);
      syncUniMajorLabelsAndPlaceholders(
        profileCard,
        getSelectedStatus(profileCard) || state.user.status
      );
    } catch {
      applyUserToProfileCard(profileCard, state.user);
      applyUserToForm(profileCard, state.user);
      syncUniMajorLabelsAndPlaceholders(
        profileCard,
        getSelectedStatus(profileCard) || state.user.status
      );
      alert(
        "내 정보 조회에 실패했습니다. 로그인 상태와 네트워크를 확인해주세요."
      );
    }
  }

  function loadReviewsIfNeeded() {
    if (state.activeTab !== "reviews") return;
    if (state.reviews.loading || state.reviews.loaded) return;

    state.reviews.loading = true;
    renderActivityBody();

    fetchWrittenReviews()
      .then(({ items, message }) => {
        state.reviews.items = items;
        state.reviews.message =
          message || (items.length === 0 ? "작성한 후기가 없습니다." : "");
        state.reviews.loaded = true;
      })
      .catch(() => {
        state.reviews.items = [];
        state.reviews.message = "작성한 후기를 불러오지 못했습니다.";
        state.reviews.loaded = true;
      })
      .finally(() => {
        state.reviews.loading = false;
        renderActivityBody();
      });
  }

  function renderTitle(text) {
    const h = document.createElement("h2");
    h.className = "mypage-title";
    h.textContent = text;
    return h;
  }

  function renderProfileCard() {
    const card = document.createElement("section");
    card.className = "card mypage-profile";

    const head = document.createElement("div");
    head.className = "mypage-profile-head";
    head.innerHTML = `
      <div class="mypage-head-left">
        <div class="mypage-avatar" aria-hidden="true"></div>
        <div class="mypage-head-text">
          <div class="mypage-nickname"></div>
          <div class="mypage-subline"></div>
        </div>
      </div>
    `;
    card.appendChild(head);

    const divider = document.createElement("div");
    divider.className = "mypage-divider";
    card.appendChild(divider);

    const form = document.createElement("form");
    form.className = "mypage-form mypage-form-grid";
    form.noValidate = true;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSave(form, card);
    });

    // 배치(3줄)
    // 1줄: 이름 아이디 닉네임 이메일 (각 3칸)
    // 2줄: 신분 대학교 학과 (각 4칸)
    // 3줄: 현재 비밀번호 비밀번호 변경 비밀번호 변경 확인 (각 4칸)
    form.appendChild(formRow("이름", "name", "", { disabled: true, span: 3 }));
    form.appendChild(
      formRow("아이디", "username", "", { disabled: true, span: 3 })
    );
    form.appendChild(
      formRow("닉네임", "nickname", "", { required: true, span: 3 })
    );
    form.appendChild(
      formRow("이메일", "email", "", { type: "email", required: true, span: 3 })
    );

    form.appendChild(dropdownRow("신분", "status", STATUS_OPTIONS, { span: 4 }));
    form.appendChild(formRow("대학교", "university", "", { span: 4 }));
    form.appendChild(formRow("학과", "major", "", { span: 4 }));

    form.appendChild(
      formRow("현재 비밀번호", "currentPassword", "", {
        type: "password",
        placeholder: "정보를 수정하려면 현재 비밀번호를 입력하세요.",
        autocomplete: "current-password",
        required: true,
        span: 4,
      })
    );

    form.appendChild(
      formRow("비밀번호 변경", "newPassword", "", {
        type: "password",
        autocomplete: "new-password",
        span: 4,
      })
    );

    form.appendChild(
      formRow("비밀번호 변경 확인", "newPasswordConfirm", "", {
        type: "password",
        autocomplete: "new-password",
        span: 4,
      })
    );

    const btnRow = document.createElement("div");
    btnRow.className = "mypage-btn-row";
    btnRow.style.gridColumn = "span 12";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "mypage-save-btn";
    saveBtn.textContent = "수정하기";

    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);

    card.appendChild(form);

    wireValidationHandlers(card);

    applyUserToProfileCard(card, state.user);
    applyUserToForm(card, state.user);
    syncUniMajorLabelsAndPlaceholders(
      card,
      getSelectedStatus(card) || state.user.status
    );

    return card;
  }

  function applyUserToProfileCard(card, user) {
    const headNick = card.querySelector(".mypage-nickname");
    const headSub = card.querySelector(".mypage-subline");

    if (headNick) headNick.textContent = user.nickname || "(닉네임 없음)";
    if (headSub) headSub.textContent = formatSubline(user);

    const avatar = card.querySelector(".mypage-avatar");
    if (avatar) {
      const url = String(user.profileImageUrl || "").trim();
      if (url) {
        avatar.style.backgroundImage = `url("${cssSafeUrl(url)}")`;
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
      } else {
        avatar.style.backgroundImage = "";
      }
    }
  }

  function applyUserToForm(card, user) {
    setInputValue(card, "name", user.name);
    setInputValue(card, "username", user.username);
    setInputValue(card, "nickname", user.nickname);
    setInputValue(card, "email", user.email);

    setStatusDropdownValue(card, user.status);

    setInputValue(card, "university", user.university);
    setInputValue(card, "major", user.major);

    setInputValue(card, "currentPassword", "");
    setInputValue(card, "newPassword", "");
    setInputValue(card, "newPasswordConfirm", "");

    clearAllErrors(card);
    state.validationActive = false;
    Object.keys(state.touched).forEach((k) => (state.touched[k] = false));
  }

  function formatSubline(user) {
    const uni = String(user.university || "").trim();
    const major = String(user.major || "").trim();
    const st = String(user.status || "").trim();

    const parts = [];
    if (uni) parts.push(uni);
    if (major) parts.push(major);
    if (st) parts.push(statusLabel(st));

    return parts.join(" · ");
  }

  function setInputValue(card, name, value) {
    const el = card.querySelector(`#mp-${name}`);
    if (el) el.value = value ?? "";
  }

  function cssSafeUrl(url) {
    return String(url).replaceAll('"', "%22").replaceAll(")", "%29");
  }

  function formRow(label, name, value, opts = {}) {
    const row = document.createElement("div");
    row.className = "mypage-row";

    const span = Number(opts.span || 12);
    row.style.gridColumn = `span ${Math.min(Math.max(span, 1), 12)}`;

    const lab = document.createElement("label");
    lab.className = "mypage-label";
    lab.setAttribute("for", `mp-${name}`);
    lab.textContent = label;

    const input = document.createElement("input");
    input.className = "mypage-input";
    input.id = `mp-${name}`;
    input.name = name;
    input.value = value ?? "";
    input.type = opts.type || "text";
    input.placeholder = opts.placeholder || "";
    if (opts.disabled) input.disabled = true;
    if (opts.autocomplete) input.autocomplete = opts.autocomplete;

    const err = document.createElement("div");
    err.className = "field-error-text";
    err.id = `err-mp-${name}`;
    err.textContent = "";

    row.appendChild(lab);
    row.appendChild(input);
    row.appendChild(err);
    return row;
  }

  function dropdownRow(label, name, options, opts = {}) {
    const row = document.createElement("div");
    row.className = "mypage-row mypage-dropdown";

    const span = Number(opts.span || 12);
    row.style.gridColumn = `span ${Math.min(Math.max(span, 1), 12)}`;

    const lab = document.createElement("label");
    lab.className = "mypage-label";
    lab.setAttribute("for", `mp-${name}`);
    lab.textContent = label;

    const input = document.createElement("input");
    input.className = "mypage-input mypage-dropdown-input";
    input.id = `mp-${name}`;
    input.name = name;
    input.type = "text";
    input.readOnly = true;
    input.placeholder = "신분을 선택하세요.";
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");

    const list = document.createElement("div");
    list.className = "mypage-dropdown-list";
    list.setAttribute("role", "listbox");
    list.id = `mp-${name}-list`;

    for (const o of options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mypage-dropdown-item";
      btn.textContent = o.label;
      btn.setAttribute("data-value", o.value);
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");

      btn.addEventListener("click", () => {
        setDropdownValue(row, name, o.value, o.label);
        closeDropdown(row, name);
        row.dispatchEvent(
          new CustomEvent("dropdown:change", {
            detail: { name, value: o.value },
          })
        );
      });

      list.appendChild(btn);
    }

    const err = document.createElement("div");
    err.className = "field-error-text";
    err.id = `err-mp-${name}`;
    err.textContent = "";

    row.appendChild(lab);
    row.appendChild(input);
    row.appendChild(list);
    row.appendChild(err);

    input.addEventListener("click", () => toggleDropdown(row, name));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDropdown(row, name);
      }
      if (e.key === "Escape") {
        closeDropdown(row, name);
      }
    });

    document.addEventListener("click", (e) => {
      if (!row.contains(e.target)) closeDropdown(row, name);
    });

    return row;
  }

  function toggleDropdown(row, name) {
    const isOpen = row.classList.toggle("open");
    const input = row.querySelector(`#mp-${name}`);
    if (input) input.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function closeDropdown(row, name) {
    row.classList.remove("open");
    const input = row.querySelector(`#mp-${name}`);
    if (input) input.setAttribute("aria-expanded", "false");
  }

  function setDropdownValue(row, name, value, label) {
    const input = row.querySelector(`#mp-${name}`);
    if (input) {
      input.value = label;
      input.dataset.value = String(value || "");
    }

    row.querySelectorAll(".mypage-dropdown-item").forEach((el) => {
      el.setAttribute(
        "aria-selected",
        String(el.getAttribute("data-value")) === String(value)
          ? "true"
          : "false"
      );
    });
  }

  function getSelectedStatus(card) {
    const input = card.querySelector("#mp-status");
    return input ? String(input.dataset.value || "") : "";
  }

  function setStatusDropdownValue(card, value) {
    const v = String(value || "").trim();
    const found = STATUS_OPTIONS.find((x) => x.value === v);

    const row = card.querySelector(".mypage-dropdown");
    const input = card.querySelector("#mp-status");
    if (!row || !input) return;

    if (found) {
      input.value = found.label;
      input.dataset.value = found.value;
    } else {
      input.value = "";
      input.dataset.value = "";
    }

    const listHost = row.querySelector(".mypage-dropdown-list");
    if (listHost) {
      listHost.querySelectorAll(".mypage-dropdown-item").forEach((el) => {
        el.setAttribute(
          "aria-selected",
          String(el.getAttribute("data-value")) === String(v) ? "true" : "false"
        );
      });
    }
  }

  function syncUniMajorLabelsAndPlaceholders(card, statusValue) {
    const st = String(statusValue || "").trim();
    const isCurrent = st === "ENROLLED" || st === "GRADUATED";

    const uniLabel = isCurrent ? "대학교" : "희망 대학교";
    const majorLabel = isCurrent ? "학과" : "희망 학과";

    const uniPh = isCurrent
      ? "재학/졸업 대학교를 입력해주세요."
      : "희망하는 대학교를 입력해주세요.";
    const majorPh = isCurrent
      ? "재학/졸업 학과를 입력해주세요."
      : "희망하는 학과를 입력해주세요.";

    const uniRowLabel = card.querySelector(`label[for="mp-university"]`);
    const majorRowLabel = card.querySelector(`label[for="mp-major"]`);
    if (uniRowLabel) uniRowLabel.textContent = uniLabel;
    if (majorRowLabel) majorRowLabel.textContent = majorLabel;

    const uniInput = card.querySelector("#mp-university");
    const majorInput = card.querySelector("#mp-major");
    if (uniInput) uniInput.placeholder = uniPh;
    if (majorInput) majorInput.placeholder = majorPh;
  }

  function setFieldError(card, name, message) {
    const input = card.querySelector(`#mp-${name}`);
    const err = card.querySelector(`#err-mp-${name}`);
    if (err) err.textContent = message || "";
    if (input) input.classList.toggle("input-error", Boolean(message));
  }

  function clearAllErrors(card) {
    [
      "nickname",
      "email",
      "status",
      "currentPassword",
      "newPassword",
      "newPasswordConfirm",
      "university",
      "major",
    ].forEach((k) => {
      const err = card.querySelector(`#err-mp-${k}`);
      if (err) err.textContent = "";

      const input = card.querySelector(`#mp-${k}`);
      if (input) input.classList.remove("input-error");
    });
  }

  function wireValidationHandlers(card) {
    const nickname = card.querySelector("#mp-nickname");
    const email = card.querySelector("#mp-email");
    const currentPassword = card.querySelector("#mp-currentPassword");
    const newPassword = card.querySelector("#mp-newPassword");
    const newPasswordConfirm = card.querySelector("#mp-newPasswordConfirm");

    const statusInput = card.querySelector("#mp-status");
    const statusRow = statusInput
      ? statusInput.closest(".mypage-dropdown")
      : null;

    if (statusRow) {
      statusRow.addEventListener("dropdown:change", () => {
        state.touched.status = true;
        syncUniMajorLabelsAndPlaceholders(card, getSelectedStatus(card));
        if (state.validationActive) validateForm(card);
      });
    }

    if (statusInput) {
      statusInput.addEventListener("blur", () => {
        state.touched.status = true;
        if (state.validationActive) validateForm(card);
      });
    }

    if (nickname) {
      nickname.addEventListener("blur", () => {
        state.touched.nickname = true;
        if (state.validationActive) validateForm(card);
      });
      nickname.addEventListener("input", () => {
        if (!state.validationActive && !state.touched.nickname) return;
        validateForm(card);
      });
    }

    if (email) {
      email.addEventListener("blur", () => {
        state.touched.email = true;
        if (state.validationActive) validateForm(card);
      });
      email.addEventListener("input", () => {
        if (!state.validationActive && !state.touched.email) return;
        validateForm(card);
      });
    }

    if (currentPassword) {
      currentPassword.addEventListener("blur", () => {
        state.touched.currentPassword = true;
        if (state.validationActive) validateForm(card);
      });
      currentPassword.addEventListener("input", () => {
        if (!state.validationActive && !state.touched.currentPassword) return;
        validateForm(card);
      });
    }

    if (newPassword) {
      newPassword.addEventListener("blur", () => {
        state.touched.newPassword = true;
        if (state.validationActive) validateForm(card);
      });
      newPassword.addEventListener("input", () => {
        if (!state.validationActive && !state.touched.newPassword) return;
        validateForm(card);
      });
    }

    if (newPasswordConfirm) {
      newPasswordConfirm.addEventListener("blur", () => {
        state.touched.newPasswordConfirm = true;
        if (state.validationActive) validateForm(card);
      });
      newPasswordConfirm.addEventListener("input", () => {
        if (!state.validationActive && !state.touched.newPasswordConfirm) return;
        validateForm(card);
      });
    }
  }

  function validateForm(card) {
    let ok = true;

    const nicknameVal = card.querySelector("#mp-nickname")?.value;
    const emailVal = card.querySelector("#mp-email")?.value;
    const statusVal = getSelectedStatus(card);

    const curPwVal = card.querySelector("#mp-currentPassword")?.value;
    const newPwVal = card.querySelector("#mp-newPassword")?.value;
    const newPw2Val = card.querySelector("#mp-newPasswordConfirm")?.value;

    const nick = validateNickname(nicknameVal);
    setFieldError(card, "nickname", nick.ok ? "" : nick.msg);
    if (!nick.ok) ok = false;

    const em = validateEmail(emailVal);
    setFieldError(card, "email", em.ok ? "" : em.msg);
    if (!em.ok) ok = false;

    // 드롭다운 신분 에러 처리(중요: 기존 setRadioError 사용 금지)
    if (!statusVal || !STATUS_OPTIONS.some((x) => x.value === statusVal)) {
      setFieldError(card, "status", "신분을 선택하세요.");
      ok = false;
    } else {
      setFieldError(card, "status", "");
    }

    const cur = validateCurrentPassword(curPwVal);
    setFieldError(card, "currentPassword", cur.ok ? "" : cur.msg);
    if (!cur.ok) ok = false;

    const newTouched =
      String(newPwVal || "").length > 0 || String(newPw2Val || "").length > 0;

    if (newTouched) {
      const issues = passwordIssues(newPwVal);
      if (issues.length > 0) {
        setFieldError(card, "newPassword", issues.join(" "));
        ok = false;
      } else {
        setFieldError(card, "newPassword", "");
      }

      if (String(newPwVal || "") !== String(newPw2Val || "")) {
        setFieldError(
          card,
          "newPasswordConfirm",
          "비밀번호 변경 확인이 일치하지 않습니다."
        );
        ok = false;
      } else {
        setFieldError(card, "newPasswordConfirm", "");
      }
    } else {
      setFieldError(card, "newPassword", "");
      setFieldError(card, "newPasswordConfirm", "");
    }

    return ok;
  }

  async function handleSave(form, card) {
    state.validationActive = true;

    const valid = validateForm(card);
    if (!valid) {
      const firstError = form.querySelector(".input-error");
      if (firstError && typeof firstError.focus === "function") {
        firstError.focus();
      }
      return;
    }

    const fd = new FormData(form);

    const nickname = String(fd.get("nickname") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const status = getSelectedStatus(card);

    const universityRaw = String(fd.get("university") || "").trim();
    const majorRaw = String(fd.get("major") || "").trim();

    const currentPassword = String(fd.get("currentPassword") || "");
    const newPassword = String(fd.get("newPassword") || "");
    const newPasswordConfirm = String(fd.get("newPasswordConfirm") || "");

    const newTouched = newPassword || newPasswordConfirm;

    const payload = {
      nickname,
      email,
      currentPassword,
      status,
      university: universityRaw ? universityRaw : null,
      major: majorRaw ? majorRaw : null,
    };

    if (newTouched) payload.newPassword = newPassword;

    try {
      await patchMyDetailWithFallback(payload);

      mergeSessionUser({
        nickname,
        email,
        status,
        university: payload.university,
        major: payload.major,
      });

      alert("수정이 완료되었습니다.");
      window.location.reload();
    } catch {
      alert(
        "수정에 실패했습니다. 현재 비밀번호와 입력값을 다시 확인해주세요."
      );
    }
  }

  function renderTabsCard() {
    const card = document.createElement("section");
    card.className = "card mypage-activity";

    const tabs = document.createElement("div");
    tabs.className = "mypage-tabs";

    for (const t of TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `mypage-tab ${t.key === state.activeTab ? "active" : ""}`;
      btn.textContent = t.label;

      btn.addEventListener("click", () => {
        state.activeTab = t.key;
        state.pageByTab[state.activeTab] = 1;

        updateTabActive();
        renderActivityBody();

        if (state.activeTab === "reviews") loadReviewsIfNeeded();
      });

      tabs.appendChild(btn);
    }

    const body = document.createElement("div");
    body.className = "mypage-activity-body";
    body.id = "mypageActivityBody";

    card.appendChild(tabs);
    card.appendChild(body);

    renderActivityBody();

    card.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn) {
        const page = Number(pageBtn.getAttribute("data-page"));
        if (Number.isFinite(page)) {
          state.pageByTab[state.activeTab] = page;
          renderActivityBody();
        }
        return;
      }

      const nextBtn = e.target.closest("[data-next]");
      if (nextBtn) {
        const max = getTotalPages(state.activeTab);
        state.pageByTab[state.activeTab] = Math.min(
          state.pageByTab[state.activeTab] + 1,
          max
        );
        renderActivityBody();
        return;
      }

      const editBtn = e.target.closest("[data-edit]");
      if (editBtn) {
        alert("수정 기능은 준비 중입니다.");
      }
    });

    function updateTabActive() {
      card.querySelectorAll(".mypage-tab").forEach((el, idx) => {
        const key = TABS[idx].key;
        el.classList.toggle("active", key === state.activeTab);
      });
    }

    return card;
  }

  function renderActivityBody() {
    const host = wrap.querySelector("#mypageActivityBody");
    if (!host) return;

    host.innerHTML = "";

    if (state.activeTab !== "reviews") {
      const empty = document.createElement("div");
      empty.className = "mypage-activity-empty empty";
      empty.textContent = "준비 중입니다.";
      host.appendChild(empty);
      return;
    }

    if (state.reviews.loading) {
      const loading = document.createElement("div");
      loading.className = "mypage-activity-empty empty";
      loading.textContent = "불러오는 중입니다.";
      host.appendChild(loading);
      return;
    }

    const items = Array.isArray(state.reviews.items) ? state.reviews.items : [];
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const page = Math.min(Math.max(1, state.pageByTab.reviews), totalPages);
    state.pageByTab.reviews = page;

    const start = (page - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mypage-activity-empty empty";
      empty.textContent = state.reviews.message || "작성한 후기가 없습니다.";
      host.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "mypage-list";
    for (const item of pageItems) {
      list.appendChild(renderReviewItem(item));
    }

    host.appendChild(list);
    host.appendChild(renderPager(totalPages, page));
  }

  function renderReviewItem(item) {
    const el = document.createElement("article");
    el.className = "mypage-item";

    const title = reviewTargetTitle(item);
    const sub = reviewTargetSub(item);
    const date = formatDateOnly(item?.createdAt);
    const content = item?.content ? String(item.content) : "";
    const rating = Number(item?.rating || 0);
    const id = String(item?.reviewId ?? "");

    el.innerHTML = `
      <div class="mypage-item-top">
        <div class="mypage-item-left">
          <div class="mypage-item-title">${escapeHtml(title)}</div>
          <div class="mypage-item-sub">${escapeHtml(sub)}</div>
          <div class="mypage-stars" aria-label="별점">
            ${renderStars(rating)}
          </div>
        </div>
        <div class="mypage-item-right">
          <div class="mypage-date">${escapeHtml(date)}</div>
        </div>
      </div>
      <div class="mypage-item-content">${escapeHtml(content)}</div>
      <div class="mypage-item-actions">
        <button type="button" class="mypage-mini-btn" data-edit="${escapeHtml(
          id
        )}">수정</button>
      </div>
    `;
    return el;
  }

  function getTotalPages(tabKey) {
    if (tabKey !== "reviews") return 1;
    const total = Array.isArray(state.reviews.items)
      ? state.reviews.items.length
      : 0;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }

  function renderStars(n) {
    const safe = Math.min(Math.max(Number(n) || 0, 0), 5);
    let out = "";
    for (let i = 1; i <= 5; i += 1) {
      out += `<span class="star ${
        i <= safe ? "on" : ""
      }" aria-hidden="true">★</span>`;
    }
    return out;
  }

  function renderPager(totalPages, currentPage) {
    const pager = document.createElement("div");
    pager.className = "pagination";

    for (let i = 1; i <= totalPages; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `page-btn ${i === currentPage ? "active" : ""}`;
      btn.textContent = String(i);
      btn.setAttribute("data-page", String(i));
      pager.appendChild(btn);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "page-btn arrow";
    next.textContent = "→";
    next.setAttribute("data-next", "1");
    pager.appendChild(next);

    return pager;
  }
}
