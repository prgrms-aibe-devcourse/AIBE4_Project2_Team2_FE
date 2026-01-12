// src/pages/mypage/template.js
export function template() {
  return `
    <div class="mypage-wrap">
      <section class="card mypage-activity" aria-label="내 활동">
        <div class="mypage-tabs" id="mypageTabs"></div>
        <div class="mypage-activity-body">
          <div id="mypageTabTitle" class="mypage-tab-title" style="display:none;"></div>
          <div class="mypage-list" id="mypageList"></div>
          <div class="pagination" id="mypagePagination"></div>
        </div>
      </section>
    </div>
  `;
}
