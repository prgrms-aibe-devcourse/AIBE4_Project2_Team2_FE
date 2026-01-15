import { navigate } from "../router.js";
import { api, ApiError } from "../services/api.js";
import { withOverlayLoading } from "../utils/overlay.js";

const PAGE_SIZE = 8;
const APPLY_SLOT_INDEX = 2; // 0-based, 3번째 위치

export async function renderHome(root) {
  console.log("Before API Call:", document.cookie);

  // 상태 관리: totalPages 추가
  const state = {
    query: "",
    page: 1, // UI상 1페이지 (API 요청 시 -1 필요)
    totalPages: 1,
    profiles: [],
    isLoading: false,
  };

  const { wrap, render, updatePagination } = buildHome();
  root.appendChild(wrap);

  // 초기 데이터 로드
  await loadProfiles();

  async function loadProfiles() {
    if (state.isLoading) return;
    state.isLoading = true;

    // [수정 포인트] withOverlayLoading으로 API 호출 감싸기
    await withOverlayLoading(
      async () => {
        try {
          let url = `/major-profiles?page=${state.page - 1}&size=${PAGE_SIZE}`;

          if (state.query && state.query.trim()) {
            const query = state.query.trim();
            if (query.startsWith("#")) {
              const tag = query.substring(1).trim();
              if (tag)
                url += `&searchType=tag&keyword=${encodeURIComponent(tag)}`;
            } else {
              url += `&searchType=all&keyword=${encodeURIComponent(query)}`;
            }
          }

          const result = await api.get(url);

          if (result?.success) {
            const pageData = result.data;
            state.profiles = pageData.content;
            state.totalPages = pageData.totalPages;

            render();
            updatePagination();

            // 페이지 상단으로 스크롤 (사용자 경험 향상)
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            console.error("전공자 목록 조회 실패:", result?.message);
          }
        } catch (e) {
          console.error("서버 통신 오류:", e);
        } finally {
          state.isLoading = false;
        }
      },
      { text: "전공자 목록을 불러오는 중입니다..." }
    );
  }

  function buildHome() {
    const wrap = document.createElement("div");

    const searchRow = document.createElement("div");
    searchRow.className = "search-row";
    searchRow.innerHTML = `
      <input class="search-input" id="searchInput" placeholder="닉네임, 학교, 학과 또는 #태그 검색" />
      <button class="search-btn" id="searchBtn" type="button">검색</button>
    `;
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
    const searchBtn = searchRow.querySelector("#searchBtn");

    // 검색 실행 함수
    const performSearch = () => {
      state.query = input.value;
      state.page = 1;
      loadProfiles(); // 검색어 변경 시 1페이지부터 다시 로드
    };

    // Enter 키로 검색
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        performSearch();
      }
    });

    // 검색 버튼 클릭
    searchBtn.addEventListener("click", performSearch);

    // 태그 클릭
    wrap.addEventListener("click", (e) => {
      const tagBtn = e.target.closest("[data-tag]");
      if (!tagBtn) return;

      // 1. 데이터 속성에서 태그명 가져오기
      let tag = tagBtn.getAttribute("data-tag") || "";

      // 2. 만약 데이터에 #이 포함되어 있다면 제거 (순수 텍스트만 추출)
      const pureTag = tag.replace(/^#/, "").trim();

      // 3. UI(검색창)에는 사용자 친화적으로 #을 붙여서 표시
      const displayTag = `#${pureTag}`;

      state.query = displayTag; // 상태 업데이트
      state.page = 1; // 페이지 초기화
      input.value = displayTag; // 검색창 텍스트 업데이트

      // 4. 데이터 로드 호출
      loadProfiles();
    });

    // 페이지 번호 클릭
    wrap.addEventListener("click", (e) => {
      const pageBtn = e.target.closest("[data-page]");
      if (!pageBtn) return;
      const page = Number(pageBtn.getAttribute("data-page"));
      if (!Number.isFinite(page) || page === state.page) return;

      state.page = page;
      loadProfiles(); // 페이지 변경 시 데이터 로드
    });

    // 다음 페이지 클릭
    wrap.addEventListener("click", (e) => {
      const nextBtn = e.target.closest("[data-next]");
      if (!nextBtn) return;

      if (state.page < state.totalPages) {
        state.page += 1;
        loadProfiles();
      }
    });

    return { wrap, render, updatePagination };

    // 렌더링 함수 (데이터 표시)
    function render() {
      const pageProfiles = state.profiles; // 이미 현재 페이지 데이터임
      grid.innerHTML = "";

      // 1페이지일 때만 '지원하기' 카드 삽입
      if (state.page === 1) {
        const insertAt = Math.min(APPLY_SLOT_INDEX, pageProfiles.length);

        const combined = [
          ...pageProfiles
            .slice(0, insertAt)
            .map((p) => ({ type: "profile", data: p })),
          { type: "apply" },
          ...pageProfiles
            .slice(insertAt)
            .map((p) => ({ type: "profile", data: p })),
        ];

        for (const card of combined) {
          grid.appendChild(
            card.type === "apply"
              ? renderApplyCard()
              : renderProfileCard(card.data)
          );
        }
      } else {
        if (pageProfiles.length === 0) {
          grid.innerHTML = `<div class="empty">등록된 프로필이 없습니다.</div>`;
        } else {
          for (const p of pageProfiles) {
            grid.appendChild(renderProfileCard(p));
          }
        }
      }
    }

    // 페이지네이션 버튼 렌더링
    function updatePagination() {
      pager.innerHTML = "";
      const totalPages = state.totalPages;

      // 페이지 버튼 생성
      // (페이지가 많을 경우 '...' 처리 로직이 필요할 수 있음. 여기선 단순 나열)
      let startPage = Math.max(1, state.page - 4);
      let endPage = Math.min(totalPages, startPage + 9);

      if (endPage - startPage < 9) {
        startPage = Math.max(1, endPage - 9);
      }

      for (let i = startPage; i <= endPage; i += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `page-btn ${i === state.page ? "active" : ""}`;
        btn.textContent = String(i);
        btn.setAttribute("data-page", String(i));
        pager.appendChild(btn);
      }

      // 다음 페이지 버튼
      if (state.page < totalPages) {
        const next = document.createElement("button");
        next.type = "button";
        next.className = "page-btn arrow";
        next.textContent = "→";
        next.setAttribute("data-next", "1");
        pager.appendChild(next);
      }
    }

    function renderProfileCard(p) {
      const card = document.createElement("article");
      card.className = "card";
      card.style.position = "relative";
      card.style.cursor = "pointer";

      // 카드 클릭 시 상세 페이지 이동
      card.addEventListener("click", (e) => {
        if (e.target.closest(".tag") || e.target.closest(".btn-like")) {
          return;
        }
        navigate(`/major-card-detail/${p.id}`);
      });

      const pid = p.id;

      // 1. 좋아요 버튼 생성
      const likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = `btn-like ${p.liked ? "active" : ""}`;

      if (p.liked) likeBtn.classList.add("active");

      likeBtn.innerHTML = `
        <svg class="heart-icon" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="like-count">${p.likeCount || 0}</span>
      `;

      // [좋아요 토글 핸들러]
      likeBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // 카드 클릭 방지

        // UI 즉시 업데이트 (Optimistic Update)
        const isNowLiked = !likeBtn.classList.contains("active");
        const countElement = likeBtn.querySelector(".like-count");
        let currentCount = parseInt(countElement.textContent);

        likeBtn.classList.toggle("active", isNowLiked);
        countElement.textContent = isNowLiked
          ? currentCount + 1
          : Math.max(0, currentCount - 1);
        try {
          const response = await api.post(`/major-profiles/${pid}/likes`);

          if (!response.success) throw new Error("좋아요 처리 실패");

          likeBtn.classList.toggle("active", response.data.liked);
          countElement.textContent = response.data.totalLikes;
        } catch (error) {
          console.error(error);
          // 실패 시 원래대로 롤백
          likeBtn.classList.toggle("active", !isNowLiked);
          countElement.textContent = currentCount;
          alert("좋아요 처리에 실패했습니다.");
        }
      });

      card.appendChild(likeBtn);

      // 2. 기존 카드 내용 (Top, Body, Tags)
      const avatarStyle = p.profileImageUrl
        ? `background-image: url('${p.profileImageUrl}'); background-size: cover;`
        : `background-color: #f1f5f9;`;

      const top = document.createElement("div");
      top.className = "card-top";
      top.innerHTML = `
        <div class="card-avatar" style="${avatarStyle}" aria-hidden="true"></div>
        <h3 class="card-title">${escapeHtml(p.nickname || p.name)}</h3>
        <p class="card-sub">${escapeHtml(p.university)}<br />${escapeHtml(
        p.major
      )}</p>
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
        const tagName = typeof t === "object" ? t : t;
        b.textContent = t.startsWith("#") ? t : `#${t}`;
        b.setAttribute("data-tag", tagName);
        tags.appendChild(b);
      }
      card.appendChild(tags);

      return card;
    }

    function renderApplyCard() {
      const card = document.createElement("article");
      card.className = "card";

      // 1. 로컬 스토리지에서 세션 정보 및 지원 상태 가져오기
      let applicationStatus = "";
      try {
        const storedSession = localStorage.getItem("mm_user");
        if (storedSession) {
          const session = JSON.parse(storedSession);
          applicationStatus = session.applicationStatus || "";
        }
      } catch (e) {
        console.error("세션 파싱 오류:", e);
      }

      const box = document.createElement("div");
      box.className = "card-cta";

      let title = "전공자 지원하기";
      let desc = "당신의 전공 경험을 공유하고<br />후배들에게 도움을 주세요!";
      let btnText = "지원하기";
      let targetPath = "/apply";
      let isBtnDisabled = false;

      switch (applicationStatus) {
        case "PENDING":
          title = "심사 진행 중";
          desc = "전공자 인증 심사가 진행 중입니다.<br />조금만 기다려 주세요!";
          btnText = "심사 현황 보기";
          targetPath = "/major-profile";
          break;

        case "REJECTED":
          title = "지원서 반려됨";
          desc =
            "인증 요청이 반려되었습니다.<br />사유를 확인하고 다시 시도해 주세요.";
          btnText = "재신청 하기";
          targetPath = "/major-profile";
          break;

        case "ACCEPTED":
          title = "인증 완료";
          desc =
            "전공자 인증이 완료되었습니다!<br />당신의 지식을 공유해 보세요.";
          btnText = "내 프로필 보기";
          targetPath = "/major-profile";
          break;

        default:
          break;
      }

      box.innerHTML = `
        <h3>${title}</h3>
        <p>${desc}</p>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cta-btn";
      btn.textContent = btnText;

      if (isBtnDisabled) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      }

      btn.addEventListener("click", () => navigate(targetPath));

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
