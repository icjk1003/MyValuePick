/* shared/js/board.js */
let currentPage = 1;
const limit = 20;       // 한 페이지당 글 개수
const pageCount = 10;   // 페이지네이션 그룹 크기 (1~10, 11~20)
let currentSearchType = "all"; 

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(location.search);
  
  // 1. URL 파라미터 초기화
  const pageParam = parseInt(urlParams.get("page"));
  if (!isNaN(pageParam) && pageParam > 0) currentPage = pageParam;
  
  const typeParam = urlParams.get("type");
  if (typeParam) currentSearchType = typeParam;

  // 2. 기능 초기화
  initSearchDropdown(); 
  loadBoardData();      
  wireSearchActions();  
});

// 커스텀 드롭다운 생성
function initSearchDropdown() {
  const options = [
    { val: "all", text: "전체" },
    { val: "title", text: "제목" },
    { val: "writer", text: "글쓴이" }
  ];

  setupCustomSelect("boardSearchType", options, currentSearchType, (val) => {
    currentSearchType = val;
  });
}

function setupCustomSelect(id, options, initialVal, onChange) {
  const wrapper = document.getElementById(id);
  if (!wrapper) return;
  wrapper.innerHTML = "";
  const trigger = document.createElement("div");
  trigger.className = "select-styled";
  trigger.textContent = options.find(o => o.val === initialVal)?.text || "전체";
  const list = document.createElement("ul");
  list.className = "select-options";
  options.forEach(opt => {
    const li = document.createElement("li");
    li.textContent = opt.text;
    li.onclick = (e) => {
      e.stopPropagation();
      trigger.textContent = opt.text;
      onChange(opt.val);
      list.style.display = "none";
    };
    list.appendChild(li);
  });
  trigger.onclick = (e) => {
    e.stopPropagation();
    list.style.display = list.style.display === "block" ? "none" : "block";
  };
  wrapper.appendChild(trigger);
  wrapper.appendChild(list);
  document.addEventListener("click", () => list.style.display = "none");
}

// [핵심 변경] 비동기 데이터 로딩 적용 (DB_API 연동)
async function loadBoardData() {
  const urlParams = new URLSearchParams(location.search);
  const query = urlParams.get("q");
  
  try {
    // 1. 실제 DB API(Mock API)를 통해 데이터 가져오기
    let posts = await DB_API.getPosts();
    let targetData = [...posts];

    // 2. 날짜 최신순으로 정렬
    targetData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. 검색어 필터링 적용
    if (query) {
      const inputEl = document.getElementById("boardSearchInput");
      if(inputEl) inputEl.value = query;
      targetData = targetData.filter(p => {
        const title = p.title || ""; const writer = p.writer || "";
        if (currentSearchType === "title") return title.includes(query);
        if (currentSearchType === "writer") return writer.includes(query);
        return title.includes(query) || writer.includes(query);
      });
    }
    
    // 4. 화면 렌더링
    renderList(targetData);
    renderPager(targetData.length);
    
  } catch (error) {
    // API 에러 발생 시 처리
    console.error("게시판 데이터를 불러오는 중 오류 발생:", error);
    const tbody = document.getElementById("boardRows");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:60px 0;color:var(--bad);">게시글을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.</td></tr>`;
    }
  }
}

function renderList(posts) {
  const tbody = document.getElementById("boardRows");
  if (!tbody) return;
  const start = (currentPage - 1) * limit;
  const pageData = posts.slice(start, start + limit);
  
  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:60px 0;">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = pageData.map(p => `
    <tr>
      <td class="colNo">${p.id || p.no}</td>
      <td class="colTag"><span class="chip">${p.tag}</span></td>
      <td style="text-align:left">
        <a class="postTitle" href="/kr/html/post/post.html?id=${p.id || p.no}">
          ${p.title} ${(p.comments) > 0 ? `<span style="color:var(--primary); font-size:12px; font-weight:700;">[${p.comments}]</span>` : ""}
        </a>
      </td>
      <td class="colWriter">
        ${p.writer === '익명' ? 
          `${p.writer}` : 
          `<span class="user-nick-clickable" 
                style="cursor: pointer;" 
                data-user-name="${p.writer}" 
                data-post-count="${p.postCount || 0}" 
                data-comment-count="${p.commentCount || 0}" 
                data-blog-url="/kr/html/blog/blog.html?user=${encodeURIComponent(p.writer)}">
            ${p.writer}
          </span>`
        }
      </td>
      <td class="colVotes">${p.votes}</td>
      <td class="colViews mobile-hide">${p.views.toLocaleString()}</td>
      <td class="colTime mobile-hide">${formatBoardDate(p.date)}</td>
    </tr>`).join("");
}

// [복구] << >> 버튼이 포함된 페이지네이션 렌더링
function renderPager(totalCount) {
  const pager = document.querySelector(".pager");
  if (!pager) return;

  const totalPages = Math.ceil(totalCount / limit);
  if (totalPages === 0) { pager.innerHTML = ""; return; }

  const pageGroup = Math.ceil(currentPage / pageCount); 
  let startPage = (pageGroup - 1) * pageCount + 1; 
  let endPage = startPage + pageCount - 1;
  if (endPage > totalPages) endPage = totalPages;

  let html = "";
  
  // 처음으로 및 이전 그룹 (<<, <)
  if (startPage > 1) {
    html += `<a class="pagerBtn" href="javascript:movePage(1)">«</a>`;
    html += `<a class="pagerBtn" href="javascript:movePage(${startPage - 1})">‹</a>`;
  } else if (currentPage > 1) {
    html += `<a class="pagerBtn" href="javascript:movePage(${currentPage - 1})">‹</a>`;
  }
  
  // 페이지 번호
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = (i === currentPage) ? 'active' : '';
    html += `<a href="javascript:movePage(${i})" class="${activeClass}">${i}</a>`;
  }
  
  // 다음 그룹 및 끝으로 (>, >>)
  if (currentPage < totalPages) {
    html += `<a class="pagerBtn" href="javascript:movePage(${currentPage + 1})">›</a>`;
  }
  if (endPage < totalPages) {
    html += `<a class="pagerBtn" href="javascript:movePage(${endPage + 1})">»</a>`;
  }
  
  pager.innerHTML = html;
}

window.movePage = function(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
};

function wireSearchActions() {
  const btn = document.getElementById("boardSearchBtn");
  const input = document.getElementById("boardSearchInput");
  if (!btn || !input) return;
  const doSearch = () => {
    if (!input.value.trim()) { alert("검색어를 입력해주세요."); return; }
    location.href = `board.html?q=${encodeURIComponent(input.value.trim())}&type=${currentSearchType}&page=1`;
  };
  btn.onclick = doSearch;
  input.onkeypress = (e) => { if (e.key === "Enter") doSearch(); };
}