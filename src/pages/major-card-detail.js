import { navigate } from "../router.js";
import { api } from "../services/api.js";
import {
  showOverlayCheck,
  withOverlayLoading, // 추가
} from "../utils/overlay.js";

const PAGE_SIZE = 5;

export async function renderProfileDetail(root, { id }) {
  // async 추가
  const wrap = document.createElement("div");
  wrap.className = "pd-wrap";

  let profile = null;
  await withOverlayLoading(
    async () => {
      try {
        const result = await api.get(`/major-profiles/${id}`);
        if (result?.success) {
          profile = result.data;
        } else {
          console.error("프로필 조회 실패:", result?.message);
        }
      } catch (e) {
        console.error("서버 통신 오류", e);
      }
    },
    { text: "프로필 정보를 불러오는 중..." }
  );

  const state = {
    tab: "review",
    page: 1,
  };

  // 프로필 데이터가 없을 경우 처리
  if (!profile) {
    wrap.innerHTML = `
      <div class="card pd-card">
        <h2 class="pd-title">프로필을 찾을 수 없습니다</h2>
        <p class="pd-muted">존재하지 않거나 비공개된 프로필입니다.</p>
        <button class="pd-back" type="button">홈으로</button>
      </div>
    `;
    const backBtn = wrap.querySelector(".pd-back");
    if (backBtn) backBtn.addEventListener("click", () => navigate("/"));
    root.appendChild(wrap);
    return;
  }

  // 기본 레이아웃 렌더링
  wrap.appendChild(renderTopCard(profile));
  wrap.appendChild(renderBottomCard());
  root.appendChild(wrap);

  // 초기 하단 데이터 로드
  renderBottom();

  // 인터뷰 신청 성공 시 호출되는 커스텀 이벤트 리스너
  window.addEventListener(
    "mj:interview-created",
    () => {
      // 1. 시각적 피드백 (오버레이 체크 표시)
      showOverlayCheck({
        text: "인터뷰 신청이 성공적으로 완료되었습니다!",
        durationMs: 1500,
      });

      // 2. 버튼 상태 업데이트
      const applyBtn = wrap.querySelector(".pd-apply-btn");
      if (applyBtn) {
        applyBtn.textContent = "신청 완료";
        applyBtn.disabled = true;
        applyBtn.style.backgroundColor = "#94a3b8";
        applyBtn.style.cursor = "default";
      }

      // 3. (선택사항) 신청 성공 후 목록을 리프레시하거나 스크롤 이동
      console.log("인터뷰 신청 완료 이벤트 수신");
    },
    { once: true }
  );

  function renderTopCard(p) {
    const card = document.createElement("section");
    card.className = "card pd-card";
    card.style.position = "relative"; // 기준점 설정

    // 프로필 이미지 처리
    const avatarStyle = p.profileImageUrl
      ? `background-image: url('${p.profileImageUrl}'); background-size: cover;`
      : `background-color: #ddd;`;

    const head = document.createElement("div");
    head.className = "pd-head";
    head.innerHTML = `
      <div class="pd-head-left">
        <div class="pd-avatar" style="${avatarStyle}" aria-hidden="true"></div>
        <div class="pd-head-text">
          <div class="pd-name">${escapeHtml(p.nickname)}</div>
          <div class="pd-sub">${escapeHtml(p.university)}<br />${escapeHtml(
      p.major
    )}</div>
          <div class="pd-one">${escapeHtml(p.title || "")}</div>
        </div>
      </div>
    `;

    const cta = document.createElement("div");
    cta.className = "pd-head-right";

    // 1. 좋아요 버튼 생성
    const likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = `pd-like-btn ${p.liked ? "active" : ""}`;
    likeBtn.innerHTML = `
      <svg class="heart-icon" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span class="like-count">${p.likeCount || 0}</span>
    `;

    // 좋아요 클릭 이벤트 핸들러
    likeBtn.addEventListener("click", async () => {
      const isNowLiked = !likeBtn.classList.contains("active");
      const countElement = likeBtn.querySelector(".like-count");
      let currentCount = parseInt(countElement.textContent) || 0;

      // Optimistic UI 업데이트
      likeBtn.classList.toggle("active", isNowLiked);
      countElement.textContent = isNowLiked
        ? currentCount + 1
        : Math.max(0, currentCount - 1);

      try {
        const response = await api.post(`/major-profiles/${id}/likes`);
        if (response?.success) {
          const result = response.data;
          // 서버 데이터로 동기화
          likeBtn.classList.toggle("active", result.liked);
          countElement.textContent = result.totalLikes;
        } else {
          throw new Error("처리 실패");
        }
      } catch (e) {
        console.error("좋아요 오류:", e);
        // 롤백
        likeBtn.classList.toggle("active", !isNowLiked);
        countElement.textContent = currentCount;
        alert("좋아요 처리에 실패했습니다.");
      }
    });

    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "pd-apply-btn";
    applyBtn.textContent = "인터뷰 신청하기";
    applyBtn.addEventListener("click", async () => {
      await withOverlayLoading(
        async () => {
          try {
            openInterviewCreatePopup(p.memberId);

            // 팝업이 뜨는 시간을 고려해 아주 짧은 지연을 주면 더 자연스럽습니다
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (e) {
            console.error("팝업 오픈 실패", e);
          }
        },
        { text: "신청 페이지를 불러오는 중..." }
      );
    });

    // 우측 영역에 좋아요와 신청 버튼 배치
    cta.appendChild(likeBtn);
    cta.appendChild(applyBtn);

    const divider = document.createElement("div");
    divider.className = "pd-divider";

    const body = document.createElement("div");
    body.className = "pd-body";

    // 상세 소개 (content)
    const aboutTitle = makeSectionTitle("상세 소개");
    const about = document.createElement("div");
    about.className = "pd-text";
    about.innerHTML = (p.content || "상세 소개가 없습니다.").replace(
      /\n/g,
      "<br>"
    );

    // 태그 목록 (활동 내역/상담 분야 대신 태그로 표시)
    const tagsTitle = makeSectionTitle("태그 / 키워드");
    const tagsContainer = document.createElement("div");
    tagsContainer.className = "pd-tags";

    if (p.tags && p.tags.length > 0) {
      p.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag";
        tagSpan.textContent = `#${tag}`;
        tagsContainer.appendChild(tagSpan);
      });
    } else {
      tagsContainer.textContent = "등록된 태그가 없습니다.";
      tagsContainer.className = "pd-muted";
    }

    body.appendChild(aboutTitle);
    body.appendChild(about);
    body.appendChild(tagsTitle);
    body.appendChild(tagsContainer);

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
        card
          .querySelectorAll(".pd-tab")
          .forEach((b) => b.classList.remove("active"));
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

  async function renderBottom() {
    const listEl = wrap.querySelector("#pdList");
    const pagerEl = wrap.querySelector("#pdPager");
    if (!listEl || !pagerEl) return;

    await withOverlayLoading(
      async () => {
        try {
          if (state.tab === "review") {
            const response = await api.get(
              `/members/${profile.memberId}/reviews/received?page=${
                state.page - 1
              }&size=${PAGE_SIZE}`
            );

            if (response?.success) {
              const reviews = response.data;
              const totalElements = response.totalElements || 0;
              const totalPages = Math.max(
                1,
                Math.ceil(totalElements / PAGE_SIZE)
              );

              listEl.innerHTML = "";
              if (!reviews || reviews.length === 0) {
                listEl.innerHTML = `<div class="empty">아직 작성된 후기가 없습니다.</div>`;
              } else {
                reviews.forEach((rev) =>
                  listEl.appendChild(renderReviewItem(rev))
                );
              }
              renderPagination(pagerEl, totalPages);
            }
          } else {
            listEl.innerHTML = `<div class="empty">Q&A 서비스 준비 중입니다.</div>`;
            pagerEl.innerHTML = "";
          }
        } catch (e) {
          console.error("데이터 로드 실패:", e);
          listEl.innerHTML = `<div class="mj-error">데이터를 불러오지 못했습니다.</div>`;
        }
      },
      { text: "후기 데이터를 불러오는 중..." }
    );
  }

  function getTotalPages() {
    const items =
      state.tab === "review"
        ? REVIEWS_BY_PROFILE[id] || []
        : QNA_BY_PROFILE[id] || [];
    return Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  }

  function renderReviewItem(item) {
    const { student, review, createdAt } = item;
    const row = document.createElement("div");
    row.className = "pd-item mj-review-row";

    // 별점 텍스트 생성
    const starsHtml = renderStars(review.rating);
    const dateStr = new Date(createdAt).toLocaleDateString("ko-KR");

    row.innerHTML = `
      <div class="pd-item-top">
        <div class="mj-reviewer-info">
          <div class="mj-reviewer-avatar" style="background-image: url('${
            student.profileImageUrl || ""
          }'); background-size: cover;">
            ${!student.profileImageUrl ? "👤" : ""}
          </div>
          <div>
            <div class="pd-item-title">${escapeHtml(student.nickname)} 
              <span class="mj-reviewer-univ">${escapeHtml(
                student.university
              )}</span>
            </div>
            <div class="pd-stars">${starsHtml} <span class="mj-rating-num">${
      review.rating
    }.0</span></div>
          </div>
        </div>
        <div class="pd-date">${dateStr}</div>
      </div>
      <div class="pd-item-content mj-review-content">
        ${escapeHtml(review.content).replace(/\n/g, "<br>")}
      </div>
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
      <div class="pd-item-content">${escapeHtml(
        q.answer || "답변 대기 중"
      )}</div>
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

  function openInterviewCreatePopup(majorId) {
    const url = `${window.location.origin}${window.location.pathname}#/interview-create/${majorId}`;
    const width = 600;
    const height = 850;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      "CreateInterview",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  }

  function renderPagination(pagerEl, totalPages) {
    pagerEl.innerHTML = "";
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `page-btn ${i === state.page ? "active" : ""}`;
      btn.textContent = String(i);
      btn.setAttribute("data-page", String(i));
      pagerEl.appendChild(btn);
    }

    if (state.page < totalPages) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "page-btn arrow";
      next.textContent = "→";
      next.setAttribute("data-next", "1");
      pagerEl.appendChild(next);
    }
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
