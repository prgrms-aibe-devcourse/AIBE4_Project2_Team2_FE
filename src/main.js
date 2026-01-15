// src/main.js
import "./css/mypage/_modals-base.css";

import { startRouter } from "./router.js";
import { initOverlayEvents } from "./utils/overlay.js";

initOverlayEvents();
startRouter();
