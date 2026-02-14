/* shared/js/home.js - 홈 화면 전용 로직 (최신글, 인기글, 캘린더) */

document.addEventListener("DOMContentLoaded", () => {
  renderHomePosts();   // 최신글 & 구독글
  renderTrending();    // 실시간 인기글
  initCalendar();      // 증시 캘린더
});

// =========================================
// 1. 메인 영역: 최신 글 및 구독글 렌더링
// =========================================
function renderHomePosts() {
  if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return;

  // (1) 최신 글: 날짜 내림차순 정렬 후 상위 5개
  const sortedPosts = [...MOCK_DB.POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
  const homeRows = document.getElementById("homeLatestRows");

  if (homeRows) {
    homeRows.innerHTML = sortedPosts.slice(0, 5).map(p => {
        // 댓글 수에 따라 강조 색상 적용
        const commentColor = (p.comments > 0) ? "var(--primary)" : "var(--muted)";
        
        return `
      <tr>
        <td class="colNo">${p.no}</td>
        <td class="colTag"><span class="chip">${p.tag}</span></td>
        <td class="postTitle">
          <a href="post.html?id=${p.no}">
            ${p.title} 
            <span style="color:${commentColor}; font-size:12px; font-weight:700; margin-left:4px;">
              [${p.comments || 0}]
            </span>
          </a>
        </td>
        <td class="colVotes">${p.votes}</td>
        <td class="colViews mobile-hide">${formatNumber(p.views)}</td>
        <td class="colTime mobile-hide">${formatBoardDate(p.date)}</td>
      </tr>
    `}).join("");
  }

  // (2) 구독한 작가의 글 (로그인 체크)
  const subRows = document.getElementById("homeSubscribedRows");
  if (subRows) {
    const isLogged = localStorage.getItem("is_logged_in");
    
    if (!isLogged) {
      subRows.innerHTML = `<tr><td colspan="6" style="padding:40px; text-align:center; color:var(--muted); font-size:13px;">🔒 로그인 후 확인 가능합니다.</td></tr>`;
    } else {
      // 임시: 랜덤으로 5개 섞어서 보여줌 (실제론 구독 리스트 필터링 필요)
      const shuffled = [...MOCK_DB.POSTS].sort(() => 0.5 - Math.random()).slice(0, 5);
      
      subRows.innerHTML = shuffled.length ? shuffled.map(p => `
        <tr>
          <td class="colNo">${p.no}</td>
          <td class="colTag"><span class="chip">${p.tag}</span></td>
          <td class="postTitle">
             <a href="post.html?id=${p.no}">
                ${p.title}
                <span style="color:var(--muted); font-size:12px;">[${p.comments || 0}]</span>
             </a>
          </td>
          <td class="colVotes">${p.votes}</td>
          <td class="colViews mobile-hide">${formatNumber(p.views)}</td>
          <td class="colTime mobile-hide">${formatBoardDate(p.date)}</td>
        </tr>`).join("") : `<tr><td colspan="6" style="text-align:center;padding:30px">새 글이 없습니다.</td></tr>`;
    }
  }
}

// =========================================
// 2. 사이드바: 실시간 인기 글 렌더링
// =========================================
function renderTrending() {
  const container = document.getElementById("homeTrendingList");
  if (!container || typeof MOCK_DB === 'undefined') return;

  // 인기순 정렬 (조회수 + 추천수 가중치)
  const topPosts = [...MOCK_DB.POSTS]
    .sort((a, b) => (b.views + b.votes * 10) - (a.views + a.votes * 10))
    .slice(0, 5);

  container.innerHTML = topPosts.map((p, index) => {
    const rank = index + 1;
    // 1~3위는 강조 색상, 4~5위는 회색
    const rankColor = rank <= 3 ? "var(--primary)" : "var(--muted)";
    const rankWeight = rank <= 3 ? "800" : "600";

    return `
      <a href="post.html?id=${p.no}" class="searchItem">
        <div class="rank-num" style="color:${rankColor}; font-weight:${rankWeight}">${rank}</div>
        <div class="rank-content">
            <div class="rank-title text-ellipsis">${p.title}</div>
            <div class="rank-meta">
                <span>조회 ${formatNumber(p.views)}</span>
                <span style="margin:0 4px">·</span>
                <span style="color:var(--bad);">추천 ${p.votes}</span>
            </div>
        </div>
        <div class="rank-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </div>
      </a>
    `;
  }).join("");
}

// =========================================
// 3. 증시 캘린더: 로직 분리 및 강화
// =========================================

// 전역 상태 관리 (캘린더용)
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth() + 1; // 1 ~ 12
let selectedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

function initCalendar() {
  if (typeof MOCK_DB === 'undefined' || !MOCK_DB.EVENTS) return;

  // 1. 초기 렌더링
  renderCalendarDays(calYear, calMonth);
  renderEventInfo(selectedDate);
  renderUpcomingEvents();

  // 2. 드롭다운(Select) 초기화
  initCalendarControls();

  // 3. 이전/다음 버튼 이벤트
  document.getElementById("calPrev")?.addEventListener("click", () => changeMonth(-1));
  document.getElementById("calNext")?.addEventListener("click", () => changeMonth(1));
}

// 월 변경 함수
function changeMonth(offset) {
  calMonth += offset;
  if (calMonth < 1) {
    calMonth = 12;
    calYear--;
  } else if (calMonth > 12) {
    calMonth = 1;
    calYear++;
  }
  
  // UI 업데이트
  updateControlText();
  renderCalendarDays(calYear, calMonth);
}

// 년/월 선택 드롭다운 초기화
function initCalendarControls() {
  // 년도 옵션 (현재 년도 기준 앞뒤 5년)
  const currentY = new Date().getFullYear();
  const yearOpts = [];
  for(let y = currentY - 2; y <= currentY + 3; y++) {
      yearOpts.push({ val: y, text: y + "년" });
  }

  // 월 옵션 (1~12월)
  const monthOpts = [];
  for(let m = 1; m <= 12; m++) {
      monthOpts.push({ val: m, text: m + "월" });
  }

  // 커스텀 셀렉트 설치
  setupDropdown("calYear", yearOpts, calYear, (val) => {
    calYear = parseInt(val);
    renderCalendarDays(calYear, calMonth);
  });

  setupDropdown("calMonth", monthOpts, calMonth, (val) => {
    calMonth = parseInt(val);
    renderCalendarDays(calYear, calMonth);
  });
}

// 드롭다운 텍스트 동기화 (버튼으로 월 변경 시)
function updateControlText() {
    const yearTrigger = document.querySelector("#calYear .select-styled");
    const monthTrigger = document.querySelector("#calMonth .select-styled");
    
    if(yearTrigger) yearTrigger.textContent = calYear + "년";
    if(monthTrigger) monthTrigger.textContent = calMonth + "월";
}

// 달력 날짜 그리기 (핵심 로직)
function renderCalendarDays(y, m) {
  const calEl = document.getElementById("calendar");
  if (!calEl) return;

  calEl.innerHTML = "";
  
  // 요일 헤더 생성
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  days.forEach(d => {
      calEl.innerHTML += `<div class="dow">${d}</div>`;
  });

  // 해당 월의 1일의 요일 (0:일, 1:월 ...)
  const firstDayIndex = new Date(y, m - 1, 1).getDay();
  // 해당 월의 마지막 날짜 (28, 30, 31)
  const lastDate = new Date(y, m, 0).getDate();

  // 1. 앞쪽 빈칸 채우기
  for (let i = 0; i < firstDayIndex; i++) {
    calEl.innerHTML += `<div class="day muted"></div>`;
  }

  // 2. 날짜 채우기
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    
    // 오늘 날짜인지 확인
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = (dateStr === todayStr);
    const isSelected = (dateStr === selectedDate);
    
    // 일정이 있는지 확인
    const hasEvent = MOCK_DB.EVENTS.some(e => e.date === dateStr);
    
    // HTML 생성
    const cell = document.createElement("div");
    cell.className = `day ${isToday ? 'today' : ''} ${isSelected ? 'sel' : ''}`;
    cell.innerHTML = `
        ${d}
        ${hasEvent ? '<div class="dot"></div>' : ''}
    `;
    
    // 클릭 이벤트
    cell.onclick = () => {
        // 선택 효과 변경
        document.querySelectorAll("#calendar .day").forEach(el => el.classList.remove("sel"));
        cell.classList.add("sel");
        
        selectedDate = dateStr;
        renderEventInfo(dateStr);
    };
    
    calEl.appendChild(cell);
  }
}

// 선택된 날짜의 일정 상세 표시
function renderEventInfo(dateStr) {
    const box = document.getElementById("eventSelected");
    if(!box) return;
    
    const events = MOCK_DB.EVENTS.filter(e => e.date === dateStr);
    
    if(events.length === 0) {
        box.innerHTML = `<div style="color:var(--muted); font-size:13px; text-align:center;">선택한 날짜에 일정이 없습니다.</div>`;
    } else {
        box.innerHTML = events.map(e => `
            <div class="event-item" style="margin-bottom:8px;">
                <div class="badge-my" style="display:inline-block; margin-bottom:4px;">${e.type}</div>
                <div style="font-size:14px; font-weight:600;">${e.title}</div>
            </div>
        `).join("<hr style='border:0; border-top:1px dashed var(--line); margin:8px 0;'>");
    }
}

// 다가오는 일정 (오늘 이후 3개)
function renderUpcomingEvents() {
    const list = document.getElementById("eventUpcoming");
    if(!list) return;
    
    const today = new Date().toISOString().split('T')[0];
    const upcoming = MOCK_DB.EVENTS
        .filter(e => e.date >= today)
        .sort((a,b) => a.date.localeCompare(b.date))
        .slice(0, 3);
        
    if(upcoming.length === 0) {
        list.innerHTML = `<div style="font-size:12px; color:var(--muted); text-align:center;">예정된 일정이 없습니다.</div>`;
    } else {
        list.innerHTML = upcoming.map(e => `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; border-bottom:1px solid var(--line); padding-bottom:6px;">
                <span class="text-ellipsis" style="flex:1; padding-right:10px;">${e.title}</span>
                <span style="color:var(--primary); font-size:11px; font-weight:700; white-space:nowrap;">${e.date.slice(5)}</span>
            </div>
        `).join("");
    }
}

// =========================================
// [유틸리티] 커스텀 드롭다운 생성 함수
// =========================================
function setupDropdown(id, options, initialVal, onChange) {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    
    wrapper.innerHTML = ""; // 기존 내용 초기화

    // 1. 보여지는 버튼
    const trigger = document.createElement("div");
    trigger.className = "select-styled";
    const initialLabel = options.find(o => o.val === initialVal)?.text || initialVal;
    trigger.textContent = initialLabel;

    // 2. 옵션 목록
    const list = document.createElement("ul");
    list.className = "select-options";

    options.forEach(opt => {
        const li = document.createElement("li");
        li.textContent = opt.text;
        li.setAttribute("rel", opt.val);
        
        // 옵션 클릭 시 동작
        li.onclick = (e) => {
            e.stopPropagation();
            trigger.textContent = opt.text;
            trigger.classList.remove("active");
            list.style.display = "none";
            onChange(opt.val); // 콜백 실행
        };
        
        list.appendChild(li);
    });

    // 3. 트리거 클릭 시 동작 (토글)
    trigger.onclick = (e) => {
        e.stopPropagation();
        
        // 다른 열린 드롭다운 닫기
        document.querySelectorAll(".select-options").forEach(ul => {
            if(ul !== list) ul.style.display = "none";
        });
        document.querySelectorAll(".select-styled").forEach(el => {
            if(el !== trigger) el.classList.remove("active");
        });

        // 현재 드롭다운 토글
        if(list.style.display === "block") {
            list.style.display = "none";
            trigger.classList.remove("active");
        } else {
            list.style.display = "block";
            trigger.classList.add("active");
        }
    };

    wrapper.appendChild(trigger);
    wrapper.appendChild(list);

    // 4. 외부 클릭 시 닫기 (전역 이벤트는 한 번만 등록하는 게 좋으므로 체크)
    if (!window.dropdownClickEventAttached) {
        document.addEventListener("click", () => {
            document.querySelectorAll(".select-options").forEach(ul => ul.style.display = "none");
            document.querySelectorAll(".select-styled").forEach(el => el.classList.remove("active"));
        });
        window.dropdownClickEventAttached = true;
    }
}