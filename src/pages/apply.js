import { navigate } from "../router.js";
import { getSession } from "../auth/auth.js";

export function renderApply(root) {
  const wrap = document.createElement("div");
  wrap.className = "apply-wrap";

  wrap.innerHTML = `
    <h2 class="apply-title">전공자 지원하기</h2>

    <section class="card apply-card">
      <form class="apply-form" id="applyForm">
        <!-- 아이디 필드 추가됨 -->
        <div class="apply-row">
          <label class="apply-label" for="username">아이디</label>
          <input class="apply-input" id="username" name="username" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="name">이름</label>
          <input class="apply-input" id="name" name="name" placeholder="로딩 중..." readonly />
        </div>
        
         <div class="apply-row">
          <label class="apply-label" for="nickname">닉네임</label>
          <input class="apply-input" id="nickname" name="nickname" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="school">학교</label>
          <input class="apply-input" id="school" name="school" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="major">전공</label>
          <input class="apply-input" id="major" name="major" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="intro">한 줄 소개</label>
          <textarea class="apply-textarea" id="intro" name="intro" rows="4" placeholder="지원 하려는 이유를 짥게 작성해 주세요" required></textarea>
        </div>

        <div class="apply-row">
          <label class="apply-label" for="file">증빙 서류</label>
          <input class="apply-input" type="file" id="file" name="file" accept="image/*" required />
          <p class="apply-help">학생증 또는 재학증명서를 업로드해주세요.</p>
        </div>

        <div class="apply-btn-row">
          <button class="apply-submit" type="submit">지원서 제출</button>
          <button class="apply-cancel" type="button" id="cancelBtn">취소</button>
        </div>
      </form>
    </section>
  `;

  root.appendChild(wrap);
  const session = getSession();

  const form = wrap.querySelector("#applyForm");
  const cancelBtn = wrap.querySelector("#cancelBtn");

  const usernameInput = wrap.querySelector("#username");
  const nameInput = wrap.querySelector("#name");
  const nicknameInput = wrap.querySelector("#nickname");
  const schoolInput = wrap.querySelector("#school");
  const majorInput = wrap.querySelector("#major");

  // 1. 세션에서 내 정보 조회 및 표시
  try {
    const member = session?.user;

    if (member) {
      // 필드명 매핑
      usernameInput.value = member.username || "";
      nameInput.value = member.name || "";
      nicknameInput.value = member.nickname || "";
      schoolInput.value = member.university || "";
      majorInput.value = member.major || "";
    } else {
      console.warn("세션에 회원 정보가 없습니다.");
    }
  } catch (e) {
    console.error("세션 데이터 파싱 오류:", e);
  }

  let resubmitId = null;

  try {
    const resubmitDataStr = sessionStorage.getItem("resubmitData");
    if (resubmitDataStr) {
      const resubmitData = JSON.parse(resubmitDataStr);
      resubmitId = resubmitData.id;

      // 폼 채우기
      const introInput = wrap.querySelector("#intro");
      if (introInput) {
        introInput.value = resubmitData.comment || ""; // comment가 intro 내용
      }

      // 반려 사유 보여주기
      if (resubmitData.reason) {
        const reasonBox = document.createElement("div");
        reasonBox.className = "apply-row reject-reason-box";
        reasonBox.innerHTML = `
                  <label class="apply-label" style="color: #dc3545;">반려 사유</label>
                  <div class="apply-textarea" style="background: #fff5f5; border-color: #f5c6cb; color: #721c24;">
                      ${resubmitData.reason}
                  </div>
              `;
        const introRow =
          wrap.querySelector(".apply-row:has(#intro)") ||
          wrap.querySelectorAll(".apply-row")[3];
        introRow.parentNode.insertBefore(reasonBox, introRow);
      }

      // 사용 후 삭제 (새로고침 시 다시 안 뜨게)
      sessionStorage.removeItem("resubmitData");
    }
  } catch (e) {
    console.error("재신청 데이터 로드 오류:", e);
  }

  cancelBtn.addEventListener("click", () => navigate("/"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const file = fd.get("file");
    const intro = fd.get("intro");

    // 1. FormData 구성 (백엔드 구조와 일치)
    const submissionData = new FormData();
    const requestDto = { content: intro };

    // JSON 파트를 명시적인 Blob으로 추가 (Content-Type 지정)
    submissionData.append(
      "request",
      new Blob([JSON.stringify(requestDto)], {
        type: "application/json",
      })
    );

    if (file && file.size > 0) {
      submissionData.append("file", file);
    }

    try {
      const sessionStr = localStorage.getItem("mm_user");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      // 백엔드 엔드포인트 URL 조합
      const baseUrl = "http://localhost:8080/api"; // 본인의 백엔드 주소에 맞게 수정
      let endpoint = resubmitId
        ? `/major-requests/${resubmitId}`
        : "/major-requests";

      // 2. api.js 대신 표준 fetch를 직접 사용
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: resubmitId ? "PUT" : "POST",
        body: submissionData,
      });

      // 3. 응답 처리
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `서버 에러: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert("전공자 인증 요청이 완료되었습니다.");
        navigate("/");
      } else {
        alert("요청 실패: " + (result.message || "다시 시도해주세요."));
      }
    } catch (error) {
      console.error("Error 상세:", error);
      alert(`제출 중 오류 발생: ${error.message}`);
    }
  });
}
