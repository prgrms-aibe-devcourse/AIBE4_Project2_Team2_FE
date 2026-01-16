import { navigate } from "../router.js";
import { api } from "../services/api.js";
import { withOverlayLoading } from "../utils/overlay.js";

export async function renderRecommend(root) {
  // 1. 전체를 감싸는 컨테이너 생성
  const container = document.createElement("div");
  container.style.maxWidth = "1200px";
  container.style.margin = "0 auto";
  container.style.padding = "20px";

  // 2. 헤더 (AI 추천 타이틀)
  const header = document.createElement("div");
  header.style.marginBottom = "30px";
  header.innerHTML = `
    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 10px;">
      <span style="color: #4ade80;">AI</span>가 추천하는 전공자
    </h2>
    <p style="color: #666; font-size: 14px;">
      회원님의 관심 전공과 연관성이 높은 전공자 3명을 분석했습니다.
    </p>
  `;
  container.appendChild(header);

  // 3. 카드 그리드 컨테이너 (home.js와 동일한 CSS 클래스 사용)
  const grid = document.createElement("div");
  grid.className = "cards-grid"; // CSS에 정의된 그리드 클래스
  container.appendChild(grid);

  // 4. 메인으로 돌아가는 버튼 (하단 배치)
  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "60px";
  btnContainer.style.textAlign = "center";
  btnContainer.style.paddingBottom = "40px"; // 하단 여백 추가

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "메인으로 돌아가기";
  
  // ★ 스타일 강제 적용 (CSS 클래스가 안 먹힐 때를 대비)
  Object.assign(btn.style, {
      display: "inline-block",
      height: "50px",
      padding: "0 32px",
      border: "1px solid #bce9b7", // 연한 테두리
      borderRadius: "999px",       // 둥근 알약 모양
      background: "linear-gradient(135deg, #d4f4a7 0%, #bce9b7 100%)", // 파스텔 그린 그라데이션
      color: "#1e293b",            // 진한 글자색
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.2s, box-shadow 0.2s"
  });

  // 호버 효과 (마우스 올렸을 때 살짝 위로)
  btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
  });
  
  // 마우스 뗐을 때 복귀
  btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
  });

  btn.addEventListener("click", () => navigate("/"));
  
  btnContainer.appendChild(btn);
  container.appendChild(btnContainer);

  // 5. Root에 추가
  root.appendChild(container);

  // 6. 데이터 로드 및 렌더링 실행
  await loadRecommendations();

  // --- 내부 함수들 ---

  async function loadRecommendations() {
    // 로딩 오버레이와 함께 API 호출
    await withOverlayLoading(async () => {
      try {
        // 백엔드 API 호출 (GET /api/recommendations)
        const response = await api.get("/recommendations");

        if (response.success && response.data) {
          renderCards(response.data);
        } else {
          showError("추천 데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("추천 로딩 실패:", error);
        showError("서버 통신 중 오류가 발생했습니다.");
      }
    }, { text: "AI가 멘토를 분석 중입니다..." });
  }

  function renderCards(profiles) {
    grid.innerHTML = "";

    if (!profiles || profiles.length === 0) {
      grid.innerHTML = `<div class="empty" style="grid-column: 1/-1; text-align: center; padding: 40px;">추천할 멘토를 찾지 못했습니다.</div>`;
      return;
    }

    profiles.forEach(p => {
      grid.appendChild(createCard(p));
    });
  }

  function createCard(p) {
    // home.js의 renderProfileCard 로직과 디자인을 동일하게 맞춤
    const card = document.createElement("article");
    card.className = "card";
    card.style.position = "relative";
    card.style.cursor = "pointer";

    // 클릭 시 상세 페이지 이동
    card.addEventListener("click", (e) => {
      // 태그 클릭 시 이동 방지
      if (e.target.closest(".tag")) return;
      navigate(`/major-card-detail/${p.id}`);
    });

    // --- 좋아요 버튼 제거됨 ---

    // 1. 프로필 이미지 스타일
    const avatarStyle = p.profileImageUrl
      ? `background-image: url('${p.profileImageUrl}'); background-size: cover;`
      : `background-color: #f1f5f9;`;

    // 2. 카드 상단 (Top)
    const top = document.createElement("div");
    top.className = "card-top";
    top.innerHTML = `
      <div class="card-avatar" style="${avatarStyle}"></div>
      <h3 class="card-title">${escapeHtml(p.nickname || p.name)}</h3>
      <p class="card-sub">${escapeHtml(p.university)}<br />${escapeHtml(p.major)}</p>
    `;
    card.appendChild(top);

    // 3. 카드 본문 (Body) - [가운데 정렬]
    const body = document.createElement("div");
    body.className = "card-body";
    body.style.textAlign = "center"; // ★ 가운데 정렬
    body.textContent = p.title || "한줄 소개가 없습니다.";
    card.appendChild(body);

    // 4. 태그 (Tags) - [가운데 정렬]
    const tags = document.createElement("div");
    tags.className = "tags";
    tags.style.justifyContent = "center"; // ★ 태그 컨테이너 가운데 정렬

    // 태그는 최대 3개까지만 노출
    (p.tags || []).slice(0, 3).forEach(t => {
      // home.js와 동일하게 button 태그 사용
      const tagBtn = document.createElement("button"); 
      tagBtn.className = "tag";
      tagBtn.type = "button";
      tagBtn.textContent = t.startsWith("#") ? t : `#${t}`;
      tags.appendChild(tagBtn);
    });
    card.appendChild(tags);

    return card;
  }

  function showError(msg) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">${msg}</div>`;
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