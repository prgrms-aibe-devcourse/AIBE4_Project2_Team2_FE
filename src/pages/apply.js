import { navigate } from "../router.js";

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

  const form = wrap.querySelector("#applyForm");
  const cancelBtn = wrap.querySelector("#cancelBtn");

  const usernameInput = wrap.querySelector("#username");
  const nameInput = wrap.querySelector("#name");
  const nicknameInput = wrap.querySelector("#nickname");
  const schoolInput = wrap.querySelector("#school");
  const majorInput = wrap.querySelector("#major");

  // 1. 세션 스토리지에서 내 정보 조회 및 표시
  try {
    // 저장된 키 이름 확인 필요 (예: "user", "member", "memberInfo" 등)
    const storedMember = sessionStorage.getItem("user");

    if (storedMember) {
      const member = JSON.parse(storedMember);

      // 필드명 매핑 (저장된 JSON 구조에 따라 수정 필요)
      usernameInput.value = member.username || member.id || "";
      nameInput.value = member.name || "";
      nicknameInput.value = member.nickname || "";
      schoolInput.value = member.university || member.school || "";
      majorInput.value = member.major || "";
    } else {
      // 정보가 없으면 로그인 페이지로 보내거나 다시 조회 시도
      console.warn("세션 스토리지에 회원 정보가 없습니다.");
      // navigate("/login"); // 필요 시 주석 해제
    }
  } catch (e) {
    console.error("회원 정보 파싱 오류:", e);
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

    const submissionData = new FormData();

    const requestDto = {
      content: intro,
    };

    const jsonBlob = new Blob([JSON.stringify(requestDto)], {
      type: "application/json",
    });
    submissionData.append("request", jsonBlob);

    if (file) {
      submissionData.append("file", file);
    }

    try {
      const token = localStorage.getItem("accessToken");

      let url = "/api/major-requests";
      let method = "POST";

      if (resubmitId) {
        url += `/${resubmitId}`;
        method = "PUT";
      }

      const response = await fetch("/api/major-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submissionData,
      });

      if (response.ok) {
        alert("전공자 인증 요청이 완료되었습니다.");
        navigate("/");
      } else {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          alert("요청 실패: " + (errorJson.message || errorText));
        } catch {
          alert("요청 실패: " + errorText);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버 통신 오류");
    }
  });
}
