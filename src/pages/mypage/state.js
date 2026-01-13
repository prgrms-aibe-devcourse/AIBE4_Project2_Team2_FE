// src/pages/mypage/state.js
import { api } from "../../services/api.js";

export const MYPAGE_TABS = [
  { key: "profile", label: "내 정보 수정" },
  { key: "reviews", label: "내가 작성한 후기" },
  { key: "qna", label: "내가 작성한 질문" },
  { key: "applied", label: "내가 신청한 인터뷰" },
  { key: "completed", label: "완료된 인터뷰" },
];

const STORAGE_KEY = "mypage.activeTab";
const DEFAULT_TAB = "profile";

/*
  응답 형태는 { success, data: [], meta } 를 기준으로 처리한다.
*/
const ENDPOINTS = {
  reviews: "/members/me/reviews/written",
  qna: "/mypage/qna",
  applied: "/members/me/interviews/applied",
  completed: "/members/me/interviews/applied/completed",
};

// rememberLastTab 기본값을 false로 둔다(항상 profile로 시작)
export function createMyPageState({ rememberLastTab = false } = {}) {
  const initialTab = rememberLastTab ? loadActiveKey(DEFAULT_TAB) : DEFAULT_TAB;

  // 마지막 탭 복원을 원치 않으면, 저장값도 profile로 덮어쓴다(확실하게)
  if (!rememberLastTab) saveActiveKey(DEFAULT_TAB);

  const state = {
    me: null,
    _mePromise: null,

    activeTab: initialTab,
    paging: { page: 0, size: 10 },

    // 마이페이지 진입 때 강제로 기본 탭으로 돌리고 싶을 때 호출한다
    resetToDefaultTab() {
      state.activeTab = DEFAULT_TAB;
      state.paging.page = 0;
      saveActiveKey(DEFAULT_TAB);
    },

    async loadMe() {
      if (state.me) return state.me;

      if (!state._mePromise) {
        state._mePromise = (async () => {
          const res = await api.get("/members/me");
          if (!res?.success) throw new Error(res?.message || "fetchMe failed");
          state.me = res.data;
          return state.me;
        })().finally(() => {
          state._mePromise = null;
        });
      }

      return state._mePromise;
    },

    loaders: {
      profile: async () => ({
        success: true,
        data: [],
        meta: emptyMeta(state),
      }),

      reviews: async ({ page, size }) =>
        fetchList(ENDPOINTS.reviews, { page, size }),

      qna: async ({ page, size }) => fetchList(ENDPOINTS.qna, { page, size }),

      applied: async ({ page, size }) =>
        fetchList(ENDPOINTS.applied, { page, size }),

      completed: async ({ page, size }) =>
        fetchList(ENDPOINTS.completed, { page, size }),
    },

    setActiveTab(key) {
      if (!isValidKey(key)) return;
      state.activeTab = key;

      // 요구사항: 다음번 마이페이지 진입 시 마지막 탭으로 가지 않게 한다
      // -> 기본은 profile로 덮어쓰고, 탭 클릭은 화면 내에서만 동작하면 된다
      // 그래도 혹시 새로고침/재진입 시에도 profile로 고정하려면 항상 profile을 저장한다
      saveActiveKey(DEFAULT_TAB);

      state.paging.page = 0;
    },

    async loadActiveTab() {
      const key = isValidKey(state.activeTab) ? state.activeTab : DEFAULT_TAB;
      const loader = state.loaders[key];
      if (!loader) return { success: true, data: [], meta: emptyMeta(state) };

      const res = await loader({
        page: state.paging.page,
        size: state.paging.size,
      });

      return normalizeListResponse(res, state);
    },
  };

  if (!isValidKey(state.activeTab)) {
    state.activeTab = DEFAULT_TAB;
    saveActiveKey(DEFAULT_TAB);
  }

  return state;
}

async function fetchList(endpoint, { page, size }) {
  const qs = toQuery({ page, size });
  const url = qs ? `${endpoint}?${qs}` : endpoint;

  const res = await api.get(url);
  return normalizeListResponse(res, { paging: { page, size } });
}

function normalizeListResponse(res, stateLike) {
  if (res && typeof res === "object" && "success" in res) {
    const data = Array.isArray(res.data) ? res.data : [];
    const meta = normalizeMeta(res.meta, stateLike);
    return { success: Boolean(res.success), data, meta };
  }

  if (res && typeof res === "object" && "items" in res) {
    const data = Array.isArray(res.items) ? res.items : [];
    const meta = normalizeMeta(res.meta, stateLike);
    return { success: true, data, meta };
  }

  return { success: true, data: [], meta: emptyMeta(stateLike) };
}

function normalizeMeta(meta, stateLike) {
  const page = Number(meta?.page ?? stateLike?.paging?.page ?? 0);
  const size = Number(meta?.size ?? stateLike?.paging?.size ?? 10);

  const totalElements = Number(meta?.totalElements ?? 0);
  const totalPages = Number(meta?.totalPages ?? 1);

  return {
    page: Number.isFinite(page) ? page : 0,
    size: Number.isFinite(size) ? size : 10,
    totalElements: Number.isFinite(totalElements) ? totalElements : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    first: Boolean(meta?.first ?? true),
    last: Boolean(meta?.last ?? true),
    hasNext: Boolean(meta?.hasNext ?? false),
    hasPrevious: Boolean(meta?.hasPrevious ?? false),
  };
}

function emptyMeta(stateLike) {
  const page = Number(stateLike?.paging?.page ?? 0);
  const size = Number(stateLike?.paging?.size ?? 10);
  return {
    page,
    size,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false,
  };
}

function isValidKey(key) {
  return MYPAGE_TABS.some((t) => t.key === key);
}

function loadActiveKey(fallback) {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v || fallback;
  } catch {
    return fallback;
  }
}

function saveActiveKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {}
}

function toQuery(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined) continue;
    params.set(k, String(v));
  }
  return params.toString();
}
