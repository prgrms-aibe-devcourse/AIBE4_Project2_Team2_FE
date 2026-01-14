// src/pages/mypage/state.js
import { api } from "../../services/api.js";

export const MYPAGE_TABS = [
  { key: "profile", label: "내 정보 수정" },
  { key: "applied", label: "내가 신청한 인터뷰" },
  { key: "completed", label: "완료된 인터뷰" },
  { key: "reviews", label: "내가 작성한 후기" },
  { key: "qna", label: "내가 작성한 질문" },
];

const STORAGE_KEY = "mypage.activeTab";
const DEFAULT_TAB = "profile";
const QNA_PAGE_SIZE = 2;

const ENDPOINTS = {
  // 변경: 통합 리뷰 목록 엔드포인트 + type=WRITTEN 고정
  reviews: { path: "/members/me/reviews", params: { type: "WRITTEN" } },
  qna: { path: "/members/me/questions" },

  applied: { path: "/members/me/interviews", params: { type: "APPLIED" } },
  completed: {
    path: "/members/me/interviews",
    params: { type: "APPLIED", status: "COMPLETED", reviewed: "false" },
  },
};

const ALLOWED_SORTS = new Set(["CREATED_AT_DESC", "CREATED_AT_ASC"]);
const ALLOWED_STATUSES = new Set([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
]);

function upper(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}

export function createMyPageState({ rememberLastTab = false } = {}) {
  const initialTab = rememberLastTab ? loadActiveKey(DEFAULT_TAB) : DEFAULT_TAB;
  if (!rememberLastTab) saveActiveKey(DEFAULT_TAB);

  const state = {
    me: null,
    _mePromise: null,

    activeTab: initialTab,
    paging: { page: 0, size: 5 },

    // 공통 정렬(프로필 제외 모든 탭에서 사용)
    listSort: "CREATED_AT_DESC",

    // applied 탭 전용 상태 필터(null=전체)
    appliedStatus: null,

    setListSort(sort) {
      const s = upper(sort);
      if (!ALLOWED_SORTS.has(s)) return;
      state.listSort = s;
      state.paging.page = 0;
    },

    setAppliedStatus(status) {
      const s = upper(status);
      if (!s || s === "ALL") {
        state.appliedStatus = null;
        state.paging.page = 0;
        return;
      }
      if (!ALLOWED_STATUSES.has(s)) return;
      state.appliedStatus = s;
      state.paging.page = 0;
    },

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
        fetchList(ENDPOINTS.reviews, { page, size }, state),

      qna: async ({ page, size }) =>
        fetchList(ENDPOINTS.qna, { page, size: QNA_PAGE_SIZE }, state),

      applied: async ({ page, size }) =>
        fetchList(ENDPOINTS.applied, { page, size }, state),

      completed: async ({ page, size }) =>
        fetchList(ENDPOINTS.completed, { page, size }, state),
    },

    setActiveTab(key) {
      if (!isValidKey(key)) return;
      state.activeTab = key;
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

async function fetchList(endpointDef, { page, size }, state) {
  const path = endpointDef?.path ?? "";
  const fixedParams = endpointDef?.params ?? {};

  const sortParam = { sort: state?.listSort || "CREATED_AT_DESC" };

  const isAppliedInterviewList =
    path === "/members/me/interviews" &&
    upper(fixedParams?.type) === "APPLIED" &&
    !("reviewed" in fixedParams);

  const statusParam =
    isAppliedInterviewList && state?.appliedStatus
      ? { status: state.appliedStatus }
      : {};

  const qs = toQuery({
    ...fixedParams,
    ...sortParam,
    ...statusParam,
    page,
    size,
  });
  const url = qs ? `${path}?${qs}` : path;

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
