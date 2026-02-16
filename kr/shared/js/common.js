/* shared/js/common.js - 공통 유틸리티 함수 */

// 1. [핵심] 페이지 로드 즉시 저장된 테마 적용
(function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();

// 2. 날짜 포맷팅 함수
function formatBoardDate(dateString, full = false) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (!full) {
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  if (full) {
      const hour = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hour}:${min}`;
  }
  return `${year}-${month}-${day}`;
}

// 3. 숫자 콤마 포맷팅
function formatNumber(num) {
  return (num || 0).toLocaleString();
}

// 4. 공통 초기화 (헤더/푸터/이벤트)
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  wireThemeToggle();
  wireLoginState();
  wireGlobalSearch();
});

// 헤더 렌더링 (알림 버튼 HTML 구조 포함)
function renderHeader() {
  const target = document.getElementById("global-header") || document.getElementById("header-placeholder");
  if (!target) return;
  
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  target.innerHTML = `
    <div style="height:60px; background:var(--header-bg); border-bottom:1px solid var(--line); 
                display:flex; align-items:center; justify-content:center; 
                position:fixed; top:0; left:0; width:100%; z-index:1000;">
      
      <div style="width:1000px; max-width:96vw; display:flex; justify-content:space-between; align-items:center; padding:0 16px;">
        
        <a href="home.html" style="font-size:20px; font-weight:800; color:var(--primary); text-decoration:none; display:flex; align-items:center; gap:6px; flex-shrink:0;">
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

          <a href="login.html" id="btnLogin" style="font-size:14px; font-weight:600; color:var(--muted); text-decoration:none;">로그인</a>
        </div>

      </div>
    </div>
  `;
  
  // 이벤트 재연결
  wireThemeToggle();
  wireLoginState();
  wireGlobalSearch();
}

// 푸터 렌더링
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

// 테마 토글
function wireThemeToggle() {
  const btn = document.getElementById("themeBtn");
  if (!btn) return;

  btn.onclick = null;
  btn.onclick = () => {
    const root = document.documentElement;
    const isDark = root.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    
    root.setAttribute("data-theme", newTheme);
    btn.textContent = newTheme === "dark" ? '🌙' : '☀️';
    localStorage.setItem("theme", newTheme);
  };
}

// [수정됨] 로그인 상태, 관리자 버튼, 알림 기능 통합
function wireLoginState() {
  const btnLogin = document.getElementById("btnLogin");
  if(!btnLogin) return;

  const isLoggedIn = localStorage.getItem("is_logged_in");
  const userId = localStorage.getItem("user_id");
  const nickName = localStorage.getItem("user_nick") || "내 정보";
  
  // 알림 버튼 요소
  const notiBtn = document.getElementById("notiBtnWrap");

  if(isLoggedIn) {
    btnLogin.textContent = nickName; 
    btnLogin.href = "mypage.html"; 
    btnLogin.onclick = null; 

    // 1. 알림 버튼 활성화
    if(notiBtn) {
        notiBtn.style.display = "flex";
        loadNotifications(); // 데이터 로드

        // 토글 이벤트
        notiBtn.onclick = (e) => {
            e.stopPropagation(); // 버블링 방지
            const dropdown = document.getElementById("notiDropdown");
            if(dropdown) {
                dropdown.classList.toggle("show");
                notiBtn.classList.toggle("active");
            }
        };
    }

    // 2. 관리자(root) 버튼 추가 (위치 고정)
    if (userId === 'root') {
        if (!document.getElementById('btnAdminMode')) {
            const parent = btnLogin.parentNode;
            
            // 기준점 설정
            parent.style.position = 'relative';

            const adminBtn = document.createElement('a');
            adminBtn.id = 'btnAdminMode';
            adminBtn.href = 'admin.html';
            adminBtn.textContent = '👑 관리자 모드';
            
            // 스타일: 닉네임 오른쪽(100%) 위치에 고정 (Absolute)
            adminBtn.style.cssText = `
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%);
                margin-left: 12px;
                font-size: 13px;
                font-weight: 700;
                color: #fff;
                background-color: #333; 
                padding: 6px 12px;
                border-radius: 6px;
                text-decoration: none;
                white-space: nowrap;
                z-index: 10;
            `;
            
            parent.appendChild(adminBtn); 
        }
    }

  } else {
    // 로그아웃 상태
    btnLogin.textContent = "로그인";
    btnLogin.href = "login.html";
    btnLogin.onclick = null;

    // 알림 버튼 숨김
    if(notiBtn) {
        notiBtn.style.display = "none";
        document.getElementById("notiDropdown")?.classList.remove("show");
    }

    // 관리자 버튼 제거
    const adminBtn = document.getElementById('btnAdminMode');
    if (adminBtn) adminBtn.remove();
  }
}

// 글로벌 검색 기능
function wireGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const suggestionsBox = document.getElementById("searchSuggestions");
  const searchBox = document.getElementById("headerSearchBox");
  
  if (!input || !suggestionsBox) return;

  input.addEventListener("focus", () => {
    if(searchBox) searchBox.style.borderColor = "var(--primary)";
  });
  input.addEventListener("blur", () => {
    if(searchBox) searchBox.style.borderColor = "var(--line)";
    setTimeout(() => suggestionsBox.classList.remove("active"), 200);
  });

  input.addEventListener("input", (e) => {
    const val = e.target.value.trim().toUpperCase();
    if (!val) {
      suggestionsBox.classList.remove("active");
      return;
    }

    const db = (typeof STOCK_DB !== 'undefined') ? STOCK_DB : [];
    const matched = db.filter(s => 
      s.name.includes(val) || 
      s.enName.toUpperCase().includes(val) || 
      s.ticker.includes(val)
    ).slice(0, 5);

    if (matched.length > 0) {
      suggestionsBox.innerHTML = matched.map(stock => `
        <div class="suggestion-item" onclick="location.href='board.html?q=${stock.name}'">
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

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      location.href = `board.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
}

// 로그아웃 기능 (전역 함수)
function logout() {
  if (confirm("로그아웃 하시겠습니까?")) {
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_nick");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    
    alert("로그아웃 되었습니다.");
    location.href = "home.html";
  }
}
window.logout = logout;

// 프로필 이미지 URL 가져오기
function getProfileImage(nickname) {
  const myNick = localStorage.getItem("user_nick");
  const myCustomImg = localStorage.getItem("user_img");

  if (nickname === myNick && myCustomImg) {
    return myCustomImg;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&length=2`;
}
window.getProfileImage = getProfileImage;


// =========================================
// [New] 알림 시스템 로직 (추가됨)
// =========================================

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', (e) => {
    const notiBtn = document.getElementById("notiBtnWrap");
    const dropdown = document.getElementById("notiDropdown");
    
    if (notiBtn && dropdown && dropdown.classList.contains('show')) {
        if (!notiBtn.contains(e.target)) {
            dropdown.classList.remove('show');
            notiBtn.classList.remove('active');
        }
    }
});

// 더미 데이터 및 로드 함수
const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'reply', user: '주식고수', text: '작성하신 글에 댓글을 남겼습니다.', time: '2024-05-20T10:30:00', read: false, link: '#' },
    { id: 2, type: 'tag', user: '단타왕', text: '댓글에서 회원님을 언급했습니다: @MyValuePick', time: '2024-05-19T14:20:00', read: false, link: '#' },
    { id: 3, type: 'comment', user: '관리자', text: '공지사항이 업데이트 되었습니다.', time: '2024-05-18T09:00:00', read: true, link: '#' },
    { id: 4, type: 'like', user: '익명', text: '회원님의 게시글을 추천했습니다.', time: '2024-05-17T11:00:00', read: true, link: '#' },
    { id: 5, type: 'system', user: 'System', text: '비밀번호 변경 완료 안내', time: '2024-05-10T12:00:00', read: true, link: '#' }
];

function loadNotifications() {
    const listContainer = document.getElementById("notiList");
    const badge = document.getElementById("notiBadge");
    if (!listContainer) return;

    // 읽지 않은 개수 확인
    const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
    if (badge) {
        badge.style.display = unreadCount > 0 ? "block" : "none";
    }

    // 리스트 렌더링
    if (MOCK_NOTIFICATIONS.length === 0) {
        listContainer.innerHTML = `<div class="noti-empty">새로운 알림이 없습니다.</div>`;
    } else {
        listContainer.innerHTML = MOCK_NOTIFICATIONS.map(n => `
            <div class="noti-item ${n.read ? '' : 'unread'}" onclick="location.href='${n.link}'">
                <div class="noti-content">
                    <div class="noti-msg">
                        <strong>${n.user}</strong>: ${n.text}
                    </div>
                    <div class="noti-time">${formatBoardDate(n.time, true)}</div>
                </div>
            </div>
        `).join("");
    }
}

// 모두 읽음 처리
window.markAllRead = function() {
    MOCK_NOTIFICATIONS.forEach(n => n.read = true);
    loadNotifications();
};