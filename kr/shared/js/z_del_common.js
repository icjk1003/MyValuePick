/* shared/js/common.js - 공통 유틸리티 */

// 1. 테마 적용
(function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();

// 2. 날짜 포맷팅
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

function formatNumber(num) {
  return (num || 0).toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  wireThemeToggle();
  wireLoginState();
  wireGlobalSearch();
});

// 헤더 렌더링 (쪽지 아이콘 제거됨)
function renderHeader() {
  const target = document.getElementById("global-header") || document.getElementById("header-placeholder");
  if (!target) return;
  
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

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

          <a href="login.html" id="btnLogin" style="font-size:14px; font-weight:600; color:var(--muted); text-decoration:none;">로그인</a>
        </div>

      </div>
    </div>
  `;
  
  wireThemeToggle();
  wireLoginState();
  wireGlobalSearch();
}

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

function wireLoginState() {
  const btnLogin = document.getElementById("btnLogin");
  if(!btnLogin) return;

  const isLoggedIn = localStorage.getItem("is_logged_in");
  const userId = localStorage.getItem("user_id");
  const nickName = localStorage.getItem("user_nick") || "내 정보";
  const notiBtn = document.getElementById("notiBtnWrap");

  if(isLoggedIn) {
    btnLogin.textContent = nickName; 
    btnLogin.href = "/kr/html/mypage/mypage.html"; 
    btnLogin.onclick = null; 

    // 알림 활성화
    if(notiBtn) {
        notiBtn.style.display = "flex";
        initNotifications();
        loadNotifications();

        notiBtn.onclick = (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById("notiDropdown");
            if(dropdown) {
                dropdown.classList.toggle("show");
                notiBtn.classList.toggle("active");
            }
        };
    }

    // 관리자 버튼
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
    location.href = "/kr/html/home.html";
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
// [New] 알림 시스템 (쪽지 연동 포함)
// =========================================

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

function initNotifications() {
    if (!localStorage.getItem('my_notifications')) {
        const initialData = [
            // [수정] 1. 쪽지 알림 추가 (link 파라미터 중요: section=messages&id=쪽지ID)
            { 
                id: 999, 
                type: 'message', 
                user: '운영자', 
                text: '환영합니다! 첫 쪽지를 확인해보세요.', 
                time: new Date().toISOString(), 
                link: '/kr/html/mypage/mypage.html?section=messages&id=welcome_msg' 
            },
            // 기존 데이터...
            { id: 1, type: 'reply', user: '주식고수', text: '댓글을 남겼습니다.', time: new Date().toISOString(), link: '/kr/html/post/post.html?id=1#cmt-0' },
            // ...
        ];
        localStorage.setItem('my_notifications', JSON.stringify(initialData));
        
        // [New] 쪽지 더미 데이터 초기화 (최초 1회)
        if(!localStorage.getItem("MOCK_MESSAGES")) {
            const welcomeMsg = [{
                id: "welcome_msg",
                sender: "운영자",
                receiver: "me",
                content: "MyValuePick에 오신 것을 환영합니다.\n즐거운 커뮤니티 활동 되세요!",
                date: new Date().toISOString(),
                read: false,
                box: "inbox" // inbox, sent, archive
            }];
            localStorage.setItem("MOCK_MESSAGES", JSON.stringify(welcomeMsg));
        }
    }
}

function loadNotifications() {
    const listContainer = document.getElementById("notiList");
    const badge = document.getElementById("notiBadge");
    if (!listContainer) return;

    const notis = JSON.parse(localStorage.getItem('my_notifications') || '[]');

    if (badge) {
        badge.style.display = notis.length > 0 ? "block" : "none";
    }

    if (notis.length === 0) {
        listContainer.innerHTML = `<div class="noti-empty">새로운 알림이 없습니다.</div>`;
    } else {
        listContainer.innerHTML = notis.map(n => `
            <div class="noti-item unread" onclick="handleNotiClick(${n.id}, '${n.link}')">
                <div class="noti-content">
                    <div class="noti-msg">
                        ${n.type === 'message' ? '💌 ' : ''}<strong>${n.user}</strong>: ${n.text}
                    </div>
                    <div class="noti-time">${formatBoardDate(n.time, true)}</div>
                </div>
            </div>
        `).join("");
    }
}

window.handleNotiClick = function(id, link) {
    let notis = JSON.parse(localStorage.getItem('my_notifications') || '[]');
    notis = notis.filter(n => n.id !== id);
    localStorage.setItem('my_notifications', JSON.stringify(notis));
    location.href = link;
};

window.markAllRead = function() {
    localStorage.setItem('my_notifications', '[]');
    loadNotifications();
};

/**
 * ==============================================================
 * [공통] 유저 닉네임 클릭 액션 (드롭다운 및 쪽지보내기 모달)
 * ==============================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. 드롭다운 및 모달 DOM HTML 문자열
    const userDropdownHTML = `
        <div id="globalUserDropdown" class="user-dropdown">
            <div class="user-dropdown-header" id="dropdownUserName">닉네임</div>
            <button class="user-dropdown-item" id="btnOpenMsgModal">
                <span>쪽지 보내기</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </button>
            <div class="user-dropdown-item">
                <span>게시글 개수</span>
                <span class="count" id="dropdownPostCount">0</span>
            </div>
            <div class="user-dropdown-item">
                <span>댓글 개수</span>
                <span class="count" id="dropdownCommentCount">0</span>
            </div>
            <a href="#" class="user-dropdown-item" id="dropdownBlogLink">
                <span>블로그 방문</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
        </div>
    `;

    const messageModalHTML = `
        <div id="globalMessageModal" class="message-modal-overlay">
            <div class="message-modal">
                <div class="message-modal-header">
                    <h3 class="message-modal-title">쪽지 보내기</h3>
                    <button class="btn-close-modal" id="btnCloseMsgModal">&times;</button>
                </div>
                <div class="message-modal-body">
                    <div class="msg-target-info">받는 사람: <strong id="msgTargetName">닉네임</strong></div>
                    <textarea class="message-textarea" id="msgContent" placeholder="보낼 쪽지 내용을 입력해주세요."></textarea>
                </div>
                <div class="message-modal-footer">
                    <button class="btn" id="btnCancelMsg">취소</button>
                    <button class="btn primary" id="btnSendMsg">보내기</button>
                </div>
            </div>
        </div>
    `;

    // body 태그 마지막에 요소 주입 (모든 페이지 공통 적용)
    document.body.insertAdjacentHTML('beforeend', userDropdownHTML);
    document.body.insertAdjacentHTML('beforeend', messageModalHTML);

    const dropdown = document.getElementById('globalUserDropdown');
    const msgModal = document.getElementById('globalMessageModal');
    let currentTargetName = "";

    // 2. 닉네임 클릭 이벤트 (이벤트 위임 패턴)
    document.addEventListener('click', (e) => {
        // 클릭한 요소가 '.user-nick-clickable' 클래스를 가지고 있는지 확인
        const target = e.target.closest('.user-nick-clickable');
        
        if (target) {
            e.preventDefault();
            e.stopPropagation();

            // data 속성에서 유저 정보 파싱 (없으면 기본값 설정)
            currentTargetName = target.dataset.userName || target.innerText.trim();
            const postCount = target.dataset.postCount || "0";
            const commentCount = target.dataset.commentCount || "0";
            const blogUrl = target.dataset.blogUrl || "#";

            // 드롭다운 내 데이터 렌더링
            document.getElementById('dropdownUserName').innerText = currentTargetName;
            document.getElementById('dropdownPostCount').innerText = postCount;
            document.getElementById('dropdownCommentCount').innerText = commentCount;
            document.getElementById('dropdownBlogLink').href = blogUrl;

            // 드롭다운 위치 지정 (클릭한 닉네임 바로 밑에 표시)
            const rect = target.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
            dropdown.style.left = `${rect.left + window.scrollX}px`;
            
            dropdown.classList.add('show');
            return;
        }

        // 드롭다운 외부를 클릭하면 드롭다운 닫기
        if (!e.target.closest('#globalUserDropdown') && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });

    // 3. 쪽지 보내기 모달 제어 로직
    document.getElementById('btnOpenMsgModal').addEventListener('click', () => {
        dropdown.classList.remove('show'); // 드롭다운 닫기
        document.getElementById('msgTargetName').innerText = currentTargetName; // 받는 사람 설정
        document.getElementById('msgContent').value = ""; // 내용 초기화
        msgModal.classList.add('show'); // 팝업 열기
    });

    const closeMsgModal = () => msgModal.classList.remove('show');
    document.getElementById('btnCloseMsgModal').addEventListener('click', closeMsgModal);
    document.getElementById('btnCancelMsg').addEventListener('click', closeMsgModal);

    // 모달 바깥 어두운 배경 클릭 시 닫기
    msgModal.addEventListener('click', (e) => {
        if (e.target === msgModal) closeMsgModal();
    });

    // 4. 쪽지 전송 로직 (추후 백엔드 API와 연동)
    document.getElementById('btnSendMsg').addEventListener('click', () => {
        const content = document.getElementById('msgContent').value.trim();
        if (!content) {
            alert('쪽지 내용을 입력해주세요.');
            return;
        }
        
        // 여기에 API 통신 로직 추가
        alert(`${currentTargetName}님에게 쪽지를 성공적으로 보냈습니다.`);
        closeMsgModal();
    });
});