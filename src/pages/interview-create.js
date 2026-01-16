import { api } from "../services/api.js";
import {
  showOverlayCheck,
  startOverlayLoading,
  endOverlayLoading,
} from "../utils/overlay.js";

export async function renderInterviewCreate(root, { id }) {
  // 팝업 전용 스타일 클래스를 감싸줍니다.
  root.innerHTML = `
    <div class="mj-popup-container">
      <div class="mj-popup-header">
        <h2 class="mj-popup-title">인터뷰 신청하기</h2>
        <p class="mj-popup-subtitle">학생에게 전달될 인터뷰 상세 내용을 작성해주세요.</p>
      </div>

      <form id="interviewForm" class="mj-popup-form">
        <div class="mj-form-group">
          <label for="title" class="mj-label">인터뷰 제목 <span class="required">*</span></label>
          <input type="text" id="title" name="title" class="mj-input" maxlength="255" 
            placeholder="예: [커리어 멘토링] 컴퓨터공학과 진로 상담" required>
        </div>

        <div class="mj-form-group">
          <label for="interviewMethod" class="mj-label">진행 방식 <span class="required">*</span></label>
          <select id="interviewMethod" name="interviewMethod" class="mj-select" required>
            <option value="">선택하세요</option>
            <option value="ONLINE_ZOOM">온라인 (Zoom/Google Meet)</option>
            <option value="ONLINE_CHAT">온라인 (카카오톡/채팅)</option>
            <option value="OFFLINE">오프라인 (대면)</option>
            <option value="PHONE">전화 인터뷰</option>
          </select>
        </div>

        <div class="mj-form-group">
          <label for="preferredDatetime" class="mj-label">희망 날짜 및 시간 <span class="required">*</span></label>
          <input type="datetime-local" id="preferredDatetime" name="preferredDatetime" class="mj-input" required>
          <p class="mj-help-text">현재 시간 이후로 선택 가능합니다.</p>
        </div>

        <div class="mj-form-group">
          <label for="content" class="mj-label">주요 인터뷰 내용 <span class="required">*</span></label>
          <textarea id="content" name="content" class="mj-textarea" rows="5" maxlength="5000"
            placeholder="인터뷰에서 다룰 주요 주제나 범위를 작성해주세요." required></textarea>
        </div>

        <div class="mj-form-group">
          <label for="extraDescription" class="mj-label">추가 전달 사항 (선택)</label>
          <textarea id="extraDescription" name="extraDescription" class="mj-textarea" rows="3" maxlength="2000"
            placeholder="..."></textarea>
        </div>

        <div class="mj-popup-actions">
          <button type="button" class="mj-btn mj-btn--ghost" onclick="window.close()">취소</button>
          <button type="submit" class="mj-btn mj-btn--primary">인터뷰 신청 완료</button>
        </div>
      </form>
    </div>
  `;

  const form = root.querySelector("#interviewForm");

  // 최소 날짜 제한 (오늘 이후)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  root.querySelector("#preferredDatetime").min = now.toISOString().slice(0, 16);

  form.onsubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const payload = {
      title: formData.get("title"),
      content: formData.get("content"),
      interviewMethod: formData.get("interviewMethod"),
      preferredDatetime: formData.get("preferredDatetime"), // ISO 8601 형식
      extraDescription: formData.get("extraDescription")
    };

    try {
      const res = await api.post(`majors/${id}/interviews`, payload);
      if (res.success) {
        alert("인터뷰 신청이 성공적으로 전달되었습니다.");
        // 부모 창의 목록을 갱신하기 위해 이벤트 발생
        if (window.opener) {
          window.opener.dispatchEvent(new CustomEvent("mj:interview-created"));
        }
        window.close();
      } else {
        alert(`신청 실패: ${res.message}`);
      }
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };
}