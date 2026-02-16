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

// 헤더 렌더링
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

// 로그인 상태 처리
function wireLoginState() {
  const btnLogin = document.getElementById("btnLogin");
  if(!btnLogin) return;

  const isLoggedIn = localStorage.getItem("is_logged_in");
  const userId = localStorage.getItem("user_id");
  const nickName = localStorage.getItem("user_nick") || "내 정보";
  
  const notiBtn = document.getElementById("notiBtnWrap");

  if(isLoggedIn) {
    btnLogin.textContent = nickName; 
    btnLogin.href = "mypage.html"; 
    btnLogin.onclick = null; 

    // 1. 알림 버튼 활성화
    if(notiBtn) {
        notiBtn.style.display = "flex";
        initNotifications(); // 초기 데이터 설정
        loadNotifications(); // 로드

        notiBtn.onclick = (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById("notiDropdown");
            if(dropdown) {
                dropdown.classList.toggle("show");
                notiBtn.classList.toggle("active");
            }
        };
    }

    // 2. 관리자 버튼
    if (userId === 'root') {
        if (!document.getElementById('btnAdminMode')) {
            const parent = btnLogin.parentNode;
            parent.style.position = 'relative';

            const adminBtn = document.createElement('a');
            adminBtn.id = 'btnAdminMode';
            adminBtn.href = 'admin.html';
            adminBtn.textContent = '👑 관리자 모드';
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
    btnLogin.textContent = "로그인";
    btnLogin.href = "login.html";
    btnLogin.onclick = null;

    if(notiBtn) {
        notiBtn.style.display = "none";
        document.getElementById("notiDropdown")?.classList.remove("show");
    }

    const adminBtn = document.getElementById('btnAdminMode');
    if (adminBtn) adminBtn.remove();
  }
}

// 글로벌 검색
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
      s.name.includes(val) || s.enName.toUpperCase().includes(val) || s.ticker.includes(val)
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

function getProfileImage(nickname) {
  const myNick = localStorage.getItem("user_nick");
  const myCustomImg = localStorage.getItem("user_img");
  if (nickname === myNick && myCustomImg) return myCustomImg;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&length=2`;
}
window.getProfileImage = getProfileImage;


// =========================================
// [New] 알림 시스템 (수정됨: 삭제 및 이동 기능 포함)
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

// 1. 초기 더미 데이터 설정 (최초 1회만 실행)
function initNotifications() {
    if (!localStorage.getItem('my_notifications')) {
        // [중요] 링크에 #cmt-0 등 해시를 포함하여 스크롤 위치 지정
        const initialData = [
            { id: 1, type: 'reply', user: '주식고수', text: '댓글을 남겼습니다.', time: new Date().toISOString(), link: 'post.html?id=1#cmt-0' },
            { id: 2, type: 'tag', user: '단타왕', text: '회원님을 언급했습니다.', time: new Date(Date.now() - 3600000).toISOString(), link: 'post.html?id=1#cmt-1' },
            { id: 3, type: 'notice', user: '관리자', text: '공지사항: 서버 점검 안내', time: new Date(Date.now() - 86400000).toISOString(), link: 'post.html?id=2' },
            { id: 4, type: 'like', user: '익명', text: '게시글을 추천했습니다.', time: new Date(Date.now() - 100000000).toISOString(), link: 'post.html?id=3' }
        ];
        localStorage.setItem('my_notifications', JSON.stringify(initialData));
    }
}

// 2. 알림 로드 및 렌더링
function loadNotifications() {
    const listContainer = document.getElementById("notiList");
    const badge = document.getElementById("notiBadge");
    if (!listContainer) return;

    // LocalStorage에서 가져오기
    const notis = JSON.parse(localStorage.getItem('my_notifications') || '[]');

    // 배지 업데이트
    if (badge) {
        badge.style.display = notis.length > 0 ? "block" : "none";
    }

    // 리스트 렌더링
    if (notis.length === 0) {
        listContainer.innerHTML = `<div class="noti-empty">새로운 알림이 없습니다.</div>`;
    } else {
        // [중요] onclick 이벤트에 handleNotiClick 연결
        listContainer.innerHTML = notis.map(n => `
            <div class="noti-item unread" onclick="handleNotiClick(${n.id}, '${n.link}')">
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

// 3. [New] 알림 클릭 처리 (삭제 + 이동)
window.handleNotiClick = function(id, link) {
    // 1. 데이터 삭제 (읽음 처리 대신 삭제로 구현)
    let notis = JSON.parse(localStorage.getItem('my_notifications') || '[]');
    notis = notis.filter(n => n.id !== id); // 해당 ID 제외
    localStorage.setItem('my_notifications', JSON.stringify(notis));

    // 2. 페이지 이동
    // (삭제 상태 저장을 위해 location.href 사용)
    location.href = link;
};

// 4. [New] 모두 읽음 (모두 삭제)
window.markAllRead = function() {
    localStorage.setItem('my_notifications', '[]'); // 빈 배열 저장
    loadNotifications(); // UI 갱신
};