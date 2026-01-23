// src/main.js
import "./css/mypage/modals-base.css";
import "./css/common.css";

import { startRouter } from "./router.js";
import { initOverlayEvents } from "./utils/overlay.js";
import { initNotification } from './services/notification.js';
import { api } from './utils/api.js';
initOverlayEvents();

// 1. 공통 기능 초기화
initOverlayEvents();

// 2. 앱 실행 (자동 시작)
(async function bootstrap() {
    try {
        // 내 정보 요청 (로그인 상태 확인)
        const response = await api.get('/members/me');

        // 로그인 성공 시
        if (response && response.data) {
            const myId = response.data.memberId;
            console.log("🔑 자동 로그인 확인 ID:", myId);

            // ★ 여기서 자동으로 알림을 켭니다! (이제 콘솔 입력 필요 없음)
            initNotification(myId);
        } else {
            console.log("👤 비로그인 상태");
        }
    } catch (e) {
        console.log("ℹ️ 로그인 정보 없음");
    } finally {
        // 라우터 시작 (화면 그리기)
        startRouter();
    }
})();
