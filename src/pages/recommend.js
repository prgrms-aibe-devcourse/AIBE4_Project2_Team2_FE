import { navigate } from "../router.js";

export function renderRecommend(root) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-cta">
      <h3>AI 추천</h3>
      <p>질문 폼과 추천 결과 UI를 여기에 붙이면 된다.</p>
    </div>
  `;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cta-btn";
  btn.textContent = "메인으로";
  btn.addEventListener("click", () => navigate("/"));

  card.querySelector(".card-cta").appendChild(btn);
  root.appendChild(card);
}
