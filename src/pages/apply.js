import { navigate } from "../router.js";

export function renderApply(root) {
  const wrap = document.createElement("div");
  wrap.className = "apply-wrap";

  wrap.innerHTML = `
    <h2 class="apply-title">전공자 지원하기</h2>

    <section class="card apply-card">
      <form class="apply-form" id="applyForm">
        <div class="apply-row">
          <label class="apply-label" for="name">이름</label>
          <input class="apply-input" id="name" name="name" placeholder="예: 홍길동" required />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="school">학교</label>
          <input class="apply-input" id="school" name="school" placeholder="예: 한국대학교" required />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="major">전공</label>
          <input class="apply-input" id="major" name="major" placeholder="예: 컴퓨터공학과" required />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="intro">한 줄 소개</label>
          <textarea class="apply-textarea" id="intro" name="intro" rows="4" placeholder="후배들에게 어떤 도움을 줄 수 있는지 짧게 적어줘" required></textarea>
        </div>

        <div class="apply-row">
          <label class="apply-label" for="tags">태그</label>
          <input class="apply-input" id="tags" name="tags" placeholder="예: 편입, 전과, 커리큘럼 (쉼표로 구분)" />
          <p class="apply-help">태그는 쉼표로 구분해서 입력한다</p>
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

  cancelBtn.addEventListener("click", () => navigate("/"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      school: String(fd.get("school") || "").trim(),
      major: String(fd.get("major") || "").trim(),
      intro: String(fd.get("intro") || "").trim(),
      tags: String(fd.get("tags") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    console.log("APPLY_PAYLOAD:", payload);
    alert("제출 처리 위치다. 콘솔 로그를 확인해줘");

    navigate("/");
  });
}
