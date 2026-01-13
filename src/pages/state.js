// src/pages/mypage/state.js
import { fetchTabPage } from "./api.js";
import { buildTabs, setActiveTabUi } from "./tabs.js";

export function createMyPageState() {
  const state = {
    me: null,
    tabs: buildTabs(), // STUDENT 전용 탭 구성
    activeTab: null,
    page: 0,
    size: 10,
    totalPages: 0,
    setActiveTab,
    setPage,
    loadActiveTab,
  };

  state.activeTab = state.tabs[0]?.key || null;

  async function setActiveTab(tabKey) {
    if (!tabKey || tabKey === state.activeTab) return;
    state.activeTab = tabKey;
    state.page = 0;
    setActiveTabUi(tabKey);
    await loadActiveTab();
  }

  async function setPage(nextPage) {
    const p = Number(nextPage);
    if (!Number.isFinite(p)) return;
    if (p < 0) return;
    if (state.totalPages && p >= state.totalPages) return;
    if (p === state.page) return;

    state.page = p;
    await loadActiveTab();
  }

  async function loadActiveTab() {
    const tab = state.activeTab;
    if (!tab) return;

    const result = await fetchTabPage(tab, state.page, state.size);
    state.totalPages = result.totalPages || 0;

    state.renderList(result.content || []);
    state.renderPagination(state.totalPages);
  }

  return state;
}
