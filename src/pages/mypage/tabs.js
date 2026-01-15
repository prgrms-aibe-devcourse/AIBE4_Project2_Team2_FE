// src/pages/mypage/tabs.js (qna 관련 부분만 전체 교체 기준으로 제시)
// 아래 코드는 기존 파일에서 qna 분기(렌더링/클릭 처리) 부분을 "그대로 유지"하면서,
// Map 키/콘텐츠 추출만 DTO 변화(QnaResponse)까지 대응하도록 수정한 버전이다.

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
import { fetchAppliedInterviewDetail } from "./api.js";

import { renderMyQuestionItem } from "./renderers/qna.js";
import { openQnaEditModal, ensureQnaEditModal } from "./components/qnaEditModal.js";
import { deleteMyQuestion } from "./api.js";

import { renderInterviewSortBar } from "./ui/interviewSortBar.js";

import { renderPagination } from "./pagination.js";
import {
  startOverlayLoading,
  endOverlayLoading,
  showOverlayCheck,
} from "../../utils/overlay.js";

function upper(v) {
  return String(v ?? "").trim().toUpperCase();
}

function pickQuestionId(it) {
  return String(it?.questionId ?? it?.question?.questionId ?? "").trim();
}

function pickQuestionContent(it) {
  return String(it?.question?.content ?? it?.questionContent ?? it?.content ?? "").trim();
}

export function initTabsSection(state) {
  const tabsEl = document.getElementById("mypageTabs");
  const listEl = document.getElementById("mypageList");
  const pagerEl = document.getElementById("mypagePagination");
  if (!tabsEl || !listEl || !pagerEl) return;

  const sortBarEl = document.createElement("div");
  sortBarEl.id = "mypageSortBar";
  sortBarEl.className = "mypage-sortbar-wrap";
  listEl.parentNode?.insertBefore(sortBarEl, listEl);

  const itemsByReviewId = new Map();
  const itemsByQuestionId = new Map();

  renderTabs();
  bindTabClick();
  bindListEventsOnce();

  state.renderActiveTab = renderActiveTab;

  window.addEventListener("mm:review-updated", async () => {
    if (state.activeTab === "reviews") await renderActiveTab();
  });

  window.addEventListener("mm:review-created", async () => {
    if (state.activeTab === "completed") await renderActiveTab();
  });

  window.addEventListener("mm:question-updated", async () => {
    if (state.activeTab === "qna") await renderActiveTab();
  });

  async function renderActiveTab() {
    sortBarEl.innerHTML = "";
    sortBarEl.style.display = "none";

    listEl.innerHTML = "";
    pagerEl.innerHTML = "";
    itemsByReviewId.clear();
    itemsByQuestionId.clear();

    if (state.activeTab === "profile") {
      renderProfileTab(state);
      return;
    }

    sortBarEl.style.display = "";
    renderInterviewSortBar(sortBarEl, {
      currentSort: state.listSort,
      showStatus: state.activeTab === "applied",
      currentStatus: state.appliedStatus || "ALL",
      onChangeSort: async (nextSort) => {
        const next = upper(nextSort);
        if (!next) return;
        if (next === upper(state.listSort)) return;

        state.setListSort(next);
        await renderActiveTab();
      },
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

      if (items.length === 0) {
        listEl.innerHTML = `<div class="empty">데이터가 없습니다.</div>`;
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "reviews") {
        for (const it of items) {
          const rid = String(it?.review?.reviewId ?? "").trim();
          if (rid) itemsByReviewId.set(rid, it);
        }
        listEl.innerHTML = items.map(renderWrittenReviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "applied") {
        listEl.innerHTML = items.map(renderAppliedInterviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "completed") {
        listEl.innerHTML = items.map(renderCompletedInterviewItem).join("");
        renderPagerAlways(res?.meta);
        return;
      }

      if (state.activeTab === "qna") {
        // 모달은 최초 1회 생성 시도(안전)
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

      listEl.innerHTML = items.map(() => "").join("");
      renderPagerAlways(res?.meta);
    } catch {
      listEl.innerHTML = `<div class="empty">목록 조회에 실패했다</div>`;
      renderPagerAlways({ page: 0, totalPages: 1 });
    } finally {
      endOverlayLoading();
    }
  }

  function bindListEventsOnce() {
    listEl.addEventListener("click", onListClick);
    listEl.addEventListener("keydown", onListKeydown);
  }

  async function onListClick(e) {
    const noDetail = e.target.closest?.('[data-no-detail="true"]');

    if (state.activeTab === "reviews") {
      const editBtn = e.target.closest?.('[data-action="open-review-edit"]');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();

        const reviewId = String(editBtn.getAttribute("data-review-id") || "").trim();
        const interviewId = String(editBtn.getAttribute("data-interview-id") || "").trim();
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

    if (state.activeTab === "applied") {
      if (noDetail) return;

      const row = e.target.closest?.('[data-action="open-applied-interview-detail"]');
      if (!row) return;

      const interviewId = String(row.getAttribute("data-interview-id") || "").trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }

    if (state.activeTab === "completed") {
      const writeBtn = e.target.closest?.('[data-action="write-review"]');
      if (writeBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (writeBtn.hasAttribute("disabled")) return;

        const interviewId = String(writeBtn.getAttribute("data-interview-id") || "").trim();
        if (!interviewId) return;

        openReviewCreateModal({ interviewId });
        return;
      }

      if (noDetail) return;

      const row = e.target.closest?.('[data-action="open-completed-interview-detail"]');
      if (!row) return;
      const interviewId = String(row.getAttribute("data-interview-id") || "").trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }

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
          target === "question" ? '[data-part="q-short"]' : '[data-part="a-short"]'
        );
        const fullEl = row.querySelector(
          target === "question" ? '[data-part="q-full"]' : '[data-part="a-full"]'
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

        const questionId = String(editBtn.getAttribute("data-question-id") || "").trim();
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

        const questionId = String(delBtn.getAttribute("data-question-id") || "").trim();
        if (!questionId) return;

        await confirmDeleteMyQuestion({ questionId });
        return;
      }
      return;
    }
  }

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
      const row = e.target.closest?.('[data-action="open-applied-interview-detail"]');
      if (!row) return;
      e.preventDefault();

      const interviewId = String(row.getAttribute("data-interview-id") || "").trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
      return;
    }

    if (state.activeTab === "completed") {
      const writeBtn = e.target.closest?.('[data-action="write-review"]');
      if (writeBtn) {
        e.preventDefault();
        if (writeBtn.hasAttribute("disabled")) return;

        const interviewId = String(writeBtn.getAttribute("data-interview-id") || "").trim();
        if (!interviewId) return;

        openReviewCreateModal({ interviewId });
        return;
      }

      const row = e.target.closest?.('[data-action="open-completed-interview-detail"]');
      if (!row) return;
      e.preventDefault();

      const interviewId = String(row.getAttribute("data-interview-id") || "").trim();
      if (!interviewId) return;

      await openAppliedDetailWithLoading(interviewId);
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

  async function openReviewDetailWithLoading(reviewId) {
    try {
      startOverlayLoading();
      const res = await fetchMyReviewDetail(reviewId);
      if (!res?.success) throw new Error(res?.message || "detail failed");
      openReviewDetailModal(res.data);
    } catch {
      alert("상세 조회에 실패했다");
    } finally {
      endOverlayLoading();
    }
  }

  async function openAppliedDetailWithLoading(interviewId) {
    try {
      startOverlayLoading();
      const res = await fetchAppliedInterviewDetail(interviewId);
      if (!res?.success) throw new Error(res?.message || "detail failed");
      openAppliedInterviewDetailModal(res.data);
    } catch {
      alert("상세 조회에 실패했다");
    } finally {
      endOverlayLoading();
    }
  }

  async function confirmDeleteMyQuestion({ questionId }) {
    const ok = confirm("정말 삭제할까?");
    if (!ok) return;

    try {
      startOverlayLoading();
      const res = await deleteMyQuestion(questionId);
      if (!res?.success) throw new Error(res?.message || "delete failed");

      if (state.activeTab === "qna") await state.renderActiveTab?.();
      window.dispatchEvent(new CustomEvent("mm:qna-updated"));
    } catch {
      alert("삭제에 실패했다");
    } finally {
      endOverlayLoading();
      showOverlayCheck({ durationMs: 900 });
    }
  }

  function renderTabs() {
    tabsEl.innerHTML = MYPAGE_TABS.map((t) => {
      const active = t.key === state.activeTab ? "active" : "";
      return `<button class="mypage-tab ${active}" type="button" data-tab="${t.key}">${t.label}</button>`;
    }).join("");
  }

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

  function normalizeItems(res) {
    const d = res?.data ?? res?.items ?? [];
    return Array.isArray(d) ? d : [];
  }

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

  function enableQnaMoreButtons(root) {
    root.querySelectorAll(".mypage-qna-item").forEach((row) => {
      applyOverflowToggle(row, "question", '[data-part="q-short"]', '[data-part="q-full"]');
      applyOverflowToggle(row, "answer", '[data-part="a-short"]', '[data-part="a-full"]');
    });
  }

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

    const isOverflow = shortEl.scrollWidth > shortEl.clientWidth + 1;

    if (isOverflow) {
      btn.hidden = false;
      shortEl.hidden = false;
      fullEl.hidden = true;
      btn.textContent = "더보기";
      btn.setAttribute("data-open", "false");
      btn.setAttribute("aria-expanded", "false");
    } else {
      btn.hidden = true;
      shortEl.hidden = true;
      fullEl.hidden = false;
      btn.setAttribute("data-open", "false");
      btn.setAttribute("aria-expanded", "false");
    }
  }
}
