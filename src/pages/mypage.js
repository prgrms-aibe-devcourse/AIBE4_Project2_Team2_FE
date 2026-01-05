import { navigate } from "../router.js";
import { MOCK_USER } from "../data/mockUser.js";
import { MY_PAGE_MOCK_DATA } from "../data/mypageMockData.js";

const PAGE_SIZE = 5;

const TABS = [
  { key: "reviews", label: "내가 한 리뷰" },
  { key: "qna", label: "내가 한 Q&A" },
  { key: "teacher", label: "선생님 인터뷰" },
  { key: "major", label: "전공생 인터뷰" },
];

export function renderMyPage(root) {
  const state = {
    activeTab: "reviews",
    pageByTab: {
      reviews: 1,
      qna: 1,
      teacher: 1,
      major: 1,
    },
    user: { ...MOCK_USER },
  };

  const wrap = document.createElement("div");
  wrap.className = "mypage-wrap";

  wrap.appendChild(renderTitle("마이페이지"));
  wrap.appendChild(renderProfileCard());
  wrap.appendChild(renderTabsCard());

  root.appendChild(wrap);

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
      <div class="mypage-nickname">${escapeHtml(state.user.nickname)}</div>
      <div class="mypage-major">${escapeHtml(state.user.major)}</div>
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

    form.appendChild(formRow("이름", "name", state.user.name, { disabled: true }));
    form.appendChild(formRow("닉네임", "nickname", state.user.nickname));
    form.appendChild(formRow("아이디", "userId", state.user.userId, { disabled: true }));

    form.appendChild(formRow("비밀번호 변경", "password", "", { type: "password", placeholder: "새 비밀번호를 입력해라." }));
    form.appendChild(formRow("비밀번호 확인", "passwordConfirm", "", { type: "password", placeholder: "비밀번호를 다시 입력해라." }));

    const btnRow = document.createElement("div");
    btnRow.className = "mypage-btn-row";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "mypage-save-btn";
    saveBtn.textContent = "저장하기";

    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);

    card.appendChild(form);
    return card;
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

    row.appendChild(lab);
    row.appendChild(input);
    return row;
  }

  function handleSave(form) {
    const fd = new FormData(form);
    const nickname = String(fd.get("nickname") || "").trim();
    const pw = String(fd.get("password") || "");
    const pw2 = String(fd.get("passwordConfirm") || "");

    if (!nickname) {
      alert("닉네임을 입력해라.");
      return;
    }

    if (pw || pw2) {
      if (pw.length < 8) {
        alert("비밀번호는 8자 이상으로 입력해라.");
        return;
      }
      if (pw !== pw2) {
        alert("비밀번호 확인이 일치하지 않는다.");
        return;
      }
    }

    state.user.nickname = nickname;

    const nickEl = document.getElementById("nickname");
    if (nickEl) nickEl.textContent = nickname;

    const headNick = wrap.querySelector(".mypage-nickname");
    if (headNick) headNick.textContent = nickname;

    alert("저장 처리 위치다.");
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
        state.pageByTab[state.activeTab] = Math.min(state.pageByTab[state.activeTab] + 1, max);
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
