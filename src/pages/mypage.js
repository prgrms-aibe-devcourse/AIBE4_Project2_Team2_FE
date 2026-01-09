import { api } from "../services/api.js";
import { MY_PAGE_MOCK_DATA } from "../data/mypageMockData.js";

const PAGE_SIZE = 5;

const TABS = [
  { key: "reviews", label: "내가 한 리뷰" },
  { key: "qna", label: "내가 한 Q&A" },
  { key: "teacher", label: "선생님 인터뷰" },
  { key: "major", label: "전공생 인터뷰" },
];

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
  };
}

async function fetchMyProfile() {
  const json = await api.get("/members/me");
  if (!json || json.success !== true) throw new Error("API success=false");
  return mapUserFromApi(json.data);
}

export function renderMyPage(root) {
  const state = {
    activeTab: "reviews",
    pageByTab: { reviews: 1, qna: 1, teacher: 1, major: 1 },
    user: emptyUser(),
  };

  const wrap = document.createElement("div");
  wrap.className = "mypage-wrap";

  wrap.appendChild(renderTitle("마이페이지"));

  const profileCard = renderProfileCard();
  wrap.appendChild(profileCard);

  wrap.appendChild(renderTabsCard());

  root.appendChild(wrap);

  loadAndApplyUser();

  async function loadAndApplyUser() {
    try {
      const me = await fetchMyProfile();

      // 서버 응답에 없는 university/major는 현재 state 값을 유지한다
      state.user = {
        ...state.user,
        ...me,
      };

      applyUserToProfileCard(profileCard, state.user);
    } catch {
      applyUserToProfileCard(profileCard, state.user);
      alert("내 정보 조회에 실패했다. 로그인 상태, 토큰, 쿠키, CORS 설정을 확인해라.");
    }
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
    form.className = "mypage-form";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSave(form);
    });

    // 요구사항 반영
    // 이름(수정불가), 닉네임(수정가능), 아이디(수정불가),
    // 이메일(가능), 상태(가능), 대학교(가능), 학과(가능),
    // 비밀번호 입력(현재 비밀번호), 비밀번호 변경(새 비밀번호), 비밀번호 변경확인
    form.appendChild(formRow("이름", "name", state.user.name, { disabled: true }));
    form.appendChild(formRow("닉네임", "nickname", state.user.nickname));
    form.appendChild(formRow("아이디", "username", state.user.username, { disabled: true }));

    form.appendChild(formRow("이메일", "email", state.user.email, { type: "email" }));
    form.appendChild(formRow("상태", "status", state.user.status));
    form.appendChild(formRow("대학교", "university", state.user.university));
    form.appendChild(formRow("학과", "major", state.user.major));

    form.appendChild(
      formRow("비밀번호 입력", "currentPassword", "", {
        type: "password",
        placeholder: "현재 비밀번호를 입력해라.",
        autocomplete: "current-password",
      }),
    );
    form.appendChild(
      formRow("비밀번호 변경", "newPassword", "", {
        type: "password",
        placeholder: "새 비밀번호를 입력해라.",
        autocomplete: "new-password",
      }),
    );
    form.appendChild(
      formRow("비밀번호 변경확인", "newPasswordConfirm", "", {
        type: "password",
        placeholder: "새 비밀번호를 다시 입력해라.",
        autocomplete: "new-password",
      }),
    );

    const btnRow = document.createElement("div");
    btnRow.className = "mypage-btn-row";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "mypage-save-btn";
    saveBtn.textContent = "저장하기";

    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);

    card.appendChild(form);

    applyUserToProfileCard(card, state.user);

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

    setInputValue(card, "name", user.name);
    setInputValue(card, "nickname", user.nickname);
    setInputValue(card, "username", user.username);
    setInputValue(card, "email", user.email);
    setInputValue(card, "status", user.status);
    setInputValue(card, "university", user.university);
    setInputValue(card, "major", user.major);
  }

  function formatSubline(user) {
    const uni = String(user.university || "").trim();
    const major = String(user.major || "").trim();
    const status = String(user.status || "").trim();

    const parts = [];
    if (uni) parts.push(uni);
    if (major) parts.push(major);
    if (status) parts.push(status);

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

    row.appendChild(lab);
    row.appendChild(input);
    return row;
  }

  function isValidEmail(email) {
    const v = String(email || "").trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function handleSave(form) {
    const fd = new FormData(form);

    const nickname = String(fd.get("nickname") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const status = String(fd.get("status") || "").trim();
    const university = String(fd.get("university") || "").trim();
    const major = String(fd.get("major") || "").trim();

    const currentPassword = String(fd.get("currentPassword") || "");
    const newPassword = String(fd.get("newPassword") || "");
    const newPasswordConfirm = String(fd.get("newPasswordConfirm") || "");

    if (!nickname) {
      alert("닉네임을 입력해라.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("이메일 형식이 올바르지 않다.");
      return;
    }

    const passwordTouched = currentPassword || newPassword || newPasswordConfirm;
    if (passwordTouched) {
      if (!currentPassword) {
        alert("비밀번호 입력은 필수다.");
        return;
      }
      if (newPassword.length < 8) {
        alert("비밀번호 변경은 8자 이상으로 입력해라.");
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        alert("비밀번호 변경확인이 일치하지 않는다.");
        return;
      }
    }

    state.user.nickname = nickname;
    state.user.email = email;
    state.user.status = status;
    state.user.university = university;
    state.user.major = major;

    applyUserToProfileCard(profileCard, state.user);

    alert("저장 API 연결 위치다.");
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
        renderActivityBody();
        updateTabActive();
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
          max,
        );
        renderActivityBody();
        return;
      }

      const editBtn = e.target.closest("[data-edit]");
      if (editBtn) {
        const id = editBtn.getAttribute("data-edit");
        alert(`수정 처리 위치다: ${id}`);
      }
    });

    function updateTabActive() {
      card.querySelectorAll(".mypage-tab").forEach((el, idx) => {
        const key = TABS[idx].key;
        el.classList.toggle("active", key === state.activeTab);
      });
    }

    function renderActivityBody() {
      const host = card.querySelector("#mypageActivityBody");
      if (!host) return;

      host.innerHTML = "";

      const list = document.createElement("div");
      list.className = "mypage-list";

      const items = getTabItems(state.activeTab);
      const totalPages = getTotalPages(state.activeTab);
      const page = Math.min(Math.max(1, state.pageByTab[state.activeTab]), totalPages);
      state.pageByTab[state.activeTab] = page;

      const start = (page - 1) * PAGE_SIZE;
      const pageItems = items.slice(start, start + PAGE_SIZE);

      if (pageItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "목록이 없다.";
        host.appendChild(empty);
        return;
      }

      for (const item of pageItems) {
        list.appendChild(renderItem(state.activeTab, item));
      }

      host.appendChild(list);
      host.appendChild(renderPager(totalPages, page));
    }

    return card;
  }

  function getTabItems(tabKey) {
    return MY_PAGE_MOCK_DATA[tabKey] || [];
  }

  function getTotalPages(tabKey) {
    const total = getTabItems(tabKey).length;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }

  function renderItem(tabKey, item) {
    const el = document.createElement("article");
    el.className = "mypage-item";

    if (tabKey === "reviews") {
      el.innerHTML = `
        <div class="mypage-item-top">
          <div class="mypage-item-left">
            <div class="mypage-item-title">${escapeHtml(item.targetName)}</div>
            <div class="mypage-item-sub">${escapeHtml(item.targetSub)}</div>
            <div class="mypage-stars" aria-label="별점">
              ${renderStars(item.rating)}
            </div>
          </div>
          <div class="mypage-item-right">
            <div class="mypage-date">${escapeHtml(item.date)}</div>
          </div>
        </div>
        <div class="mypage-item-content">${escapeHtml(item.content)}</div>
        <div class="mypage-item-actions">
          <button type="button" class="mypage-mini-btn" data-edit="${escapeHtml(item.id)}">수정</button>
        </div>
      `;
      return el;
    }

    el.innerHTML = `
      <div class="mypage-item-top">
        <div class="mypage-item-left">
          <div class="mypage-item-title">${escapeHtml(item.title)}</div>
          <div class="mypage-item-sub">${escapeHtml(item.status || "")}</div>
        </div>
        <div class="mypage-item-right">
          <div class="mypage-date">${escapeHtml(item.date)}</div>
        </div>
      </div>
      <div class="mypage-item-content">${escapeHtml(item.content)}</div>
    `;
    return el;
  }

  function renderStars(n) {
    const safe = Math.min(Math.max(Number(n) || 0, 0), 5);
    let out = "";
    for (let i = 1; i <= 5; i += 1) {
      out += `<span class="star ${i <= safe ? "on" : ""}" aria-hidden="true">★</span>`;
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

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
