/* =========================================
   [공통] 전역 레이아웃 및 GNB 컨트롤
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    // DOM 로드 완료 후 공통 레이아웃 렌더링 및 이벤트 바인딩 실행
    renderHeader();
    renderFooter();
});

/**
 * 1. 헤더(GNB) 렌더링 및 내부 스크립트 바인딩
 * - 모든 페이지에서 공통으로 사용되는 상단 네비게이션 바를 동적으로 생성합니다.
 */
function renderHeader() {
    const target = document.getElementById("global-header") || document.getElementById("header-placeholder");
    if (!target) return;
    
    // 현재 적용된 테마를 확인하여 아이콘 초기 상태 결정
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    // 헤더 HTML 주입
    target.innerHTML = `
        <div style="height:60px; background:var(--header-bg); border-bottom:1px solid var(--line); 
                    display:flex; align-items:center; justify-content:center; 
                    position:fixed; top:0; left:0; width:100%; z-index:1000;">
            
            <div style="width:1000px; max-width:96vw; display:flex; justify-content:space-between; align-items:center; padding:0 16px;">
                
                <a href="/kr/html/home.html" style="font-size:20px; font-weight:800; color:var(--primary); text-decoration:none; display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <span style="background:var(--primary); color:white; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">M</span>
                    <span class="mobile-hide">MyValuePick</span>
                </a>

                <div style="flex:1; max-width:400px; margin:0 20px; position:relative;">
                    <div style="display:flex; align-items:center; background:var(--bg); border:1px solid var(--line); border-radius:12px; padding:8px 12px; transition:0.2s;" id="headerSearchBox">
                        <input id="globalSearchInput" placeholder="종목명/티커 검색" autocomplete="off" 
                               style="border:none; background:transparent; width:100%; outline:none; font-size:14px; color:var(--text); font-weight:500;">
                        <svg style="width:18px; height:18px; color:var(--muted); cursor:pointer;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"/><path d="M16.5 16.5 21 21"/>
                        </svg>
                    </div>
                    <div id="searchSuggestions" class="search-suggestions"></div>
                </div>

                <div style="display:flex; align-items:center; gap:16px; flex-shrink:0;" id="headerRightGroup">
                    <button id="themeBtn" style="background:none; border:none; cursor:pointer; font-size:20px; padding:4px; border-radius:50%; transition:0.2s;" title="다크모드 전환">
                        ${isDark ? '🌙' : '☀️'}
                    </button>
                    
                    <div style="width:1px; height:14px; background:var(--line);"></div>

                    <div id="notiBtnWrap" class="noti-btn-wrap" style="display:none;">
                        <svg class="noti-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span id="notiBadge" class="noti-badge" style="display:none;"></span>
                        
                        <div id="notiDropdown" class="noti-dropdown">
                            <div class="noti-header">
                                <span class="noti-title">알림</span>
                                <button class="noti-read-all" onclick="markAllRead()">모두 읽음</button>
                            </div>
                            <div id="notiList" class="noti-list"></div>
                        </div>
                    </div>

                    <a href="/kr/html/login.html" id="btnLogin" style="font-size:14px; font-weight:600; color:var(--muted); text-decoration:none;">로그인</a>
                </div>

            </div>
        </div>
    `;
    
    // 헤더가 DOM에 그려진 후 기능들을 활성화합니다.
    if (typeof wireThemeToggle === 'function') wireThemeToggle();
    wireLoginState();
    wireGlobalSearch();
}

/**
 * 2. 푸터 렌더링
 * - 하단 카피라이트 및 안내 문구를 동적으로 생성합니다.
 */
function renderFooter() {
    const target = document.getElementById("global-footer") || document.getElementById("footer-placeholder");
    if (!target) return;
    target.innerHTML = `
        <div style="padding:40px 0; text-align:center; color:var(--muted); font-size:13px; margin-top:60px; border-top:1px solid var(--line);">
            <div style="margin-bottom:8px; font-weight:700;">MyValuePick</div>
            © 2024 MyValuePick. All rights reserved.<br>
            투자에 대한 책임은 본인에게 있습니다.
        </div>
    `;
}

/**
 * 3. 로그인 상태 확인 및 헤더 UI 업데이트
 * - 로컬 스토리지를 확인하여 로그인/로그아웃 상태에 맞는 버튼과 알림창을 표시합니다.
 */
function wireLoginState() {
    const btnLogin = document.getElementById("btnLogin");
    if(!btnLogin) return;

    const isLoggedIn = localStorage.getItem("is_logged_in");
    const userId = localStorage.getItem("user_id");
    const nickName = localStorage.getItem("user_nick") || "내 정보";
    const notiBtn = document.getElementById("notiBtnWrap");

    if (isLoggedIn) {
        // 로그인 상태: 닉네임 표시 및 마이페이지 연결
        btnLogin.textContent = nickName; 
        btnLogin.href = "/kr/html/mypage/mypage.html"; 
        btnLogin.onclick = null; 

        // 알림 기능 활성화
        if (notiBtn) {
            notiBtn.style.display = "flex";
            if (typeof initNotifications === 'function') initNotifications();
            if (typeof loadNotifications === 'function') loadNotifications();

            // 알림창 토글 이벤트
            notiBtn.onclick = (e) => {
                e.stopPropagation(); // 외부 클릭 시 닫힘 처리와 충돌 방지
                const dropdown = document.getElementById("notiDropdown");
                if (dropdown) {
                    dropdown.classList.toggle("show");
                    notiBtn.classList.toggle("active");
                }
            };
        }

        // 최상위 관리자 권한 확인 시 '관리자 모드' 버튼 동적 생성
        if (userId === 'root') {
            if (!document.getElementById('btnAdminMode')) {
                const parent = btnLogin.parentNode;
                parent.style.position = 'relative';

                const adminBtn = document.createElement('a');
                adminBtn.id = 'btnAdminMode';
                adminBtn.href = 'admin.html';
                adminBtn.textContent = '👑 관리자 모드';
                adminBtn.style.cssText = `
                    position: absolute; left: 100%; top: 50%; transform: translateY(-50%);
                    margin-left: 12px; font-size: 13px; font-weight: 700; color: #fff;
                    background-color: #333; padding: 6px 12px; border-radius: 6px;
                    text-decoration: none; white-space: nowrap; z-index: 10;
                `;
                parent.appendChild(adminBtn); 
            }
        }

    } else {
        // 비로그인 상태: 로그인 버튼 표시 및 기능 초기화
        btnLogin.textContent = "로그인";
        btnLogin.href = "login.html";
        btnLogin.onclick = null;

        if (notiBtn) {
            notiBtn.style.display = "none";
            document.getElementById("notiDropdown")?.classList.remove("show");
        }
        
        const adminBtn = document.getElementById('btnAdminMode');
        if (adminBtn) adminBtn.remove();
    }
}

/**
 * 4. 전역 통합 검색창 이벤트 바인딩
 * - 검색어 입력에 따른 자동완성 UI 노출 및 키보드(Enter) 검색 기능을 제공합니다.
 */
function wireGlobalSearch() {
    const input = document.getElementById("globalSearchInput");
    const suggestionsBox = document.getElementById("searchSuggestions");
    const searchBox = document.getElementById("headerSearchBox");
    
    if (!input || !suggestionsBox) return;

    // 포커스 시 테두리 색상 강조
    input.addEventListener("focus", () => {
        if(searchBox) searchBox.style.borderColor = "var(--primary)";
    });
    
    // 블러 시 원래 테두리로 복구하고 드롭다운 닫기 (약간의 지연 시간 부여)
    input.addEventListener("blur", () => {
        if(searchBox) searchBox.style.borderColor = "var(--line)";
        setTimeout(() => suggestionsBox.classList.remove("active"), 200);
    });

    // 실시간 검색어 입력 감지 로직
    input.addEventListener("input", (e) => {
        const val = e.target.value.trim().toUpperCase();
        
        if (!val) {
            suggestionsBox.classList.remove("active");
            return;
        }
        
        // 전역 변수 STOCK_DB를 기반으로 필터링 진행 (임시 더미 데이터 연동 구조)
        const db = (typeof STOCK_DB !== 'undefined') ? STOCK_DB : [];
        const matched = db.filter(s => 
            s.name.includes(val) || s.enName.toUpperCase().includes(val) || s.ticker.includes(val)
        ).slice(0, 5); // 최대 5개 노출

        if (matched.length > 0) {
            suggestionsBox.innerHTML = matched.map(stock => `
                <div class="suggestion-item" onclick="location.href='/kr/html/board.html?q=${stock.name}'">
                    <div style="text-align:left">
                        <div style="font-weight:700; font-size:13px; color:var(--text)">${stock.name}</div>
                        <div style="font-size:11px; color:var(--muted)">${stock.enName}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700; font-size:13px; color:var(--primary)">${stock.ticker}</div>
                        <div style="font-size:11px; color:var(--muted)">${stock.exch}</div>
                    </div>
                </div>
            `).join("");
            suggestionsBox.classList.add("active");
        } else {
            suggestionsBox.classList.remove("active");
        }
    });

    // 엔터키 입력 시 검색 결과 페이지로 이동
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
            location.href = `/kr/html/board.html?q=${encodeURIComponent(input.value.trim())}`;
        }
    });
}

/**
 * 5. 공통 로그아웃 처리 함수
 * - 로컬스토리지 데이터를 삭제하고 세션을 초기화합니다.
 */
function logout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_nick");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_role");
        
        alert("로그아웃 되었습니다.");
        location.href = "/kr/html/home.html"; // 메인 페이지로 리다이렉트
    }
}

// 외부 HTML에서 onclick 속성으로 접근할 수 있도록 window 객체에 할당
window.logout = logout;