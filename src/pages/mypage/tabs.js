// src/pages/mypage/tabs.js
// qna 관련 부분만 전체 교체 기준으로 제시
// - fetchAppliedInterviewDetail import 제거
// - openAppliedDetailWithLoading에서 fetchMyInterviewDetail로 교체
// - 모달/클릭 처리 로직은 기존 흐름을 유지하되, 함수/맵 처리와 주석을 정리한다

import { MYPAGE_TABS } from "./state.js";
import { renderProfileTab } from "./renderers/profile.js";

import { renderWrittenReviewItem } from "./renderers/review.js";
import { openReviewDetailModal } from "./components/reviewDetailModal.js";
import { openReviewEditModal } from "./components/reviewEditModal.js";
import { fetchMyReviewDetail } from "./api.js";

import { renderAppliedInterviewItem } from "./renderers/appliedInterview.js";
import { openAppliedInterviewDetailModal } from "./components/appliedInterviewDetailModal.js";

import { renderCompletedInterviewItem } from "./renderers/completedInterview.js";
import { openReviewCreateModal } from "./components/reviewCreateModal.js";
import { fetchMyInterviewDetail } from "./api.js"; // 2번 방식: 상세 조회는 통합 함수로 사용

import { renderMyQuestionItem } from "./renderers/qna.js";
import {
  openQnaEditModal,
  ensureQnaEditModal,
} from "./components/qnaEditModal.js";
import { deleteMyQuestion } from "./api.js";

import { renderInterviewSortBar } from "./ui/interviewSortBar.js";
import { renderPagination } from "./pagination.js";

import {
  startOverlayLoading,
  endOverlayLoading,
  showOverlayCheck,
} from "../../utils/overlay.js";

/*
  문자열 정규화 헬퍼
*/
function upper(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase();
}

/*
  QnA DTO 변화 대응
  - 서버 응답이 { questionId, questionContent } 형태이거나
    { question: { questionId, content } } 형태일 수 있어 둘 다 대응한다
*/
function pickQuestionId(it) {
  return String(it?.questionId ?? it?.question?.questionId ?? "").trim();
}

function pickQuestionContent(it) {
  return String(
    it?.question?.content ?? it?.questionContent ?? it?.content ?? ""
  ).trim();
}

export function initTabsSection(state) {
  const tabsEl = document.getElementById("mypageTabs");
  const listEl = document.getElementById("mypageList");
  const pagerEl = document.getElementById("mypagePagination");
  if (!tabsEl || !listEl || !pagerEl) return;

  // 정렬/필터 바(인터뷰 목록 탭에서 활용)
  const sortBarEl = document.createElement("div");
  sortBarEl.id = "mypageSortBar";
  sortBarEl.className = "mypage-sortbar-wrap";
  listEl.parentNode?.insertBefore(sortBarEl, listEl);

  // 상세 조회를 위해 목록 아이템을 id로 역참조한다
  const itemsByReviewId = new Map(); // reviewId -> item
  const itemsByQuestionId = new Map(); // questionId -> item

  renderTabs();
  bindTabClick();
  bindListEventsOnce();

  // 외부(페이지)에서 탭 재렌더링 호출할 수 있도록 핸들 주입
  state.renderActiveTab = renderActiveTab;

  // 후기 수정 후 목록 갱신
  window.addEventListener("mm:review-updated", async () => {
    if (state.activeTab === "reviews") await renderActiveTab();
  });

  // 후기 작성 후(완료 탭) 목록 갱신
  window.addEventListener("mm:review-created", async () => {
    if (state.activeTab === "completed") await renderActiveTab();
  });

  // QnA 수정 후 목록 갱신
  window.addEventListener("mm:question-updated", async () => {
    if (state.activeTab === "qna") await renderActiveTab();
  });

  /*
    현재 활성 탭 렌더링
    - state.loadActiveTab()는 탭별 목록 API 호출을 수행한다고 가정한다
  */
  async function renderActiveTab() {
    sortBarEl.innerHTML = "";
    sortBarEl.style.display = "none";

    listEl.innerHTML = "";
    pagerEl.innerHTML = "";

    itemsByReviewId.clear();
    itemsByQuestionId.clear();

    // 프로필 탭은 별도 렌더러 사용, 정렬바 숨김
    if (state.activeTab === "profile") {
      renderProfileTab(state);
      return;
    }

    // 프로필 외 탭은 정렬바 표시
    sortBarEl.style.display = "";
    renderInterviewSortBar(sortBarEl, {
      currentSort: state.listSort,
      showStatus: state.activeTab === "applied",
      currentStatus: state.appliedStatus || "ALL",

      // 정렬 변경: 값이 바뀐 경우만 재조회
      onChangeSort: async (nextSort) => {
        const next = upper(nextSort);
        if (!next) return;
        if (next === upper(state.listSort)) return;

        state.setListSort(next);
        await renderActiveTab();
      },

      // 신청(applied) 탭에서만 상태 필터 사용
      onChangeStatus: async (nextStatus) => {
        if (state.activeTab !== "applied") return;

        const next = upper(nextStatus);
        const cur = state.appliedStatus ? upper(state.appliedStatus) : "ALL";
        if (next === cur) return;

        state.setAppliedStatus(nextStatus);
        await renderActiveTab();
      },
    });

    try {
      startOverlayLoading();

      const res = await state.loadActiveTab();
      const items = normalizeItems(res);

      // 빈 목록 처리
      if (items.length === 0) {
        listEl.innerHTML = `<div class="empty">데이터가 없습니다.</div>`;
        renderPagerAlways(res?.meta);
        return;
      }

      // 리뷰 탭
      if (state.activeTab === "reviews") {
        for (const it of items) {
          const rid = String(it?.review?.reviewId ?? "").trim();
          if (rid) itemsByReviewId.set(rid, it);
        }
        listEl.innerHTML = items.map(renderWrittenReviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      // 신청 인터뷰 탭
      if (state.activeTab === "applied") {
        listEl.innerHTML = items.map(renderAppliedInterviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      // 완료 인터뷰 탭
      if (state.activeTab === "completed") {
        listEl.innerHTML = items.map(renderCompletedInterviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      // QnA 탭
      if (state.activeTab === "qna") {
        // 수정 모달 DOM은 최초 1회만 생성 시도
        ensureQnaEditModal();

        for (const it of items) {
          const qid = pickQuestionId(it);
          if (qid) itemsByQuestionId.set(qid, it);
        }
        listEl.innerHTML = items.map(renderMyQuestionItem).join("");
        enableQnaMoreButtons(listEl);
        renderPagerAlways(res?.meta);
        return;
      }

      // 알 수 없는 탭 키 방어
      listEl.innerHTML = `<div class="empty">탭을 확인해라</div>`;
      renderPagerAlways(res?.meta);
    } catch {
      listEl.innerHTML = `<div class="empty">목록 조회에 실패했다</div>`;
      renderPagerAlways({ page: 0, totalPages: 1 });
    } finally {
      endOverlayLoading();
    }
  }

  /*
    목록 이벤트는 1회만 바인딩하고, activeTab에 따라 분기 처리한다
  */
  function bindListEventsOnce() {
    listEl.addEventListener("click", onListClick);
    listEl.addEventListener("keydown", onListKeydown);
  }

  /*
    목록 클릭 처리
    - data-no-detail="true" 영역 클릭 시 상세 열지 않게 한다
  */
  async function onListClick(e) {
    const noDetail = e.target.closest?.('[data-no-detail="true"]');

    // 리뷰 탭: 상세/수정
    if (state.activeTab === "reviews") {
      const editBtn = e.target.closest?.('[data-action="open-review-edit"]');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();

        const reviewId = String(
          editBtn.getAttribute("data-review-id") || ""
        ).trim();
        const interviewId = String(
          editBtn.getAttribute("data-interview-id") || ""
        ).trim();
        if (!reviewId || !interviewId) return;

        const item = itemsByReviewId.get(reviewId);
        const rating = item?.review?.rating ?? 0;
        const content = item?.review?.content ?? "";

        openReviewEditModal({ reviewId, interviewId, rating, content });
        return;
      }

      if (noDetail) return;

      const row = e.target.closest?.('[data-action="open-review-detail"]');
      if (!row) return;

      const reviewId = String(row.getAttribute("data-review-id") || "").trim();
      if (!reviewId) return;

      await openReviewDetailWithLoading(reviewId);
      return;
    }

    // 신청 인터뷰 탭: 상세
    if (state.activeTab === "applied") {
      if (noDetail) return;

      const row = e.target.closest?.(
        '[data-action="open-applied-interview-detail"]'
      );
      if (!row) return;

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openInterviewDetailWithLoading(interviewId);
      return;
    }

    // 완료 인터뷰 탭: 후기 작성/상세
    if (state.activeTab === "completed") {
      const writeBtn = e.target.closest?.('[data-action="write-review"]');
      if (writeBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (writeBtn.hasAttribute("disabled")) return;

        const interviewId = String(
          writeBtn.getAttribute("data-interview-id") || ""
        ).trim();
        if (!interviewId) return;

        openReviewCreateModal({ interviewId });
        return;
      }

      if (noDetail) return;

      const row = e.target.closest?.(
        '[data-action="open-completed-interview-detail"]'
      );
      if (!row) return;

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openInterviewDetailWithLoading(interviewId);
      return;
    }

    // QnA 탭: 더보기/수정/삭제
    if (state.activeTab === "qna") {
      const toggleBtn = e.target.closest?.('[data-action="toggle-qna"]');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();

        const row = toggleBtn.closest?.(".mypage-qna-item");
        if (!row) return;

        const target = toggleBtn.getAttribute("data-target");
        const open = toggleBtn.getAttribute("data-open") === "true";

        const shortEl = row.querySelector(
          target === "question"
            ? '[data-part="q-short"]'
            : '[data-part="a-short"]'
        );
        const fullEl = row.querySelector(
          target === "question"
            ? '[data-part="q-full"]'
            : '[data-part="a-full"]'
        );
        if (!shortEl || !fullEl) return;

        const nextOpen = !open;

        if (nextOpen) {
          shortEl.hidden = true;
          fullEl.hidden = false;
          toggleBtn.textContent = "접기";
          toggleBtn.setAttribute("data-open", "true");
          toggleBtn.setAttribute("aria-expanded", "true");
        } else {
          shortEl.hidden = false;
          fullEl.hidden = true;
          toggleBtn.textContent = "더보기";
          toggleBtn.setAttribute("data-open", "false");
          toggleBtn.setAttribute("aria-expanded", "false");
        }
        return;
      }

      const editBtn = e.target.closest?.('[data-action="edit-qna"]');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (editBtn.hasAttribute("disabled")) return;

        const questionId = String(
          editBtn.getAttribute("data-question-id") || ""
        ).trim();
        if (!questionId) return;

        const item = itemsByQuestionId.get(questionId);
        if (!item) return;

        openQnaEditModal({
          questionId,
          content: pickQuestionContent(item),
        });
        return;
      }

      const delBtn = e.target.closest?.('[data-action="delete-qna"]');
      if (delBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (delBtn.hasAttribute("disabled")) return;

        const questionId = String(
          delBtn.getAttribute("data-question-id") || ""
        ).trim();
        if (!questionId) return;

        await confirmDeleteMyQuestion({ questionId });
        return;
      }

      return;
    }
  }

  /*
    키보드 접근성 처리
    - Enter/Space를 클릭과 동일하게 동작시키는 보조 처리
  */
  async function onListKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;

    if (state.activeTab === "reviews") {
      const row = e.target.closest?.('[data-action="open-review-detail"]');
      if (!row) return;
      e.preventDefault();

      const reviewId = String(row.getAttribute("data-review-id") || "").trim();
      if (!reviewId) return;

      await openReviewDetailWithLoading(reviewId);
      return;
    }

    if (state.activeTab === "applied") {
      const row = e.target.closest?.(
        '[data-action="open-applied-interview-detail"]'
      );
      if (!row) return;
      e.preventDefault();

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openInterviewDetailWithLoading(interviewId);
      return;
    }

    if (state.activeTab === "completed") {
      const writeBtn = e.target.closest?.('[data-action="write-review"]');
      if (writeBtn) {
        e.preventDefault();
        if (writeBtn.hasAttribute("disabled")) return;

        const interviewId = String(
          writeBtn.getAttribute("data-interview-id") || ""
        ).trim();
        if (!interviewId) return;

        openReviewCreateModal({ interviewId });
        return;
      }

      const row = e.target.closest?.(
        '[data-action="open-completed-interview-detail"]'
      );
      if (!row) return;
      e.preventDefault();

      const interviewId = String(
        row.getAttribute("data-interview-id") || ""
      ).trim();
      if (!interviewId) return;

      await openInterviewDetailWithLoading(interviewId);
      return;
    }

    if (state.activeTab === "qna") {
      const toggleBtn = e.target.closest?.('[data-action="toggle-qna"]');
      if (toggleBtn) {
        e.preventDefault();
        toggleBtn.click();
        return;
      }

      const editBtn = e.target.closest?.('[data-action="edit-qna"]');
      if (editBtn) {
        e.preventDefault();
        if (editBtn.hasAttribute("disabled")) return;
        editBtn.click();
        return;
      }

      const delBtn = e.target.closest?.('[data-action="delete-qna"]');
      if (delBtn) {
        e.preventDefault();
        if (delBtn.hasAttribute("disabled")) return;
        delBtn.click();
        return;
      }
    }
  }

  /*
    리뷰 상세 조회 + 모달 오픈
    - fetchMyReviewDetail은 data만 반환하도록 정리된 경우를 기준으로 처리한다
  */
  async function openReviewDetailWithLoading(reviewId) {
    try {
      startOverlayLoading();
      const detail = await fetchMyReviewDetail(reviewId);
      openReviewDetailModal(detail);
    } catch {
      alert("상세 조회에 실패했다");
    } finally {
      endOverlayLoading();
    }
  }

  /*
    인터뷰 상세 조회 + 모달 오픈
    - 2번 방식: fetchAppliedInterviewDetail 대신 fetchMyInterviewDetail을 사용한다
    - fetchMyInterviewDetail이 data만 반환하는 형태를 기준으로 처리한다
  */
  async function openInterviewDetailWithLoading(interviewId) {
    try {
      startOverlayLoading();
      const detail = await fetchMyInterviewDetail(interviewId);
      openAppliedInterviewDetailModal(detail);
    } catch {
      alert("상세 조회에 실패했다");
    } finally {
      endOverlayLoading();
    }
  }

  /*
    질문 삭제 확인 및 실행
    - 삭제 후 현재 탭이 qna면 목록을 다시 그린다
  */
  async function confirmDeleteMyQuestion({ questionId }) {
    const ok = confirm("정말 삭제할까?");
    if (!ok) return;

    try {
      startOverlayLoading();
      await deleteMyQuestion(questionId);

      if (state.activeTab === "qna") await state.renderActiveTab?.();
      window.dispatchEvent(new CustomEvent("mm:qna-updated"));
    } catch {
      alert("삭제에 실패했다");
    } finally {
      endOverlayLoading();
      showOverlayCheck({ durationMs: 900 });
    }
  }

  /*
    탭 렌더링
  */
  function renderTabs() {
    tabsEl.innerHTML = MYPAGE_TABS.map((t) => {
      const active = t.key === state.activeTab ? "active" : "";
      return `<button class="mypage-tab ${active}" type="button" data-tab="${t.key}">${t.label}</button>`;
    }).join("");
  }

  /*
    탭 클릭 바인딩
    - activeTab 변경 후 현재 탭을 렌더링한다
  */
  function bindTabClick() {
    tabsEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;

      const key = btn.getAttribute("data-tab");
      if (!key || key === state.activeTab) return;

      state.setActiveTab(key);
      renderTabs();
      await renderActiveTab();
    });
  }

  /*
    API 응답에서 items 배열 추출
    - res.data 또는 res.items를 허용
  */
  function normalizeItems(res) {
    const d = res?.data ?? res?.items ?? [];
    return Array.isArray(d) ? d : [];
  }

  /*
    페이저는 항상 렌더링
    - totalPages는 최소 1
    - page는 0-based -> 렌더는 1-based
  */
  function renderPagerAlways(meta) {
    const m = meta || {};
    const totalPages = normalizeTotalPages(m);
    const page1 = normalizePage1(m, totalPages);

    renderPagination(pagerEl, {
      page: page1,
      totalPages,
      onChange: async (nextPage1) => {
        state.paging.page = Math.max(0, Number(nextPage1) - 1);
        await renderActiveTab();
      },
    });
  }

  function normalizeTotalPages(meta) {
    const tp = Number(meta?.totalPages);
    if (Number.isFinite(tp) && tp > 0) return Math.trunc(tp);
    return 1;
  }

  function normalizePage1(meta, totalPages) {
    const p = Number(meta?.page);
    const candidate = Number.isFinite(p) ? Math.trunc(p) + 1 : 1;
    if (candidate < 1) return 1;
    if (candidate > totalPages) return totalPages;
    return candidate;
  }

  /*
    QnA 더보기 버튼 활성화
    - 텍스트 오버플로우를 감지해 더보기 버튼 표시 여부를 결정한다
  */
  function enableQnaMoreButtons(root) {
    root.querySelectorAll(".mypage-qna-item").forEach((row) => {
      applyOverflowToggle(
        row,
        "question",
        '[data-part="q-short"]',
        '[data-part="q-full"]'
      );
      applyOverflowToggle(
        row,
        "answer",
        '[data-part="a-short"]',
        '[data-part="a-full"]'
      );
    });
  }

  /*
    단일 row의 오버플로우 토글 상태 초기화
    - 오버플로우면: short 표시, full 숨김, 버튼 표시
    - 오버플로우가 아니면: full 표시, 버튼 숨김
  */
  function applyOverflowToggle(row, target, shortSel, fullSel) {
    const btn = row.querySelector(`.mypage-qna-more[data-target="${target}"]`);
    const shortEl = row.querySelector(shortSel);
    const fullEl = row.querySelector(fullSel);
    if (!btn || !shortEl || !fullEl) return;

    const shortText = String(shortEl.textContent ?? "").trim();
    const fullText = String(fullEl.textContent ?? "").trim();
    if (!shortText || !fullText) {
      btn.hidden = true;
      return;
    }

    // shortEl은 CSS로 line-clamp가 적용된 상태라는 가정
    const isOverflow = shortEl.scrollWidth > shortEl.clientWidth + 1;

    if (isOverflow) {
      btn.hidden = false;
      shortEl.hidden = false;
      fullEl.hidden = true;
      btn.textContent = "더보기";
      btn.setAttribute("data-open", "false");
      btn.setAttribute("aria-expanded", "false");
      return;
    }

    btn.hidden = true;
    shortEl.hidden = true;
    fullEl.hidden = false;
    btn.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");
  }
}
