// src/pages/mypage/state.js
/*
  마이페이지 상태 관리
  - activeTab, paging, 정렬/필터 상태를 한 곳에서 관리한다
  - 탭별 목록 로더(loaders)에서 공통 fetchList를 사용한다
  - rememberLastTab=true면 마지막 탭을 localStorage에서 복원한다
  - 주의: 기존 코드에는 setActiveTab에서 항상 DEFAULT_TAB을 저장하는 버그가 있었다
*/

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

// qna는 다른 탭과 페이지 크기를 다르게 쓰는 요구사항이 있어 별도 상수로 둔다
const QNA_PAGE_SIZE = 2;

const ENDPOINTS = {
  // 리뷰 목록(작성한 후기만)
  reviews: { path: "/members/me/reviews", params: { type: "WRITTEN" } },

  // QnA 목록
  qna: { path: "/members/me/questions" },

  // 인터뷰 목록(내가 신청)
  applied: { path: "/members/me/interviews", params: { type: "APPLIED" } },

  // 완료된 인터뷰(후기 미작성만)
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

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function createMyPageState({ rememberLastTab = false } = {}) {
  const initialTab = rememberLastTab ? loadActiveKey(DEFAULT_TAB) : DEFAULT_TAB;

  // rememberLastTab을 쓰지 않는 경우에도 기본값은 저장해둔다
  if (!rememberLastTab) saveActiveKey(DEFAULT_TAB);

  const state = {
    // 내 정보 캐시
    me: null,
    _mePromise: null,

    // 탭/페이징
    activeTab: isValidKey(initialTab) ? initialTab : DEFAULT_TAB,
    paging: { page: 0, size: 5 },

    // 프로필 제외 공통 정렬
    listSort: "CREATED_AT_DESC",

    // applied 탭 전용 상태 필터(null=전체)
    appliedStatus: null,

    /*
      정렬 설정
      - 허용되지 않은 값은 무시
      - 정렬 변경 시 페이지는 0으로 리셋
    */
    setListSort(sort) {
      const s = upper(sort);
      if (!ALLOWED_SORTS.has(s)) return;
      state.listSort = s;
      state.paging.page = 0;
    },

    /*
      신청 인터뷰 상태 필터
      - "ALL" 또는 빈 값이면 전체(null)로 처리
      - 필터 변경 시 페이지는 0으로 리셋
    */
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

    /*
      기본 탭으로 리셋
    */
    resetToDefaultTab() {
      state.activeTab = DEFAULT_TAB;
      state.paging.page = 0;
      saveActiveKey(DEFAULT_TAB);
    },

    /*
      내 정보 로딩
      - 동시 호출 시 _mePromise로 중복 요청을 막는다
    */
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

    /*
      탭별 목록 로더
      - profile은 목록이 없으므로 빈 배열을 반환한다
      - qna는 size를 QNA_PAGE_SIZE로 강제한다
    */
    loaders: {
      profile: async () => ({
        success: true,
        data: [],
        meta: emptyMeta(state),
      }),

      reviews: async ({ page, size }) =>
        fetchList(ENDPOINTS.reviews, { page, size }, state),

      qna: async ({ page }) =>
        fetchList(ENDPOINTS.qna, { page, size: QNA_PAGE_SIZE }, state),

      applied: async ({ page, size }) =>
        fetchList(ENDPOINTS.applied, { page, size }, state),

      completed: async ({ page, size }) =>
        fetchList(ENDPOINTS.completed, { page, size }, state),
    },

    /*
      활성 탭 변경
      - 유효한 키만 허용
      - 변경된 탭 키를 localStorage에 저장하는 것이 맞다
      - 기존 코드의 버그: DEFAULT_TAB을 항상 저장하고 있었다
    */
    setActiveTab(key) {
      if (!isValidKey(key)) return;
      state.activeTab = key;
      saveActiveKey(key);
      state.paging.page = 0;
    },

    /*
      현재 활성 탭 로딩
      - 실패하더라도 meta 형식을 맞춘 응답을 반환하도록 정규화한다
    */
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

  // 초기 탭이 비정상인 경우 방어적으로 복구
  if (!isValidKey(state.activeTab)) {
    state.resetToDefaultTab();
  }

  return state;
}

/*
  목록 조회 공통 함수
  - endpointDef.params는 탭 고정 파라미터
  - state.listSort는 공통 정렬 파라미터
  - applied 탭인 경우에만 state.appliedStatus를 status로 추가한다
*/
async function fetchList(endpointDef, { page, size }, state) {
  const path = String(endpointDef?.path ?? "").trim();
  const fixedParams = endpointDef?.params ?? {};

  const pagingPage = toInt(page, 0);
  const pagingSize = toInt(size, 10);

  const sortParam = { sort: state?.listSort || "CREATED_AT_DESC" };

  // applied 목록에서만 상태 필터를 동적으로 붙인다
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
    page: pagingPage,
    size: pagingSize,
  });

  const url = qs ? `${path}?${qs}` : path;

  const res = await api.get(url);
  return normalizeListResponse(res, {
    paging: { page: pagingPage, size: pagingSize },
  });
}

/*
  서버 응답 정규화
  - { success, data, meta } 또는 { items, meta } 형태를 모두 허용
*/
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

/*
  meta 정규화
  - 페이지네이션 컴포넌트에서 기대하는 최소 필드를 보장한다
*/
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
    first: Boolean(meta?.first ?? page <= 0),
    last: Boolean(meta?.last ?? (totalPages <= 1 || page >= totalPages - 1)),
    hasNext: Boolean(
      meta?.hasNext ?? (totalPages > 1 && page < totalPages - 1)
    ),
    hasPrevious: Boolean(meta?.hasPrevious ?? page > 0),
  };
}

function emptyMeta(stateLike) {
  const page = Number(stateLike?.paging?.page ?? 0);
  const size = Number(stateLike?.paging?.size ?? 10);
  return {
    page: Number.isFinite(page) ? page : 0,
    size: Number.isFinite(size) ? size : 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false,
  };
}

/*
  탭 키 유효성
*/
function isValidKey(key) {
  return MYPAGE_TABS.some((t) => t.key === key);
}

/*
  마지막 활성 탭 로드
*/
function loadActiveKey(fallback) {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v || fallback;
  } catch {
    return fallback;
  }
}

/*
  마지막 활성 탭 저장
*/
function saveActiveKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {}
}

/*
  query string 생성
  - null/undefined는 제외한다
*/
function toQuery(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined) continue;
    params.set(k, String(v));
  }
  return params.toString();
}
