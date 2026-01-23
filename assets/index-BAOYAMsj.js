(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const Wa="http://3.25.253.204:8080/api",va=Ja(Wa),Ka="mm_user",Qa="mm_session";let K=class extends Error{constructor(e,a,n){super(e),this.name="ApiError",this.status=a,this.data=n}};function Ja(t){const e=String(t).trim();return e.endsWith("/")?e.slice(0,-1):e}function Za(t){return/^https?:\/\//i.test(String(t||"").trim())}function fa(t,e){const a=String(e||"").trim();return a?Za(a)?a:a.startsWith("/")?`${t}${a}`:`${t}/${a}`:t}function Ya(t){return String(t||"").trim()}function Xa(t){const e=Ya(t);return e==="/auth/login"||e==="auth/login"||e==="/auth/signup"||e==="auth/signup"||e==="/auth/refresh"||e==="auth/refresh"||e==="/auth/logout"||e==="auth/logout"}async function de(t){const e=t.headers.get("content-type")||"";if(t.status===204)return null;if(e.includes("application/json"))try{return await t.json()}catch{}try{const a=await t.text();return a?{message:a}:null}catch{return null}}function tn(){try{window.dispatchEvent(new CustomEvent("mm:auth-expired"))}catch{}}function en(){localStorage.removeItem(Ka),localStorage.removeItem(Qa)}function Xt(t,e={}){const a=t!==void 0;return{...e,body:a?JSON.stringify(t):void 0,headers:{...e.headers||{},...a?{"Content-Type":"application/json"}:{}}}}async function an(){try{const t=await fetch(fa(va,"/auth/refresh"),{method:"POST",credentials:"include",headers:{Accept:"application/json"}}),e=await de(t);return t.ok&&!!(e!=null&&e.success)}catch{return!1}}async function ot(t,e={}){const a=fa(va,t),n={method:"GET",credentials:"include",...e,headers:{...e.headers||{}}},s=typeof FormData<"u"&&n.body instanceof FormData;n.body&&!s&&!n.headers["Content-Type"]&&(n.headers["Content-Type"]="application/json"),n.headers.Accept||(n.headers.Accept="application/json"),delete n.headers.Authorization;try{const i=await fetch(a,n),o=await de(i);if(i.ok)return o;if(i.status===401&&!Xa(t)){if(await an()){const m=await fetch(a,n),l=await de(m);if(m.ok)return l;throw new K((l==null?void 0:l.message)||"요청에 실패했습니다.",m.status,l)}throw en(),tn(),window.location.hash="#/login",new K("인증이 만료되었습니다. 다시 로그인하세요.",401,o)}throw new K((o==null?void 0:o.message)||"요청에 실패했습니다.",i.status,o)}catch(i){throw i instanceof K?i:new K("네트워크 오류가 발생했습니다.",0,null)}}const q={get:(t,e={})=>ot(t,{...e,method:"GET"}),post:(t,e,a={})=>ot(t,{method:"POST",...Xt(e,a)}),put:(t,e,a={})=>ot(t,{method:"PUT",...Xt(e,a)}),patch:(t,e,a={})=>ot(t,{method:"PATCH",...Xt(e,a)}),postForm:(t,e,a={})=>ot(t,{method:"POST",body:e,...a}),putForm:(t,e,a={})=>ot(t,{method:"PUT",body:e,...a}),patchForm:(t,e,a={})=>ot(t,{method:"PATCH",body:e,...a}),delete:(t,e={})=>ot(t,{...e,method:"DELETE"})},At="mm_user";localStorage.getItem("mm_session")&&(console.log("🧹 기존 mm_session 제거 중..."),localStorage.removeItem("mm_session"));function ut(){try{const t=localStorage.getItem(At);return t?{user:JSON.parse(t)}:null}catch{return null}}function Ft(){const t=ut();return!!(t&&t.user)}async function nn({username:t,password:e}){var a,n,s,i;try{console.log("🔐 로그인 시도:",t);const o=await q.post("/auth/login",{username:t,password:e});if(console.log("✅ 로그인 응답:",o),!(o!=null&&o.success))return console.error("❌ 로그인 실패:",o),{ok:!1,message:(o==null?void 0:o.message)||"로그인 실패"};try{console.log("👤 사용자 정보 조회 시작");const r=await q.get("/members/me");if(console.log("✅ 사용자 정보 응답:",r),r!=null&&r.success&&(r!=null&&r.data)){const m={memberId:r.data.memberId??"",name:r.data.name??"",nickname:r.data.nickname??"",email:r.data.email??"",username:r.data.username??"",profileImageUrl:r.data.profileImageUrl??"",status:r.data.status??"",university:r.data.university??"",major:r.data.major??"",role:r.data.role??"",authProvider:r.data.authProvider??""};return localStorage.setItem(At,JSON.stringify(m)),console.log("✅ 사용자 정보 저장 완료:",m),await sn(),{ok:!0,user:m}}else return console.error("❌ 사용자 정보 형식 오류:",r),{ok:!1,message:"사용자 정보 조회 실패"}}catch(r){return console.error("❌ 사용자 정보 조회 실패:",r),r instanceof K?(console.error("  - Status:",r.status),console.error("  - Data:",r.data),console.error("  - Message:",r.message),{ok:!1,message:((a=r.data)==null?void 0:a.message)||r.message||"사용자 정보 조회 실패"}):{ok:!1,message:"사용자 정보 조회 실패"}}}catch(o){return console.error("❌ 로그인 오류:",o),o instanceof K?(console.error("  - Status:",o.status),console.error("  - Data:",o.data),{ok:!1,message:((s=(n=o.data)==null?void 0:n.error)==null?void 0:s.message)||((i=o.data)==null?void 0:i.message)||o.message}):{ok:!1,message:"서버 연결 오류"}}}async function sn(){try{const t=await q.get("/major-requests/me"),e=localStorage.getItem(At);if(!e)return{ok:!1};const a=JSON.parse(e);if(t!=null&&t.success&&Array.isArray(t.data)&&t.data.length>0){const n=t.data[0];a.applicationStatus=n.applicationStatus??"",a.requestId=n.id??null,a.rejectReason=n.reason??""}else a.applicationStatus="NONE",a.requestId=null;return localStorage.setItem(At,JSON.stringify(a)),console.log("✅ 지원 상태 통합 완료:",a),{ok:!0,user:a}}catch(t){return console.warn("⚠️ 지원 정보 통합 실패:",t),{ok:!1,error:t}}}async function Te(){try{await q.post("/auth/logout")}catch(t){console.error("로그아웃 API 호출 실패:",t)}finally{localStorage.removeItem(At),localStorage.removeItem("mm_session")}}let wt=null,Et=null,dt=0,ga=0;function ya(){return document.getElementById("mmOverlay")}function rn(){return document.getElementById("mmOverlayText")}function St(t){const e=ya();if(e){if(t){e.classList.add("is-show"),e.setAttribute("aria-hidden","false");return}e.classList.remove("is-show"),e.setAttribute("aria-hidden","true"),e.dataset.mode=""}}function ba(t){const e=rn();if(!e)return;const a=String(t||"").trim();e.textContent=a,e.style.display=a?"block":"none"}function ha(t){const e=ya();e&&(e.dataset.mode=String(t||""))}function wa(){window.clearTimeout(wt),window.clearTimeout(Et),wt=null,Et=null}function X({durationMs:t=900,text:e=""}={}){wa(),ha("check"),ba(e),St(!0),wt=window.setTimeout(()=>{St(!1)},t)}function z({text:t="",delayMs:e=150,minVisibleMs:a=350}={}){if(window.clearTimeout(wt),dt+=1,ha("loading"),ba(t),dt>1){St(!0);return}ga=Date.now()+e+a,window.clearTimeout(Et),Et=window.setTimeout(()=>{dt>0&&St(!0)},e)}function O(){if(dt=Math.max(0,dt-1),dt!==0)return;window.clearTimeout(Et),Et=null;const t=Date.now(),e=Math.max(0,ga-t);window.clearTimeout(wt),wt=window.setTimeout(()=>{dt===0&&St(!1)},e)}function on(){dt=0,wa(),St(!1)}async function at(t,{text:e="",delayMs:a=150,minVisibleMs:n=350}={}){z({text:e,delayMs:a,minVisibleMs:n});try{return await t()}finally{O()}}function Ea(){window.addEventListener("mm:overlay-check",t=>{X((t==null?void 0:t.detail)||{})}),window.addEventListener("mm:overlay-loading-start",t=>{z((t==null?void 0:t.detail)||{})}),window.addEventListener("mm:overlay-loading-end",()=>{O()}),window.addEventListener("mm:overlay-hide",()=>{on()})}const qe=8,cn=2;async function ln(t){console.log("Before API Call:",document.cookie);const e={query:"",page:1,totalPages:1,profiles:[],isLoading:!1},{wrap:a,render:n,updatePagination:s}=o();t.appendChild(a),await i();async function i(){e.isLoading||(e.isLoading=!0,await at(async()=>{try{let r="";if(e.page===1?r=`/major-profiles?page=${e.page-1}&size=${qe}`:r=`/major-profiles?page=${e.page-1}&size=${qe+1}`,e.query&&e.query.trim()){const l=e.query.trim();if(l.startsWith("#")){const p=l.substring(1).trim();p&&(r+=`&searchType=tag&keyword=${encodeURIComponent(p)}`)}else r+=`&searchType=all&keyword=${encodeURIComponent(l)}`}const m=await q.get(r);if(m!=null&&m.success){const l=m.data;e.profiles=l.content,e.totalPages=l.totalPages,n(),s(),window.scrollTo({top:0,behavior:"smooth"})}else console.error("전공자 목록 조회 실패:",m==null?void 0:m.message)}catch(r){console.error("서버 통신 오류:",r)}finally{e.isLoading=!1}},{text:"전공자 목록을 불러오는 중입니다..."}))}function o(){const r=document.createElement("div"),m=document.createElement("div");m.className="search-row",m.innerHTML=`
      <input class="search-input" id="searchInput" placeholder="닉네임, 학교, 학과 또는 #태그 검색" />
      <button class="search-btn" id="searchBtn" type="button">검색</button>
    `,r.appendChild(m);const l=document.createElement("button");l.className="primary-wide",l.type="button",l.textContent="AI로 전공자 추천받기",l.addEventListener("click",()=>N("/recommend")),r.appendChild(l);const p=document.createElement("div");p.className="cards-grid",p.id="cardsGrid",r.appendChild(p);const d=document.createElement("div");d.className="pagination",d.id="pager",r.appendChild(d);const f=m.querySelector("#searchInput"),h=m.querySelector("#searchBtn"),y=()=>{e.query=f.value,e.page=1,i()};return f.addEventListener("keydown",b=>{b.key==="Enter"&&y()}),h.addEventListener("click",y),r.addEventListener("click",b=>{const u=b.target.closest("[data-tag]");if(!u)return;const v=`#${(u.getAttribute("data-tag")||"").replace(/^#/,"").trim()}`;e.query=v,e.page=1,f.value=v,i()}),r.addEventListener("click",b=>{const u=b.target.closest("[data-page]");if(!u)return;const g=Number(u.getAttribute("data-page"));!Number.isFinite(g)||g===e.page||(e.page=g,i())}),r.addEventListener("click",b=>{b.target.closest("[data-next]")&&e.page<e.totalPages&&(e.page+=1,i())}),{wrap:r,render:$,updatePagination:x};function $(){const b=e.profiles;if(p.innerHTML="",e.page===1){const u=Math.min(cn,b.length),g=[...b.slice(0,u).map(c=>({type:"profile",data:c})),{type:"apply"},...b.slice(u).map(c=>({type:"profile",data:c}))];for(const c of g)p.appendChild(c.type==="apply"?_():E(c.data))}else if(b.length===0)p.innerHTML='<div class="empty">등록된 프로필이 없습니다.</div>';else for(const u of b)p.appendChild(E(u))}function x(){d.innerHTML="";const b=e.totalPages;let u=Math.max(1,e.page-4),g=Math.min(b,u+9);g-u<9&&(u=Math.max(1,g-9));for(let c=u;c<=g;c+=1){const v=document.createElement("button");v.type="button",v.className=`page-btn ${c===e.page?"active":""}`,v.textContent=String(c),v.setAttribute("data-page",String(c)),d.appendChild(v)}if(e.page<b){const c=document.createElement("button");c.type="button",c.className="page-btn arrow",c.textContent="→",c.setAttribute("data-next","1"),d.appendChild(c)}}function E(b){const u=document.createElement("article");u.className="card",u.style.position="relative",u.style.cursor="pointer",u.addEventListener("click",L=>{L.target.closest(".tag")||L.target.closest(".btn-like")||N(`/major-card-detail/${b.id}`)});const g=b.id,c=document.createElement("button");c.type="button",c.className=`btn-like ${b.liked?"active":""}`,b.liked&&c.classList.add("active"),c.innerHTML=`
        <svg class="heart-icon" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="like-count">${b.likeCount||0}</span>
      `,c.addEventListener("click",async L=>{L.stopPropagation();const T=!c.classList.contains("active"),C=c.querySelector(".like-count");let j=parseInt(C.textContent);c.classList.toggle("active",T),C.textContent=T?j+1:Math.max(0,j-1);try{const A=await q.post(`/major-profiles/${g}/likes`);if(!A.success)throw new Error("좋아요 처리 실패");c.classList.toggle("active",A.data.liked),C.textContent=A.data.totalLikes}catch(A){console.error(A),c.classList.toggle("active",!T),C.textContent=j,alert("좋아요 처리에 실패했습니다.")}}),u.appendChild(c);const v=b.profileImageUrl?`background-image: url('${b.profileImageUrl}'); background-size: cover;`:"background-color: #f1f5f9;",w=document.createElement("div");w.className="card-top",w.innerHTML=`
        <div class="card-avatar" style="${v}" aria-hidden="true"></div>
        <h3 class="card-title">${P(b.nickname||b.name)}</h3>
        <p class="card-sub">${P(b.university)}<br />${P(b.major)}</p>
      `,u.appendChild(w);const S=document.createElement("div");S.className="card-body",S.textContent=b.title||"",u.appendChild(S);const k=document.createElement("div");k.className="tags";for(const L of b.tags||[]){const T=document.createElement("button");T.type="button",T.className="tag";const C=L;T.textContent=L.startsWith("#")?L:`#${L}`,T.setAttribute("data-tag",C),k.appendChild(T)}return u.appendChild(k),u}function _(){const b=document.createElement("article");b.className="card";let u="";try{const L=localStorage.getItem("mm_user");L&&(u=JSON.parse(L).applicationStatus||"")}catch(L){console.error("세션 파싱 오류:",L)}const g=document.createElement("div");g.className="card-cta";let c="전공자 지원하기",v="당신의 전공 경험을 공유하고<br />후배들에게 도움을 주세요!",w="지원하기",S="/apply";switch(u){case"PENDING":c="심사 진행 중",v="전공자 인증 심사가 진행 중입니다.<br />조금만 기다려 주세요!",w="심사 현황 보기",S="/major-profile";break;case"REJECTED":c="지원서 반려됨",v="인증 요청이 반려되었습니다.<br />사유를 확인하고 다시 시도해 주세요.",w="재신청 하기",S="/major-profile";break;case"ACCEPTED":c="인증 완료",v="전공자 인증이 완료되었습니다!<br />당신의 지식을 공유해 보세요.",w="내 프로필 보기",S="/major-profile";break}g.innerHTML=`
        <h3>${c}</h3>
        <p>${v}</p>
      `;const k=document.createElement("button");return k.type="button",k.className="cta-btn",k.textContent=w,k.addEventListener("click",()=>N(S)),g.appendChild(k),b.appendChild(g),b}function P(b){return String(b??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}}}function dn(){return`
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
  `}const je=[{key:"profile",label:"내 정보 수정"},{key:"applied",label:"신청한 인터뷰"},{key:"completed",label:"후기 작성하기"},{key:"reviews",label:"작성한 후기"},{key:"qna",label:"Q&A"}],Sa="mypage.activeTab",pt="profile",un=2,Mt={reviews:{path:"/members/me/reviews",params:{type:"WRITTEN"}},qna:{path:"/members/me/questions"},applied:{path:"/members/me/interviews",params:{type:"APPLIED"}},completed:{path:"/members/me/interviews",params:{type:"APPLIED",status:"COMPLETED",reviewed:"false"}}},mn=new Set(["CREATED_AT_DESC","CREATED_AT_ASC"]),pn=new Set(["PENDING","ACCEPTED","REJECTED","COMPLETED"]);function ue(t){return String(t??"").trim().toUpperCase()}function _e(t,e){const a=Number(t);return Number.isFinite(a)?a:e}function vn({rememberLastTab:t=!1}={}){const e=t?fn(pt):pt;t||te(pt);const a={me:null,_mePromise:null,activeTab:Nt(e)?e:pt,paging:{page:0,size:5},listSort:"CREATED_AT_DESC",appliedStatus:null,setListSort(n){const s=ue(n);mn.has(s)&&(a.listSort=s,a.paging.page=0)},setAppliedStatus(n){const s=ue(n);if(!s||s==="ALL"){a.appliedStatus=null,a.paging.page=0;return}pn.has(s)&&(a.appliedStatus=s,a.paging.page=0)},resetToDefaultTab(){a.activeTab=pt,a.paging.page=0,te(pt)},async loadMe(){return a.me?a.me:(a._mePromise||(a._mePromise=(async()=>{const n=await q.get("/members/me");if(!(n!=null&&n.success))throw new Error((n==null?void 0:n.message)||"fetchMe failed");return a.me=n.data,a.me})().finally(()=>{a._mePromise=null})),a._mePromise)},loaders:{profile:async()=>({success:!0,data:[],meta:me(a)}),reviews:async({page:n,size:s})=>Bt(Mt.reviews,{page:n,size:s},a),qna:async({page:n})=>Bt(Mt.qna,{page:n,size:un},a),applied:async({page:n,size:s})=>Bt(Mt.applied,{page:n,size:s},a),completed:async({page:n,size:s})=>Bt(Mt.completed,{page:n,size:s},a)},setActiveTab(n){Nt(n)&&(a.activeTab=n,te(n),a.paging.page=0)},async loadActiveTab(){const n=Nt(a.activeTab)?a.activeTab:pt,s=a.loaders[n];if(!s)return{success:!0,data:[],meta:me(a)};const i=await s({page:a.paging.page,size:a.paging.size});return Ca(i,a)}};return Nt(a.activeTab)||a.resetToDefaultTab(),a}async function Bt(t,{page:e,size:a},n){const s=String((t==null?void 0:t.path)??"").trim(),i=(t==null?void 0:t.params)??{},o=_e(e,0),r=_e(a,10),m={sort:(n==null?void 0:n.listSort)||"CREATED_AT_DESC"},p=s==="/members/me/interviews"&&ue(i==null?void 0:i.type)==="APPLIED"&&!("reviewed"in i)&&(n!=null&&n.appliedStatus)?{status:n.appliedStatus}:{},d=gn({...i,...m,...p,page:o,size:r}),f=d?`${s}?${d}`:s,h=await q.get(f);return Ca(h,{paging:{page:o,size:r}})}function Ca(t,e){if(t&&typeof t=="object"&&"success"in t){const a=Array.isArray(t.data)?t.data:[],n=Ae(t.meta,e);return{success:!!t.success,data:a,meta:n}}if(t&&typeof t=="object"&&"items"in t){const a=Array.isArray(t.items)?t.items:[],n=Ae(t.meta,e);return{success:!0,data:a,meta:n}}return{success:!0,data:[],meta:me(e)}}function Ae(t,e){var o,r;const a=Number((t==null?void 0:t.page)??((o=e==null?void 0:e.paging)==null?void 0:o.page)??0),n=Number((t==null?void 0:t.size)??((r=e==null?void 0:e.paging)==null?void 0:r.size)??10),s=Number((t==null?void 0:t.totalElements)??0),i=Number((t==null?void 0:t.totalPages)??1);return{page:Number.isFinite(a)?a:0,size:Number.isFinite(n)?n:10,totalElements:Number.isFinite(s)?s:0,totalPages:Number.isFinite(i)?i:1,first:!!((t==null?void 0:t.first)??a<=0),last:!!((t==null?void 0:t.last)??(i<=1||a>=i-1)),hasNext:!!((t==null?void 0:t.hasNext)??(i>1&&a<i-1)),hasPrevious:!!((t==null?void 0:t.hasPrevious)??a>0)}}function me(t){var n,s;const e=Number(((n=t==null?void 0:t.paging)==null?void 0:n.page)??0),a=Number(((s=t==null?void 0:t.paging)==null?void 0:s.size)??10);return{page:Number.isFinite(e)?e:0,size:Number.isFinite(a)?a:10,totalElements:0,totalPages:1,first:!0,last:!0,hasNext:!1,hasPrevious:!1}}function Nt(t){return je.some(e=>e.key===t)}function fn(t){try{return localStorage.getItem(Sa)||t}catch{return t}}function te(t){try{localStorage.setItem(Sa,t)}catch{}}function gn(t){const e=new URLSearchParams;for(const[a,n]of Object.entries(t||{}))n!=null&&e.set(a,String(n));return e.toString()}function Yt(t){return encodeURIComponent(String(t??"").trim())}function mt(t,e){if(!(t!=null&&t.success))throw new Error((t==null?void 0:t.message)||e||"요청에 실패했습니다");return t}async function yn(){const t=await q.get("/members/me");return mt(t,"내 정보 조회에 실패했습니다").data}async function bn(t){const e=await q.patch("/members/me",t);return mt(e,"내 정보 수정에 실패했습니다").data}async function hn(t){const e=new FormData;e.append("file",t);const a=await q.putForm("/members/me/profile-image",e,{headers:{}});return mt(a,"프로필 이미지 업로드에 실패했습니다").data}async function wn(){const t=await q.delete("/members/me/profile-image");return mt(t,"프로필 이미지 삭제에 실패했습니다").data}async function En(t){const e=await q.get(`/members/me/interviews/${Yt(t)}`);return mt(e,"인터뷰 상세 조회에 실패했습니다").data}async function Sn(t){const e=await q.get(`/members/me/reviews/${Yt(t)}`);return mt(e,"후기 상세 조회에 실패했습니다").data}async function Cn(t,e){const a=await q.patch(`/questions/${Yt(t)}`,e);return mt(a,"질문 수정에 실패했습니다").data}async function $n(t){const e=await q.delete(`/questions/${Yt(t)}`);return mt(e,"질문 삭제에 실패했습니다").data}function kn(t,e){const a={},n=t&&typeof t=="object"?t:{},s=e&&typeof e=="object"?e:{},i=$a(n.nickname);i&&(a.nickname=i),n.university!=null&&String(n.university).length>20&&(a.university="대학교명은 20자 이하입니다."),n.major!=null&&String(n.major).length>20&&(a.major="학과명은 20자 이하입니다.");const o=String(n.currentPassword||"").trim(),r=String(n.newPassword||"").trim(),m=String(n.newPasswordConfirm||"").trim(),l=jn(s),p=!!(o||r||m);if(!l){p&&(o&&(a.currentPassword="소셜 계정은 현재 비밀번호를 입력할 수 없습니다."),r&&(a.newPassword="소셜 계정은 비밀번호를 변경할 수 없습니다."),m&&(a.newPasswordConfirm="소셜 계정은 비밀번호를 변경할 수 없습니다."));const f=Object.keys(a).length===0;return{ok:f,fieldErrors:a,message:f?"":"입력값을 확인해 주세요."}}if(p){if(!o)a.currentPassword="현재 비밀번호가 필요합니다.";else{const f=Ot(o);f&&(a.currentPassword=f)}if(!r)a.newPassword="새 비밀번호가 필요합니다.";else{const f=Ot(r);f&&(a.newPassword=f)}m?r&&r!==m&&(a.newPasswordConfirm="새 비밀번호가 일치하지 않습니다."):a.newPasswordConfirm="새 비밀번호 확인이 필요합니다.",o&&r&&o===r&&(a.newPassword="새 비밀번호는 현재 비밀번호와 달라야 합니다.")}const d=Object.keys(a).length===0;return{ok:d,fieldErrors:a,message:d?"":"입력값을 확인해 주세요."}}function $a(t){const e=String(t||"").trim();return e?e.length<2||e.length>20?"닉네임은 2~20자입니다.":/^[가-힣a-zA-Z0-9_-]{2,20}$/.test(e)?"":"닉네임 형식이 올바르지 않습니다.":"닉네임은 필수입니다."}function Ot(t){const e=String(t||"").trim();return e?e.length<8||e.length>20?"비밀번호는 8~20자입니다.":/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(e)?"":"비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.":""}function Ln(t,e){const a=String(t||"").trim(),n=String(e||"").trim();return!a&&!n||!n||a===n?"":"새 비밀번호가 일치하지 않습니다."}function jn(t){const e=(t==null?void 0:t.authProvider)??null;if(e)return String(e).toUpperCase()==="LOCAL";const a=(t==null?void 0:t.username)??"",n=String(a).toLowerCase();return!(n.startsWith("google_")||n.startsWith("github_")||n.startsWith("kakao_")||n.startsWith("naver_"))}const pe="mm_user",In=[{value:"ENROLLED",label:"재학생"},{value:"GRADUATED",label:"졸업생"},{value:"HIGH_SCHOOL",label:"고등학생"},{value:"ETC",label:"기타"}];function xn(t){return t==="HIGH_SCHOOL"||t==="ETC"}function yt(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function ve(){try{const t=localStorage.getItem(pe);return t?JSON.parse(t):null}catch{return null}}function fe(t){try{t?localStorage.setItem(pe,JSON.stringify(t)):localStorage.removeItem(pe)}catch{}}function ge(t){try{window.dispatchEvent(new CustomEvent("mm:user-updated",{detail:{user:t}}))}catch{}}function ye(t,e){if(!t)return;const a=String(e||"").trim();if(!a){t.style.removeProperty("background-image"),t.style.removeProperty("background-size"),t.style.removeProperty("background-position"),t.style.removeProperty("background-repeat");return}t.style.backgroundImage=`url("${a}")`,t.style.backgroundSize="cover",t.style.backgroundPosition="center",t.style.backgroundRepeat="no-repeat"}function W(t,e){const a=document.getElementById(t);a&&(a.textContent=e?String(e):"")}function et(t,e){const a=document.getElementById(t);a&&a.classList.toggle("is-invalid",!!e)}function Tn(){const t=["err_form","err_nickname","err_status","err_university","err_major","err_currentPassword","err_newPassword","err_newPasswordConfirm"];for(const a of t)W(a,"");const e=["nickname","statusSelect","university","major","currentPassword","newPassword","newPasswordConfirm"];for(const a of e)et(a,!1)}function be(t){var i,o,r,m;const e={nickname:["err_nickname","nickname"],status:["err_status","statusSelect"],university:["err_university","university"],major:["err_major","major"],currentPassword:["err_currentPassword","currentPassword"],newPassword:["err_newPassword","newPassword"],newPasswordConfirm:["err_newPasswordConfirm","newPasswordConfirm"]},a=((i=t==null?void 0:t.error)==null?void 0:i.message)||(t==null?void 0:t.message)||"요청 값을 확인해 주세요.",n=((o=t==null?void 0:t.error)==null?void 0:o.fieldErrors)||(t==null?void 0:t.fieldErrors)||(t==null?void 0:t.errors)||null;if(Array.isArray(n)){let l=!1;for(const p of n){const d=String((p==null?void 0:p.field)||(p==null?void 0:p.name)||"").trim(),f=String((p==null?void 0:p.message)||"").trim();if(!d||!f)continue;const h=e[d];h&&(W(h[0],f),et(h[1],!0),l=!0)}l||W("err_form",a);return}if(n&&typeof n=="object"){let l=!1;for(const[p,d]of Object.entries(n)){const f=String(p||"").trim(),h=String(d||"").trim();if(!f||!h)continue;const y=e[f];y&&(W(y[0],h),et(y[1],!0),l=!0)}l||W("err_form",a);return}const s=((r=t==null?void 0:t.error)==null?void 0:r.field)||((m=t==null?void 0:t.error)==null?void 0:m.target)||(t==null?void 0:t.field)||(t==null?void 0:t.target)||null;if(s){const l=String(s).trim(),p=e[l];if(p){W(p[0],a),et(p[1],!0);return}}W("err_form",a)}function qn(t,e){if(!t||typeof t!="object"){W("err_nickname",e||"입력값을 확인해 주세요."),et("nickname",!0);return}const a={nickname:["err_nickname","nickname"],status:["err_status","statusSelect"],university:["err_university","university"],major:["err_major","major"],currentPassword:["err_currentPassword","currentPassword"],newPassword:["err_newPassword","newPassword"],newPasswordConfirm:["err_newPasswordConfirm","newPasswordConfirm"]};let n=!1;for(const[s,i]of Object.entries(t)){const o=a[s];if(!o)continue;const r=String(i||"").trim();r&&(W(o[0],r),et(o[1],!0),n=!0)}n||(W("err_nickname",e||"입력값을 확인해 주세요."),et("nickname",!0))}function he(t){const e=document.getElementById("labelUniversity"),a=document.getElementById("labelMajor"),n=xn(t);e&&(e.textContent=n?"희망 대학교":"대학교"),a&&(a.textContent=n?"희망 학과":"학과")}function _n(t){if(t&&!(t.options&&t.options.length>0))for(const e of In){const a=document.createElement("option");a.value=e.value,a.textContent=e.label,t.appendChild(a)}}function we(t,e){const a=t&&typeof t=="object"?t:{},n=e&&typeof e=="object"?e:{};return{...a,memberId:n.memberId??a.memberId,name:n.name??a.name,username:n.username??a.username,nickname:n.nickname??a.nickname,email:n.email??a.email,profileImageUrl:n.profileImageUrl??a.profileImageUrl??"",status:n.status??a.status,university:n.university??a.university,major:n.major??a.major,role:n.role??a.role,authProvider:n.authProvider??a.authProvider}}function An(t,e,a){const n=String(e||"").trim(),s=String(a||"").trim(),i=[n,s].filter(Boolean).join("/");return i?t==="ENROLLED"?`${i} 재학`:t==="GRADUATED"?`${i} 졸업`:`${i} 희망`:"-"}function Ee(t){const e=document.getElementById("mypageSummary");e&&(e.textContent=An(t==null?void 0:t.status,t==null?void 0:t.university,t==null?void 0:t.major))}function ka(t){const e=(t==null?void 0:t.authProvider)??null;if(e)return String(e).toUpperCase()==="LOCAL";const a=(t==null?void 0:t.username)??"",n=String(a).toLowerCase();return!(n.startsWith("google_")||n.startsWith("github_")||n.startsWith("kakao_")||n.startsWith("naver_"))}function Pn(t){const e=yt((t==null?void 0:t.name)||""),a=yt((t==null?void 0:t.username)||""),n=yt((t==null?void 0:t.nickname)||""),s=yt((t==null?void 0:t.email)||""),i=yt((t==null?void 0:t.university)||""),o=yt((t==null?void 0:t.major)||""),r=ka(t);return`
  <div class="mypage-profile" aria-label="내 정보 수정">
    <div class="mypage-profile-head">
      <div class="mypage-head-left">
        <div class="mypage-avatar mypage-avatar--lg" id="mypageAvatar" aria-hidden="true"></div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="mypage-head-text">
            <div class="mypage-nickname" id="mypageNickname">${n||"사용자"}</div>
            <div class="mypage-major" id="mypageSummary"></div>
          </div>

          <div style="display:flex; gap:8px; align-items:center;">
            <button class="mypage-mini-btn" type="button" id="btnProfileImageChange">이미지 변경</button>
            <button class="mypage-mini-btn" type="button" id="btnProfileImageDelete">이미지 삭제</button>
            <input type="file" id="profileImageFile" accept="image/*" style="display:none;" />
          </div>
        </div>
      </div>
    </div>

    <div class="mypage-divider"></div>

    <form class="mypage-form" id="mypageForm" novalidate>
      <div class="mypage-error mypage-error--form" id="err_form" aria-live="polite"></div>

      <div class="mypage-grid mypage-grid-2">
        <div class="mypage-field">
          <label class="mypage-label" for="name">이름</label>
          <input class="mypage-input" id="name" name="name" type="text" value="${e}" disabled />
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="username">아이디</label>
          <input class="mypage-input" id="username" name="username" type="text" value="${a}" disabled />
        </div>
      </div>

      <div class="mypage-grid mypage-grid-2">
        <div class="mypage-field">
          <label class="mypage-label mypage-label--required" for="nickname">닉네임</label>
          <input class="mypage-input" id="nickname" name="nickname" type="text" value="${n}" autocomplete="nickname" />
          <div class="mypage-error" id="err_nickname" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="email">이메일</label>
          <input class="mypage-input" id="email" name="email" type="email" value="${s}" autocomplete="email" disabled />
          <div class="mypage-error" id="err_email" aria-live="polite"></div>
        </div>
      </div>

      <div class="mypage-grid mypage-grid-3">
        <div class="mypage-field">
          <label class="mypage-label" for="statusSelect">신분</label>
          <select class="mypage-input" id="statusSelect" name="status"></select>
          <div class="mypage-error" id="err_status" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" id="labelUniversity" for="university">대학교</label>
          <input class="mypage-input" id="university" name="university" type="text" value="${i}" />
          <div class="mypage-error" id="err_university" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" id="labelMajor" for="major">학과</label>
          <input class="mypage-input" id="major" name="major" type="text" value="${o}" />
          <div class="mypage-error" id="err_major" aria-live="polite"></div>
        </div>
      </div>

      <div class="mypage-divider mypage-divider--dashed" aria-hidden="true"></div>

      ${r?`
      <div class="mypage-grid mypage-grid-3">
        <div class="mypage-field">
          <label class="mypage-label mypage-label--required" for="currentPassword">현재 비밀번호</label>
          <input class="mypage-input" id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" />
          <div class="mypage-error" id="err_currentPassword" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="newPassword">새 비밀번호</label>
          <input class="mypage-input" id="newPassword" name="newPassword" type="password" autocomplete="new-password" />
          <div class="mypage-error" id="err_newPassword" aria-live="polite"></div>
        </div>

        <div class="mypage-field">
          <label class="mypage-label" for="newPasswordConfirm">새 비밀번호 확인</label>
          <input class="mypage-input" id="newPasswordConfirm" name="newPasswordConfirm" type="password" autocomplete="new-password" />
          <div class="mypage-error" id="err_newPasswordConfirm" aria-live="polite"></div>
        </div>
      </div>
      `:`
      <div class="mypage-field">
        <div class="mypage-label">비밀번호</div>
        <div style="padding: 12px; background-color: #f8f9fa; border-radius: 4px; color: #6c757d; font-size: 14px;">
          소셜 로그인 계정은 비밀번호 변경이 불가능합니다.
        </div>
      </div>
      `}

      <div class="mypage-btn-row">
        <button class="mypage-save-btn" type="submit" id="btnSave">저장</button>
      </div>
    </form>
  </div>
  `}function Mn(t){const e=document.getElementById("mypageList"),a=document.getElementById("mypagePagination");if(!e)return;a&&(a.innerHTML="");const n=(t==null?void 0:t.me)??{};e.innerHTML=Pn(n);const s=document.getElementById("mypageAvatar");ye(s,n==null?void 0:n.profileImageUrl);const i=document.getElementById("statusSelect");_n(i);const o=(n==null?void 0:n.status)||"ENROLLED";i&&(i.value=o),he(o),Ee(n),i&&i.addEventListener("change",()=>{var r,m;he(i.value),Ee({...n,status:i.value,university:((r=document.getElementById("university"))==null?void 0:r.value)??n.university,major:((m=document.getElementById("major"))==null?void 0:m.value)??n.major})}),Bn(t),Nn(t),Dn(t)}function Bn(t){const e=document.getElementById("mypageForm");e&&e.addEventListener("submit",async a=>{var h,y,$,x,E,_,P;a.preventDefault(),Tn();const n=String(((h=document.getElementById("nickname"))==null?void 0:h.value)||"").trim(),s=String(((y=document.getElementById("statusSelect"))==null?void 0:y.value)||"").trim(),i=String((($=document.getElementById("university"))==null?void 0:$.value)??"").trim(),o=String(((x=document.getElementById("major"))==null?void 0:x.value)??"").trim(),r=String(((E=document.getElementById("currentPassword"))==null?void 0:E.value)||"").trim(),m=String(((_=document.getElementById("newPassword"))==null?void 0:_.value)||"").trim(),l=String(((P=document.getElementById("newPasswordConfirm"))==null?void 0:P.value)||"").trim(),p={nickname:n,currentPassword:r,newPassword:m||null,status:s||null,university:i,major:o},d={...p,newPasswordConfirm:l},f=kn(d,t==null?void 0:t.me);if(!f.ok){qn(f.fieldErrors,f.message);return}try{z();const b=await bn(p);t.me=b;const u=document.getElementById("mypageNickname");u&&(u.textContent=(b==null?void 0:b.nickname)||"사용자"),Ee(b);const g=document.getElementById("statusSelect"),c=document.getElementById("university"),v=document.getElementById("major"),w=(b==null?void 0:b.status)||"ENROLLED";g&&(g.value=w),c&&(c.value=String((b==null?void 0:b.university)??"")),v&&(v.value=String((b==null?void 0:b.major)??"")),he(w);const S=ve(),k=we(S,b);fe(k),ge(k);const L=document.getElementById("currentPassword"),T=document.getElementById("newPassword"),C=document.getElementById("newPasswordConfirm");L&&(L.value=""),T&&(T.value=""),C&&(C.value=""),O(),X({durationMs:1e3})}catch(b){if(O(),b instanceof K){be(b.data);return}W("err_form","서버 통신에 실패했습니다.")}})}function Nn(t){const e=document.getElementById("btnProfileImageChange"),a=document.getElementById("btnProfileImageDelete"),n=document.getElementById("profileImageFile");e&&n&&(e.addEventListener("click",()=>{n.click()}),n.addEventListener("change",async()=>{const s=n.files&&n.files[0];if(s)try{z();const i=await hn(s);t.me=i;const o=document.getElementById("mypageAvatar");ye(o,i==null?void 0:i.profileImageUrl);const r=ve(),m=we(r,i);fe(m),ge(m),O(),X({durationMs:900})}catch(i){if(O(),i instanceof K){be(i.data);return}W("err_form","이미지 업로드에 실패했습니다.")}finally{n.value=""}})),a&&a.addEventListener("click",async()=>{if(confirm("프로필 이미지를 삭제하시겠습니까?"))try{z();const i=await wn();i&&(i.profileImageUrl===null||i.profileImageUrl===void 0)&&(i.profileImageUrl=""),t.me=i;const o=document.getElementById("mypageAvatar");ye(o,i==null?void 0:i.profileImageUrl);const r=ve(),m=we(r,i);m.profileImageUrl=i!=null&&i.profileImageUrl?String(i.profileImageUrl):"",fe(m),ge(m),O(),X({durationMs:1e3})}catch(i){if(O(),i instanceof K){be(i.data);return}W("err_form","이미지 삭제에 실패했습니다.")}})}function Dn(t){const e=document.getElementById("nickname");if(!e)return;const a=document.getElementById("currentPassword"),n=document.getElementById("newPassword"),s=document.getElementById("newPasswordConfirm"),i=ka(t==null?void 0:t.me),o={nickname:!1,currentPassword:!1,newPassword:!1,newPasswordConfirm:!1},r=()=>{const m=String(e.value||""),l=o.nickname?$a(m):"";if(W("err_nickname",l),et("nickname",!!l),!a||!n||!s)return;if(!i){W("err_currentPassword",""),et("currentPassword",!1),W("err_newPassword",""),et("newPassword",!1),W("err_newPasswordConfirm",""),et("newPasswordConfirm",!1);return}const p=String(a.value||""),d=String(n.value||""),f=String(s.value||""),h=o.currentPassword&&p.trim()?Ot(p):"",y=o.newPassword&&d.trim()?Ot(d):"",$=o.newPasswordConfirm||o.newPassword?Ln(d,f):"";W("err_currentPassword",h),et("currentPassword",!!h),W("err_newPassword",y),et("newPassword",!!y),W("err_newPasswordConfirm",$),et("newPasswordConfirm",!!$)};e.addEventListener("focus",()=>{o.nickname=!0,r()}),e.addEventListener("input",()=>{o.nickname=!0,r()}),a&&(a.addEventListener("focus",()=>{o.currentPassword=!0,r()}),a.addEventListener("input",()=>{o.currentPassword=!0,r()})),n&&(n.addEventListener("focus",()=>{o.newPassword=!0,r()}),n.addEventListener("input",()=>{o.newPassword=!0,r()})),s&&(s.addEventListener("focus",()=>{o.newPasswordConfirm=!0,r()}),s.addEventListener("input",()=>{o.newPasswordConfirm=!0,r()}))}function I(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function H(t){return I(t)}function La(t){const e=Number(t),a=Number.isFinite(e)?e:0,n=Math.max(0,Math.min(5,a)),s=Math.round(n);let i="";for(let o=1;o<=5;o+=1)i+=`<span class="star ${o<=s?"on":""}">★</span>`;return i}function Un(t){const e=(t==null?void 0:t.peer)??{},a=(t==null?void 0:t.review)??{},n=(t==null?void 0:t.interview)??{},s=Pe(a==null?void 0:a.reviewId),i=Pe(n==null?void 0:n.interviewId),o=vt(e==null?void 0:e.profileImageUrl,""),r=vt(e==null?void 0:e.nickname,"-"),m=vt(e==null?void 0:e.university,""),l=vt(e==null?void 0:e.major,""),p=Rn(m,l),d=Hn(a==null?void 0:a.rating,0,5),f=vt(a==null?void 0:a.content,""),h=vt(t==null?void 0:t.createdAt,""),y=vt(t==null?void 0:t.updatedAt,""),$=Me(h),x=Me(y),E=Fn(h,y),_=o?`background-image:url('${H(o)}')`:"";return`
    <div class="mypage-item mypage-review-item"
      data-action="open-review-detail"
      data-review-id="${H(s)}"
      role="button"
      tabindex="0"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left">
          <div class="mypage-review-avatar" style="${_}"></div>

          <div class="mypage-review-head">
            <div class="mypage-item-title">
              ${I(r)}${p?` <span class="mypage-review-sub">(${I(p)})</span>`:""}
            </div>
            <div class="mypage-stars">${La(d)}</div>
          </div>
        </div>

        <div class="mypage-review-meta">
          <div class="mypage-date">
            <span class="mypage-date-label">작성일</span>
            <span class="mypage-date-value">${I($)}</span>
          </div>

          ${E?`<div class="mypage-date mypage-date--edited">
                   <span class="mypage-date-label">수정일</span>
                   <span class="mypage-date-value">${I(x)}</span>
                 </div>`:""}
        </div>
      </div>

      <div class="mypage-review-bottom">
        <div class="mypage-review-snippet" data-no-detail="true">${I(f)}</div>

        <button
          class="mypage-mini-btn mypage-review-edit-btn"
          type="button"
          data-action="open-review-edit"
          data-review-id="${H(s)}"
          data-interview-id="${H(i)}"
          data-no-detail="true"
          ${i?"":"disabled"}
        >수정하기</button>
      </div>
    </div>
  `}function vt(t,e=""){const a=String(t??"").trim();return a||e}function Pe(t){return String(t??"").trim()}function Rn(t,e){const a=String(t??"").trim(),n=String(e??"").trim();return!a&&!n?"":a&&n?`${a} / ${n}`:a||n}function Hn(t,e,a){const n=Number(t);return Number.isFinite(n)?Math.min(a,Math.max(e,Math.trunc(n))):e}function Me(t){const e=String(t??"").trim();return e?e.length>=10?e.slice(0,10):e:"-"}function Fn(t,e){const a=Be(t),n=Be(e);return!a||!n?!1:n.getTime()>a.getTime()}function Be(t){const e=String(t??"").trim();if(!e)return null;const a=new Date(e);return Number.isFinite(a.getTime())?a:null}let Ne=!1;function On(){if(document.getElementById("reviewDetailModal")||Ne)return;Ne=!0;const t=document.createElement("div");t.id="reviewDetailModal",t.className="mm-modal",t.innerHTML=`
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="후기 상세">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="reviewDetailBody"></div>
    </div>
  `,document.body.appendChild(t),t.addEventListener("click",e=>{var n,s;((s=(n=e.target)==null?void 0:n.getAttribute)==null?void 0:s.call(n,"data-action"))==="close"&&De()}),window.addEventListener("keydown",e=>{e.key==="Escape"&&De()})}function zn(t){On();const e=document.getElementById("reviewDetailModal"),a=document.getElementById("reviewDetailBody");!e||!a||(a.innerHTML=Gn(t),ja(a),e.classList.add("is-open"),document.body.classList.add("mm-modal-open"))}function De(){const t=document.getElementById("reviewDetailModal"),e=document.getElementById("reviewDetailBody");t&&(t.classList.remove("is-open"),document.body.classList.remove("mm-modal-open"),e&&ja(e))}function Gn(t){const e=(t==null?void 0:t.peer)||{},a=(t==null?void 0:t.review)||{},n=(t==null?void 0:t.interview)||null,s=String((e==null?void 0:e.profileImageUrl)||"").trim(),i=st(e==null?void 0:e.nickname,"-"),o=`${st(e==null?void 0:e.university,"")}${e!=null&&e.university&&(e!=null&&e.major)?" / ":""}${st(e==null?void 0:e.major,"")}`.trim(),r=Number((a==null?void 0:a.rating)||0),m=st(a==null?void 0:a.content,"-"),l=String((n==null?void 0:n.status)||"").trim(),p=ee(t==null?void 0:t.createdAt)||"-",d=ee(t==null?void 0:t.updatedAt)||"-",f=Vn(t==null?void 0:t.createdAt,t==null?void 0:t.updatedAt),h=f?`<span class="mm-date-label">작성일</span> ${I(p)} · <span class="mm-date-label">수정일</span> ${I(d)}`:`<span class="mm-date-label">작성일</span> ${I(p)}`,y=f?`작성일 ${p} · 수정일 ${d}`:`작성일 ${p}`,$=st(n==null?void 0:n.title,"-"),x=st(n==null?void 0:n.content,"-"),E=st(n==null?void 0:n.interviewMethod,"-"),_=ee(n==null?void 0:n.preferredDatetime)||"-",P=st(n==null?void 0:n.extraDescription,"-"),b=st(n==null?void 0:n.majorMessage,"-");return`
    <div class="mm-modal__stack">

      <div class="mm-card mm-card--hero">
        <div class="mm-hero2">
          <div class="mm-hero2__avatar" style="${s?`background-image:url('${H(s)}')`:""}"></div>

          <div class="mm-hero2__main">
            <div class="mm-hero2__line">
              <span class="mm-hero2__name">${I(i)}</span>
              <span class="mm-hero2__paren">(${I(o||"-")})</span>
            </div>
          </div>

          <div class="mm-hero2__badge">
            ${l?`<div class="mm-badge" data-tone="dark">${I(l)}</div>`:""}
          </div>

          <div class="mm-hero2__dates mm-hero2__dates--inline" title="${H(y)}">
            ${h}
          </div>
        </div>
      </div>

      <div class="mm-card">
        <div class="mm-card__title">인터뷰 신청 정보</div>
        ${n?`
          <div class="mm-kv2">
            <div class="mm-kv2__row">
              <div class="mm-kv2__k">제목</div>
              <div class="mm-kv2__v">${I($)}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">내용</div>
              <div class="mm-kv2__v mm-pre">${I(x)}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">진행 방식</div>
              <div class="mm-kv2__v">${I(E)}</div>
            </div>

            <div class="mm-kv2__row">
              <div class="mm-kv2__k">희망 일시</div>
              <div class="mm-kv2__v">${I(_)}</div>
            </div>

            ${n!=null&&n.extraDescription?`
              <div class="mm-kv2__row">
                <div class="mm-kv2__k">추가 설명</div>
                <div class="mm-kv2__v mm-pre">${I(P)}</div>
              </div>
              `:""}

            ${n!=null&&n.majorMessage?`
              <div class="mm-kv2__row">
                <div class="mm-kv2__k">전공자 메시지</div>
                <div class="mm-kv2__v mm-pre">${I(b)}</div>
              </div>
              `:""}
          </div>
          `:'<div class="mm-empty">상세에서만 제공되는 정보입니다</div>'}
      </div>

      <div class="mm-card">
        <div class="mm-card__head mm-card__head--review">
          <div class="mm-card__head-left">
            <div class="mm-card__title mm-card__title--inline">내 후기</div>
            <div class="mm-review__stars mm-review__stars--inline">${La(r)}</div>
          </div>

          <div class="mm-card__head-right mm-review__dates mm-review__dates--top" title="${H(y)}">
            ${h}
          </div>
        </div>

        <div class="mm-review">
          <div class="mm-review__content mm-pre">${I(m)}</div>

          <div class="mm-review__dates mm-review__dates--below" title="${H(y)}">
            ${h}
          </div>
        </div>
      </div>

    </div>
  `}function st(t,e){const a=String(t??"").trim();return a||(e??"")}function ee(t){const e=String(t??"").trim();return e?e.length>=16?e.slice(0,16).replace("T"," "):e.length>=10?e.slice(0,10):e:""}function Vn(t,e){const a=Ue(t),n=Ue(e);return n?a?n!==a:!0:!1}function Ue(t){const e=String(t||"").trim();if(!e)return"";const a=e.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);if(!a)return e;const n=a[1],i=(a[2]||"").replace(/0+$/,"");return i?`${n}.${i}`:n}function ja(t){var e;t&&(t.scrollTop=0,(e=t.scrollTo)==null||e.call(t,{top:0,left:0,behavior:"auto"}),requestAnimationFrame(()=>{var a;t.scrollTop=0,(a=t.scrollTo)==null||a.call(t,{top:0,left:0,behavior:"auto"})}))}let Re=!1,He=!1;function Wn(){if(Re)return;Re=!0;const t=document.createElement("div");t.id="reviewEditModal",t.className="mm-modal",t.innerHTML=`
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="후기 수정">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="reviewEditBody"></div>
    </div>
  `,document.body.appendChild(t),t.addEventListener("click",e=>{var n,s;((s=(n=e.target)==null?void 0:n.getAttribute)==null?void 0:s.call(n,"data-action"))==="close"&&zt()}),window.addEventListener("keydown",e=>{e.key==="Escape"&&zt()}),Jn()}function Kn({reviewId:t,interviewId:e,rating:a=0,content:n=""}={}){var r;Wn();const s=document.getElementById("reviewEditModal"),i=document.getElementById("reviewEditBody");if(!s||!i)return;i.innerHTML=Qn({reviewId:t,interviewId:e,rating:a,content:n}),s.classList.add("is-open"),document.body.classList.add("mm-modal-open"),i.scrollTop=0;const o=Vt(Number((r=i.querySelector("#mmEditRating"))==null?void 0:r.value),0,5);Ia(o,i),xa(i),Gt("mmEditRatingErr",i),Gt("mmEditContentErr",i)}function zt(){const t=document.getElementById("reviewEditModal"),e=document.getElementById("reviewEditBody");t&&(t.classList.remove("is-open"),document.body.classList.remove("mm-modal-open"),e&&(e.scrollTop=0))}function Qn({reviewId:t,interviewId:e,rating:a,content:n}){const s=String(t??"").trim(),i=String(e??"").trim(),o=Vt(a,0,5);return`
    <div class="mm-modal__stack mm-review-edit-stack">
      <form id="mmReviewEditForm" class="mm-review-edit mm-review-edit--vertical"
        data-review-id="${H(s)}"
        data-interview-id="${H(i)}"
      >
        <input type="hidden" name="rating" id="mmEditRating" value="${H(o)}" />

        <div class="mm-edit-top">
          <div class="mm-star-picker mm-star-picker--top" role="radiogroup" aria-label="평점 선택">
            ${[1,2,3,4,5].map(r=>`
              <button type="button"
                class="mm-star-btn ${r<=o?"is-on":""}"
                data-star="${r}"
                aria-label="${r}점"
                aria-pressed="${r===o?"true":"false"}"
              >★</button>
            `).join("")}
          </div>
          <div class="mm-field-error" id="mmEditRatingErr" aria-live="polite"></div>
        </div>

        <div class="mm-edit-body">
          <div class="mm-textarea-wrap">
            <textarea class="mm-textarea mm-textarea--fixed" id="mmEditContent" name="content" rows="10"
              placeholder="후기 내용을 입력합니다"
              maxlength="1000"
            >${I(String(n??""))}</textarea>

            <div class="mm-textarea-meta">
              <span id="mmEditCount">0</span><span>/1000</span>
            </div>
          </div>
          <div class="mm-field-error" id="mmEditContentErr" aria-live="polite"></div>
        </div>

        <div class="mm-actions mm-actions--sticky">
          <button type="button" class="mypage-mini-btn" data-action="close">취소</button>
          <button type="submit" class="mypage-save-btn mm-save-btn">저장</button>
        </div>
      </form>
    </div>
  `}function Jn(){He||(He=!0,document.addEventListener("click",t=>{var i,o,r,m;const e=document.getElementById("reviewEditModal");if(!e||!e.classList.contains("is-open"))return;const a=document.getElementById("reviewEditBody");if(!a)return;if((o=(i=t.target).closest)==null?void 0:o.call(i,'[data-action="close"]')){t.preventDefault(),zt();return}const s=(m=(r=t.target).closest)==null?void 0:m.call(r,".mm-star-btn");if(s){t.preventDefault();const l=Number(s.getAttribute("data-star"));if(!Number.isFinite(l))return;const p=a.querySelector("#mmEditRating");if(!p)return;const d=Vt(l,1,5);p.value=String(d),Ia(d,a),Gt("mmEditRatingErr",a);return}}),document.addEventListener("input",t=>{var n;const e=document.getElementById("reviewEditModal");if(!e||!e.classList.contains("is-open"))return;const a=document.getElementById("reviewEditBody");a&&((n=t.target)==null?void 0:n.id)==="mmEditContent"&&(xa(a),Gt("mmEditContentErr",a))}),document.addEventListener("submit",async t=>{var m,l;const e=t.target;if(!(e instanceof HTMLFormElement)||e.id!=="mmReviewEditForm")return;t.preventDefault();const a=document.getElementById("reviewEditBody");if(!a)return;const n=String(e.getAttribute("data-review-id")||"").trim(),s=String(e.getAttribute("data-interview-id")||"").trim(),i=Vt(Number((m=a.querySelector("#mmEditRating"))==null?void 0:m.value),0,5),o=String(((l=a.querySelector("#mmEditContent"))==null?void 0:l.value)??"").trim();if(Zn({rating:i,content:o},a))try{if(z(),!s){ae({message:"인터뷰 식별자 누락"},a);return}const p=await q.patch(`/interviews/${encodeURIComponent(s)}/reviews`,{rating:i,content:o});if(!(p!=null&&p.success)){ae(p,a);return}zt(),window.dispatchEvent(new CustomEvent("mm:review-updated",{detail:{reviewId:n,interviewId:s,data:p.data}}))}catch(p){ae(p,a)}finally{O(),X({durationMs:1e3})}}))}function Zn({rating:t,content:e},a){let n=!0;return(!Number.isFinite(t)||t<1||t>5)&&(Rt("mmEditRatingErr","평점은 1~5 사이 값 필요",a),n=!1),e?e.length>1e3&&(Rt("mmEditContentErr","후기 내용 1000자 이하 필요",a),n=!1):(Rt("mmEditContentErr","후기 내용 필수",a),n=!1),n}function ae(t,e){var n;const a=String((t==null?void 0:t.message)??((n=t==null?void 0:t.error)==null?void 0:n.message)??t??"").replace(/\s+/g," ").trim()||"요청에 실패했습니다";Rt("mmEditContentErr",a,e)}function Ia(t,e){const a=Array.from(e.querySelectorAll(".mm-star-btn"));for(const n of a){const s=Number(n.getAttribute("data-star")),i=Number.isFinite(s)&&s<=t;n.classList.toggle("is-on",i),n.setAttribute("aria-pressed",s===t?"true":"false")}}function xa(t){const e=t.querySelector("#mmEditContent"),a=t.querySelector("#mmEditCount");!e||!a||(a.textContent=String(String(e.value??"").length))}function Rt(t,e,a){var s;const n=(s=a==null?void 0:a.querySelector)==null?void 0:s.call(a,`#${t}`);n&&(n.textContent=String(e||""))}function Gt(t,e){var n;const a=(n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,`#${t}`);a&&(a.textContent="")}function Vt(t,e,a){const n=Math.trunc(Number(t));return Number.isFinite(n)?Math.min(a,Math.max(e,n)):e}function Yn(t){const e=(t==null?void 0:t.peer)||{},a=(t==null?void 0:t.interview)||{},n=String((t==null?void 0:t.interviewId)??(a==null?void 0:a.interviewId)??"").trim(),s=String((e==null?void 0:e.profileImageUrl)||"").trim(),i=xt(e==null?void 0:e.nickname,"-"),o=`${xt(e==null?void 0:e.university,"")}${e!=null&&e.university&&(e!=null&&e.major)?" / ":""}${xt(e==null?void 0:e.major,"")}`.trim(),r=xt(a==null?void 0:a.title,"-"),m=xt(t==null?void 0:t.status,"-"),l=m.toUpperCase(),p=Xn(l),d=(t==null?void 0:t.createdAt)??"",f=(t==null?void 0:t.updatedAt)??"",h=Fe(d),y=Fe(f),$=ts(d,f),x=l==="COMPLETED"?"완료일":"응답일",E=s?`background-image:url('${H(s)}')`:"";return`
    <div class="mypage-item mypage-review-item mypage-applied-item"
      data-action="open-applied-interview-detail"
      data-interview-id="${H(n)}"
      role="button"
      tabindex="0"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left">
          <div class="mypage-review-avatar" style="${E}"></div>

          <div class="mypage-review-head">
            <div class="mypage-item-title">${I(i)}${o?` <span class="mypage-review-sub">(${I(o)})</span>`:""}</div>
          </div>
        </div>

        <div class="mypage-review-meta">
          <span
            class="mm-badge mypage-status-chip"
            data-tone="${H(p)}"
            data-no-detail="true"
          >${I(m)}</span>
        </div>
      </div>

      <div class="mypage-review-bottom mypage-applied-bottom">
        <div class="mypage-review-snippet mypage-applied-snippet" data-no-detail="true">
          ${I(r)}
        </div>

        <div class="mypage-applied-dates" data-no-detail="true">
          <div class="mypage-date">
            <span class="mypage-date-label">신청일</span>
            <span class="mypage-date-value">${I(h)}</span>
          </div>

          ${$?`<div class="mypage-date mypage-date--edited">
                   <span class="mypage-date-label">${I(x)}</span>
                   <span class="mypage-date-value">${I(y)}</span>
                 </div>`:""}
        </div>
      </div>
    </div>
  `}function Xn(t){const e=String(t||"").trim().toUpperCase();return e==="ACCEPTED"?"accepted":e==="REJECT"||e==="REJECTED"?"rejected":e==="PENDING"?"pending":e==="COMPLETED"?"dark":"soft"}function xt(t,e){const a=String(t??"").trim();return a||String(e??"")}function Fe(t){const e=String(t||"").trim();return e?e.length>=10?e.slice(0,10):e:"-"}function ts(t,e){const a=Oe(t),n=Oe(e);return n?a?n!==a:!0:!1}function Oe(t){const e=String(t||"").trim();if(!e)return"";const a=e.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);if(!a)return e;const n=a[1],i=(a[2]||"").replace(/0+$/,"");return i?`${n}.${i}`:n}let ze=!1;function es(t){as();const e=document.getElementById("appliedInterviewDetailModal"),a=document.getElementById("appliedInterviewDetailBody");!e||!a||(a.innerHTML=ns(t),rs(a),e.classList.add("is-open"),document.body.classList.add("mm-modal-open"))}function Ge(){const t=document.getElementById("appliedInterviewDetailModal");t&&(t.classList.remove("is-open"),document.body.classList.remove("mm-modal-open"))}function as(){if(document.getElementById("appliedInterviewDetailModal")||ze)return;ze=!0;const t=document.createElement("div");t.id="appliedInterviewDetailModal",t.className="mm-modal",t.innerHTML=`
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="인터뷰 신청 상세">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="appliedInterviewDetailBody"></div>
    </div>
  `,document.body.appendChild(t),t.addEventListener("click",e=>{var n,s;((s=(n=e.target)==null?void 0:n.getAttribute)==null?void 0:s.call(n,"data-action"))==="close"&&Ge()}),window.addEventListener("keydown",e=>{e.key==="Escape"&&Ge()})}function ns(t){const e=(t==null?void 0:t.peer)||{},a=(t==null?void 0:t.interview)||{},n=String((e==null?void 0:e.profileImageUrl)||"").trim(),s=ct(e==null?void 0:e.nickname,"-"),i=`${ct(e==null?void 0:e.university,"")}${e!=null&&e.university&&(e!=null&&e.major)?" / ":""}${ct(e==null?void 0:e.major,"")}`.trim(),o=String((t==null?void 0:t.status)||"").trim(),r=o.toUpperCase(),m=ss(r),l=ne(t==null?void 0:t.createdAt)||"-",p=ne(t==null?void 0:t.updatedAt)||"-",d=is(t==null?void 0:t.createdAt,t==null?void 0:t.updatedAt),f=r==="COMPLETED"?"완료일":"응답일",h=d?`<span class="mm-date-label">신청일</span> ${I(l)} · <span class="mm-date-label">${I(f)}</span> ${I(p)}`:`<span class="mm-date-label">신청일</span> ${I(l)}`,y=d?`신청일 ${l} · ${f} ${p}`:`신청일 ${l}`,$=ct(a==null?void 0:a.title,"-"),x=ct(a==null?void 0:a.content,"-"),E=ct(a==null?void 0:a.interviewMethod,"-"),_=ne(a==null?void 0:a.preferredDatetime)||"-",P=ct(a==null?void 0:a.extraDescription,"-"),b=ct((t==null?void 0:t.majorMessage)??(a==null?void 0:a.majorMessage)??"","-");return`
    <div class="mm-modal__stack">

      <div class="mm-card mm-card--hero">
        <div class="mm-hero2">
          <div class="mm-hero2__avatar" style="${n?`background-image:url('${H(n)}')`:""}"></div>

          <div class="mm-hero2__main">
            <div class="mm-hero2__line">
              <span class="mm-hero2__name">${I(s)}</span>
              <span class="mm-hero2__paren">(${I(i||"-")})</span>
            </div>
          </div>

          <div class="mm-hero2__badge">
            ${o?`<div class="mm-badge" data-tone="${H(m)}">${I(o)}</div>`:""}
          </div>

          <div class="mm-hero2__dates mm-hero2__dates--inline" title="${H(y)}">
            ${h}
          </div>
        </div>

        <div class="mm-hero2__message">
          <div class="mm-hero2__message-k">전공자 메시지</div>
          <div class="mm-hero2__message-v mm-pre">${I(b)}</div>
        </div>
      </div>

      <div class="mm-card">
        <div class="mm-card__title">인터뷰 신청 정보</div>

        <div class="mm-kv2">
          <div class="mm-kv2__row">
            <div class="mm-kv2__k">제목</div>
            <div class="mm-kv2__v">${I($)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">내용</div>
            <div class="mm-kv2__v mm-pre">${I(x)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">진행 방식</div>
            <div class="mm-kv2__v">${I(E)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">희망 일시</div>
            <div class="mm-kv2__v">${I(_)}</div>
          </div>

          <div class="mm-kv2__row">
            <div class="mm-kv2__k">추가 설명</div>
            <div class="mm-kv2__v mm-pre">${I(P)}</div>
          </div>
        </div>
      </div>

    </div>
  `}function ss(t){const e=String(t||"").trim().toUpperCase();return e==="ACCEPTED"?"accepted":e==="REJECT"||e==="REJECTED"?"rejected":e==="PENDING"?"pending":e==="COMPLETED"?"dark":"soft"}function ct(t,e){const a=String(t??"").trim();return a||(e??"")}function ne(t){const e=String(t??"").trim();return e?e.length>=16?e.slice(0,16).replace("T"," "):e.length>=10?e.slice(0,10):e:""}function is(t,e){const a=Ve(t),n=Ve(e);return n?a?n!==a:!0:!1}function Ve(t){const e=String(t||"").trim();if(!e)return"";const a=e.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);if(!a)return e;const n=a[1],i=(a[2]||"").replace(/0+$/,"");return i?`${n}.${i}`:n}function rs(t){var e;t&&(t.scrollTop=0,(e=t.scrollTo)==null||e.call(t,{top:0,left:0,behavior:"auto"}),requestAnimationFrame(()=>{var a;t.scrollTop=0,(a=t.scrollTo)==null||a.call(t,{top:0,left:0,behavior:"auto"})}))}function os(t){const e=(t==null?void 0:t.peer)||{},a=(t==null?void 0:t.interview)||{},n=String((t==null?void 0:t.interviewId)??(a==null?void 0:a.interviewId)??"").trim(),s=String((e==null?void 0:e.profileImageUrl)||"").trim(),i=Tt(e==null?void 0:e.nickname,"-"),o=`${Tt(e==null?void 0:e.university,"")}${e!=null&&e.university&&(e!=null&&e.major)?" / ":""}${Tt(e==null?void 0:e.major,"")}`.trim(),r=Tt(a==null?void 0:a.title,"-"),m=Tt(t==null?void 0:t.status,"-"),l=m.toUpperCase(),p=cs(l),d=(t==null?void 0:t.createdAt)??"",f=(t==null?void 0:t.updatedAt)??"",h=We(d),y=We(f),$=ls(d,f),x=l==="COMPLETED"?"완료일":"응답일",E=!!(t!=null&&t.reviewWritten);return`
    <div class="mypage-item mypage-review-item"
      data-action="open-completed-interview-detail"
      data-interview-id="${H(n)}"
      role="button"
      tabindex="0"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left">
          <div class="mypage-review-avatar" style="${s?`background-image:url('${H(s)}')`:""}"></div>

          <div class="mypage-review-head">
            <div class="mypage-item-sub" data-no-detail="true">
              <span
                class="mm-badge mypage-status-chip"
                data-tone="${H(p)}"
              >${I(m)}</span>
            </div>

            <div class="mypage-item-title">${I(i)}${o?` <span class="mypage-review-sub">(${I(o)})</span>`:""}</div>
          </div>
        </div>

        <div class="mypage-review-meta">
          <div class="mypage-date">
            <span class="mypage-date-label">신청일</span>
            <span class="mypage-date-value">${I(h)}</span>
          </div>

          ${$?`<div class="mypage-date mypage-date--edited">
                   <span class="mypage-date-label">${I(x)}</span>
                   <span class="mypage-date-value">${I(y)}</span>
                 </div>`:""}
        </div>
      </div>

      <div class="mypage-review-bottom">
        <div class="mypage-review-snippet" data-no-detail="true">${I(r)}</div>

        <button
          class="mypage-mini-btn mypage-review-write-btn"
          type="button"
          data-action="write-review"
          data-interview-id="${H(n)}"
          data-no-detail="true"
          ${E?"disabled aria-disabled='true'":""}
        >${E?"후기 작성 완료":"후기 작성하기"}</button>
      </div>
    </div>
  `}function cs(t){const e=String(t||"").trim().toUpperCase();return e==="ACCEPTED"?"accepted":e==="REJECT"||e==="REJECTED"?"rejected":e==="PENDING"?"pending":e==="COMPLETED"?"dark":"soft"}function Tt(t,e){const a=String(t??"").trim();return a||String(e??"")}function We(t){const e=String(t||"").trim();return e?e.length>=10?e.slice(0,10):e:"-"}function ls(t,e){const a=Ke(t),n=Ke(e);return n?a?n!==a:!0:!1}function Ke(t){const e=String(t||"").trim();if(!e)return"";const a=e.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);if(!a)return e;const n=a[1],i=(a[2]||"").replace(/0+$/,"");return i?`${n}.${i}`:n}let Qe=!1,Je=!1;function ds(){if(Qe)return;Qe=!0;const t=document.createElement("div");t.id="reviewCreateModal",t.className="mm-modal",t.innerHTML=`
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="후기 작성">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="reviewCreateBody"></div>
    </div>
  `,document.body.appendChild(t),t.addEventListener("click",e=>{var n,s;((s=(n=e.target)==null?void 0:n.getAttribute)==null?void 0:s.call(n,"data-action"))==="close"&&Wt()}),window.addEventListener("keydown",e=>{e.key==="Escape"&&Wt()}),ms()}function Ze({interviewId:t}={}){var i;ds();const e=document.getElementById("reviewCreateModal"),a=document.getElementById("reviewCreateBody");if(!e||!a)return;const n=String(t??"").trim();if(!n)return;a.innerHTML=us({interviewId:n}),_a(a);const s=Se(Number((i=a.querySelector("#mmCreateRating"))==null?void 0:i.value),0,5);Ta(s,a),qa(a),Kt("mmCreateRatingErr",a),Kt("mmCreateContentErr",a),e.classList.add("is-open"),document.body.classList.add("mm-modal-open")}function Wt(){const t=document.getElementById("reviewCreateModal"),e=document.getElementById("reviewCreateBody");t&&(t.classList.remove("is-open"),document.body.classList.remove("mm-modal-open"),e&&_a(e))}function us({interviewId:t}){return`
    <div class="mm-modal__stack mm-review-edit-stack">
      <form id="mmReviewCreateForm" class="mm-review-edit mm-review-edit--vertical"
        data-interview-id="${H(t)}"
      >
        <input type="hidden" name="rating" id="mmCreateRating" value="0" />

        <div class="mm-edit-top">
          <div class="mm-star-picker mm-star-picker--top" role="radiogroup" aria-label="평점 선택">
            ${[1,2,3,4,5].map(e=>`
              <button type="button"
                class="mm-star-btn"
                data-star="${e}"
                aria-label="${e}점"
                aria-pressed="false"
              >★</button>
            `).join("")}
          </div>
          <div class="mm-field-error" id="mmCreateRatingErr" aria-live="polite"></div>
        </div>

        <div class="mm-edit-body">
          <div class="mm-textarea-wrap">
            <textarea class="mm-textarea mm-textarea--fixed" id="mmCreateContent" name="content" rows="10"
              placeholder="후기 내용을 입력합니다"
              maxlength="1000"
            ></textarea>

            <div class="mm-textarea-meta">
              <span id="mmCreateCount">0</span><span>/1000</span>
            </div>
          </div>
          <div class="mm-field-error" id="mmCreateContentErr" aria-live="polite"></div>
        </div>

        <div class="mm-actions mm-actions--sticky">
          <button type="button" class="mypage-mini-btn" data-action="close">취소</button>
          <button type="submit" class="mypage-save-btn mm-save-btn">저장</button>
        </div>
      </form>
    </div>
  `}function ms(){Je||(Je=!0,document.addEventListener("click",t=>{var i,o,r,m;const e=document.getElementById("reviewCreateModal");if(!e||!e.classList.contains("is-open"))return;const a=document.getElementById("reviewCreateBody");if(!a)return;if((o=(i=t.target).closest)==null?void 0:o.call(i,'[data-action="close"]')){t.preventDefault(),Wt();return}const s=(m=(r=t.target).closest)==null?void 0:m.call(r,".mm-star-btn");if(s){t.preventDefault();const l=Number(s.getAttribute("data-star"));if(!Number.isFinite(l))return;const p=a.querySelector("#mmCreateRating");if(!p)return;const d=Se(l,1,5);p.value=String(d),Ta(d,a),Kt("mmCreateRatingErr",a)}}),document.addEventListener("input",t=>{var n;const e=document.getElementById("reviewCreateModal");if(!e||!e.classList.contains("is-open"))return;const a=document.getElementById("reviewCreateBody");a&&((n=t.target)==null?void 0:n.id)==="mmCreateContent"&&(qa(a),Kt("mmCreateContentErr",a))}),document.addEventListener("submit",async t=>{var r,m;const e=t.target;if(!(e instanceof HTMLFormElement)||e.id!=="mmReviewCreateForm")return;t.preventDefault();const a=document.getElementById("reviewCreateBody");if(!a)return;const n=String(e.getAttribute("data-interview-id")||"").trim();if(!n)return;const s=Se(Number((r=a.querySelector("#mmCreateRating"))==null?void 0:r.value),0,5),i=String(((m=a.querySelector("#mmCreateContent"))==null?void 0:m.value)??"").trim();if(ps({rating:s,content:i},a))try{z();const l=await q.post(`/interviews/${encodeURIComponent(n)}/reviews`,{rating:s,content:i});if(!(l!=null&&l.success)){Ye(l,a);return}Wt(),window.dispatchEvent(new CustomEvent("mm:review-created",{detail:{interviewId:n,data:l.data}})),window.dispatchEvent(new CustomEvent("mm:review-updated"))}catch(l){Ye(l,a)}finally{O(),X({durationMs:1e3})}}))}function ps({rating:t,content:e},a){let n=!0;return(!Number.isFinite(t)||t<1||t>5)&&(Ht("mmCreateRatingErr","평점은 1~5 사이여야 합니다",a),n=!1),e?e.length>1e3&&(Ht("mmCreateContentErr","후기 내용은 1000자 이하여야 합니다",a),n=!1):(Ht("mmCreateContentErr","후기 내용은 필수입니다",a),n=!1),n}function Ye(t,e){var n;const a=String((t==null?void 0:t.message)??((n=t==null?void 0:t.error)==null?void 0:n.message)??t??"").replace(/\s+/g," ").trim()||"요청에 실패했습니다";Ht("mmCreateContentErr",a,e)}function Ta(t,e){const a=Array.from(e.querySelectorAll(".mm-star-btn"));for(const n of a){const s=Number(n.getAttribute("data-star")),i=Number.isFinite(s)&&s<=t;n.classList.toggle("is-on",i),n.setAttribute("aria-pressed",s===t?"true":"false")}}function qa(t){const e=t.querySelector("#mmCreateContent"),a=t.querySelector("#mmCreateCount");!e||!a||(a.textContent=String(String(e.value??"").length))}function Ht(t,e,a){var s;const n=(s=a==null?void 0:a.querySelector)==null?void 0:s.call(a,`#${t}`);n&&(n.textContent=String(e||""))}function Kt(t,e){var n;const a=(n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,`#${t}`);a&&(a.textContent="")}function Se(t,e,a){const n=Math.trunc(Number(t));return Number.isFinite(n)?Math.min(a,Math.max(e,n)):e}function _a(t){var e;t&&(t.scrollTop=0,(e=t.scrollTo)==null||e.call(t,{top:0,left:0,behavior:"auto"}),requestAnimationFrame(()=>{var a;t.scrollTop=0,(a=t.scrollTo)==null||a.call(t,{top:0,left:0,behavior:"auto"})}))}function vs(t){var v,w,S;const e=fs(t),a=aa(((v=t==null?void 0:t.question)==null?void 0:v.content)??(t==null?void 0:t.questionContent)??(t==null?void 0:t.content),"-"),n=!!(t!=null&&t.hasAnswer),s=((w=t==null?void 0:t.question)==null?void 0:w.createdAt)??(t==null?void 0:t.createdAt)??"",i=((S=t==null?void 0:t.question)==null?void 0:S.updatedAt)??(t==null?void 0:t.updatedAt)??"",o=Dt(s),r=Dt(i),m=na(s,i),l=(t==null?void 0:t.answer)??(t==null?void 0:t.answerBody)??null,p=aa(l==null?void 0:l.content,""),d=(l==null?void 0:l.createdAt)??"",f=(l==null?void 0:l.updatedAt)??"",h=Dt(d),y=Dt(f),$=na(d,f),x=n?"accepted":"pending",E=n?"답변 완료":"답변 대기",_=Xe({primaryLabel:"질문일",primaryValue:o,edited:m,updatedLabel:"수정일",updatedValue:r}),P=p?Xe({primaryLabel:"답변일",primaryValue:h,edited:$,updatedLabel:"수정일",updatedValue:y}):"",b=a,u=a,g=p,c=p;return`
    <div class="mypage-item mypage-review-item mypage-qna-item"
      data-question-id="${H(e)}"
    >
      <div class="mypage-review-top">
        <div class="mypage-review-left"></div>
        <div class="mypage-review-meta"></div>
      </div>

      <div class="mypage-qna-block mypage-qna-block--question">
        ${_?`<div class="mypage-qna-dates-line" data-no-detail="true">${_}</div>`:""}

        <div class="mypage-qna-text" data-no-detail="true">
          <span class="mypage-qna-short" data-part="q-short">${I(b)}</span>
          <span class="mypage-qna-full" data-part="q-full" hidden>${I(u)}</span>
          <button
            type="button"
            class="mypage-qna-more"
            data-action="toggle-qna"
            data-target="question"
            data-open="false"
            aria-expanded="false"
            hidden
          >더보기</button>
        </div>

        ${n?"":`
              <div class="mypage-qna-actions">
                <button
                  class="mypage-mini-btn"
                  type="button"
                  data-action="edit-qna"
                  data-question-id="${H(e)}"
                >수정하기</button>

                <button
                  class="mypage-mini-btn"
                  type="button"
                  data-action="delete-qna"
                  data-question-id="${H(e)}"
                >삭제하기</button>
              </div>
            `}
      </div>

      <div class="mypage-qna-block mypage-qna-block--answer">
        <div class="mypage-qna-head">
          <div class="mypage-qna-head-left">
            <span class="mm-badge mypage-status-chip mypage-qna-status"
              data-tone="${H(x)}"
              data-no-detail="true"
            >${I(E)}</span>
          </div>

          ${P?`<div class="mypage-qna-head-dates" data-no-detail="true">${P}</div>`:""}
        </div>

        ${p?`
              <div class="mypage-qna-text" data-no-detail="true">
                <span class="mypage-qna-short" data-part="a-short">${I(g)}</span>
                <span class="mypage-qna-full" data-part="a-full" hidden>${I(c)}</span>
                <button
                  type="button"
                  class="mypage-qna-more"
                  data-action="toggle-qna"
                  data-target="answer"
                  data-open="false"
                  aria-expanded="false"
                  hidden
                >더보기</button>
              </div>
            `:'<div class="mm-empty">아직 답변이 없습니다</div>'}
      </div>
    </div>
  `}function fs(t){var e;return String((t==null?void 0:t.questionId)??((e=t==null?void 0:t.question)==null?void 0:e.questionId)??"").trim()}function Xe({primaryLabel:t,primaryValue:e,edited:a,updatedLabel:n,updatedValue:s}={}){const i=String(e||"").trim();if(!i||i==="-")return"";const o=[`${ta(t)} ${ea(i)}`];if(a){const r=String(s||"").trim();r&&r!=="-"&&r!==i&&o.push(`${ta(n)} ${ea(r)}`)}return o.join('<span class="mypage-qna-dot" aria-hidden="true">·</span>')}function ta(t){return`<span class="mypage-qna-date-chip" data-no-detail="true">${I(t)}</span>`}function ea(t){return`<span class="mypage-qna-date-val" data-no-detail="true">${I(t)}</span>`}function aa(t,e=""){const a=String(t??"").trim();return a||e}function Dt(t){const e=String(t??"").trim();return e?e.length>=10?e.slice(0,10):e:"-"}function na(t,e){const a=sa(t),n=sa(e);return n?a?n!==a:!0:!1}function sa(t){const e=String(t??"").trim();if(!e)return"";const a=e.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?/);if(!a)return e;const n=a[1],i=(a[2]||"").replace(/0+$/,"");return i?`${n}.${i}`:n}let ia=!1;function Aa(){if(document.getElementById("qnaEditModal")){ra();return}const e=document.createElement("div");e.id="qnaEditModal",e.className="mm-modal",e.innerHTML=`
    <div class="mm-modal__backdrop" data-action="close"></div>
    <div class="mm-modal__panel" role="dialog" aria-modal="true" aria-label="질문 수정">
      <button class="mm-modal__close mm-modal__close--floating" type="button" data-action="close" aria-label="닫기">×</button>
      <div class="mm-modal__body" id="qnaEditBody"></div>
    </div>
  `,document.body.appendChild(e),e.addEventListener("click",a=>{var s,i;((i=(s=a.target)==null?void 0:s.getAttribute)==null?void 0:i.call(s,"data-action"))==="close"&&Qt()}),window.addEventListener("keydown",a=>{a.key==="Escape"&&Qt()}),ra()}function gs({questionId:t,content:e=""}={}){Aa();const a=document.getElementById("qnaEditModal"),n=document.getElementById("qnaEditBody");!a||!n||(n.innerHTML=ys({questionId:t,content:e}),a.classList.add("is-open"),document.body.classList.add("mm-modal-open"),Ba(n),Ma(n),Pa(n))}function Qt(){const t=document.getElementById("qnaEditModal"),e=document.getElementById("qnaEditBody");t&&(t.classList.remove("is-open"),document.body.classList.remove("mm-modal-open"),e&&Ba(e))}function ys({questionId:t,content:e}){const a=String(t??"").trim(),n=String(e??"");return`
    <div class="mm-modal__stack mm-review-edit-stack">
      <form id="mmQnaEditForm" class="mm-review-edit mm-review-edit--vertical"
        data-question-id="${H(a)}"
      >
        <div class="mm-edit-body">
          <div class="mm-textarea-wrap">
            <textarea class="mm-textarea mm-textarea--fixed" id="mmQnaContent" rows="10"
              placeholder="질문 내용을 입력합니다"
              maxlength="3000"
            >${I(n)}</textarea>

            <div class="mm-textarea-meta">
              <span id="mmQnaCount">0</span><span>/3000</span>
            </div>
          </div>
          <div class="mm-field-error" id="mmQnaErr" aria-live="polite"></div>
        </div>

        <div class="mm-actions mm-actions--sticky">
          <button type="button" class="mypage-mini-btn" data-action="close">취소</button>
          <button type="submit" class="mypage-save-btn mm-save-btn">저장</button>
        </div>
      </form>
    </div>
  `}function ra(){ia||(ia=!0,document.addEventListener("click",t=>{var n,s;const e=document.getElementById("qnaEditModal");if(!e||!e.classList.contains("is-open"))return;((s=(n=t.target).closest)==null?void 0:s.call(n,'[data-action="close"]'))&&(t.preventDefault(),Qt())}),document.addEventListener("input",t=>{var a;const e=document.getElementById("qnaEditModal");if(!(!e||!e.classList.contains("is-open"))&&((a=t.target)==null?void 0:a.id)==="mmQnaContent"){const n=document.getElementById("qnaEditBody");Ma(n),Pa(n)}}),document.addEventListener("submit",async t=>{var i;const e=t.target;if(!(e instanceof HTMLFormElement)||e.id!=="mmQnaEditForm")return;t.preventDefault();const a=document.getElementById("qnaEditBody");if(!a)return;const n=String(e.getAttribute("data-question-id")||"").trim(),s=String(((i=a.querySelector("#mmQnaContent"))==null?void 0:i.value)??"").trim();if(bs(s,a))try{z();const o=await Cn(n,{content:s});Qt(),window.dispatchEvent(new CustomEvent("mm:question-updated"))}catch(o){hs(o,a)}finally{O(),X({durationMs:900})}}))}function bs(t,e){return t?t.length>3e3?(Ce("내용은 3000자 이하여야 합니다",e),!1):!0:(Ce("내용은 필수입니다",e),!1)}function hs(t,e){var n;const a=String((t==null?void 0:t.message)??((n=t==null?void 0:t.error)==null?void 0:n.message)??t??"").replace(/\s+/g," ").trim()||"요청에 실패했습니다";Ce(a,e)}function Ce(t,e){var n;const a=(n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,"#mmQnaErr");a&&(a.textContent=String(t||""))}function Pa(t){var a;const e=(a=t==null?void 0:t.querySelector)==null?void 0:a.call(t,"#mmQnaErr");e&&(e.textContent="")}function Ma(t){if(!t)return;const e=t.querySelector("#mmQnaContent"),a=t.querySelector("#mmQnaCount");!e||!a||(a.textContent=String(String(e.value??"").length))}function Ba(t){var e;t&&(t.scrollTop=0,(e=t.scrollTo)==null||e.call(t,{top:0,left:0,behavior:"auto"}),requestAnimationFrame(()=>{var a;t.scrollTop=0,(a=t.scrollTo)==null||a.call(t,{top:0,left:0,behavior:"auto"})}))}const ws=[{value:"ALL",label:"전체"},{value:"PENDING",label:"대기"},{value:"ACCEPTED",label:"수락"},{value:"REJECTED",label:"거절"},{value:"COMPLETED",label:"완료"}],Es=[{value:"CREATED_AT_DESC",label:"최신순"},{value:"CREATED_AT_ASC",label:"오래된순"}];function bt(t){return String(t??"").trim().toUpperCase()}function Ss(t,{currentSort:e,onChangeSort:a,showStatus:n=!1,currentStatus:s,onChangeStatus:i}={}){if(!t)return;const o=bt(e)||"CREATED_AT_DESC",r=bt(s)||"ALL";t.innerHTML=`
    <div class="mypage-sortbar" data-no-detail="true">
      <div class="mypage-sortbar-row mypage-sortbar-row--top">
        <div class="mypage-sortbar-left">
          ${n?ws.map(m=>`
                    <button type="button"
                      class="mypage-filterbtn ${bt(m.value)===r?"is-active":""}"
                      data-status="${m.value}"
                    >${m.label}</button>
                  `).join(""):""}
        </div>

        <div class="mypage-sortbar-right">
          ${Es.map(m=>`
              <button type="button"
                class="mypage-sortbtn ${bt(m.value)===o?"is-active":""}"
                data-sort="${m.value}"
              >${m.label}</button>
            `).join("")}
        </div>
      </div>
    </div>
  `,t.querySelectorAll(".mypage-sortbtn").forEach(m=>{m.addEventListener("click",()=>{const l=bt(m.dataset.sort);l&&typeof a=="function"&&a(l)})}),n&&t.querySelectorAll(".mypage-filterbtn").forEach(m=>{m.addEventListener("click",()=>{const l=bt(m.dataset.status);l&&typeof i=="function"&&i(l)})})}const oa=7;function Cs(t,{page:e,totalPages:a,onChange:n}){if(!t)return;const s=ca(a,1,Number.MAX_SAFE_INTEGER),i=ca(e,1,s),o=ks(i,s,oa),r=Ls(o,s,oa),m=[];i>1&&m.push(se({kind:"arrow",label:"‹",page:i-1}));for(let l=o;l<=r;l+=1)m.push(se({kind:l===i?"active":"",label:String(l),page:l}));i<s&&m.push(se({kind:"arrow",label:"›",page:i+1})),t.innerHTML=m.join(""),t.__mmPager=t.__mmPager||{},t.__mmPager.onChange=n,t.__mmPager.totalPages=s,$s(t)}function se({kind:t,label:e,page:a}){return`<button class="${`page-btn ${t||""}`.trim()}" type="button" data-page="${a}">${I(e)}</button>`}function $s(t){var e;(e=t.__mmPager)!=null&&e.bound||(t.__mmPager.bound=!0,t.addEventListener("click",async a=>{var m,l;const n=a.target.closest(".page-btn");if(!n)return;const s=n.getAttribute("data-page");if(s==null)return;const i=Number(s);if(!Number.isFinite(i))return;const o=((m=t.__mmPager)==null?void 0:m.totalPages)??1;if(i<1||i>o)return;const r=(l=t.__mmPager)==null?void 0:l.onChange;typeof r=="function"&&await r(i)}))}function ca(t,e,a){const n=Number(t);if(!Number.isFinite(n))return e;const s=Math.trunc(n);return s<e?e:s>a?a:s}function ks(t,e,a){const n=Math.floor(a/2);let s=t-n;return s<1&&(s=1),s+(a-1)>e&&(s=Math.max(1,e-(a-1))),s}function Ls(t,e,a){return Math.min(e,t+(a-1))}function Ut(t){return String(t??"").trim().toUpperCase()}function js(t){var e;return String((t==null?void 0:t.questionId)??((e=t==null?void 0:t.question)==null?void 0:e.questionId)??"").trim()}function Is(t){var e;return String(((e=t==null?void 0:t.question)==null?void 0:e.content)??(t==null?void 0:t.questionContent)??(t==null?void 0:t.content)??"").trim()}function xs(t){var g;const e=document.getElementById("mypageTabs"),a=document.getElementById("mypageList"),n=document.getElementById("mypagePagination");if(!e||!a||!n)return;const s=document.createElement("div");s.id="mypageSortBar",s.className="mypage-sortbar-wrap",(g=a.parentNode)==null||g.insertBefore(s,a);const i=new Map,o=new Map;y(),$(),m(),t.renderActiveTab=r,window.addEventListener("mm:review-updated",async()=>{t.activeTab==="reviews"&&await r()}),window.addEventListener("mm:review-created",async()=>{t.activeTab==="completed"&&await r()}),window.addEventListener("mm:question-updated",async()=>{t.activeTab==="qna"&&await r()});async function r(){var c;if(s.innerHTML="",s.style.display="none",a.innerHTML="",n.innerHTML="",i.clear(),o.clear(),t.activeTab==="profile"){Mn(t);return}s.style.display="",Ss(s,{currentSort:t.listSort,showStatus:t.activeTab==="applied",currentStatus:t.appliedStatus||"ALL",onChangeSort:async v=>{const w=Ut(v);w&&w!==Ut(t.listSort)&&(t.setListSort(w),await r())},onChangeStatus:async v=>{if(t.activeTab!=="applied")return;const w=Ut(v),S=t.appliedStatus?Ut(t.appliedStatus):"ALL";w!==S&&(t.setAppliedStatus(v),await r())}});try{z();const v=await t.loadActiveTab(),w=x(v);if(w.length===0){a.innerHTML='<div class="empty">데이터가 없습니다.</div>',E(v==null?void 0:v.meta);return}if(t.activeTab==="reviews"){for(const S of w){const k=String(((c=S==null?void 0:S.review)==null?void 0:c.reviewId)??"").trim();k&&i.set(k,S)}a.innerHTML=w.map(Un).join(""),E(v==null?void 0:v.meta);return}if(t.activeTab==="applied"){a.innerHTML=w.map(Yn).join(""),E(v==null?void 0:v.meta);return}if(t.activeTab==="completed"){a.innerHTML=w.map(os).join(""),E(v==null?void 0:v.meta);return}if(t.activeTab==="qna"){Aa();for(const S of w){const k=js(S);k&&o.set(k,S)}a.innerHTML=w.map(vs).join(""),b(a),E(v==null?void 0:v.meta);return}a.innerHTML='<div class="empty">탭을 확인해라</div>',E(v==null?void 0:v.meta)}catch{a.innerHTML='<div class="empty">목록 조회에 실패했다</div>',E({page:0,totalPages:1})}finally{O()}}function m(){a.addEventListener("click",l),a.addEventListener("keydown",p)}async function l(c){var w,S,k,L,T,C,j,A,B,U,M,D,J,R,G,tt,nt,Ct,$t,kt,Lt;const v=(S=(w=c.target).closest)==null?void 0:S.call(w,'[data-no-detail="true"]');if(t.activeTab==="reviews"){const F=(L=(k=c.target).closest)==null?void 0:L.call(k,'[data-action="open-review-edit"]');if(F){c.preventDefault(),c.stopPropagation();const Q=String(F.getAttribute("data-review-id")||"").trim(),it=String(F.getAttribute("data-interview-id")||"").trim();if(!Q||!it)return;const rt=i.get(Q),jt=((T=rt==null?void 0:rt.review)==null?void 0:T.rating)??0,It=((C=rt==null?void 0:rt.review)==null?void 0:C.content)??"";Kn({reviewId:Q,interviewId:it,rating:jt,content:It});return}if(v)return;const V=(A=(j=c.target).closest)==null?void 0:A.call(j,'[data-action="open-review-detail"]');if(!V)return;const Z=String(V.getAttribute("data-review-id")||"").trim();if(!Z)return;await d(Z);return}if(t.activeTab==="applied"){if(v)return;const F=(U=(B=c.target).closest)==null?void 0:U.call(B,'[data-action="open-applied-interview-detail"]');if(!F)return;const V=String(F.getAttribute("data-interview-id")||"").trim();if(!V)return;await f(V);return}if(t.activeTab==="completed"){const F=(D=(M=c.target).closest)==null?void 0:D.call(M,'[data-action="write-review"]');if(F){if(c.preventDefault(),c.stopPropagation(),F.hasAttribute("disabled"))return;const Q=String(F.getAttribute("data-interview-id")||"").trim();if(!Q)return;Ze({interviewId:Q});return}if(v)return;const V=(R=(J=c.target).closest)==null?void 0:R.call(J,'[data-action="open-completed-interview-detail"]');if(!V)return;const Z=String(V.getAttribute("data-interview-id")||"").trim();if(!Z)return;await f(Z);return}if(t.activeTab==="qna"){const F=(tt=(G=c.target).closest)==null?void 0:tt.call(G,'[data-action="toggle-qna"]');if(F){c.preventDefault(),c.stopPropagation();const Q=(nt=F.closest)==null?void 0:nt.call(F,".mypage-qna-item");if(!Q)return;const it=F.getAttribute("data-target"),rt=F.getAttribute("data-open")==="true",jt=Q.querySelector(it==="question"?'[data-part="q-short"]':'[data-part="a-short"]'),It=Q.querySelector(it==="question"?'[data-part="q-full"]':'[data-part="a-full"]');if(!jt||!It)return;!rt?(jt.hidden=!0,It.hidden=!1,F.textContent="접기",F.setAttribute("data-open","true"),F.setAttribute("aria-expanded","true")):(jt.hidden=!1,It.hidden=!0,F.textContent="더보기",F.setAttribute("data-open","false"),F.setAttribute("aria-expanded","false"));return}const V=($t=(Ct=c.target).closest)==null?void 0:$t.call(Ct,'[data-action="edit-qna"]');if(V){if(c.preventDefault(),c.stopPropagation(),V.hasAttribute("disabled"))return;const Q=String(V.getAttribute("data-question-id")||"").trim();if(!Q)return;const it=o.get(Q);if(!it)return;gs({questionId:Q,content:Is(it)});return}const Z=(Lt=(kt=c.target).closest)==null?void 0:Lt.call(kt,'[data-action="delete-qna"]');if(Z){if(c.preventDefault(),c.stopPropagation(),Z.hasAttribute("disabled"))return;const Q=String(Z.getAttribute("data-question-id")||"").trim();if(!Q)return;await h({questionId:Q});return}return}}async function p(c){var v,w,S,k,L,T,C,j,A,B,U,M,D,J;if(!(c.key!=="Enter"&&c.key!==" ")){if(t.activeTab==="reviews"){const R=(w=(v=c.target).closest)==null?void 0:w.call(v,'[data-action="open-review-detail"]');if(!R)return;c.preventDefault();const G=String(R.getAttribute("data-review-id")||"").trim();if(!G)return;await d(G);return}if(t.activeTab==="applied"){const R=(k=(S=c.target).closest)==null?void 0:k.call(S,'[data-action="open-applied-interview-detail"]');if(!R)return;c.preventDefault();const G=String(R.getAttribute("data-interview-id")||"").trim();if(!G)return;await f(G);return}if(t.activeTab==="completed"){const R=(T=(L=c.target).closest)==null?void 0:T.call(L,'[data-action="write-review"]');if(R){if(c.preventDefault(),R.hasAttribute("disabled"))return;const nt=String(R.getAttribute("data-interview-id")||"").trim();if(!nt)return;Ze({interviewId:nt});return}const G=(j=(C=c.target).closest)==null?void 0:j.call(C,'[data-action="open-completed-interview-detail"]');if(!G)return;c.preventDefault();const tt=String(G.getAttribute("data-interview-id")||"").trim();if(!tt)return;await f(tt);return}if(t.activeTab==="qna"){const R=(B=(A=c.target).closest)==null?void 0:B.call(A,'[data-action="toggle-qna"]');if(R){c.preventDefault(),R.click();return}const G=(M=(U=c.target).closest)==null?void 0:M.call(U,'[data-action="edit-qna"]');if(G){if(c.preventDefault(),G.hasAttribute("disabled"))return;G.click();return}const tt=(J=(D=c.target).closest)==null?void 0:J.call(D,'[data-action="delete-qna"]');if(tt){if(c.preventDefault(),tt.hasAttribute("disabled"))return;tt.click();return}}}}async function d(c){try{z();const v=await Sn(c);zn(v)}catch{alert("상세 조회에 실패했다")}finally{O()}}async function f(c){try{z();const v=await En(c);es(v)}catch{alert("상세 조회에 실패했다")}finally{O()}}async function h({questionId:c}){var w;if(confirm("정말 삭제할까?"))try{z(),await $n(c),t.activeTab==="qna"&&await((w=t.renderActiveTab)==null?void 0:w.call(t)),window.dispatchEvent(new CustomEvent("mm:qna-updated"))}catch{alert("삭제에 실패했다")}finally{O(),X({durationMs:900})}}function y(){e.innerHTML=je.map(c=>`<button class="mypage-tab ${c.key===t.activeTab?"active":""}" type="button" data-tab="${c.key}">${c.label}</button>`).join("")}function $(){e.addEventListener("click",async c=>{const v=c.target.closest("[data-tab]");if(!v)return;const w=v.getAttribute("data-tab");!w||w===t.activeTab||(t.setActiveTab(w),y(),await r())})}function x(c){const v=(c==null?void 0:c.data)??(c==null?void 0:c.items)??[];return Array.isArray(v)?v:[]}function E(c){const v=c||{},w=_(v),S=P(v,w);Cs(n,{page:S,totalPages:w,onChange:async k=>{t.paging.page=Math.max(0,Number(k)-1),await r()}})}function _(c){const v=Number(c==null?void 0:c.totalPages);return Number.isFinite(v)&&v>0?Math.trunc(v):1}function P(c,v){const w=Number(c==null?void 0:c.page),S=Number.isFinite(w)?Math.trunc(w)+1:1;return S<1?1:S>v?v:S}function b(c){c.querySelectorAll(".mypage-qna-item").forEach(v=>{u(v,"question",'[data-part="q-short"]','[data-part="q-full"]'),u(v,"answer",'[data-part="a-short"]','[data-part="a-full"]')})}function u(c,v,w,S){const k=c.querySelector(`.mypage-qna-more[data-target="${v}"]`),L=c.querySelector(w),T=c.querySelector(S);if(!k||!L||!T)return;const C=String(L.textContent??"").trim(),j=String(T.textContent??"").trim();if(!C||!j){k.hidden=!0;return}if(L.scrollWidth>L.clientWidth+1){k.hidden=!1,L.hidden=!1,T.hidden=!0,k.textContent="더보기",k.setAttribute("data-open","false"),k.setAttribute("aria-expanded","false");return}k.hidden=!0,L.hidden=!0,T.hidden=!1,k.setAttribute("data-open","false"),k.setAttribute("aria-expanded","false")}}async function Ts(t){if(!t)return;t.innerHTML=dn();const e=vn(),a=window.location.hash,n=a.includes("?")?a.split("?")[1]:"",i=new URLSearchParams(n).get("tab"),o=je.map(r=>r.key);i&&o.includes(i)&&e.setActiveTab(i);try{e.me=await yn()}catch{la(t,"내 정보 조회에 실패했습니다");return}if(xs(e),typeof e.renderActiveTab=="function"){await e.renderActiveTab();return}la(t,"탭 초기화에 실패했습니다")}function la(t,e){t.innerHTML=`
    <div class="mypage-wrap">
      <h2 class="mypage-title">마이페이지</h2>
      <div class="card">
        <div class="empty">${qs(e||"오류가 발생했습니다")}</div>
      </div>
    </div>
  `}function qs(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function _s(t){const e=t.closest(".page");return e&&e.classList.add("page--auth"),()=>{e&&e.classList.remove("page--auth")}}function As(t){if(Ft()){N("/");return}const e=_s(t),a="/AIBE4_Project2_Team2_FE/img/logo.png",n=document.createElement("div");n.className="auth-wrap",n.innerHTML=`
    <div class="auth-split">
      <div class="auth-hero">
        <div class="auth-hero-content">
          <img src="${a}" alt="MajorMate" class="auth-hero-logo" />
          <p class="auth-hero-tagline">전공자와 함께하는<br/>진로 탐색의 첫걸음</p>
        </div>
        <div class="auth-hero-decoration"></div>
      </div>

      <div class="auth-form-side">
        <div class="auth-card card">
          <div class="auth-header">
            <p class="auth-desc">MajorMate에 오신 것을 환영합니다</p>
          </div>

          <form class="auth-form" id="loginForm">
            <div class="auth-row">
              <label class="auth-label" for="login-username">아이디</label>
              <input class="auth-input" id="login-username" name="username" type="text" autocomplete="username" placeholder="아이디를 입력하세요" required />
            </div>

            <div class="auth-row">
              <label class="auth-label" for="login-password">비밀번호</label>
              <input class="auth-input" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="비밀번호를 입력하세요" required />
            </div>

            <button class="auth-primary" type="submit">로그인</button>

            <div class="auth-links">
              <a href="#" id="toFindUsername">아이디 찾기</a>
              <span class="auth-link-divider">|</span>
              <a href="#" id="toFindPassword">비밀번호 찾기</a>
            </div>

            <div class="auth-divider">또는</div>

            <div class="auth-social-buttons">
              <button type="button" class="auth-social-btn google" id="googleLogin" title="Google로 로그인">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M15.68 8.18182C15.68 7.61455 15.6291 7.06909 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z" fill="#4285F4"/>
                  <path d="M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98545 12.5309 9.07636 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4182 3.52 9.52H0.858182V11.5927C2.17455 14.2036 4.87273 16 8 16Z" fill="#34A853"/>
                  <path d="M3.52 9.52C3.36 9.04 3.27273 8.52727 3.27273 8C3.27273 7.47273 3.36 6.96 3.52 6.48V4.40727H0.858182C0.312727 5.49091 0 6.70909 0 8C0 9.29091 0.312727 10.5091 0.858182 11.5927L3.52 9.52Z" fill="#FBBC05"/>
                  <path d="M8 3.17818C9.17818 3.17818 10.2255 3.58545 11.0582 4.37818L13.3527 2.08364C11.9673 0.792727 10.1564 0 8 0C4.87273 0 2.17455 1.79636 0.858182 4.40727L3.52 6.48C4.15273 4.58182 5.92 3.17818 8 3.17818Z" fill="#EA4335"/>
                </svg>
              </button>

              <button type="button" class="auth-social-btn github" id="githubLogin" title="GitHub로 로그인">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </button>

              <button type="button" class="auth-social-btn kakao" id="kakaoLogin" title="Kakao로 로그인">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C3.58 0 0 2.91 0 6.5C0 8.74 1.23 10.71 3.13 11.89L2.38 14.84C2.32 15.06 2.53 15.25 2.73 15.14L6.29 13.03C6.85 13.12 7.42 13.17 8 13.17C12.42 13.17 16 10.26 16 6.67C16 3.08 12.42 0 8 0Z" fill="#3c1e1e"/>
                </svg>
              </button>
            </div>

            <div class="auth-signup-prompt">
              <span>아직 계정이 없으신가요?</span>
              <button class="auth-link-btn" type="button" id="toSignup">회원가입</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,t.appendChild(n);const s=n.querySelector("#loginForm"),i=n.querySelector("#toSignup"),o=n.querySelector("#toFindUsername"),r=n.querySelector("#toFindPassword"),m=n.querySelector("#googleLogin"),l=n.querySelector("#githubLogin"),p=n.querySelector("#kakaoLogin"),d=f=>{e(),N(f)};i.addEventListener("click",()=>d("/signup")),o.addEventListener("click",f=>{f.preventDefault(),d("/find-username")}),r.addEventListener("click",f=>{f.preventDefault(),d("/find-password")}),m.addEventListener("click",()=>{z({text:"Google 로그인 중..."});const h="http://3.25.253.204:8080/api".replace(/\/api$/,"");window.location.href=`${h}/oauth2/authorization/google`}),l.addEventListener("click",()=>{z({text:"GitHub 로그인 중..."});const h="http://3.25.253.204:8080/api".replace(/\/api$/,"");window.location.href=`${h}/oauth2/authorization/github`}),p.addEventListener("click",()=>{z({text:"Kakao 로그인 중..."});const h="http://3.25.253.204:8080/api".replace(/\/api$/,"");window.location.href=`${h}/oauth2/authorization/kakao`}),s.addEventListener("submit",async f=>{f.preventDefault();const h=new FormData(s);z({text:"로그인 중..."});const y=await nn({username:String(h.get("username")||"").trim(),password:String(h.get("password")||"")});if(O(),!y.ok){alert(y.message||"로그인에 실패했습니다");return}e(),N("/")})}function Ps(t){const e=document.createElement("div");e.className="auth-wrap",e.innerHTML=`
    <div class="auth-split">
      <!-- 좌측: 로고 영역 -->
      <div class="auth-hero">
        <div class="auth-hero-content">
          <img src="/img/logo.png" alt="MajorMate" class="auth-hero-logo" />
          <p class="auth-hero-tagline">전공자와 함께하는<br/>진로 탐색의 첫걸음</p>
        </div>
        <div class="auth-hero-decoration"></div>
      </div>

      <!-- 우측: 회원가입 폼 -->
      <div class="auth-form-side">
        <div class="auth-card card">
          <div class="auth-header">
            <p class="auth-desc">새로운 여정을 시작하세요</p>
          </div>

          <form class="auth-form" id="signupForm">

            <div class="auth-row">
              <label class="auth-label">아이디</label>
              <input class="auth-input" name="username" placeholder="아이디를 입력하세요" required />
              <div id="usernameStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row">
              <label class="auth-label">이름</label>
              <input class="auth-input" name="name" placeholder="이름을 입력하세요" required />
            </div>

            <div class="auth-row">
              <label class="auth-label">닉네임</label>
              <input class="auth-input" name="nickname" placeholder="닉네임을 입력하세요" required />
              <div id="nicknameStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row">
              <label class="auth-label">이메일</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="emailInput" name="email" type="email" placeholder="이메일을 입력하세요" required />
                </div>
                <button type="button" class="auth-btn-secondary" id="sendVerificationBtn">인증 코드 발송</button>
              </div>
              <div id="emailStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row" id="verificationCodeRow" style="display: none;">
              <label class="auth-label">인증 코드</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="verificationCodeInput" type="text" maxlength="6" placeholder="6자리 코드 입력" />
                </div>
                <button type="button" class="auth-btn-secondary" id="verifyCodeBtn">확인</button>
              </div>
              <div id="verificationStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row">
              <label class="auth-label">신분</label>
              <select class="auth-input" name="status" required>
                <option value="">선택</option>
                <option value="ENROLLED">재학생</option>
                <option value="GRADUATED">졸업생</option>
                <option value="HIGH_SCHOOL">고등학생</option>
                <option value="ETC">기타</option>
              </select>
            </div>

            <div class="auth-row">
              <label class="auth-label">비밀번호</label>
              <input class="auth-input" name="password" type="password" placeholder="비밀번호를 입력하세요" required />
              <div id="passwordStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row">
              <label class="auth-label">비밀번호 확인</label>
              <input class="auth-input" name="password2" type="password" placeholder="비밀번호를 다시 입력하세요" required />
              <div id="password2Status" class="auth-verification-status"></div>
            </div>

            <button class="auth-primary" type="submit">가입하기</button>

            <div class="auth-divider">또는</div>

            <div class="auth-social-buttons">
              <button type="button" class="auth-social-btn google" id="googleSignup" title="Google로 가입">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M15.68 8.18182C15.68 7.61455 15.6291 7.06909 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z" fill="#4285F4"/>
                  <path d="M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98545 12.5309 9.07636 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4182 3.52 9.52H0.858182V11.5927C2.17455 14.2036 4.87273 16 8 16Z" fill="#34A853"/>
                  <path d="M3.52 9.52C3.36 9.04 3.27273 8.52727 3.27273 8C3.27273 7.47273 3.36 6.96 3.52 6.48V4.40727H0.858182C0.312727 5.49091 0 6.70909 0 8C0 9.29091 0.312727 10.5091 0.858182 11.5927L3.52 9.52Z" fill="#FBBC05"/>
                  <path d="M8 3.17818C9.17818 3.17818 10.2255 3.58545 11.0582 4.37818L13.3527 2.08364C11.9673 0.792727 10.1564 0 8 0C4.87273 0 2.17455 1.79636 0.858182 4.40727L3.52 6.48C4.15273 4.58182 5.92 3.17818 8 3.17818Z" fill="#EA4335"/>
                </svg>
              </button>
              <button type="button" class="auth-social-btn github" id="githubSignup" title="GitHub로 가입">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </button>
              <button type="button" class="auth-social-btn kakao" id="kakaoSignup" title="Kakao로 가입">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M8 0C3.58 0 0 2.91 0 6.5C0 8.74 1.23 10.71 3.13 11.89L2.38 14.84C2.32 15.06 2.53 15.25 2.73 15.14L6.29 13.03C6.85 13.12 7.42 13.17 8 13.17C12.42 13.17 16 10.26 16 6.67C16 3.08 12.42 0 8 0Z" fill="#3c1e1e"/>
                </svg>
              </button>
            </div>

            <div class="auth-signup-prompt">
              <span>이미 계정이 있으신가요?</span>
              <button class="auth-link-btn" type="button" id="toLogin">로그인</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,t.appendChild(e);const a=e.querySelector("#signupForm"),n=e.querySelector("#toLogin"),s=e.querySelector("#googleSignup"),i=e.querySelector("#githubSignup"),o=e.querySelector("#kakaoSignup"),r=e.querySelector('input[name="username"]'),m=e.querySelector('input[name="nickname"]'),l=e.querySelector('input[name="password"]'),p=e.querySelector('input[name="password2"]'),d=e.querySelector("#usernameStatus"),f=e.querySelector("#nicknameStatus"),h=e.querySelector("#passwordStatus"),y=e.querySelector("#password2Status"),$=e.querySelector("#emailInput"),x=e.querySelector("#sendVerificationBtn"),E=e.querySelector("#emailStatus"),_=e.querySelector("#verificationCodeRow"),P=e.querySelector("#verificationCodeInput"),b=e.querySelector("#verifyCodeBtn"),u=e.querySelector("#verificationStatus");let g=!1,c=!1,v=!1;function w(C,j){let A;return function(...U){const M=()=>{clearTimeout(A),C(...U)};clearTimeout(A),A=setTimeout(M,j)}}function S(C){const j=/[a-zA-Z]/.test(C),A=/[0-9]/.test(C),B=/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(C),U=C.length>=8&&C.length<=20;return{valid:U&&j&&A&&B,hasLetter:j,hasNumber:A,hasSpecial:B,isLengthValid:U}}const k=w(async C=>{var j;if(!C||C.length<2||C.length>20){d.textContent="아이디는 2자 이상 20자 이하여야 합니다",d.className="auth-verification-status error",c=!1;return}d.textContent="확인 중...",d.className="auth-verification-status";try{(j=(await q.get(`/auth/check-username?username=${encodeURIComponent(C)}`)).data)!=null&&j.available?(d.textContent="✓ 사용 가능한 아이디입니다",d.className="auth-verification-status success",c=!0):(d.textContent="이미 사용 중인 아이디입니다",d.className="auth-verification-status error",c=!1)}catch(A){console.error("아이디 중복 체크 에러:",A),d.textContent="중복 확인 실패. 다시 시도해주세요",d.className="auth-verification-status error",c=!1}},500),L=w(async C=>{var j;if(!C||C.length<2||C.length>20){f.textContent="닉네임은 2자 이상 20자 이하여야 합니다",f.className="auth-verification-status error",v=!1;return}f.textContent="확인 중...",f.className="auth-verification-status";try{(j=(await q.get(`/auth/check-nickname?nickname=${encodeURIComponent(C)}`)).data)!=null&&j.available?(f.textContent="✓ 사용 가능한 닉네임입니다",f.className="auth-verification-status success",v=!0):(f.textContent="이미 사용 중인 닉네임입니다",f.className="auth-verification-status error",v=!1)}catch(A){console.error("닉네임 중복 체크 에러:",A),f.textContent="중복 확인 실패. 다시 시도해주세요",f.className="auth-verification-status error",v=!1}},500);r.addEventListener("input",C=>{k(C.target.value.trim())}),m.addEventListener("input",C=>{L(C.target.value.trim())}),l.addEventListener("input",C=>{const j=C.target.value,A=S(j);if(!j){h.textContent="",h.className="auth-verification-status";return}if(A.valid)h.textContent="✓ 사용 가능한 비밀번호입니다",h.className="auth-verification-status success";else{const B=[];A.isLengthValid||B.push("8자 이상 20자 이하"),A.hasLetter||B.push("영문자"),A.hasNumber||B.push("숫자"),A.hasSpecial||B.push("특수기호"),h.textContent=`필요: ${B.join(", ")}`,h.className="auth-verification-status error"}p.value&&T()});function T(){const C=l.value,j=p.value;if(!j){y.textContent="",y.className="auth-verification-status";return}C===j?(y.textContent="✓ 비밀번호가 일치합니다",y.className="auth-verification-status success"):(y.textContent="비밀번호가 일치하지 않습니다",y.className="auth-verification-status error")}p.addEventListener("input",T),n.addEventListener("click",()=>N("/login")),x.addEventListener("click",async()=>{var j,A,B,U;const C=$.value.trim();if(!C){E.textContent="이메일을 입력해주세요",E.className="auth-verification-status error";return}x.disabled=!0,E.textContent="이메일 확인 중...",E.className="auth-verification-status";try{if(!((j=(await q.get(`/auth/check-email?email=${encodeURIComponent(C)}`)).data)!=null&&j.available)){E.textContent="이미 등록된 이메일입니다",E.className="auth-verification-status error",x.disabled=!1;return}E.textContent="인증 코드 발송 중...";const D=await q.post("/auth/email/send",{email:C,type:"SIGNUP"});D.success?(E.textContent="인증 코드가 발송되었습니다",E.className="auth-verification-status success",_.style.display="flex",x.textContent="재발송"):(E.textContent=D.message||"발송 실패",E.className="auth-verification-status error")}catch(M){console.error("이메일 발송 에러:",M);let D="서버 오류";M instanceof K&&(D=((B=(A=M.data)==null?void 0:A.error)==null?void 0:B.message)||((U=M.data)==null?void 0:U.message)||M.message),E.textContent=D,E.className="auth-verification-status error"}finally{x.disabled=!1}}),b.addEventListener("click",async()=>{var A,B,U;const C=$.value.trim(),j=P.value.trim();if(!j){u.textContent="인증 코드를 입력해주세요",u.className="auth-verification-status error";return}b.disabled=!0,u.textContent="확인 중...",u.className="auth-verification-status";try{const M=await q.post("/auth/email/verify",{email:C,code:j,type:"SIGNUP"});M.success?(u.textContent="✓ 인증 완료",u.className="auth-verification-status success",g=!0,$.readOnly=!0,$.style.backgroundColor="#f5f5f5",x.disabled=!0,P.readOnly=!0,P.style.backgroundColor="#f5f5f5",b.disabled=!0):(u.textContent=M.message||"인증 실패",u.className="auth-verification-status error")}catch(M){console.error("인증 코드 확인 에러:",M);let D="서버 오류";M instanceof K&&(D=((B=(A=M.data)==null?void 0:A.error)==null?void 0:B.message)||((U=M.data)==null?void 0:U.message)||M.message),u.textContent=D,u.className="auth-verification-status error"}finally{g||(b.disabled=!1)}}),s.addEventListener("click",()=>{z({text:"Google 회원가입 중..."});const j="http://3.25.253.204:8080/api".replace(/\/api$/,"");window.location.href=`${j}/oauth2/authorization/google`}),i.addEventListener("click",()=>{z({text:"GitHub 회원가입 중..."});const j="http://3.25.253.204:8080/api".replace(/\/api$/,"");window.location.href=`${j}/oauth2/authorization/github`}),o.addEventListener("click",()=>{z({text:"Kakao 회원가입 중..."});const j="http://3.25.253.204:8080/api".replace(/\/api$/,"");window.location.href=`${j}/oauth2/authorization/kakao`}),a.addEventListener("submit",async C=>{var tt,nt,Ct,$t,kt,Lt,F;C.preventDefault();const j=new FormData(a),A=(tt=j.get("username"))==null?void 0:tt.trim(),B=(nt=j.get("name"))==null?void 0:nt.trim(),U=(Ct=j.get("nickname"))==null?void 0:Ct.trim(),M=($t=j.get("email"))==null?void 0:$t.trim(),D=j.get("status"),J=j.get("password"),R=j.get("password2");if(console.log("폼 데이터:",{username:A,name:B,nickname:U,email:M,status:D,password:"***"}),!A||!B||!U||!M||!D){alert("필수 항목을 모두 입력해주세요");return}if(!c){alert("아이디 중복 확인을 완료해주세요"),r.focus();return}if(!v){alert("닉네임 중복 확인을 완료해주세요"),m.focus();return}if(!g){alert("이메일 인증을 완료해주세요"),$.focus();return}if(B.length<2||B.length>20){alert("이름은 2자 이상 20자 이하 이어야 합니다");return}if(!S(J).valid){alert("비밀번호는 영문자, 숫자, 특수기호를 포함해 8자 이상 20자 이하이어야 합니다"),l.focus();return}if(J!==R){alert("비밀번호 확인이 일치하지 않습니다"),p.focus();return}z({text:"회원가입 중..."});try{const V={username:A,password:J,name:B,nickname:U,email:M,status:D};console.log("회원가입 요청 데이터:",{...V,password:"***"});const Z=await q.post("/auth/signup",V);if(console.log("회원가입 응답:",Z),O(),!Z.success){alert(Z.message||"회원가입 실패");return}alert("회원가입 완료"),N("/login")}catch(V){O(),console.error("회원가입 에러:",V),console.error("에러 상세:",V.data);let Z="서버 연결 오류";V instanceof K&&(Z=((Lt=(kt=V.data)==null?void 0:kt.error)==null?void 0:Lt.message)||((F=V.data)==null?void 0:F.message)||V.message),alert(Z)}})}async function Ms(t){const e=document.createElement("div");e.className="auth-wrap",e.innerHTML=`
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark">MM</div>
        <div class="auth-title">로그인 처리중...</div>
      </div>
      <p class="auth-desc">잠시만 기다려주세요</p>
    </div>
  `,t.appendChild(e);const n=new URLSearchParams(window.location.search).get("error");if(n){const i={email_already_registered:"이미 가입된 이메일입니다. 로컬 계정으로 로그인해주세요.",email_not_found:"이메일 정보를 가져올 수 없습니다.",unsupported_provider:"지원하지 않는 소셜 로그인입니다.",username_generation_failed:"계정 생성 중 오류가 발생했습니다.",nickname_generation_failed:"닉네임 생성 중 오류가 발생했습니다."}[n]||"로그인에 실패했습니다.";alert(i),window.location.replace("/login");return}try{const s=await q.get("/members/me");if(s!=null&&s.success&&(s!=null&&s.data)){const i={memberId:s.data.memberId??"",name:s.data.name??"",nickname:s.data.nickname??"",email:s.data.email??"",username:s.data.username??"",profileImageUrl:s.data.profileImageUrl??"",status:s.data.status??"",university:s.data.university??"",major:s.data.major??"",role:s.data.role??""};localStorage.setItem("mm_user",JSON.stringify(i))}else{alert("사용자 정보 조회 실패"),window.location.replace("/login");return}}catch(s){console.error("사용자 정보 조회 실패:",s),alert("사용자 정보 조회 실패"),window.location.replace("/login");return}window.location.replace("/")}function Bs(t){const e=document.createElement("div");e.className="auth-wrap",e.innerHTML=`
    <div class="auth-split">
      <!-- 좌측: 로고 영역 -->
      <div class="auth-hero">
        <div class="auth-hero-content">
          <img src="/img/logo.png" alt="MajorMate" class="auth-hero-logo" />
          <p class="auth-hero-tagline">전공자와 함께하는<br/>진로 탐색의 첫걸음</p>
        </div>
        <div class="auth-hero-decoration"></div>
      </div>

      <!-- 우측: 아이디 찾기 폼 -->
      <div class="auth-form-side">
        <div class="auth-card card">
          <div class="auth-header">
            <p class="auth-desc">가입 시 등록한 이메일로 인증하면<br/>아이디를 확인할 수 있습니다</p>
          </div>

          <form class="auth-form" id="findUsernameForm">
            <div class="auth-row">
              <label class="auth-label">이메일</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="emailInput" type="email" placeholder="이메일을 입력하세요" required />
                </div>
                <button type="button" class="auth-btn-secondary" id="sendVerificationBtn">인증 코드 발송</button>
              </div>
              <div id="emailStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row" id="verificationCodeRow" style="display: none;">
              <label class="auth-label">인증 코드</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="verificationCodeInput" type="text" maxlength="6" placeholder="6자리 코드 입력" />
                </div>
                <button type="button" class="auth-btn-secondary" id="verifyCodeBtn">확인</button>
              </div>
              <div id="verificationStatus" class="auth-verification-status"></div>
            </div>

            <div id="usernameResult" class="auth-row" style="display: none;">
              <div class="auth-result-box">
                <p class="auth-result-label">회원님의 아이디</p>
                <p id="usernameText" class="auth-result-value"></p>
              </div>
            </div>

            <div class="auth-links-group">
              <div class="auth-signup-prompt">
                <span>비밀번호가 기억나지 않으세요?</span>
                <button class="auth-link-btn" type="button" id="toFindPassword">비밀번호 찾기</button>
              </div>
              <div class="auth-signup-prompt">
                <span>로그인 화면으로</span>
                <button class="auth-link-btn" type="button" id="toLogin">돌아가기</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,t.appendChild(e);const a=e.querySelector("#emailInput"),n=e.querySelector("#sendVerificationBtn"),s=e.querySelector("#emailStatus"),i=e.querySelector("#verificationCodeRow"),o=e.querySelector("#verificationCodeInput"),r=e.querySelector("#verifyCodeBtn"),m=e.querySelector("#verificationStatus"),l=e.querySelector("#usernameResult"),p=e.querySelector("#usernameText"),d=e.querySelector("#toLogin"),f=e.querySelector("#toFindPassword");n.addEventListener("click",async()=>{var y,$,x;const h=a.value.trim();if(!h){s.textContent="이메일을 입력해주세요",s.className="auth-verification-status error";return}n.disabled=!0,z({text:"인증 코드 발송 중..."});try{const E=await q.post("/auth/email/send",{email:h,type:"FIND_USERNAME"});O(),E.success?(s.textContent="인증 코드가 발송되었습니다",s.className="auth-verification-status success",i.style.display="flex",n.textContent="재발송"):(s.textContent=E.message||"발송 실패",s.className="auth-verification-status error")}catch(E){O(),console.error("이메일 발송 에러:",E);let _="서버 오류";E instanceof K&&(_=(($=(y=E.data)==null?void 0:y.error)==null?void 0:$.message)||((x=E.data)==null?void 0:x.message)||E.message),s.textContent=_,s.className="auth-verification-status error"}finally{n.disabled=!1}}),r.addEventListener("click",async()=>{var $,x,E;const h=a.value.trim(),y=o.value.trim();if(!y){m.textContent="인증 코드를 입력해주세요",m.className="auth-verification-status error";return}r.disabled=!0,z({text:"아이디 찾는 중..."});try{const _=await q.post("/auth/email/verify",{email:h,code:y,type:"FIND_USERNAME"});if(!_.success){O(),m.textContent=_.message||"인증 실패",m.className="auth-verification-status error",r.disabled=!1;return}const P=await q.post("/auth/find-username",{email:h,code:y});if(O(),P.success&&P.data){m.textContent="✓ 인증 완료",m.className="auth-verification-status success";const{username:b,provider:u}=P.data;if(u&&u!=="LOCAL"){const c={GOOGLE:"Google",GITHUB:"GitHub",KAKAO:"Kakao"}[u]||u;p.innerHTML=`
            <span class="auth-result-social">소셜 로그인으로 가입된 계정입니다</span>
            <span class="auth-result-provider">${c} 로그인을 사용해주세요</span>
          `}else p.textContent=b;l.style.display="flex",a.readOnly=!0,a.style.backgroundColor="#f5f5f5",n.disabled=!0,o.readOnly=!0,o.style.backgroundColor="#f5f5f5",r.disabled=!0}else m.textContent="아이디를 찾을 수 없습니다",m.className="auth-verification-status error",r.disabled=!1}catch(_){O(),console.error("아이디 찾기 에러:",_);let P="서버 오류";_ instanceof K&&(P=((x=($=_.data)==null?void 0:$.error)==null?void 0:x.message)||((E=_.data)==null?void 0:E.message)||_.message),m.textContent=P,m.className="auth-verification-status error",r.disabled=!1}}),d.addEventListener("click",()=>N("/login")),f.addEventListener("click",()=>N("/find-password"))}function Ns(t){const e=document.createElement("div");e.className="auth-wrap",e.innerHTML=`
    <div class="auth-split">
      <!-- 좌측: 로고 영역 -->
      <div class="auth-hero">
        <div class="auth-hero-content">
          <img src="/img/logo.png" alt="MajorMate" class="auth-hero-logo" />
          <p class="auth-hero-tagline">전공자와 함께하는<br/>진로 탐색의 첫걸음</p>
        </div>
        <div class="auth-hero-decoration"></div>
      </div>

      <!-- 우측: 비밀번호 찾기 폼 -->
      <div class="auth-form-side">
        <div class="auth-card card">
          <div class="auth-header">
            <p class="auth-desc">아이디와 이메일로 인증하면<br/>비밀번호를 재설정할 수 있습니다</p>
          </div>

          <form class="auth-form" id="findPasswordForm">
            <div class="auth-row">
              <label class="auth-label">아이디</label>
              <input class="auth-input" id="usernameInput" type="text" placeholder="아이디를 입력하세요" required />
            </div>

            <div class="auth-row">
              <label class="auth-label">이메일</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="emailInput" type="email" placeholder="이메일을 입력하세요" required />
                </div>
                <button type="button" class="auth-btn-secondary" id="sendVerificationBtn">인증 코드 발송</button>
              </div>
              <div id="emailStatus" class="auth-verification-status"></div>
            </div>

            <div class="auth-row" id="verificationCodeRow" style="display: none;">
              <label class="auth-label">인증 코드</label>
              <div class="auth-row-inline">
                <div class="auth-input-wrapper">
                  <input class="auth-input" id="verificationCodeInput" type="text" maxlength="6" placeholder="6자리 코드 입력" />
                </div>
                <button type="button" class="auth-btn-secondary" id="verifyCodeBtn">확인</button>
              </div>
              <div id="verificationStatus" class="auth-verification-status"></div>
            </div>

            <div id="passwordResetSection" style="display: none;">
              <div class="auth-row">
                <label class="auth-label">새 비밀번호</label>
                <input class="auth-input" id="newPasswordInput" type="password" placeholder="영문, 숫자, 특수기호 포함 8자 이상" />
                <div id="newPasswordStatus" class="auth-verification-status"></div>
              </div>

              <div class="auth-row">
                <label class="auth-label">새 비밀번호 확인</label>
                <input class="auth-input" id="newPasswordConfirmInput" type="password" placeholder="비밀번호를 다시 입력하세요" />
                <div id="newPasswordConfirmStatus" class="auth-verification-status"></div>
              </div>

              <button class="auth-primary" type="button" id="resetPasswordBtn">비밀번호 변경</button>
            </div>

            <div class="auth-links-group">
              <div class="auth-signup-prompt">
                <span>아이디가 기억나지 않으세요?</span>
                <button class="auth-link-btn" type="button" id="toFindUsername">아이디 찾기</button>
              </div>
              <div class="auth-signup-prompt">
                <span>로그인 화면으로</span>
                <button class="auth-link-btn" type="button" id="toLogin">돌아가기</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,t.appendChild(e);const a=e.querySelector("#usernameInput"),n=e.querySelector("#emailInput"),s=e.querySelector("#sendVerificationBtn"),i=e.querySelector("#emailStatus"),o=e.querySelector("#verificationCodeRow"),r=e.querySelector("#verificationCodeInput"),m=e.querySelector("#verifyCodeBtn"),l=e.querySelector("#verificationStatus"),p=e.querySelector("#passwordResetSection"),d=e.querySelector("#newPasswordInput"),f=e.querySelector("#newPasswordConfirmInput"),h=e.querySelector("#newPasswordStatus"),y=e.querySelector("#newPasswordConfirmStatus"),$=e.querySelector("#resetPasswordBtn"),x=e.querySelector("#toLogin"),E=e.querySelector("#toFindUsername");let _=!1;function P(u){const g=/[a-zA-Z]/.test(u),c=/[0-9]/.test(u),v=/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(u),w=u.length>=8&&u.length<=20;return{valid:w&&g&&c&&v,hasLetter:g,hasNumber:c,hasSpecial:v,isLengthValid:w}}function b(){const u=d.value,g=f.value;if(!g){y.textContent="",y.className="auth-verification-status";return}u===g?(y.textContent="✓ 비밀번호가 일치합니다",y.className="auth-verification-status success"):(y.textContent="비밀번호가 일치하지 않습니다",y.className="auth-verification-status error")}d.addEventListener("input",u=>{const g=u.target.value,c=P(g);if(!g){h.textContent="",h.className="auth-verification-status";return}if(c.valid)h.textContent="✓ 사용 가능한 비밀번호입니다",h.className="auth-verification-status success";else{const v=[];c.isLengthValid||v.push("8자 이상 20자 이하"),c.hasLetter||v.push("영문자"),c.hasNumber||v.push("숫자"),c.hasSpecial||v.push("특수기호"),h.textContent=`필요: ${v.join(", ")}`,h.className="auth-verification-status error"}f.value&&b()}),f.addEventListener("input",b),s.addEventListener("click",async()=>{var c,v,w,S;const u=a.value.trim(),g=n.value.trim();if(!u){i.textContent="아이디를 입력해주세요",i.className="auth-verification-status error";return}if(!g){i.textContent="이메일을 입력해주세요",i.className="auth-verification-status error";return}s.disabled=!0,i.textContent="확인 중...",i.className="auth-verification-status";try{const k=await q.post("/auth/check-provider",{username:u,email:g});if(k.success&&((c=k.data)!=null&&c.provider)&&k.data.provider!=="LOCAL"){const C={GOOGLE:"Google",GITHUB:"GitHub",KAKAO:"Kakao"}[k.data.provider]||k.data.provider;i.textContent=`${C} 소셜 로그인 계정입니다. 소셜 로그인을 사용해주세요.`,i.className="auth-verification-status error",s.disabled=!1;return}const L=await q.post("/auth/email/send",{email:g,type:"RESET_PASSWORD"});L.success?(i.textContent="인증 코드가 발송되었습니다",i.className="auth-verification-status success",o.style.display="flex",s.textContent="재발송"):(i.textContent=L.message||"발송 실패",i.className="auth-verification-status error")}catch(k){console.error("이메일 발송 에러:",k);let L="서버 오류";k instanceof K&&(L=((w=(v=k.data)==null?void 0:v.error)==null?void 0:w.message)||((S=k.data)==null?void 0:S.message)||k.message),i.textContent=L,i.className="auth-verification-status error"}finally{s.disabled=!1}}),m.addEventListener("click",async()=>{var c,v,w;const u=n.value.trim(),g=r.value.trim();if(!g){l.textContent="인증 코드를 입력해주세요",l.className="auth-verification-status error";return}m.disabled=!0,l.textContent="확인 중...",l.className="auth-verification-status";try{const S=await q.post("/auth/email/verify",{email:u,code:g,type:"RESET_PASSWORD"});S.success?(l.textContent="✓ 인증 완료",l.className="auth-verification-status success",_=!0,a.readOnly=!0,a.style.backgroundColor="#f5f5f5",n.readOnly=!0,n.style.backgroundColor="#f5f5f5",s.disabled=!0,r.readOnly=!0,r.style.backgroundColor="#f5f5f5",m.disabled=!0,p.style.display="block"):(l.textContent=S.message||"인증 실패",l.className="auth-verification-status error")}catch(S){console.error("인증 코드 확인 에러:",S);let k="서버 오류";S instanceof K&&(k=((v=(c=S.data)==null?void 0:c.error)==null?void 0:v.message)||((w=S.data)==null?void 0:w.message)||S.message),l.textContent=k,l.className="auth-verification-status error"}finally{_||(m.disabled=!1)}}),$.addEventListener("click",async()=>{var k,L,T;const u=a.value.trim(),g=n.value.trim(),c=r.value.trim(),v=d.value,w=f.value;if(!_){alert("이메일 인증을 완료해주세요");return}if(!P(v).valid){alert("비밀번호는 영문자, 숫자, 특수기호를 포함해 8자 이상 20자 이하이어야 합니다"),d.focus();return}if(v!==w){alert("비밀번호 확인이 일치하지 않습니다");return}$.disabled=!0,z({text:"비밀번호 변경 중..."});try{const C=await q.post("/auth/reset-password",{username:u,email:g,code:c,newPassword:v});O(),C.success?(alert("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요."),N("/login")):(alert(C.message||"비밀번호 변경 실패"),$.disabled=!1)}catch(C){O(),console.error("비밀번호 변경 에러:",C);let j="서버 오류";C instanceof K&&(j=((L=(k=C.data)==null?void 0:k.error)==null?void 0:L.message)||((T=C.data)==null?void 0:T.message)||C.message),alert(j),$.disabled=!1}}),x.addEventListener("click",()=>N("/login")),E.addEventListener("click",()=>N("/find-username"))}function Ds(t){const e=document.createElement("div");e.className="apply-wrap",e.innerHTML=`
    <h2 class="apply-title">전공자 지원하기</h2>

    <section class="card apply-card">
      <form class="apply-form" id="applyForm">
        <!-- 아이디 필드 추가됨 -->
        <div class="apply-row">
          <label class="apply-label" for="username">아이디</label>
          <input class="apply-input" id="username" name="username" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="name">이름</label>
          <input class="apply-input" id="name" name="name" placeholder="로딩 중..." readonly />
        </div>
        
         <div class="apply-row">
          <label class="apply-label" for="nickname">닉네임</label>
          <input class="apply-input" id="nickname" name="nickname" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="school">학교</label>
          <input class="apply-input" id="school" name="school" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="major">전공</label>
          <input class="apply-input" id="major" name="major" placeholder="로딩 중..." readonly />
        </div>

        <div class="apply-row">
          <label class="apply-label" for="intro">한 줄 소개</label>
          <textarea class="apply-textarea" id="intro" name="intro" rows="4" placeholder="지원 하려는 이유를 짥게 작성해 주세요" required></textarea>
        </div>

        <div class="apply-row">
          <label class="apply-label" for="file">증빙 서류</label>
          <input class="apply-input" type="file" id="file" name="file" accept="image/*" required />
          <p class="apply-help">학생증 또는 재학증명서를 업로드해주세요.</p>
        </div>

        <div class="apply-btn-row">
          <button class="apply-submit" type="submit">지원서 제출</button>
          <button class="apply-cancel" type="button" id="cancelBtn">취소</button>
        </div>
      </form>
    </section>
  `,t.appendChild(e);const a=ut(),n=e.querySelector("#applyForm"),s=e.querySelector("#cancelBtn"),i=e.querySelector("#username"),o=e.querySelector("#name"),r=e.querySelector("#nickname"),m=e.querySelector("#school"),l=e.querySelector("#major");try{const d=a==null?void 0:a.user;d?(i.value=d.username||"",o.value=d.name||"",r.value=d.nickname||"",m.value=d.university||"",l.value=d.major||"",(d.university.size==0||d.major==0)&&(alert("지원 하기전에 학교와 전공을 입력해주세요."),N("/mypage"))):console.warn("세션에 회원 정보가 없습니다.")}catch(d){console.error("세션 데이터 파싱 오류:",d)}let p=null;try{const d=sessionStorage.getItem("resubmitData");if(d){const f=JSON.parse(d);p=f.id;const h=e.querySelector("#intro");if(h&&(h.value=f.comment||""),f.reason){const y=document.createElement("div");y.className="apply-row reject-reason-box",y.innerHTML=`
                  <label class="apply-label" style="color: #dc3545;">반려 사유</label>
                  <div class="apply-textarea" style="background: #fff5f5; border-color: #f5c6cb; color: #721c24;">
                      ${f.reason}
                  </div>
              `;const $=e.querySelector(".apply-row:has(#intro)")||e.querySelectorAll(".apply-row")[3];$.parentNode.insertBefore(y,$)}sessionStorage.removeItem("resubmitData")}}catch(d){console.error("재신청 데이터 로드 오류:",d)}s.addEventListener("click",()=>N("/")),n.addEventListener("submit",async d=>{d.preventDefault();const f=new FormData(n),h=f.get("file"),y=f.get("intro"),$=new FormData,x={content:y};$.append("request",new Blob([JSON.stringify(x)],{type:"application/json"})),h&&h.size>0&&$.append("file",h);try{const E="http://localhost:8080/api";let _=p?`/major-requests/${p}`:"/major-requests";const P=await fetch(`${E}${_}`,{method:p?"PUT":"POST",body:$,credentials:"include"});if(!P.ok){const u=await P.json().catch(()=>({}));throw new Error(u.message||`서버 에러: ${P.status}`)}const b=await P.json();b.success?(alert("전공자 인증 요청이 완료되었습니다."),a.user.applicationStatus=="NONE"&&(a.user.applicationStatus="PENDING"),localStorage.setItem("mm_user",JSON.stringify(a.user)),N("/")):alert("요청 실패: "+(b.message||"다시 시도해주세요."))}catch(E){console.error("Error 상세:",E),alert(`제출 중 오류 발생: ${E.message}`)}})}function Na(t){switch(t){case"PENDING":return{label:"대기중",className:"mj-badge--pending"};case"ACCEPTED":return{label:"인증됨",className:"mj-badge--accepted"};case"REJECTED":return{label:"반려됨",className:"mj-badge--rejected"};case"RESUBMITTED":return{label:"재심사중",className:"mj-badge--resubmitted"};default:return{label:t||"미신청",className:"mj-badge--none"}}}const ie={interviews:0,review:0,qna:0};async function Us(t){const e=ut(),a=e==null?void 0:e.user;if(!a){alert("로그인이 필요합니다."),N("/login");return}const n=Na(a.applicationStatus),s=a.applicationStatus==="ACCEPTED",i=window.location.hash,o=i.includes("?")?i.split("?")[1]:"",m=new URLSearchParams(o).get("tab");let l=s?"profile":"request";m&&(["profile","interviews","qna","review"].includes(m)?s&&(l=m):l=m);const p=document.createElement("div");p.className="mj-container",p.innerHTML=`
    <header class="mj-header">
      <div class="mj-header__main">
        <div class="mj-avatar" style="background-image: url('${a.profileImageUrl||""}');">
          ${a.profileImageUrl?"":'<span class="mj-avatar-empty"></span>'}
        </div>
        <div class="mj-info">
          <div class="mj-info__top">
            <span class="mj-info__name">${a.nickname||a.name}</span>
            <span class="mj-info__badge ${n.className}">${n.label}</span>
          </div>
          <div class="mj-info__sub">${a.university} · ${a.major}</div>
        </div>
      </div>
    </header>

    <nav class="mj-tabs">
      <button class="mj-tab ${s?"is-active":"is-disabled"}" data-tab="profile">내 프로필</button>

      <button class="mj-tab ${s?"":"is-disabled"}" data-tab="interviews">받은 인터뷰</button>

      <button class="mj-tab ${s?"":"is-disabled"}" data-tab="qna">Q&A 관리</button>

      <button class="mj-tab ${s?"":"is-disabled"}" data-tab="review">인터뷰 후기</button>

      <button class="mj-tab ${s?"":"is-active"}" data-tab="request">인증 현황</button>

    </nav>

    <div id="contentArea" class="mj-content-wrapper"></div>
  `,t.appendChild(p);const d=p.querySelector("#contentArea"),f=p.querySelectorAll(".mj-tab");f.forEach(y=>{const $=y.dataset.tab,x=["profile","interviews","qna","review"];x.includes($)&&!s&&y.classList.add("is-disabled"),y.onclick=async()=>{if(x.includes($)&&!s){alert("전공자 인증이 완료된 후에 이용 가능합니다.");return}f.forEach(E=>E.classList.remove("is-active")),y.classList.add("is-active"),await at(async()=>{await Pt($,d,a)},{text:"데이터를 불러오는 중..."})}}),f.forEach(y=>y.classList.remove("is-active"));const h=p.querySelector(`.mj-tab[data-tab="${l}"]`);h&&h.classList.add("is-active"),await at(async()=>{await Pt(l,d,a)},{text:"정보를 불러오고 있습니다..."})}async function Pt(t,e,a,n=!1){try{n?ie[t]++:ie[t]=0;const i=ie[t],o=new URLSearchParams({page:i,size:10});if(t==="profile"){const r=await q.get("/major-profiles/me");r.success&&r.data?Ie(e,r.data,a):Da(e,null,a)}else if(t==="request"){const r=await q.get("/major-requests/me");Rs(e,r.data)}else{let r="";t==="interviews"?(r="/members/me/interviews",o.append("type","RECEIVED"),o.append("sort","CREATED_AT_DESC")):t==="review"?(r="/members/me/reviews",o.append("type","RECEIVED")):t==="qna"&&(r=`/majors/${a.memberId}/qna`);const m=await q.get(`${r}?${o.toString()}`);({interviews:Hs,review:Fs,qna:Os})[t](e,{items:m.data,meta:m.meta},a,n)}}catch(s){console.error("데이터 로드 에러:",s),n||(e.innerHTML='<div class="mj-error">데이터를 불러오지 못했습니다.</div>')}}function Ie(t,e,a){const n=e.active?"프로필 비공개로 전환":"프로필 공개로 전환",s=e.active?"mj-btn--status-off":"mj-btn--status-on";t.innerHTML=`
    <div class="mj-card mj-card--view">
      <div class="mj-status-indicator">
        <span class="mj-status-dot ${e.active?"active":""}"></span>
        <span class="mj-status-label">${e.active?"현재 공개 중":"현재 비공개"}</span>
      </div>

      <div class="mj-body">
        <h2 class="mj-display-title">"${e.title}"</h2>
        <div class="mj-display-content">${e.content?e.content.replace(/\n/g,"<br>"):"소개 내용이 없습니다."}</div>
        
        <div class="mj-tags">
          ${(e.tags||[]).map(i=>`<span class="mj-tag-item">${i.startsWith("#")?i:"#"+i}</span>`).join("")}
        </div>
      </div>

      <div class="mj-actions mj-actions--separated">
        <div class="mj-actions-row">
          <button class="mj-btn ${s}" id="statusToggleBtn">${n}</button>
          <button class="mj-btn mj-btn--primary" id="editBtn">프로필 수정하기</button>
        </div>
        <button class="mj-btn mj-btn--ghost" id="backBtn">메인 화면으로 돌아가기</button>
      </div>
    </div>
  `,t.querySelector("#statusToggleBtn").onclick=async()=>{await at(async()=>{try{if((await q.patch("/major-profiles/status")).success){const o=!e.active;Ie(t,{...e,active:o},a),X({text:o?"공개로 전환되었습니다.":"비공개로 전환되었습니다.",durationMs:800})}}catch{alert("상태 변경 중 오류가 발생했습니다.")}},{text:"상태 변경 중..."})},t.querySelector("#editBtn").onclick=()=>Da(t,e,a),t.querySelector("#backBtn").onclick=()=>N("/")}function Da(t,e,a){const n=!!e;let s=n?[...e.tags]:[];t.innerHTML=`
    <div class="mj-card mj-card--edit">
      <div class="mj-edit-header">
        <h3 class="mj-edit-title">${n?"프로필 수정":"전공자 프로필 등록"}</h3>
      </div>

      <form id="editForm" class="mj-form">
        <div class="mj-form-group">
          <label class="mj-label">한 줄 소개</label>
          <input type="text" id="title" class="mj-input" 
            value="${n&&e.title||""}" 
            placeholder="예: 후배들을 위해 노력하겠습니다! 부담없이 신청해주세요." required>
        </div>

        <div class="mj-form-group">
          <label class="mj-label">상세 내용</label>
          <textarea id="content" class="mj-textarea" rows="8" 
            placeholder="학생들에게 도움이 될 수 있는 내용을 적어주세요.">${n&&e.content||""}</textarea>
        </div>

        <div class="mj-form-group">
          <label class="mj-label">태그 (최대 5개)</label>
          <div class="mj-tag-input-row">
            <input type="text" id="tagInput" class="mj-input" placeholder="태그 입력 후 추가 버튼 클릭">
            <button type="button" id="addTagBtn" class="mj-btn-add">추가</button>
          </div>
          <div id="tagsList" class="mj-tags-editable"></div>
        </div>

        <div class="mj-actions mj-actions--separated">
          <div class="mj-actions-row">
            ${n?'<button type="button" id="cancelBtn" class="mj-btn mj-btn--primary">수정 취소</button>':"<div></div>"}
            <button type="submit" class="mj-btn mj-btn--save">${n?"변경사항 저장":"프로필 등록"}</button>
          </div>
        </div>
      </form>
    </div>
  `;const i=t.querySelector("#tagsList"),o=t.querySelector("#tagInput"),r=t.querySelector("#addTagBtn"),m=t.querySelector("#editForm"),l=()=>{i&&(i.innerHTML=s.map((d,f)=>`
      <span class="mj-tag-edit">
        ${d.startsWith("#")?d:"#"+d} 
        <button type="button" class="mj-tag-remove" data-idx="${f}">×</button>
      </span>
    `).join(""),i.querySelectorAll(".mj-tag-remove").forEach(d=>{d.onclick=f=>{const h=f.target.dataset.idx;s.splice(h,1),l()}}))};r&&o&&(r.onclick=()=>{const d=o.value.trim();d&&s.length<5&&!s.includes(d)?(s.push(d),o.value="",l()):s.length>=5&&alert("태그는 최대 5개까지 가능합니다.")}),l(),m&&(m.onsubmit=async d=>{d.preventDefault();const f={title:t.querySelector("#title").value,content:t.querySelector("#content").value,tags:s};await at(async()=>{try{(e?await q.patch("/major-profiles",f):await q.post("/major-profiles",f)).success&&(X({text:"프로필이 저장되었습니다!",durationMs:1e3}),setTimeout(()=>location.reload(),1e3))}catch{alert("저장 중 오류가 발생했습니다.")}},{text:"프로필 정보를 저장하고 있습니다..."})});const p=t.querySelector("#cancelBtn");p&&(p.onclick=()=>Ie(t,e,a))}function Rs(t,e){const a=ut(),n=a==null?void 0:a.user;if(!e||e.length===0){t.innerHTML=`
      <div class="mj-card mj-empty-card">
        <p class="mj-empty-msg">인증 신청 내역이 없습니다.</p>
        <button class="mj-btn mj-btn--primary" onclick="navigate('/major-role-request')">인증 신청하러 가기</button>
      </div>`;return}const s=e[0],i=Na(s.applicationStatus),o=s.applicationStatus==="REJECTED";n&&n.applicationStatus!==s.applicationStatus&&sessionStorage.setItem("mm_user",JSON.stringify(s.applicationStatus)),t.innerHTML=`
    <div class="mj-card mj-card--clickable" id="requestCard">
      <div class="mj-status-bar">
        <span class="mj-label">현재 신청 상태</span>
        <span class="mj-info__badge ${i.className}">${i.label}</span>
      </div>
      
      <div class="mj-detail-list">
        <div class="mj-detail-item">
          <label>신청 일시</label>
          <p>${new Date(s.createdAt).toLocaleString("ko-KR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
        </div>

        <div class="mj-detail-item">
          <label>지원 내용</label>
          <div class="mj-comment-box">${s.comment?s.comment.replace(/\n/g,"<br>"):"내용 없음"}</div>
        </div>

        ${s.reason?`
          <div class="mj-detail-item mj-reject-section">
            <label>반려 사유</label>
            <div class="mj-reject-reason">
              <span class="mj-icon-warn">⚠️</span>
              ${s.reason}
            </div>
          </div>
        `:""}
      </div>

      ${o?`
        <div class="mj-card-footer">
          <button class="mj-btn mj-btn--reapply" id="reapplyBtn">수정 후 재제출하기</button>
        </div>
      `:""}
    </div>
  `;const r=t.querySelector("#requestCard");r.onclick=()=>{const l=s.id||s.requestId,p=`${window.location.origin}${window.location.pathname}#/major-role-request-detail/${l}`,d=600,f=800,h=window.screenX+(window.outerWidth-d)/2,y=window.screenY+(window.outerHeight-f)/2;window.open(p,"RequestDetail",`width=${d},height=${f},left=${h},top=${y},scrollbars=yes,resizable=yes`)};const m=t.querySelector("#reapplyBtn");m&&(m.onclick=l=>{l.stopPropagation(),sessionStorage.setItem("resubmitData",JSON.stringify(s)),N("/apply")})}function Hs(t,e,a,n=!1){const s=(e==null?void 0:e.items)||[],i=(e==null?void 0:e.meta)||{},o=i.totalElements||0,r=i.last;if(n||(t.innerHTML=`
      <div class="mj-interview-list">
        <div class="mj-list-header">
          <span class="mj-list-count">나에게 온 인터뷰 요청 총 <strong class="mj-text-highlight">${o}</strong>건</span>
        </div>
        <div id="interviewItems"></div>
        <div id="moreBtnArea" class="mj-more-area" style="text-align:center; margin-top:20px;"></div>
      </div>
    `),s.length===0&&!n){t.innerHTML='<div class="mj-card mj-empty-card"><p>신청 내역이 없습니다.</p></div>';return}const m=t.querySelector("#interviewItems");if(s.forEach(l=>{const{status:p,createdAt:d,interview:f,interviewId:h,peer:y}=l,$=document.createElement("div");$.className="mj-card mj-card--interview-accordion pg-theme";const E={PENDING:{label:"신규 요청",class:"pg-badge--pending"},ACCEPTED:{label:"수락함",class:"pg-badge--accepted"},REJECTED:{label:"거절함",class:"pg-badge--rejected"},COMPLETED:{label:"진행 완료",class:"pg-badge--completed"}}[p]||{label:p,class:""},_=d?new Date(d).toLocaleDateString("ko-KR"):"-",P=f!=null&&f.preferredDatetime?new Date(f.preferredDatetime).toLocaleString("ko-KR",{month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}):"-";$.innerHTML=`
      <div class="mj-interview-summary">
        <div class="mj-summary-top">
          <div class="mj-student-profile">
            <div class="mj-student-avatar" style="background-image: url('${(y==null?void 0:y.profileImageUrl)||""}');">
              ${y!=null&&y.profileImageUrl?"":"👤"}
            </div>
            <div class="mj-student-meta">
              <span class="mj-student-nick">${Y((y==null?void 0:y.nickname)||"-")}</span>
              <span class="mj-student-univ">${Y((y==null?void 0:y.university)||"-")} · ${Y((y==null?void 0:y.major)||"-")}</span>
            </div>
          </div>
          <span class="mj-info__badge ${E.class}">${E.label}</span>
        </div>
        
        <div class="mj-summary-body">
          <p class="mj-summary-title">"${Y((f==null?void 0:f.title)||"제목 없음")}"</p>
          <span class="mj-summary-date">${_}</span>
        </div>

        <div class="mj-accordion-arrow-bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      <div class="mj-interview-detail" style="display: none;">
        <div class="mj-detail-divider"></div>
        
        <div class="mj-detail-section">
          <label>📝 인터뷰 신청 상세 내용</label>
          <div class="mj-detail-text">
            ${f!=null&&f.content?Y(f.content).replace(/\n/g,"<br>"):"상세 내용이 없습니다."}
          </div>
        </div>

        <div class="mj-detail-grid">
          <div class="mj-detail-section">
            <label>💬 진행 방식</label>
            <div class="mj-method-tag">${Y((f==null?void 0:f.interviewMethod)||"미지정")}</div>
          </div>
          <div class="mj-detail-section">
            <label>📅 희망 시간</label>
            <div class="mj-time-display">${P}</div>
          </div>
        </div>

        ${p==="PENDING"?`
          <div class="mj-response-area">
            <textarea class="mj-response-input" placeholder="학생에게 수락/거절 메시지를 남겨주세요."></textarea>
            <div class="mj-item-actions">
              <button class="mj-btn-pg mj-btn-pg--accept">수락하기</button>
              <button class="mj-btn-pg mj-btn-pg--reject">거절</button>
            </div>
          </div>
        `:""}

        ${p==="ACCEPTED"?`
          <div class="mj-item-actions" style="margin-top: 15px;">
            <button class="mj-btn-pg mj-btn-pg--complete" style="width:100%;">인터뷰 진행 완료</button>
          </div>
        `:""}
      </div>
    `;const b=$.querySelector(".mj-interview-summary"),u=$.querySelector(".mj-interview-detail");if(b.onclick=()=>{const g=u.style.display==="block";u.style.display=g?"none":"block",$.classList.toggle("is-open",!g)},p==="PENDING"){const g=$.querySelector(".mj-response-input");$.querySelector(".mj-btn-pg--accept").onclick=c=>{c.stopPropagation(),re(h,"ACCEPTED",(g==null?void 0:g.value)||"")},$.querySelector(".mj-btn-pg--reject").onclick=c=>{c.stopPropagation(),re(h,"REJECTED",(g==null?void 0:g.value)||"")}}else p==="ACCEPTED"&&($.querySelector(".mj-btn-pg--complete").onclick=g=>{g.stopPropagation(),re(h,"COMPLETED")});m.appendChild($)}),moreBtnArea.innerHTML="",!r){const l=document.createElement("button");l.className="mj-btn mj-btn--ghost",l.textContent="더보기 ↓",l.onclick=()=>Pt("interviews",t,a,!0),moreBtnArea.appendChild(l)}}async function re(t,e,a=""){if(!t){alert("인터뷰 ID가 없어 처리할 수 없습니다.");return}const n={ACCEPTED:"수락",REJECTED:"거절",COMPLETED:"완료"}[e]||"처리";if((e==="ACCEPTED"||e==="REJECTED")&&!String(a||"").trim()){alert("메시지를 입력해 주세요.");return}const s=e==="COMPLETED"?`실제로 인터뷰를 완료하셨나요?
완료 후에는 상태 변경이 불가능합니다.`:`이 인터뷰 요청을 ${n}하시겠습니까?`;confirm(s)&&await at(async()=>{try{(await q.patch(`/interviews/${t}/status`,{majorMessage:a.trim(),status:e})).success&&(X({text:`${n} 처리가 완료되었습니다.`,durationMs:800}),setTimeout(()=>{const o=document.querySelector('.mj-tab[data-tab="interviews"]');o&&o.click()},800))}catch(i){console.log(i.message),alert("서버 통신 오류가 발생했습니다.")}},{text:"처리 중입니다..."})}function Fs(t,e,a,n=!1){const s=(e==null?void 0:e.items)||[],i=(e==null?void 0:e.meta)||{},o=i.totalElements||0,r=i.last;if(n||(t.innerHTML=`
    <div class="mj-review-list">
      <div class="mj-list-header">
        <span class="mj-list-count">학생들의 소중한 후기 <strong>${o}</strong>건</span>
      </div>
      <div id="reviewItems"></div>
      <div id="moreBtnArea" class="mj-more-area" style="text-align:center; margin-top:20px;"></div>
    </div>
  `),s.length===0){t.innerHTML='<div class="mj-card mj-empty-card"><p>후기가 없습니다.</p></div>';return}const m=t.querySelector("#reviewItems"),l=t.querySelector("#moreBtnArea");if(s.forEach(p=>{const{peer:d,review:f,createdAt:h}=p,y=document.createElement("div");y.className="mj-card mj-card--review";const $=Number(f==null?void 0:f.rating)||0,x="⭐".repeat(Math.max(0,Math.min(5,$))),E=h?new Date(h).toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"}):"-";String((d==null?void 0:d.profileImageUrl)||"").trim();const _=String((d==null?void 0:d.nickname)||"-"),P=String((d==null?void 0:d.university)||"-"),b=String((d==null?void 0:d.major)||"-"),u=String((f==null?void 0:f.content)||"");y.innerHTML=`
      <div class="mj-review-item">
        <div class="mj-review-top">
          <div class="mj-review-student">
            <div class="mj-student-avatar" style="background-image: url('${d.profileImageUrl||""}');">
            </div>
            <div class="mj-student-meta">
              <span class="mj-student-nick">${Y(_)}</span>
              <span class="mj-student-univ">${Y(P)} · ${Y(b)}</span>
            </div>
          </div>
          <span class="mj-review-date">${Y(E)}</span>
        </div>

        <div class="mj-review-body">
          <div class="mj-rating-box">${x} <span class="mj-rating-num">${Math.max(0,Math.min(5,$))}.0</span></div>
          <p class="mj-review-text">"${Y(u)}"</p>
        </div>
      </div>
    `,m.appendChild(y)}),l.innerHTML="",!r){const p=document.createElement("button");p.className="mj-btn mj-btn--ghost",p.textContent="질문 더보기 ↓",p.onclick=()=>Pt("review",t,a,!0),l.appendChild(p)}}function Os(t,e,a,n=!1){const s=(e==null?void 0:e.items)||[],i=(e==null?void 0:e.meta)||{},o=i.totalElements||0,r=i.last;if(console.log(s),!n){if(!s||s.length===0){t.innerHTML=`
      <div class="mj-card mj-empty-card">
        <p class="mj-empty-msg">아직 등록된 질문이 없습니다.</p>
      </div>`;return}t.innerHTML=`
    <div class="mj-qna-list">
      <div class="mj-list-header">
        <span class="mj-list-count">받은 질문 총 <strong class="mj-text-highlight">${o}</strong>건</span>
      </div>
      <div id="qnaItems"></div>
      <div id="moreBtnArea" class="mj-more-area" style="text-align:center; margin-top:20px;"></div>
    </div>
  `}const m=t.querySelector("#qnaItems");s.forEach(p=>{var c,v,w,S,k,L;const d=p.question.questionId,f=((c=p.student)==null?void 0:c.nickname)||"익명",h=((v=p.question)==null?void 0:v.content)||"",y=((w=p.answer)==null?void 0:w.content)||"",$=((S=p.question)==null?void 0:S.createdAt)||p.createdAt,x=!!(p.answer&&p.answer.content),E=document.createElement("div");E.className=`mj-card mj-card--qna-accordion pg-theme ${x?"is-answered":""}`;const _=h.substring(0,40),P=h.length>40?"...":"";E.innerHTML=`
      <div class="mj-qna-summary">
        <div class="mj-summary-top">
          <div class="mj-student-profile">
            <div class="mj-student-avatar" style="background-image: url('${((k=p.student)==null?void 0:k.profileImageUrl)||""}');">
              ${(L=p.student)!=null&&L.profileImageUrl?"":"👤"}
            </div>
            <div class="mj-student-meta">
              <span class="mj-student-nick">${Y(f)} 학생의 질문</span>
              <span class="mj-summary-date">${$?new Date($).toLocaleDateString():"-"}</span>
            </div>
          </div>
          <span class="mj-info__badge ${x?"pg-badge--accepted":"pg-badge--pending"}">
            ${x?"답변완료":"답변대기"}
          </span>
        </div>
        
        <div class="mj-summary-body">
          <p class="mj-qna-preview">"${Y(_)}${P}"</p>
        </div>

        <div class="mj-accordion-arrow-bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      <div class="mj-qna-detail" style="display: none;">
        <div class="mj-detail-divider"></div>
        
        <div class="mj-detail-section">
          <label>❓ 질문 상세 내용</label>
          <div class="mj-detail-text">
            ${Y(h).replace(/\n/g,"<br>")}
          </div>
        </div>

        <div class="mj-qna-answer-section" id="answerArea-${d}">
          <label>✅ 나의 답변</label>
          ${x?`
                <div class="mj-detail-text mj-answer-text">
                  ${Y(y).replace(/\n/g,"<br>")}
                </div>
                <div class="mj-item-actions">
                   <button class="mj-btn-text" id="editAnsBtn-${d}">답변 수정하기</button>
                </div>`:`
                <div class="mj-item-actions">
                   <button class="mj-btn-pg mj-btn-pg--accept" style="width:100%" id="writeAnsBtn-${d}">답변 작성하기</button>
                </div>`}
        </div>
      </div>
    `;const b=E.querySelector(".mj-qna-summary"),u=E.querySelector(".mj-qna-detail");b.onclick=()=>{const T=u.style.display==="block";u.style.display=T?"none":"block",E.classList.toggle("is-open",!T)};const g=x?E.querySelector(`#editAnsBtn-${d}`):E.querySelector(`#writeAnsBtn-${d}`);g&&(g.onclick=T=>{T.stopPropagation(),zs(d,x?y:"",t)}),m.appendChild(E)});const l=t.querySelector("#moreBtnArea");if(l&&(l.innerHTML="",!r)){const p=document.createElement("button");p.className="mj-btn mj-btn--ghost",p.textContent="질문 더보기 ↓",p.onclick=()=>Pt("qna",t,a,!0),l.appendChild(p)}}function zs(t,e,a){const n=a.querySelector(`#answerArea-${t}`),s=!!e;n.innerHTML=`
    <div class="mj-answer-form" style="margin-top:10px;">
      <label>${s?"답변 수정":"답변 작성"}</label>
      <textarea class="mj-textarea" id="ansInput-${t}" rows="4" placeholder="학생에게 도움이 될 상세한 답변을 남겨주세요.">${e||""}</textarea>
      <div class="mj-form-actions">
        <button class="mj-btn-text" id="cancelAnsBtn-${t}">취소</button>
        <button class="mj-btn-pg mj-btn-pg--accept" id="saveAnsBtn-${t}">${s?"수정완료":"답변등록"}</button>
      </div>
    </div>
  `,n.querySelector(`#cancelAnsBtn-${t}`).onclick=i=>{i.stopPropagation(),document.querySelector('.mj-tab[data-tab="qna"]').click()},n.querySelector(`#saveAnsBtn-${t}`).onclick=async i=>{i.stopPropagation();const o=document.getElementById(`ansInput-${t}`).value.trim();if(!o){alert("답변 내용을 입력해주세요.");return}await at(async()=>{try{(await q.post(`/questions/${t}/answer`,{content:o})).success&&(X({text:"답변이 저장되었습니다.",durationMs:800}),setTimeout(()=>document.querySelector('.mj-tab[data-tab="qna"]').click(),800))}catch{alert("답변 저장 중 오류가 발생했습니다.")}},{text:"답변 저장 중..."})}}function Y(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}async function Gs(t){const e=document.createElement("div");e.className="major-role-request-wrap",e.innerHTML=`
    <h2 class="page-title">내 전공자 인증 신청 내역</h2>
    <div class="request-list" id="requestList">
      <div class="loading">불러오는 중...</div>
    </div>
    <div class="btn-row">
        <button class="btn-back" id="backBtn">뒤로 가기</button>
    </div>
  `,t.appendChild(e);const a=e.querySelector("#requestList");e.querySelector("#backBtn").addEventListener("click",()=>N("/"));try{if(!localStorage.getItem("mm_user")){alert("로그인이 필요합니다."),N("/login");return}const i=await q.get("/major-requests/me");if(!(i!=null&&i.success))return a.innerHTML=`<div class="error">조회 실패: ${errorText}</div>`,{ok:!1,message:(result==null?void 0:result.message)||"불러오기 실패"};Vs(a,i)}catch(s){console.error("Error:",s),a.innerHTML='<div class="error">서버 통신 오류</div>'}}function Vs(t,e){if(!e||e.length===0){t.innerHTML='<div class="empty-message">신청 내역이 없습니다.</div>';return}t.innerHTML=e.data.map(a=>{const n=Ws(a.applicationStatus),s=new Date(a.createdAt).toLocaleDateString();return`
      <div class="request-card" data-id="${a.id}" style="cursor: pointer;">
        <div class="card-header">
          <span class="request-date">${s}</span>
          <span class="status-badge ${n.className}">${n.label}</span>
        </div>
        
        <div class="card-body">
          <div class="info-row">
            <span class="label">학교/전공:</span>
            <span class="value">${a.university} / ${a.major}</span>
          </div>
          <div class="info-row">
            <span class="label">신청 내용:</span>
            <span class="value">${a.comment}</span>
          </div>
          
          ${a.reason?`
            <div class="reject-reason">
              <span class="label">반려 사유:</span>
              <span class="value">${a.reason}</span>
            </div>
          `:""}
        </div>

        ${a.applicationStatus==="REJECTED"?`
          <div class="card-footer">
            <button class="btn-resubmit" data-id="${a.id}">재신청 하기</button>
          </div>
        `:""}
      </div>
    `}).join(""),t.querySelectorAll(".request-card").forEach(a=>{a.addEventListener("click",n=>{if(n.target.classList.contains("btn-resubmit"))return;const s=a.dataset.id;N(`/major-role-request-detail/${s}`)})}),t.querySelectorAll(".btn-resubmit").forEach(a=>{a.addEventListener("click",n=>{n.stopPropagation();const s=n.target.dataset.id,i=e.find(o=>o.id==s);i&&(sessionStorage.setItem("resubmitData",JSON.stringify(i)),N("/apply"))})})}function Ws(t){switch(t){case"PENDING":return{label:"심사 대기중",className:"status-pending"};case"ACCEPTED":return{label:"승인됨",className:"status-accepted"};case"REJECTED":return{label:"반려됨",className:"status-rejected"};case"RESUBMITTED":return{label:"재제출됨",className:"status-resubmitted"};default:return{label:t,className:""}}}async function Ks(t,e){const a=e.id,n=document.createElement("div");n.className="request-detail-wrap only-content",n.innerHTML=`
    <div class="detail-page-header">
      <h2 class="page-title">신청 상세 내역</h2>
      <button class="btn-close-window" onclick="window.close()">창 닫기</button>
    </div>
    <div class="detail-container" id="detailContainer">
      <div class="loading">불러오는 중...</div>
    </div>
  `,t.appendChild(n);const s=n.querySelector("#detailContainer");await at(async()=>{try{const i=await q.get(`/major-requests/${a}`);i!=null&&i.success?Qs(s,i.data):s.innerHTML=`<div class="error">데이터 로드 실패: ${i==null?void 0:i.message}</div>`}catch(i){console.error("Error:",i),s.innerHTML='<div class="error">서버 통신 오류가 발생했습니다.</div>'}},{text:"신청 내역 상세 정보를 가져오고 있습니다..."})}function Qs(t,e){const a=oe(e.applicationStatus),n=new Date(e.createdAt).toLocaleDateString();t.innerHTML=`
    <!-- 1. 기본 정보 카드 -->
    <div class="detail-card">
      <div class="detail-header">
        <span class="detail-date">${n}</span>
        <span class="status-badge ${a.className}">${a.label}</span>
      </div>
      <div class="detail-row">
        <span class="label">이름</span>
        <span class="value">${e.name} (${e.nickname})</span>
      </div>
      <div class="detail-row">
        <span class="label">학교/전공</span>
        <span class="value">${e.universityName} / ${e.majorName}</span>
      </div>
    </div>

    <!-- 2. 신청 내용 카드 -->
<div class="detail-card">
  <h3 class="card-title">신청 내용</h3>
  
  <div class="detail-content text-section">
    ${e.content}
  </div>

  <hr class="section-divider" />

  <div class="document-section">
    <p class="label">증빙 서류</p>
    <div class="document-box">
      ${e.documentUrl?`<img src="${e.documentUrl}" alt="증빙 서류" class="document-img" />`:'<p class="pd-muted">검토가 완료되었거나 증빙 서류가 존재하지 않습니다.</p>'}
    </div>
  </div>
</div>

    <!-- 3. 히스토리 (타임라인) -->
<div class="detail-card">
  <h3 class="card-title">진행 이력</h3>
  <ul class="history-timeline">
    ${(e.histories||[]).length>0?e.histories.map(s=>{const i=new Date(s.changedAt).toLocaleString(),o=s.oldStatus?oe(s.oldStatus):null,r=oe(s.newStatus);return`
            <li class="history-item">
              <div class="history-marker ${r.className}"></div>
              
              <div class="history-content">
                <div class="history-header">
                  <div class="history-status-flow">
                    ${o?`<span class="status-old">${o.label}</span>
                         <span class="status-arrow">→</span>`:'<span class="status-tag-new">최초 신청</span>'}
                    <span class="history-status ${r.className}">${r.label}</span>
                  </div>
                  <span class="history-date">${i}</span>
                </div>
                
                <div class="history-actor">
                  <i class="icon-user"></i> 처리자: <strong>${s.changedBy}</strong>
                </div>

                ${s.reason?`<div class="history-reason">
                         <strong>처리 사유</strong>
                         <p>${s.reason}</p>
                       </div>`:""}
              </div>
            </li>
          `}).join(""):'<li class="history-empty">기록된 진행 이력이 없습니다.</li>'}
  </ul>
</div>
  `}function oe(t){switch(t){case"PENDING":return{label:"심사 대기중",className:"status-pending"};case"ACCEPTED":return{label:"승인됨",className:"status-accepted"};case"REJECTED":return{label:"반려됨",className:"status-rejected"};case"RESUBMITTED":return{label:"재제출됨",className:"status-resubmitted"};default:return{label:t,className:""}}}async function Js(t,{id:e}){t.innerHTML=`
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
  `;const a=t.querySelector("#interviewForm"),n=new Date;n.setMinutes(n.getMinutes()-n.getTimezoneOffset()),t.querySelector("#preferredDatetime").min=n.toISOString().slice(0,16),a.onsubmit=async s=>{s.preventDefault();const i=new FormData(a),o={title:i.get("title"),content:i.get("content"),interviewMethod:i.get("interviewMethod"),preferredDatetime:i.get("preferredDatetime"),extraDescription:i.get("extraDescription")};try{const r=await q.post(`majors/${e}/interviews`,o);r.success?(alert("인터뷰 신청이 성공적으로 전달되었습니다."),window.opener&&window.opener.dispatchEvent(new CustomEvent("mj:interview-created")),window.close()):alert(`신청 실패: ${r.message}`)}catch{alert("서버 통신 중 오류가 발생했습니다.")}}}async function Zs(t){const e=document.createElement("div");e.style.maxWidth="1200px",e.style.margin="0 auto",e.style.padding="20px";const a=document.createElement("div");a.style.marginBottom="30px",a.innerHTML=`
    <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 10px;">
      <span style="color: #4ade80;">AI</span>가 추천하는 전공자
    </h2>
    <p style="color: #666; font-size: 14px;">
      회원님의 관심 전공과 연관성이 높은 전공자 3명을 분석했습니다.
    </p>
  `,e.appendChild(a);const n=document.createElement("div");n.className="cards-grid",e.appendChild(n);const s=document.createElement("div");s.style.marginTop="60px",s.style.textAlign="center",s.style.paddingBottom="40px";const i=document.createElement("button");i.type="button",i.textContent="메인으로 돌아가기",Object.assign(i.style,{display:"inline-block",height:"50px",padding:"0 32px",border:"1px solid #bce9b7",borderRadius:"999px",background:"linear-gradient(135deg, #d4f4a7 0%, #bce9b7 100%)",color:"#1e293b",fontSize:"16px",fontWeight:"700",cursor:"pointer",boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1)",transition:"transform 0.2s, box-shadow 0.2s"}),i.addEventListener("mouseenter",()=>{i.style.transform="translateY(-2px)",i.style.boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1)"}),i.addEventListener("mouseleave",()=>{i.style.transform="translateY(0)",i.style.boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"}),i.addEventListener("click",()=>N("/")),s.appendChild(i),e.appendChild(s),t.appendChild(e),await o();async function o(){await at(async()=>{try{const d=await q.get("/recommendations");d.success&&d.data?r(d.data):l("추천 데이터를 불러오지 못했습니다.")}catch(d){console.error("추천 로딩 실패:",d),l("서버 통신 중 오류가 발생했습니다.")}},{text:"AI가 멘토를 분석 중입니다..."})}function r(d){if(n.innerHTML="",!d||d.length===0){n.innerHTML='<div class="empty" style="grid-column: 1/-1; text-align: center; padding: 40px;">추천할 멘토를 찾지 못했습니다.</div>';return}d.forEach(f=>{n.appendChild(m(f))})}function m(d){const f=document.createElement("article");f.className="card",f.style.position="relative",f.style.cursor="pointer",f.addEventListener("click",E=>{E.target.closest(".tag")||N(`/major-card-detail/${d.id}`)});const h=d.profileImageUrl?`background-image: url('${d.profileImageUrl}'); background-size: cover;`:"background-color: #f1f5f9;",y=document.createElement("div");y.className="card-top",y.innerHTML=`
      <div class="card-avatar" style="${h}"></div>
      <h3 class="card-title">${p(d.nickname||d.name)}</h3>
      <p class="card-sub">${p(d.university)}<br />${p(d.major)}</p>
    `,f.appendChild(y);const $=document.createElement("div");$.className="card-body",$.style.textAlign="center",$.textContent=d.title||"한줄 소개가 없습니다.",f.appendChild($);const x=document.createElement("div");return x.className="tags",x.style.justifyContent="center",(d.tags||[]).slice(0,3).forEach(E=>{const _=document.createElement("button");_.className="tag",_.type="button",_.textContent=E.startsWith("#")?E:`#${E}`,x.appendChild(_)}),f.appendChild(x),f}function l(d){n.innerHTML=`<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">${d}</div>`}function p(d){return String(d??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}}const ce=5;async function Ys(t,{id:e}){const a=document.createElement("div");a.className="pd-wrap";let n=null,s=!1;const i=ut(),o=i==null?void 0:i.user;await at(async()=>{try{const u=await q.get(`/major-profiles/${e}`);if(u!=null&&u.success&&(n=u.data),o&&n){const g=await q.get("/members/me/interviews?type=APPLIED&status=PENDING&size=100");g!=null&&g.success&&(s=(g.data||[]).some(v=>String(v.peer.memberId)===String(n.memberId)))}}catch(u){console.error("서버 통신 오류",u)}},{text:"프로필 정보를 불러오는 중..."});const r={tab:"review",page:1};if(!n){a.innerHTML=`
      <div class="card pd-card">
        <h2 class="pd-title">프로필을 찾을 수 없습니다</h2>
        <p class="pd-muted">존재하지 않거나 비공개된 프로필입니다.</p>
        <button class="pd-back" type="button">홈으로</button>
      </div>
    `;const u=a.querySelector(".pd-back");u&&u.addEventListener("click",()=>N("/")),t.appendChild(a);return}a.appendChild(m(n)),a.appendChild(l()),t.appendChild(a),p(),window.addEventListener("mj:interview-created",()=>{X({text:"인터뷰 신청이 성공적으로 완료되었습니다!",durationMs:1500});const u=a.querySelector(".pd-apply-btn");u&&(u.textContent="신청 완료",u.disabled=!0,u.style.backgroundColor="#94a3b8",u.style.cursor="default"),console.log("인터뷰 신청 완료 이벤트 수신")},{once:!0});function m(u){const g=document.createElement("section");g.className="card pd-card",g.style.position="relative";const c=u.profileImageUrl?`background-image: url('${u.profileImageUrl}'); background-size: cover;`:"background-color: #ddd;",v=document.createElement("div");v.className="pd-head",v.innerHTML=`
      <div class="pd-head-left">
        <div class="pd-avatar" style="${c}" aria-hidden="true"></div>
        <div class="pd-head-text">
          <div class="pd-name">${b(u.nickname)}</div>
          <div class="pd-sub">${b(u.university)}<br />${b(u.major)}</div>
          <div class="pd-one">${b(u.title||"")}</div>
        </div>
      </div>
    `;const w=document.createElement("div");w.className="pd-head-right";const S=document.createElement("button");S.type="button",S.className=`pd-like-btn ${u.liked?"active":""}`,S.innerHTML=`
      <svg class="heart-icon" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span class="like-count">${u.likeCount||0}</span>
    `,S.addEventListener("click",async()=>{const M=!S.classList.contains("active"),D=S.querySelector(".like-count");let J=parseInt(D.textContent)||0;S.classList.toggle("active",M),D.textContent=M?J+1:Math.max(0,J-1);try{const R=await q.post(`/major-profiles/${e}/likes`);if(R!=null&&R.success){const G=R.data;S.classList.toggle("active",G.liked),D.textContent=G.totalLikes}else throw new Error("처리 실패")}catch(R){console.error("좋아요 오류:",R),S.classList.toggle("active",!M),D.textContent=J,alert("좋아요 처리에 실패했습니다.")}});const k=o&&String(o.memberId)===String(u.memberId),L=document.createElement("button");L.type="button",L.className="pd-apply-btn",k?(L.textContent="내 프로필입니다",L.disabled=!0,L.classList.add("btn-disabled")):s?(L.textContent="신청중",L.disabled=!0,L.style.backgroundColor="#ebf7ed",L.style.color="#2ecc71",L.style.border="1px solid #2ecc71",L.style.cursor="default"):(L.textContent="인터뷰 신청하기",L.onclick=()=>_(u.memberId)),w.appendChild(S),w.appendChild(L);const T=document.createElement("div");T.className="pd-divider";const C=document.createElement("div");C.className="pd-body";const j=E("상세 소개"),A=document.createElement("div");A.className="pd-text",A.innerHTML=(u.content||"상세 소개가 없습니다.").replace(/\n/g,"<br>");const B=E("태그 / 키워드"),U=document.createElement("div");return U.className="pd-tags",u.tags&&u.tags.length>0?u.tags.forEach(M=>{const D=document.createElement("span");D.className="tag",D.textContent=`#${M}`,U.appendChild(D)}):(U.textContent="등록된 태그가 없습니다.",U.className="pd-muted"),C.appendChild(j),C.appendChild(A),C.appendChild(B),C.appendChild(U),g.appendChild(v),g.appendChild(w),g.appendChild(T),g.appendChild(C),g}function l(){const u=ut(),g=u==null?void 0:u.user,c=g&&String(g.id)===String(n.memberId),v=document.createElement("section");return v.className="card pd-bottom",v.innerHTML=`
    <div class="pd-tabs">
      <button class="pd-tab active" type="button" data-tab="review">후기</button>
      <button class="pd-tab" type="button" data-tab="qna">Q&A</button>
    </div>
    
    <div class="pd-bottom-body">
      <div id="qnaInputArea" style="display: none; padding: 20px; background-color: #f0fdf4; border-bottom: 1px solid #dcfce7;">
        ${c?`<div class="pd-muted" style="font-size: 0.9rem; text-align: center; color: #16a34a;">
                내 프로필에 등록된 질문에 답변을 남길 수 있습니다.
               </div>`:`
          <div class="mj-qna-input-box">
            <label class="mj-input-label" style="color: #16a34a;">전공자에게 질문하기</label>
            <div class="mj-answer-input-container">
              <textarea id="newQuestionText" class="mj-answer-textarea" 
                style="border-color: #d1fae5;"
                placeholder="궁금한 점을 질문해보세요!"></textarea>
              <button type="button" id="submitQuestionBtn" class="mj-ans-submit" 
                style="background-color: #2ecc71; color: white;">등록</button>
            </div>
          </div>
        `}
      </div>
      
      <div class="pd-list-wrap" id="pdList"></div>
      <div class="pagination" id="pdPager"></div>
    </div>
  `,v.addEventListener("click",w=>{const S=w.target.closest("[data-tab]");if(S){const T=S.getAttribute("data-tab");a.querySelector("#qnaInputArea").style.display=T==="qna"?"block":"none",r.tab=S.getAttribute("data-tab"),r.page=1,v.querySelectorAll(".pd-tab").forEach(C=>C.classList.remove("active")),S.classList.add("active"),p();return}if(w.target.id==="submitQuestionBtn"){const T=v.querySelector("#newQuestionText");$(T.value)}const k=w.target.closest("[data-page]");if(k){const T=Number(k.getAttribute("data-page"));if(!Number.isFinite(T))return;r.page=T,p();return}w.target.closest("[data-next]")&&(r.page=Math.min(r.page+1,d()),p())}),v}async function p(){const u=a.querySelector("#pdList"),g=a.querySelector("#pdPager");!u||!g||await at(async()=>{var c;try{const v=r.tab==="review"?`/majors/${n.memberId}/reviews`:`/majors/${n.memberId}/qna`,w=await q.get(`${v}?page=${r.page-1}&size=${ce}&type=RECEIVED`);if(w!=null&&w.success){const S=w.data||[],k=((c=w.meta)==null?void 0:c.totalElements)||w.totalElements||0,L=Math.max(1,Math.ceil(k/ce));if(u.innerHTML="",S.length===0){const T=r.tab==="review"?"아직 작성된 후기가 없습니다.":"아직 등록된 질문이 없습니다.";u.innerHTML=`<div class="empty">${T}</div>`}else S.forEach(T=>{const C=r.tab==="review"?f(T):h(T);u.appendChild(C)});P(g,L)}}catch(v){console.error("데이터 로드 실패:",v),u.innerHTML='<div class="mj-error">데이터를 불러오지 못했습니다.</div>'}},{text:r.tab==="review"?"후기를 불러오는 중...":"질문을 불러오는 중..."})}function d(){const u=r.tab==="review"?REVIEWS_BY_PROFILE[e]||[]:QNA_BY_PROFILE[e]||[];return Math.max(1,Math.ceil(u.length/ce))}function f(u){const{peer:g,review:c,updatedAt:v}=u,w=document.createElement("div");w.className="pd-item mj-review-row";const S=x(c.rating),k=new Date(v).toLocaleDateString("ko-KR");return w.innerHTML=`
      <div class="pd-item-top">
        <div class="mj-reviewer-info">
          <div class="mj-reviewer-avatar" style="background-image: url('${g.profileImageUrl||""}'); background-size: cover;">
            ${g.profileImageUrl?"":"👤"}
          </div>
          <div>
            <div class="pd-item-title">${b(g.nickname)} 
              <span class="mj-reviewer-univ">${b(g.university)}</span>
            </div>
            <div class="pd-stars">${S} <span class="mj-rating-num">${c.rating}.0</span></div>
          </div>
        </div>
        <div class="pd-date">${k}</div>
      </div>
      <div class="pd-item-content mj-review-content">
        ${b(c.content).replace(/\n/g,"<br>")}
      </div>
    `,w}function h(u){var A,B,U,M,D,J,R,G;const g=ut(),c=(g==null?void 0:g.user)&&String(g.user.memberId)===String(n.memberId),v=u.question.questionId,w=((A=u.student)==null?void 0:A.nickname)||"익명";(B=u.student)!=null&&B.university;const S=((U=u.student)==null?void 0:U.profileImageUrl)||"",k=((M=u.question)==null?void 0:M.content)||"",L=((D=u.answer)==null?void 0:D.content)||"",T=((J=u.question)==null?void 0:J.createdAt)||u.createdAt,C=!!(u.answer&&u.answer.content),j=document.createElement("div");return j.className="pd-item mj-qna-row",T&&new Date(T).toLocaleDateString("ko-KR"),j.innerHTML=`
    <div class="pd-item-top">
      <div class="mj-reviewer-info">
        <div class="mj-reviewer-avatar" style="background-image: url('${S}');">
          ${S?"":"👤"}
        </div>
        <div>
          <div class="pd-item-title">
            ${b(w)} 
            <span class="mj-reviewer-univ">${b(((R=u.student)==null?void 0:R.university)||"")}</span>
          </div>
          <div class="mj-qna-badge-wrap">
            <span class="mj-qna-status-badge" 
                  style="background-color: ${C?"#ebf7ed":"#f1f5f9"}; 
                         color: ${C?"#2ecc71":"#64748b"};">
              ${C?"답변완료":"답변대기"}
            </span>
          </div>
        </div>
      </div>
      <div class="pd-date">${new Date((G=u.question)==null?void 0:G.createdAt).toLocaleDateString()}</div>
    </div>
    
    <div class="pd-item-content mj-qna-content">
      <div class="mj-q-label" style="color: #2ecc71; font-weight: bold;">Q.</div>
      <div class="mj-q-text">${b(k).replace(/\n/g,"<br>")}</div>
    </div>

    <div class="mj-answer-section" id="ans-section-${v}">
      ${C?`
          <div class="mj-answer-box" style="background-color: #f9fdfa; border-left: 4px solid #2ecc71; padding: 12px; margin-top: 12px; border-radius: 4px;">
            <div class="mj-answer-label" style="color: #16a34a; font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">전공자 답변</div>
            <div class="mj-answer-text">${b(L).replace(/\n/g,"<br>")}</div>
          </div>`:c?`
          <div class="mj-answer-input-container" style="margin-top: 12px;">
            <textarea id="textarea-${v}" class="mj-answer-textarea" placeholder="답변을 입력해주세요..."></textarea>
            <button type="button" class="mj-ans-submit" style="background-color: #2ecc71;">등록</button>
          </div>`:""}
    </div>
  `,c&&!C&&j.addEventListener("click",async tt=>{if(tt.target.classList.contains("mj-ans-submit")){const nt=j.querySelector(`#textarea-${v}`);await y(v,nt.value)}}),j}async function y(u,g){if(!g.trim())return alert("내용을 입력해주세요.");await at(async()=>{try{(await q.post(`/questions/${u}/answer`,{content:g})).success&&(X({text:"답변이 등록되었습니다."}),p())}catch(c){console.error(c),alert("답변 등록에 실패했습니다.")}})}async function $(u){if(!u.trim()){alert("질문 내용을 입력해주세요.");return}await at(async()=>{try{if((await q.post(`/majors/${n.memberId}/questions`,{content:u})).success){X({text:"질문이 성공적으로 등록되었습니다."});const c=document.getElementById("newQuestionText");c&&(c.value=""),p()}}catch(g){console.error("질문 등록 실패:",g),alert("질문 등록 중 오류가 발생했습니다.")}},{text:"질문을 등록하는 중..."})}function x(u){const g=Math.max(0,Math.min(5,Number(u)||0));let c="";for(let v=1;v<=5;v+=1)c+=v<=g?"★":"☆";return c}function E(u){const g=document.createElement("div");return g.className="pd-section-title",g.textContent=u,g}function _(u){const g=`${window.location.origin}${window.location.pathname}#/interview-create/${u}`,c=600,v=850,w=window.screenX+(window.outerWidth-c)/2,S=window.screenY+(window.outerHeight-v)/2;window.open(g,"CreateInterview",`width=${c},height=${v},left=${w},top=${S},scrollbars=yes,resizable=yes`)}function P(u,g){if(u.innerHTML="",!(g<=1)){for(let c=1;c<=g;c++){const v=document.createElement("button");v.type="button",v.className=`page-btn ${c===r.page?"active":""}`,v.textContent=String(c),v.setAttribute("data-page",String(c)),u.appendChild(v)}if(r.page<g){const c=document.createElement("button");c.type="button",c.className="page-btn arrow",c.textContent="→",c.setAttribute("data-next","1"),u.appendChild(c)}}}function b(u){return String(u??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}}const Jt=new Set(["/login","/signup","/oauth/callback","/find-username","/find-password"]),da={"/":ln,"/mypage":Ts,"/apply":Ds,"/major-profile":Us,"/major-role-request":Gs,"/recommend":Zs,"/login":As,"/signup":Ps,"/oauth/callback":Ms,"/find-username":Bs,"/find-password":Ns},Xs=[{pattern:"/interview-create/:id",render:Js},{pattern:"/major-role-request-detail/:id",render:Ks},{pattern:"/major-card-detail/:id",render:Ys}],ti=[{test:t=>Jt.has(t),files:["src/css/auth.css"]},{test:t=>t==="/",files:["src/css/home.css"]},{test:t=>t==="/mypage"||t.startsWith("/mypage/"),files:["src/css/mypage.css"]},{test:t=>t==="/apply",files:["src/css/apply.css"]},{test:t=>t.startsWith("/interview-create/"),files:["src/css/interview-create.css"]},{test:t=>t==="/major-profile",files:["src/css/major-profile.css"]},{test:t=>t==="/recommend",files:["src/css/recommend.css"]},{test:t=>t==="/major-role-request",files:["src/css/major-role-request.css"]},{test:t=>t.startsWith("/major-role-request-detail/"),files:["src/css/major-role-request-detail.css"]},{test:t=>t.startsWith("/major-card-detail/"),files:["src/css/profileDetail.css"]}],ei=[t=>Jt.has(t),t=>t.startsWith("/major-role-request-detail/"),t=>t.startsWith("/interview-create/")],ai=["reviewCreateModal","reviewEditModal","reviewDetailModal","qnaEditModal","appliedInterviewDetailModal"];function N(t){const e=Ua(t);window.location.hash!==`#${e}`&&(window.location.hash=`#${e}`)}function ni(){mi(),window.addEventListener("mm:user-updated",$e),window.addEventListener("mm:session-updated",$e),window.addEventListener("hashchange",ua),ua()}function ua(){const t=document.getElementById("view");if(!t)return;const e=fi(),a=oi(),n=Zt(a);if(e&&e!==n&&si(e,n),gi(n),!Jt.has(n)&&!Ft()){N("/login");return}if(Jt.has(n)&&Ft()){N("/");return}li(n),di(n),$e(),Ra(),t.innerHTML="";const s=ri(a);if(s){s.render(t,s.params);return}(da[n]||da["/"])(t)}function si(t,e){ma(t)&&!ma(e)&&ii()}function ma(t){const e=Zt(t);return e==="/mypage"||e.startsWith("/mypage/")}function ii(){for(const t of ai){const e=document.getElementById(t);e&&e.remove()}document.body.classList.remove("mm-modal-open"),document.querySelectorAll(".mm-modal.is-open").forEach(t=>t.classList.remove("is-open"))}function ri(t){for(const e of Xs){const a=ci(t,e.pattern);if(a)return{render:e.render,params:a}}return null}function oi(){const t=window.location.hash||"#/",e=t.startsWith("#")?t.slice(1):t;return Ua(e)}function Ua(t){const e=String(t||"").trim();return!e||e==="#"?"/":e.startsWith("/")?e:`/${e}`}function Zt(t){const e=String(t||"").trim();if(!e)return"/";const a=e.indexOf("?"),n=e.indexOf("#"),s=a===-1?n:n===-1?a:Math.min(a,n);return(s===-1?e:e.slice(0,s))||"/"}function ci(t,e){const a=Zt(t),n=Zt(e),s=a.split("/").filter(Boolean),i=n.split("/").filter(Boolean);if(s.length!==i.length)return null;const o={};for(let r=0;r<i.length;r++){const m=i[r],l=s[r];if(m.startsWith(":")){const p=m.slice(1);o[p]=decodeURIComponent(l);continue}if(m!==l)return null}return o}function li(t){const e=document.getElementById("siteHeader");if(!e)return;const a=ei.some(n=>n(t));e.style.display=a?"none":""}function di(t){const e=document.head;e.querySelectorAll('link[data-route-style="1"]').forEach(n=>n.remove());const a=ui(t);for(const n of a){const s=document.createElement("link");s.rel="stylesheet",s.href=n,s.setAttribute("data-route-style","1"),e.appendChild(s)}}function ui(t){for(const e of ti)if(e.test(t))return e.files;return[]}function mi(){const t=document.getElementById("btnMyPage"),e=document.getElementById("btnLogout"),a=document.getElementById("avatarBtn"),n=document.getElementById("userMenu"),s=document.getElementById("menuMyPage"),i=document.getElementById("menuLogout");t&&t.addEventListener("click",()=>N("/mypage")),e&&e.addEventListener("click",async()=>{await Te(),ht(),N("/login")}),s&&s.addEventListener("click",()=>{ht(),N("/mypage")}),i&&i.addEventListener("click",async()=>{await Te(),ht(),N("/login")}),a&&a.addEventListener("click",()=>{ke()&&pi(n)}),document.addEventListener("click",o=>{if(!n||!n.classList.contains("open"))return;const r=o.target.closest("#userMenu"),m=o.target.closest("#avatarBtn");r||m||ht()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&ht()}),window.addEventListener("resize",()=>{Ra(),ke()||ht()})}function pi(t){t&&t.classList.toggle("open")}function ht(){const t=document.getElementById("userMenu");t&&t.classList.remove("open")}function $e(){const t=ut(),e=(t==null?void 0:t.user)||null,a=document.getElementById("deskNickname"),n=document.getElementById("menuNickname"),s=document.getElementById("userLinks"),i=Ft();s&&(s.style.visibility=i?"visible":"hidden");const o=String((e==null?void 0:e.nickname)||"").trim()||"사용자";a&&(a.textContent=o),n&&(n.textContent=o),vi(e==null?void 0:e.profileImageUrl)}function vi(t){const e=String(t||"").trim(),a=document.querySelector("#avatarBtn .avatar");if(a){if(!e){a.style.removeProperty("background-image"),a.style.removeProperty("background-size"),a.style.removeProperty("background-position"),a.style.removeProperty("background-repeat");return}a.style.backgroundImage=`url("${e}")`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.style.backgroundRepeat="no-repeat"}}function ke(){return window.matchMedia("(max-width: 720px)").matches}function Ra(){const t=document.getElementById("avatarBtn");if(!t)return;const e=ke();t.disabled=!e,t.classList.toggle("avatar-btn--disabled",!e)}const Ha="__mm_prev_guard_path__";function fi(){try{return sessionStorage.getItem(Ha)||""}catch{return""}}function gi(t){try{sessionStorage.setItem(Ha,String(t||""))}catch{}}let pa=null,gt=null,ft=0,qt=null;function Fa(t){if(pa=document.getElementById("notificationBtn"),document.getElementById("notificationBadge"),document.getElementById("notificationPopup"),gt=document.getElementById("notificationList"),document.getElementById("popupCount"),document.getElementById("closeNotification"),!pa){setTimeout(()=>Fa(t),500);return}console.log("✅ 알림 시스템 가동 (Member ID:",t+")"),yi(),bi(),hi(t)}function yi(){document.addEventListener("click",t=>{if(t.target.closest("#notificationBtn")){t.stopPropagation();const o=document.getElementById("notificationPopup");o?(o.classList.toggle("active"),console.log("🔔 종 버튼 클릭됨! 팝업 상태:",o.classList.contains("active"))):console.error("❌ 팝업 요소를 찾을 수 없습니다.");return}if(t.target.closest("#closeNotification")){t.stopPropagation(),document.getElementById("notificationPopup").classList.remove("active");return}const n=document.getElementById("notificationPopup"),s=t.target.closest("#notificationBtn"),i=t.target.closest("#notificationPopup");n&&n.classList.contains("active")&&!s&&!i&&n.classList.remove("active")}),console.log("✅ 이벤트 리스너(위임 방식) 등록 완료")}async function bi(){try{const t=await fetch("http://localhost:8080/api/notifications/unread",{method:"GET",credentials:"include"});if(t.ok){const a=(await t.json()).data||[];ft=a.length,xe(),gt.innerHTML="",a.length===0?za():a.forEach(n=>Oa(n,!1))}}catch(t){console.error("초기 알림 로드 실패:",t)}}function hi(t){qt&&qt.close();const e=`http://localhost:8080/api/notifications/subscribe?id=${t}`;qt=new EventSource(e,{withCredentials:!0}),qt.addEventListener("notification",a=>{const n=JSON.parse(a.data);ft++,xe(),Oa(n,!0)}),qt.onerror=a=>{}}function Oa(t,e){const a=gt.querySelector(".empty-msg");a&&a.remove();const n=document.createElement("li");n.className="notification-item";let s=t.type;t.type==="INTERVIEW_REQUEST"&&(s="인터뷰 요청"),t.type==="INTERVIEW_ACCEPTED"&&(s="인터뷰 수락"),t.type==="INTERVIEW_REJECTED"&&(s="인터뷰 거절"),t.type==="INTERVIEW_COMPLETED"&&(s="인터뷰 완료"),n.innerHTML=`
        <span class="noti-type">${s}</span>
        <span class="noti-content">${t.content}</span>
    `,n.addEventListener("click",()=>wi(t.id,t.url,n)),e?gt.prepend(n):gt.appendChild(n)}async function wi(t,e,a){try{await fetch(`http://localhost:8080/api/notifications/${t}/read`,{method:"PATCH",credentials:"include"}),a.remove(),ft--,xe(),gt.children.length===0&&za(),e&&(window.location.hash="#"+e)}catch(n){console.error(n)}}function xe(){const t=document.getElementById("notificationBadge");if(!t){console.warn("배지 요소를 찾을 수 없습니다.");return}console.log(`뱃지 업데이트: ${ft}개`),ft>0?(t.style.display="flex",t.textContent=ft>99?"99+":ft):t.style.display="none"}function za(){gt.innerHTML='<li class="empty-msg">새로운 알림이 없습니다.</li>'}const Ei="http://3.25.253.204:8080/api",Ga=Si(Ei);class _t extends Error{constructor(e,a,n){super(e),this.name="ApiError",this.status=a,this.data=n}}function Si(t){const e=String(t).trim();return e.endsWith("/")?e.slice(0,-1):e}function Ci(t){return/^https?:\/\//i.test(String(t||"").trim())}function Va(t,e){const a=String(e||"").trim();return a?Ci(a)?a:a.startsWith("/")?`${t}${a}`:`${t}/${a}`:t}function $i(t){return String(t||"").trim()}function ki(t){const e=$i(t);return e==="/auth/login"||e==="auth/login"||e==="/auth/signup"||e==="auth/signup"||e==="/auth/refresh"||e==="auth/refresh"||e==="/auth/logout"||e==="auth/logout"}async function Le(t){const e=t.headers.get("content-type")||"";if(t.status===204)return null;if(e.includes("application/json"))try{return await t.json()}catch{}try{const a=await t.text();return a?{message:a}:null}catch{return null}}function Li(){try{window.dispatchEvent(new CustomEvent("mm:auth-expired"))}catch{}}async function lt(t,e={}){const a=Va(Ga,t),n={method:"GET",credentials:"include",...e,headers:{...e.headers}},s=typeof FormData<"u"&&n.body instanceof FormData;n.body&&!s&&!n.headers["Content-Type"]&&(n.headers["Content-Type"]="application/json"),n.headers.Accept||(n.headers.Accept="application/json"),delete n.headers.Authorization;try{console.log(`🌐 API 요청: ${n.method} ${a}`),console.log("  - Headers:",n.headers),console.log("  - Credentials:",n.credentials);const i=await fetch(a,n),o=await Le(i);if(console.log(`📥 API 응답: ${n.method} ${a}`),console.log("  - Status:",i.status),console.log("  - Data:",o),i.ok)return o;if(i.status===401&&!ki(t)){if(await ji()){const m=await fetch(a,n),l=await Le(m);if(!m.ok)throw new _t((l==null?void 0:l.message)||"요청에 실패했습니다.",m.status,l);return l}throw Ii(),Li(),window.location.hash="#/login",new _t("인증이 만료되었습니다. 다시 로그인하세요.",401,o)}throw new _t((o==null?void 0:o.message)||"요청에 실패했습니다.",i.status,o)}catch(i){throw i instanceof _t?i:new _t("네트워크 오류가 발생했습니다.",0,null)}}async function ji(){try{const t=await fetch(Va(Ga,"/auth/refresh"),{method:"POST",credentials:"include",headers:{Accept:"application/json"}}),e=await Le(t);return t.ok&&(e==null?void 0:e.success)}catch{return!1}}function Ii(){localStorage.removeItem("mm_user"),localStorage.removeItem("mm_session")}function le(t,e={}){const a=t!==void 0;return{...e,body:a?JSON.stringify(t):void 0,headers:{...e.headers||{},...a?{"Content-Type":"application/json"}:{}}}}const xi={get:(t,e={})=>lt(t,{...e,method:"GET"}),post:(t,e,a={})=>lt(t,{method:"POST",...le(e,a)}),put:(t,e,a={})=>lt(t,{method:"PUT",...le(e,a)}),patch:(t,e,a={})=>lt(t,{method:"PATCH",...le(e,a)}),postForm:(t,e,a={})=>lt(t,{method:"POST",body:e,...a}),putForm:(t,e,a={})=>lt(t,{method:"PUT",body:e,...a}),patchForm:(t,e,a={})=>lt(t,{method:"PATCH",body:e,...a}),delete:(t,e={})=>lt(t,{...e,method:"DELETE"})};Ea();Ea();(async function(){try{const e=await xi.get("/members/me");if(e&&e.data){const a=e.data.memberId;console.log("🔑 자동 로그인 확인 ID:",a),Fa(a)}else console.log("👤 비로그인 상태")}catch{console.log("ℹ️ 로그인 정보 없음")}finally{ni()}})();
