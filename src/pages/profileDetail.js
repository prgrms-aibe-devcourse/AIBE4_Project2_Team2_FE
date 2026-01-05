import { PROFILES } from "../data/profiles.js";
import { navigate } from "../router.js";
import { REVIEWS_BY_PROFILE, QNA_BY_PROFILE } from "../data/profileDetailData.js";

const PAGE_SIZE = 5;

export function renderProfileDetail(root, { id }) {
  const profile = PROFILES.find((p) => String(p.id) === String(id));

  const state = {
    tab: "review",
    page: 1,
  };

  const wrap = document.createElement("div");
  wrap.className = "pd-wrap";

  if (!profile) {
    wrap.innerHTML = `
      <div class="card pd-card">
        <h2 class="pd-title">프로필을 찾을 수 없다</h2>
        <p class="pd-muted">존재하지 않는 프로필이다</p>
        <button class="pd-back" type="button">홈으로</button>
      </div>
    `;
    wrap.querySelector(".pd-back").addEventListener("click", () => navigate("/"));
    root.appendChild(wrap);
    return;
  }

  wrap.appendChild(renderTopCard(profile));
  wrap.appendChild(renderBottomCard());

  root.appendChild(wrap);
  renderBottom();

  function renderTopCard(p) {
    const card = document.createElement("section");
    card.className = "card pd-card";

    const head = document.createElement("div");
    head.className = "pd-head";
    head.innerHTML = `
      <div class="pd-head-left">
        <div class="pd-avatar" aria-hidden="true"></div>
        <div class="pd-head-text">
          <div class="pd-name">${escapeHtml(p.name)}</div>
          <div class="pd-sub">${escapeHtml(p.school)}<br />${escapeHtml(p.major)}</div>
          <div class="pd-one">${escapeHtml(p.intro || "")}</div>
        </div>
      </div>
    `;

    const cta = document.createElement("div");
    cta.className = "pd-head-right";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pd-apply-btn";
    btn.textContent = "인터뷰 신청하기";
    btn.addEventListener("click", () => navigate(`/apply`));

    cta.appendChild(btn);

    const divider = document.createElement("div");
    divider.className = "pd-divider";

    const body = document.createElement("div");
    body.className = "pd-body";

    const aboutTitle = makeSectionTitle("자기소개");
    const about = document.createElement("p");
    about.className = "pd-text";
    about.textContent = getDetail(profile, "about") || (p.intro || "자기소개가 없다");

    const actTitle = makeSectionTitle("활동 내역");
    const act = document.createElement("ul");
    act.className = "pd-list";
    for (const item of getDetail(profile, "activities", [])) {
      const li = document.createElement("li");
      li.textContent = item;
      act.appendChild(li);
    }
    if (act.children.length === 0) {
      const li = document.createElement("li");
      li.textContent = "활동 내역이 없다";
      act.appendChild(li);
    }

    const consultTitle = makeSectionTitle("상담 가능 분야");
    const consult = document.createElement("ul");
    consult.className = "pd-list";
    for (const item of getDetail(profile, "consultTopics", [])) {
      const li = document.createElement("li");
      li.textContent = item;
      consult.appendChild(li);
    }
    if (consult.children.length === 0) {
      const li = document.createElement("li");
      li.textContent = "상담 가능 분야 정보가 없다";
      consult.appendChild(li);
    }

    body.appendChild(aboutTitle);
    body.appendChild(about);
    body.appendChild(actTitle);
    body.appendChild(act);
    body.appendChild(consultTitle);
    body.appendChild(consult);

    card.appendChild(head);
    card.appendChild(cta);
    card.appendChild(divider);
    card.appendChild(body);

    return card;
  }

  function renderBottomCard() {
    const card = document.createElement("section");
    card.className = "card pd-bottom";

    card.innerHTML = `
      <div class="pd-tabs">
        <button class="pd-tab active" type="button" data-tab="review">후기</button>
        <button class="pd-tab" type="button" data-tab="qna">Q&amp;A</button>
      </div>
      <div class="pd-bottom-body">
        <div class="pd-list-wrap" id="pdList"></div>
        <div class="pagination" id="pdPager"></div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-tab]");
      if (tabBtn) {
        state.tab = tabBtn.getAttribute("data-tab");
        state.page = 1;
        card.querySelectorAll(".pd-tab").forEach((b) => b.classList.remove("active"));
        tabBtn.classList.add("active");
        renderBottom();
        return;
      }

      const pageBtn = e.target.closest("[data-page]");
      if (pageBtn) {
        const page = Number(pageBtn.getAttribute("data-page"));
        if (!Number.isFinite(page)) return;
        state.page = page;
        renderBottom();
        return;
      }

      const nextBtn = e.target.closest("[data-next]");
      if (nextBtn) {
        state.page = Math.min(state.page + 1, getTotalPages());
        renderBottom();
      }
    });

    return card;
  }

  function renderBottom() {
    const listEl = wrap.querySelector("#pdList");
    const pagerEl = wrap.querySelector("#pdPager");
    if (!listEl || !pagerEl) return;

    const items = state.tab === "review"
      ? (REVIEWS_BY_PROFILE[id] || [])
      : (QNA_BY_PROFILE[id] || []);

    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), totalPages);

    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    listEl.innerHTML = "";
    if (pageItems.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = state.tab === "review" ? "후기가 없다" : "Q&A가 없다";
      listEl.appendChild(empty);
    } else {
      for (const it of pageItems) {
        listEl.appendChild(state.tab === "review" ? renderReview(it) : renderQna(it));
      }
    }

    pagerEl.innerHTML = "";
    for (let i = 1; i <= totalPages; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `page-btn ${i === state.page ? "active" : ""}`;
      btn.textContent = String(i);
      btn.setAttribute("data-page", String(i));
      pagerEl.appendChild(btn);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "page-btn arrow";
    next.textContent = "→";
    next.setAttribute("data-next", "1");
    pagerEl.appendChild(next);
  }

  function getTotalPages() {
    const items = state.tab === "review"
      ? (REVIEWS_BY_PROFILE[id] || [])
      : (QNA_BY_PROFILE[id] || []);
    return Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  }

  function renderReview(r) {
    const row = document.createElement("div");
    row.className = "pd-item";

    row.innerHTML = `
      <div class="pd-item-top">
        <div>
          <div class="pd-item-title">${escapeHtml(r.author)}</div>
          <div class="pd-stars">${renderStars(r.stars || 0)}</div>
        </div>
        <div class="pd-date">${escapeHtml(r.date)}</div>
      </div>
      <div class="pd-item-content">${escapeHtml(r.text)}</div>
    `;

    return row;
  }

  function renderQna(q) {
    const row = document.createElement("div");
    row.className = "pd-item";

    row.innerHTML = `
      <div class="pd-item-top">
        <div>
          <div class="pd-item-title">${escapeHtml(q.author)}</div>
          <div class="pd-item-sub">${escapeHtml(q.question)}</div>
        </div>
        <div class="pd-date">${escapeHtml(q.date)}</div>
      </div>
      <div class="pd-item-content">${escapeHtml(q.answer || "답변이 없다")}</div>
    `;

    return row;
  }

  function renderStars(n) {
    const on = Math.max(0, Math.min(5, Number(n) || 0));
    let s = "";
    for (let i = 1; i <= 5; i += 1) {
      s += i <= on ? "★" : "☆";
    }
    return s;
  }

  function makeSectionTitle(text) {
    const h = document.createElement("div");
    h.className = "pd-section-title";
    h.textContent = text;
    return h;
  }

  function getDetail(p, key, fallback = "") {
    const d = p.detail || {};
    const v = d[key];
    return v ?? fallback;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
