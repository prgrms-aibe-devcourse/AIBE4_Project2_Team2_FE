// import { PROFILES } from "../data/profiles.js";
import { navigate } from "../router.js";

const PAGE_SIZE = 8;
const APPLY_SLOT_INDEX = 2; // 0-based, 3번째 위치

export async function renderHome(root) {
  const state = {
    query: "",
    page: 1,
    profiles: [],
  };

  const { wrap, render } = buildHome();
  root.appendChild(wrap);

  // 1. 백엔드에서 전공자 카드 목록 조회
  try {
      const response = await fetch("/api/major-profiles");
      if (response.ok) {
          const json = await response.json();
          state.profiles = json.data; // 백엔드 데이터 저장
      } else {
          console.error("전공자 목록 조회 실패");
      }
  } catch (e) {
      console.error("서버 통신 오류", e);
  }

  render();

  function buildHome() {
    const wrap = document.createElement("div");

    const searchRow = document.createElement("div");
    searchRow.className = "search-row";
    searchRow.innerHTML = `<input class="search-input" id="searchInput" placeholder="검색어를 입력하세요." />`;
    wrap.appendChild(searchRow);

    const recommendBtn = document.createElement("button");
    recommendBtn.className = "primary-wide";
    recommendBtn.type = "button";
    recommendBtn.textContent = "AI로 전공자 추천받기";
    recommendBtn.addEventListener("click", () => navigate("/recommend"));
    wrap.appendChild(recommendBtn);

    const grid = document.createElement("div");
    grid.className = "cards-grid";
    grid.id = "cardsGrid";
    wrap.appendChild(grid);

    const pager = document.createElement("div");
    pager.className = "pagination";
    pager.id = "pager";
    wrap.appendChild(pager);

    const input = searchRow.querySelector("#searchInput");

    input.addEventListener("input", (e) => {
      state.query = e.target.value;
      state.page = 1;
      render();
    });

    wrap.addEventListener("click", (e) => {
      const tagBtn = e.target.closest("[data-tag]");
      if (!tagBtn) return;
      const tag = tagBtn.getAttribute("data-tag") || "";
      state.query = tag;
      state.page = 1;
      input.value = tag;
      render();
    });

    wrap.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("[data-page]");
      if (!pageBtn) return;
      const page = Number(pageBtn.getAttribute("data-page"));
      if (!Number.isFinite(page)) return;
      state.page = page;
      render();
    });

    wrap.addEventListener("click", (e) => {
      const nextBtn = e.target.closest("[data-next]");
      if (!nextBtn) return;
      state.page = Math.min(state.page + 1, getTotalPages());
      render();
    });

    return { wrap, render };

    function normalize(s) {
      return String(s || "").trim().toLowerCase();
    }

    function matches(profile, q) {
      const qq = normalize(q);
      if (!qq) return true;

      const hay = [
        profile.name,
        profile.school,
        profile.major,
        profile.intro,
        ...(profile.tags || []),
      ]
        .map(normalize)
        .join(" ");

      return hay.includes(qq);
    }

    function getFilteredProfiles() {
      const arr = Array.isArray(PROFILES) ? PROFILES : [];
      return arr.filter((p) => matches(p, state.query));
    }

    function getTotalPages() {
      const n = getFilteredProfiles().length; // 프로필 개수만 기준
      const firstCap = PAGE_SIZE - 1; // 1페이지는 지원하기 카드가 1칸 차지
      if (n <= firstCap) return 1;
      return 1 + Math.ceil((n - firstCap) / PAGE_SIZE);
    }

    function render() {
      const profiles = getFilteredProfiles();

      const totalPages = getTotalPages();
      const safePage = Math.min(Math.max(1, state.page), totalPages);
      state.page = safePage;

      let pageProfiles = [];

      if (safePage === 1) {
        pageProfiles = profiles.slice(0, PAGE_SIZE - 1);
      } else {
        const offset = (PAGE_SIZE - 1) + (safePage - 2) * PAGE_SIZE;
        pageProfiles = profiles.slice(offset, offset + PAGE_SIZE);
      }

      grid.innerHTML = "";

      if (safePage === 1) {
        const insertAt = Math.min(APPLY_SLOT_INDEX, pageProfiles.length);

        const combined = [
          ...pageProfiles.slice(0, insertAt).map((p) => ({ type: "profile", data: p })),
          { type: "apply" },
          ...pageProfiles.slice(insertAt).map((p) => ({ type: "profile", data: p })),
        ];

        for (const card of combined) {
          grid.appendChild(card.type === "apply" ? renderApplyCard() : renderProfileCard(card.data));
        }
      } else {
        if (pageProfiles.length === 0) {
          grid.innerHTML = `<div class="empty">검색 결과가 없습니다.</div>`;
        } else {
          for (const p of pageProfiles) {
            grid.appendChild(renderProfileCard(p));
          }
        }
      }

      pager.innerHTML = "";
      for (let i = 1; i <= totalPages; i += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `page-btn ${i === safePage ? "active" : ""}`;
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
    }

    function renderProfileCard(p) {
      const card = document.createElement("article");
      card.className = "card";
      card.style.cursor = "pointer";

      const pid = p.id; // ?? p.profileId ?? p.userId ?? p.name;

      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-tag]")) return;
        if (pid == null) return;
        // navigate(`/profile/${encodeURIComponent(String(pid))}`);
        navigate(`/major-profile/${encodeURIComponent(String(pid))}`);
      });
      
          // 프로필 이미지 처리
      const avatarStyle = p.profileImageUrl 
        ? `background-image: url('${p.profileImageUrl}'); background-size: cover;` 
        : `background-color: #ddd;`; // 기본 이미지


      const top = document.createElement("div");
      top.className = "card-top";
      top.innerHTML = `
        <div class="card-avatar" aria-hidden="true"></div>
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        <p class="card-sub">${escapeHtml(p.school)}<br />${escapeHtml(p.major)}</p>
      `;
      card.appendChild(top);

      const body = document.createElement("div");
      body.className = "card-body";
      body.textContent = p.title || "";
      card.appendChild(body);

      const tags = document.createElement("div");
      tags.className = "tags";
      for (const t of p.tags || []) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tag";
        b.textContent = t;
        b.setAttribute("data-tag", t);
        tags.appendChild(b);
      }
      card.appendChild(tags);

      return card;
    }

    function renderApplyCard() {
      const card = document.createElement("article");
      card.className = "card";

      const box = document.createElement("div");
      box.className = "card-cta";
      box.innerHTML = `
        <h3>전공자 지원하기</h3>
        <p>당신의 전공 경험을 공유하고<br />후배들에게 도움을 주세요!</p>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cta-btn";
      btn.textContent = "지원하기";
      btn.addEventListener("click", () => navigate("/apply"));

      box.appendChild(btn);
      card.appendChild(box);

      return card;
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
}
