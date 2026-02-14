/* shared/js/home.js */

document.addEventListener("DOMContentLoaded", () => {
  renderHomePosts();
  renderTrending();
  wireCalendar();
});

// 1. 메인: 최신 글 및 구독글
function renderHomePosts() {
  if (typeof MOCK_DB === 'undefined') return;

  // (1) 최신 글 (New 아이콘 적용 + 제목 칸 확보)
  const sortedPosts = [...MOCK_DB.POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
  const homeRows = document.getElementById("homeLatestRows");

  const latestTitle = document.querySelector(".h3"); 
  if(latestTitle && latestTitle.textContent.includes("최신 글")) {
    latestTitle.innerHTML = `<span style="background:#EF4444; color:white; font-size:11px; padding:2px 6px; border-radius:4px; margin-right:6px;">NEW</span> 최신 글`;
  }

  const table = homeRows ? homeRows.parentElement : null;
  if(table) {
    const colgroup = table.querySelector("colgroup");
    if(colgroup) {
      colgroup.innerHTML = `<col style="width:50px"><col style="width:70px"><col><col style="width:60px"><col class="mobile-hide" style="width:70px"><col class="mobile-hide" style="width:90px">`;
    }
  }

if (homeRows) {
    // 정렬된 데이터에서 상위 5개 추출
    homeRows.innerHTML = sortedPosts.slice(0, 5).map(p => `
      <tr>
        <td class="colNo" style="color:var(--muted); font-size:12px;">${p.no}</td>
        <td class="colTag"><span class="chip" style="padding:2px 8px; font-size:11px">${p.tag}</span></td>
        <td title="${p.title}">
          <a class="postTitle text-ellipsis" href="post-detail.html?no=${p.no}" style="display:flex; align-items:center; gap:6px;">
            ${p.no > 10147 ? `<span style="color:#EF4444; font-weight:900; font-size:10px;">N</span>` : ''}
            ${p.title}
          </a>
        </td>
        <td class="colVotes" style="font-size:12px;">${p.votes}</td>
        <td class="colViews mobile-hide" style="font-size:12px; color:var(--muted)">${p.views}</td>
        <td class="colTime mobile-hide" style="font-size:11px; color:var(--muted)">
          ${formatBoardDate(p.date)}
        </td>
      </tr>
    `).join("");
  }

  // (2) 구독글
  const subRows = document.getElementById("homeSubscribedRows");
  if (subRows) {
    const isLogged = localStorage.getItem("is_logged_in");
    if (!isLogged) {
      subRows.innerHTML = `<tr><td colspan="6" style="padding:40px; text-align:center; color:var(--muted); font-size:13px;">🔒 로그인 후 확인 가능합니다.</td></tr>`;
    } else {
      const mySubs = ["user_150", "user_149", "user_148", "ant_man"];
      const subPosts = MOCK_DB.POSTS.filter(p => mySubs.includes(p.writer)).slice(0, 5);
      subRows.innerHTML = subPosts.length ? subPosts.map(p => `
        <tr>
          <td class="colNo">${p.no}</td>
          <td class="colTag"><span class="chip">${p.tag}</span></td>
          <td><a class="postTitle text-ellipsis" href="post-detail.html?no=${p.no}">${p.title}</a></td>
          <td class="colVotes">${p.votes}</td>
          <td class="colViews mobile-hide">${p.views}</td>
          <td class="colTime mobile-hide">
            ${formatBoardDate(p.date)}
          </td>
        </tr>`).join("") : `<tr><td colspan="6" style="text-align:center;padding:30px">새 글이 없습니다.</td></tr>`;
    }
  }
}

// 2. 사이드바: 실시간 인기 글
function renderTrending() {
  const trending = document.getElementById("homeTrendingList");
  if (trending && typeof MOCK_DB !== 'undefined') {
    const topPosts = [...MOCK_DB.POSTS].sort((a, b) => b.votes - a.votes).slice(0, 5);
    
    trending.innerHTML = topPosts.map((p, index) => `
      <a class="searchItem" href="post-detail.html?no=${p.no}" style="display:block; padding:12px 16px; border-bottom:1px solid var(--line);">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-weight:900; font-size:16px; color:var(--primary); width:16px; text-align:center;">${index + 1}</div>
          <div style="overflow:hidden; flex:1; min-width:0;">
            <div class="text-ellipsis" style="font-weight:600; font-size:14px; color:var(--text); margin-bottom:2px;">
              ${p.title}
            </div>
            <div style="font-size:11px; color:var(--muted);">
              추천 ${p.votes} · 댓글 ${Math.floor(p.votes / 3)}
            </div>
          </div>
        </div>
      </a>
    `).join("");
  }
}

// 3. 캘린더: 커스텀 드롭다운 적용 버전
function wireCalendar() {
  const cal = document.getElementById("calendar");
  const selectedBox = document.getElementById("eventSelected");
  const upcomingBox = document.getElementById("eventUpcoming");
  const btnPrev = document.getElementById("calPrev");
  const btnNext = document.getElementById("calNext");

  if (!cal || typeof MOCK_DB === 'undefined') return;

  const eventMap = MOCK_DB.EVENTS.reduce((acc, evt) => {
    (acc[evt.date] = acc[evt.date] || []).push(evt);
    return acc;
  }, {});

  if (window.curY === undefined) window.curY = new Date().getFullYear();
  if (window.curM === undefined) window.curM = new Date().getMonth();
  let selectedISO = new Date().toISOString().split('T')[0];

  // 커스텀 드롭다운 생성 및 제어 함수
  function setupCustomSelect(id, options, initialVal, onChange) {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    wrapper.innerHTML = ""; // 초기화

    // 1. 보여지는 버튼 (Trigger)
    const trigger = document.createElement("div");
    trigger.className = "select-styled";
    const initialLabel = options.find(o => o.val === initialVal)?.text || initialVal;
    trigger.textContent = initialLabel;
    
    // 2. 숨겨진 목록 (List)
    const list = document.createElement("ul");
    list.className = "select-options";

    options.forEach(opt => {
      const li = document.createElement("li");
      li.textContent = opt.text;
      li.setAttribute("rel", opt.val);
      if (opt.val === initialVal) li.setAttribute("rel", "selected"); // 초기 선택 표시
      
      li.onclick = (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        trigger.textContent = opt.text;
        onChange(opt.val); // 값 변경 콜백 실행
        
        // UI 업데이트
        list.style.display = "none";
        trigger.classList.remove("active");
        
        // 선택 스타일 갱신
        Array.from(list.children).forEach(c => {
            if(c === li) c.setAttribute("rel", "selected");
            else c.removeAttribute("rel");
        });
      };
      list.appendChild(li);
    });

    // 3. 클릭 이벤트 (열기/닫기)
    trigger.onclick = (e) => {
      e.stopPropagation();
      // 다른 열린 드롭다운 모두 닫기
      document.querySelectorAll(".select-options").forEach(ul => {
        if (ul !== list) ul.style.display = "none";
      });
      document.querySelectorAll(".select-styled").forEach(el => {
        if (el !== trigger) el.classList.remove("active");
      });

      // 토글
      if (list.style.display === "block") {
        list.style.display = "none";
        trigger.classList.remove("active");
      } else {
        list.style.display = "block";
        trigger.classList.add("active");
      }
    };

    wrapper.appendChild(trigger);
    wrapper.appendChild(list);
  }

  // 화면 아무곳이나 클릭하면 드롭다운 닫기
  document.addEventListener("click", () => {
    document.querySelectorAll(".select-options").forEach(ul => ul.style.display = "none");
    document.querySelectorAll(".select-styled").forEach(el => el.classList.remove("active"));
  });

  function initControls() {
    // 연도 데이터 생성 (2024 ~ 2028)
    const yearOpts = [];
    for(let y = 2024; y <= 2028; y++) yearOpts.push({ val: y, text: y + "년" });

    // 월 데이터 생성 (0 ~ 11)
    const monthOpts = [];
    for(let m = 0; m < 12; m++) monthOpts.push({ val: m, text: (m + 1) + "월" });

    // 커스텀 셀렉트 설치
    setupCustomSelect("calYear", yearOpts, window.curY, (val) => {
      window.curY = val; render();
    });

    setupCustomSelect("calMonth", monthOpts, window.curM, (val) => {
      window.curM = val; render();
    });
    
    // 화살표 버튼 연결
    if(btnPrev) btnPrev.onclick = () => {
      window.curM--;
      if (window.curM < 0) { window.curM = 11; window.curY--; }
      syncControlsAndRender();
    };
    
    if(btnNext) btnNext.onclick = () => {
      window.curM++;
      if (window.curM > 11) { window.curM = 0; window.curY++; }
      syncControlsAndRender();
    };
  }

  function syncControlsAndRender() {
    render();
    const yearWrapper = document.getElementById("calYear");
    const monthWrapper = document.getElementById("calMonth");
    
    if(yearWrapper) {
       const display = yearWrapper.querySelector(".select-styled");
       if(display) display.textContent = window.curY + "년";
    }
    if(monthWrapper) {
       const display = monthWrapper.querySelector(".select-styled");
       if(display) display.textContent = (window.curM + 1) + "월";
    }
  }

  function renderInfo(iso) {
    if(!selectedBox) return;
    const evts = eventMap[iso] || [];
    const day = ["일","월","화","수","목","금","토"][new Date(iso).getDay()];
    let html = `<div style="font-weight:800;font-size:13px;margin-bottom:8px">${iso} (${day})</div>`;
    if(evts.length === 0) html += `<div style="color:var(--muted);font-size:12px">일정이 없습니다.</div>`;
    else html += evts.map(e => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--line)"><span style="font-size:13px">${e.title}</span><span class="badge" style="font-size:10px">${e.type}</span></div>`).join("");
    selectedBox.innerHTML = html;
  }

  function renderUpcoming() {
    if(!upcomingBox) return;
    const today = new Date().toISOString().split('T')[0];
    const ups = MOCK_DB.EVENTS.filter(e => e.date >= today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
    if(ups.length===0) { upcomingBox.innerHTML=`<div style="font-size:12px;color:var(--muted)">예정된 일정이 없습니다.</div>`; return; }
    upcomingBox.innerHTML = ups.map(e => `<div class="eventCardMini" style="display:flex; justify-content:space-between; margin-bottom:6px;"><div><div style="font-weight:700;font-size:12px;color:var(--primary)">${e.date.slice(5)}</div><div style="font-size:13px">${e.title}</div></div><div class="badge" style="font-size:10px">${e.type}</div></div>`).join("");
  }
  
  function render() {
    if(!cal) return;
    cal.innerHTML = "";
    ["일","월","화","수","목","금","토"].forEach(d => cal.innerHTML += `<div class="dow">${d}</div>`);
    
    const first = new Date(window.curY, window.curM, 1);
    const startDay = first.getDay(); 
    const start = new Date(first); start.setDate(1 - startDay); 
    
    for(let i=0; i<42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const isCur = d.getMonth() === window.curM;
      const isToday = iso === new Date().toISOString().split('T')[0];
      const hasEvt = !!eventMap[iso];
      
      const cell = document.createElement("div");
      cell.className = `day ${!isCur?'muted':''} ${isToday?'today':''} ${iso===selectedISO?'sel':''}`;
      cell.innerHTML = `${d.getDate()} ${hasEvt ? '<div class="dot"></div>' : ''}`;
      cell.onclick = () => { 
        selectedISO = iso; 
        const allDays = cal.querySelectorAll(".day");
        allDays.forEach(day => day.classList.remove("sel"));
        cell.classList.add("sel");
        renderInfo(iso); 
      };
      cal.appendChild(cell);
    }
  }
  
  initControls(); 
  render(); 
  renderInfo(selectedISO); 
  renderUpcoming();
}