/* shared/js/common.js */

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

/**
 * [추가된 핵심 함수] 날짜 포맷팅 로직
 * - 1시간 이내: 방금 전, 15분 전
 * - 오늘 (1시간 경과 후): 14:30
 * - 다음날부터: 2025.11.05
 * - 상세페이지 전용(isFull=true): 2025.11.05 14:30:53
 */
function formatBoardDate(dateStr, isFull = false) {
  const now = new Date();
  const target = new Date(dateStr);
  
  // 실제 게시글 상세용: 2025.11.05 14:30:53
  if (isFull) {
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const mm = String(target.getMinutes()).padStart(2, '0');
    const ss = String(target.getSeconds()).padStart(2, '0');
    return `${y}.${m}.${d} ${hh}:${mm}:${ss}`;
  }

  const diffMS = now - target;
  const diffMin = Math.floor(diffMS / (1000 * 60));

  // 1시간 이내: 방금 전, 15분 전
  if (diffMin < 60) {
    if (diffMin <= 1) return "방금 전";
    return `${diffMin}분 전`;
  }

  // 오늘 (1시간 경과 ~ 밤 11시 59분): HH:mm 표기
  const isToday = now.toDateString() === target.toDateString();
  if (isToday) {
    const hh = String(target.getHours()).padStart(2, '0');
    const mm = String(target.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // 다음날부터: 연.월.일 표기
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  wireThemeToggle();
  wireLoginState();
  wireGlobalSearch(); // [복구] 검색 기능 연결
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

        <div style="display:flex; align-items:center; gap:16px; flex-shrink:0;">
          <button id="themeBtn" style="background:none; border:none; cursor:pointer; font-size:20px; padding:4px; border-radius:50%; transition:0.2s;" title="다크모드 전환">
            ${isDark ? '🌙' : '☀️'}
          </button>
          <div style="width:1px; height:14px; background:var(--line);"></div>
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

// 로그인 상태 처리
function wireLoginState() {
  const btnLogin = document.getElementById("btnLogin");
  if(!btnLogin) return;

  const isLoggedIn = localStorage.getItem("is_logged_in");
  const nickName = localStorage.getItem("user_nick") || "내 정보";

  if(isLoggedIn) {
    // 버튼 텍스트를 닉네임으로 변경
    btnLogin.textContent = nickName; 
    
    // 클릭 시 마이페이지로 이동
    btnLogin.href = "mypage.html"; 
    
    // 기존의 onclick 로그아웃 이벤트 제거 (마이페이지 내부에 존재)
    btnLogin.onclick = null; 

  } else {
    btnLogin.textContent = "로그인";
    btnLogin.href = "login.html";
    btnLogin.onclick = null;
  }
}

// [복구] 글로벌 검색 기능 (자동완성 포함)
function wireGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const suggestionsBox = document.getElementById("searchSuggestions");
  const searchBox = document.getElementById("headerSearchBox");
  
  if (!input || !suggestionsBox) return;

  // 포커스 효과
  input.addEventListener("focus", () => {
    if(searchBox) searchBox.style.borderColor = "var(--primary)";
  });
  input.addEventListener("blur", () => {
    if(searchBox) searchBox.style.borderColor = "var(--line)";
    // 클릭 씹힘 방지 딜레이
    setTimeout(() => suggestionsBox.classList.remove("active"), 200);
  });

  // 입력 이벤트
  input.addEventListener("input", (e) => {
    const val = e.target.value.trim().toUpperCase();
    
    if (!val) {
      suggestionsBox.classList.remove("active");
      return;
    }

    // STOCK_DB가 있으면 검색 (없으면 빈 배열)
    const db = (typeof STOCK_DB !== 'undefined') ? STOCK_DB : [];
    
    // 검색 로직 (이름, 영어이름, 티커 매칭)
    const matched = db.filter(s => 
      s.name.includes(val) || 
      s.enName.toUpperCase().includes(val) || 
      s.ticker.includes(val)
    ).slice(0, 5); // 5개만 제한

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

  // 엔터키 처리
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      location.href = `board.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
}