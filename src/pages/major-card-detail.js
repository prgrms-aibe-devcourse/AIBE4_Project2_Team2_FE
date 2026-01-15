import { navigate } from "../router.js";
import { api } from "../services/api.js";
import { getSession } from "../auth/auth.js";
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
  let hasPendingInterview = false; // 신청 중 여부 상태값

  const session = getSession();
  const currentUser = session?.user;

  await withOverlayLoading(
    async () => {
      try {
        // 1. 전공자 프로필 정보 조회
        const profileRes = await api.get(`/major-profiles/${id}`);
        if (profileRes?.success) {
          profile = profileRes.data;
        }

        // 2. 내가 신청한 인터뷰 중 대기(PENDING) 상태가 있는지 조회
        if (currentUser && profile) {
          // 제공해주신 API: /members/me/interviews
          // type=SENT (내가 보낸 것), status=PENDING (대기중)
          const interviewRes = await api.get(
            `/members/me/interviews?type=APPLIED&status=PENDING&size=100`
          );

          if (interviewRes?.success) {
            const mySentItems = interviewRes.data || [];
            // 현재 상세 페이지의 주인공(profile.memberId)에게 보낸 것이 있는지 확인
            hasPendingInterview = mySentItems.some(
              (item) => String(item.peer.memberId) === String(profile.memberId)
            );
          }
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

    const isOwner =
      currentUser && String(currentUser.memberId) === String(p.memberId);
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "pd-apply-btn";

    if (isOwner) {
      // 내 프로필일 때
      applyBtn.textContent = "내 프로필입니다";
      applyBtn.disabled = true;
      applyBtn.classList.add("btn-disabled");
    } else if (hasPendingInterview) {
      // 이미 신청했을 때 (파스텔 그린 테마)
      applyBtn.textContent = "신청중";
      applyBtn.disabled = true;
      applyBtn.style.backgroundColor = "#ebf7ed"; // 파스텔 그린 배경
      applyBtn.style.color = "#2ecc71"; // 테마 포인트 색상
      applyBtn.style.border = "1px solid #2ecc71";
      applyBtn.style.cursor = "default";
    } else {
      // 신청 가능할 때
      applyBtn.textContent = "인터뷰 신청하기";
      applyBtn.onclick = () => openInterviewCreatePopup(p.memberId);
    }

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
    const session = getSession();
    const currentUser = session?.user;

    const isOwner =
      currentUser && String(currentUser.id) === String(profile.memberId);

    const card = document.createElement("section");
    card.className = "card pd-bottom";
    card.innerHTML = `
    <div class="pd-tabs">
      <button class="pd-tab active" type="button" data-tab="review">후기</button>
      <button class="pd-tab" type="button" data-tab="qna">Q&A</button>
    </div>
    
    <div class="pd-bottom-body">
      <div id="qnaInputArea" style="display: none; padding: 20px; background-color: #f0fdf4; border-bottom: 1px solid #dcfce7;">
        ${
          !isOwner
            ? `
          <div class="mj-qna-input-box">
            <label class="mj-input-label" style="color: #16a34a;">전공자에게 질문하기</label>
            <div class="mj-answer-input-container">
              <textarea id="newQuestionText" class="mj-answer-textarea" 
                style="border-color: #d1fae5;"
                placeholder="궁금한 점을 질문해보세요!"></textarea>
              <button type="button" id="submitQuestionBtn" class="mj-ans-submit" 
                style="background-color: #2ecc71; color: white;">등록</button>
            </div>
          </div>
        `
            : `<div class="pd-muted" style="font-size: 0.9rem; text-align: center; color: #16a34a;">
                내 프로필에 등록된 질문에 답변을 남길 수 있습니다.
               </div>`
        }
      </div>
      
      <div class="pd-list-wrap" id="pdList"></div>
      <div class="pagination" id="pdPager"></div>
    </div>
  `;
    card.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-tab]");
      if (tabBtn) {
        const tab = tabBtn.getAttribute("data-tab");
        wrap.querySelector("#qnaInputArea").style.display =
          tab === "qna" ? "block" : "none";
        state.tab = tabBtn.getAttribute("data-tab");
        state.page = 1;
        card
          .querySelectorAll(".pd-tab")
          .forEach((b) => b.classList.remove("active"));
        tabBtn.classList.add("active");
        renderBottom();
        return;
      }

      if (e.target.id === "submitQuestionBtn") {
        const textEl = card.querySelector("#newQuestionText");
        handleCreateQuestion(textEl.value);
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
          const endpoint =
            state.tab === "review"
              ? `/majors/${profile.memberId}/reviews`
              : `/majors/${profile.memberId}/qna`;

          const response = await api.get(
            `${endpoint}?page=${state.page - 1}&size=${PAGE_SIZE}&type=RECEIVED`
          );

          if (response?.success) {
            const items = response.data || [];
            // 페이징 정보 추출 (백엔드 응답 구조에 따라 meta 또는 direct 필드 사용)
            const totalElements =
              response.meta?.totalElements || response.totalElements || 0;
            const totalPages = Math.max(
              1,
              Math.ceil(totalElements / PAGE_SIZE)
            );

            listEl.innerHTML = "";

            if (items.length === 0) {
              const msg =
                state.tab === "review"
                  ? "아직 작성된 후기가 없습니다."
                  : "아직 등록된 질문이 없습니다.";
              listEl.innerHTML = `<div class="empty">${msg}</div>`;
            } else {
              items.forEach((item) => {
                const row =
                  state.tab === "review"
                    ? renderReviewItem(item)
                    : renderQnaItem(item);
                listEl.appendChild(row);
              });
            }
            renderPagination(pagerEl, totalPages);
          }
        } catch (e) {
          console.error("데이터 로드 실패:", e);
          listEl.innerHTML = `<div class="mj-error">데이터를 불러오지 못했습니다.</div>`;
        }
      },
      {
        text:
          state.tab === "review"
            ? "후기를 불러오는 중..."
            : "질문을 불러오는 중...",
      }
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
    const { peer, review, updatedAt } = item;
    const row = document.createElement("div");
    row.className = "pd-item mj-review-row";

    // 별점 텍스트 생성
    const starsHtml = renderStars(review.rating);
    const dateStr = new Date(updatedAt).toLocaleDateString("ko-KR");

    row.innerHTML = `
      <div class="pd-item-top">
        <div class="mj-reviewer-info">
          <div class="mj-reviewer-avatar" style="background-image: url('${
            peer.profileImageUrl || ""
          }'); background-size: cover;">
            ${!peer.profileImageUrl ? "👤" : ""}
          </div>
          <div>
            <div class="pd-item-title">${escapeHtml(peer.nickname)} 
              <span class="mj-reviewer-univ">${escapeHtml(
                peer.university
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

  function renderQnaItem(item) {
    const session = getSession();
    const isOwner =
      session?.user && String(session.user.id) === String(profile.memberId);

    // 백엔드 데이터 구조에 맞게 변수 추출
    const qId = item.questionId;
    const studentNick = item.student?.nickname || "익명";
    const studentUniv = item.student?.university || "";
    const studentImg = item.student?.profileImageUrl || "";
    const qContent = item.question?.content || "";
    const aContent = item.answer?.content || "";
    const createdAt = item.question?.createdAt || item.createdAt;
    const hasAnswer = !!(item.answer && item.answer.content);

    const row = document.createElement("div");
    // Review와 동일한 class 구조(pd-item)를 사용하여 디자인 통일
    row.className = "pd-item mj-qna-row";

    const dateStr = createdAt
      ? new Date(createdAt).toLocaleDateString("ko-KR")
      : "";

    row.innerHTML = `
    <div class="pd-item-top">
      <div class="mj-reviewer-info">
        <div class="mj-reviewer-avatar" style="background-image: url('${studentImg}');">
          ${!studentImg ? "👤" : ""}
        </div>
        <div>
          <div class="pd-item-title">
            ${escapeHtml(studentNick)} 
            <span class="mj-reviewer-univ">${escapeHtml(
              item.student?.university || ""
            )}</span>
          </div>
          <div class="mj-qna-badge-wrap">
            <span class="mj-qna-status-badge" 
                  style="background-color: ${
                    hasAnswer ? "#ebf7ed" : "#f1f5f9"
                  }; 
                         color: ${hasAnswer ? "#2ecc71" : "#64748b"};">
              ${hasAnswer ? "답변완료" : "답변대기"}
            </span>
          </div>
        </div>
      </div>
      <div class="pd-date">${new Date(
        item.question?.createdAt
      ).toLocaleDateString()}</div>
    </div>
    
    <div class="pd-item-content mj-qna-content">
      <div class="mj-q-label" style="color: #2ecc71; font-weight: bold;">Q.</div>
      <div class="mj-q-text">${escapeHtml(qContent).replace(
        /\n/g,
        "<br>"
      )}</div>
    </div>

    <div class="mj-answer-section" id="ans-section-${qId}">
      ${
        hasAnswer
          ? `
          <div class="mj-answer-box" style="background-color: #f9fdfa; border-left: 4px solid #2ecc71; padding: 12px; margin-top: 12px; border-radius: 4px;">
            <div class="mj-answer-label" style="color: #16a34a; font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">전공자 답변</div>
            <div class="mj-answer-text">${escapeHtml(aContent).replace(
              /\n/g,
              "<br>"
            )}</div>
          </div>`
          : isOwner
          ? `
          <div class="mj-answer-input-container" style="margin-top: 12px;">
            <textarea id="textarea-${qId}" class="mj-answer-textarea" placeholder="답변을 입력해주세요..."></textarea>
            <button type="button" class="mj-ans-submit" style="background-color: #2ecc71;">등록</button>
          </div>`
          : ""
      }
    </div>
  `;

    // 이벤트 바인딩 (답변 등록 버튼)
    if (isOwner && !hasAnswer) {
      row.addEventListener("click", async (e) => {
        if (e.target.classList.contains("mj-ans-submit")) {
          const textarea = row.querySelector(`#textarea-${qId}`);
          await submitAnswer(qId, textarea.value);
        }
      });
    }

    return row;
  }

  function renderAnswerBox(answer, isOwner, qId) {
    return `
    <div class="mj-answer-box">
      <div class="mj-answer-header">
        <span class="mj-answer-label">전공자 답변</span>
      </div>
      <div class="mj-answer-text">${escapeHtml(answer).replace(
        /\n/g,
        "<br>"
      )}</div>
    </div>
  `;
  }

  // 2. 전공자(주인)에게만 보이는 답변 입력창 (텍스트 + 오른쪽 버튼)
  function renderAnswerInput(qId) {
    return `
    <div class="mj-answer-input-container">
      <textarea id="textarea-${qId}" class="mj-answer-textarea" placeholder="답변을 입력해주세요..."></textarea>
      <button type="button" class="mj-ans-submit">등록</button>
    </div>
  `;
  }

  async function submitAnswer(questionId, content) {
    if (!content.trim()) return alert("내용을 입력해주세요.");

    await withOverlayLoading(async () => {
      try {
        const res = await api.post(`/questions/${questionId}/answer`, {
          content,
        });
        if (res.success) {
          showOverlayCheck({ text: "답변이 등록되었습니다." });
          renderBottom(); // 목록 새로고침
        }
      } catch (e) {
        console.error(e);
        alert("답변 등록에 실패했습니다.");
      }
    });
  }

  async function handleCreateQuestion(content) {
    if (!content.trim()) {
      alert("질문 내용을 입력해주세요.");
      return;
    }

    await withOverlayLoading(
      async () => {
        try {
          // profile.memberId는 상세페이지 주인의 ID
          const res = await api.post(`/majors/${profile.memberId}/questions`, {
            content: content,
          });

          if (res.success) {
            showOverlayCheck({ text: "질문이 성공적으로 등록되었습니다." });
            // 입력창 초기화
            const textEl = document.getElementById("newQuestionText");
            if (textEl) textEl.value = "";
            // 목록 새로고침
            renderBottom();
          }
        } catch (e) {
          console.error("질문 등록 실패:", e);
          alert("질문 등록 중 오류가 발생했습니다.");
        }
      },
      { text: "질문을 등록하는 중..." }
    );
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
