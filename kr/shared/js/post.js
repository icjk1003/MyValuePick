/* shared/js/post.js - 게시글 상세 + 하단 목록 (검색/페이징 포함) */

// 전역 변수
let currentPage = 1;        // 상세글 하단 목록의 현재 페이지
const limit = 20;           // 페이지당 글 수
const pageCount = 10;       // 페이징 그룹 크기
let currentSearchType = "all"; // 검색 타입

document.addEventListener("DOMContentLoaded", () => {
  // 1. URL 파라미터 처리
  const urlParams = new URLSearchParams(window.location.search);
  const postIdParam = urlParams.get("id") || urlParams.get("no");
  const postId = parseInt(postIdParam);
  
  if(urlParams.get("page")) currentPage = parseInt(urlParams.get("page"));

  // 2. DB 체크
  if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) {
    console.error("데이터베이스 로드 실패");
    return;
  }
  
  // 3. 잘못된 접근 처리
  if (!postIdParam || isNaN(postId)) {
    alert("잘못된 접근입니다.");
    location.href = "board.html";
    return;
  }

  // 4. 현재 게시글 찾기
  const post = MOCK_DB.POSTS.find(p => p.no === postId || p.id === postId);
  if (!post) { 
    alert("존재하지 않는 게시글입니다."); 
    location.href = "board.html"; 
    return; 
  }

  // 5. 화면 렌더링
  renderPostContent(post);
  renderAuthorProfile(post);
  
  // [New] 블로그 방문 버튼 이벤트 연결
  const btnVisitBlog = document.getElementById("btnVisitBlog");
  if(btnVisitBlog) {
      btnVisitBlog.onclick = () => {
          // 작성자 닉네임을 파라미터로 블로그 페이지 이동
          location.href = `blog.html?user=${encodeURIComponent(post.writer)}`;
      };
  }
  
  // 6. 댓글 기능
  window.currentCommentList = post.commentList || [];
  renderComments(window.currentCommentList);
  updateCommentInputState();
  wireCommentSubmit();
  wireActionButtons();

  // 7. 하단 목록 렌더링
  initBelowSearchDropdown();
  wireBelowSearchActions();
  loadBelowBoardData(postId);
});

// =========================================
// A. 게시글 본문 렌더링
// =========================================
function renderPostContent(post) {
  const setContent = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setContent("postTag", post.tag || "일반");
  setContent("postTitle", post.title);
  setContent("postWriter", post.writer);
  setContent("postDate", formatBoardDate(post.date, true));
  setContent("postViews", (post.views || 0).toLocaleString());
  setContent("postVotes", post.votes || 0);
  setContent("voteUpCount", post.votes || 0);

  const bodyEl = document.getElementById("postBody");
  if (bodyEl) {
    const bodyText = post.body || "";
    bodyEl.innerHTML = bodyText.replace(/\n/g, "<br>");
  }

  const cmtCount = post.comments || (post.commentList ? post.commentList.length : 0);
  setContent("postCommentCount", cmtCount);
  setContent("commentCountHeader", cmtCount);
}

function renderAuthorProfile(post) {
  const img = document.getElementById("authorImg");
  const name = document.getElementById("authorName");
  const bio = document.querySelector(".author-bio"); 

  if(img) img.src = getProfileImage(post.writer);
  if(name) name.textContent = post.writer;

  if (bio) {
    const myNick = localStorage.getItem("user_nick");
    if (post.writer === myNick || (post.writer === "익명" && post.isMyPost)) {
       const myBio = localStorage.getItem("user_bio");
       bio.textContent = myBio || `안녕하세요. ${myNick}입니다.`;
    } else {
       bio.textContent = post.writerBio || "주식과 경제를 분석하는 개인 투자자입니다.";
    }
  }
}

// =========================================
// B. 댓글 기능 (수정됨: 스크롤 기능 추가)
// =========================================
function renderComments(list) {
  const el = document.getElementById("commentList");
  if(!el) return;

  if (!list || list.length === 0) {
    el.innerHTML = `<div style="padding:40px; text-align:center; color:var(--muted);">등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</div>`;
    return;
  }

  // 각 댓글에 고유 ID (cmt-인덱스) 부여하여 스크롤 타겟 생성
  el.innerHTML = list.map((c, index) => `
    <div class="comment-item" id="cmt-${index}">
      <div class="cmt-profile">
        <img src="${getProfileImage(c.writer)}" alt="프사">
      </div>
      <div class="cmt-body">
        <div class="cmt-top">
          <div class="cmt-info">
            <span class="cmt-nick">${c.writer}</span>
            <span class="cmt-date">${formatBoardDate(c.date)}</span>
            <button class="btn-delete-cmt" onclick="deleteComment(${index})">삭제</button>
          </div>
          <button class="cmt-vote-btn">👍 ${c.votes || 0}</button>
        </div>
        <div class="cmt-content">${c.content}</div>
      </div>
    </div>`).join("");

  // URL 해시(예: #cmt-0)가 있다면 해당 위치로 스크롤
  if(window.location.hash) {
      setTimeout(() => {
          const targetId = window.location.hash; // #cmt-0
          const targetEl = document.querySelector(targetId);
          if(targetEl) {
              // 부드럽게 스크롤
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // 강조 효과
              targetEl.style.transition = "background 0.5s";
              targetEl.style.backgroundColor = "rgba(37, 99, 235, 0.1)"; // 잠시 파란색 배경
              setTimeout(() => { targetEl.style.backgroundColor = "transparent"; }, 1500);
          }
      }, 300);
  }
}

function wireCommentSubmit() {
  const btn = document.querySelector(".btn-comment-submit");
  const textarea = document.querySelector(".comment-textarea");
  
  if(!btn || !textarea) return;

  btn.addEventListener("click", () => {
    const content = textarea.value.trim();
    if(!content) { alert("내용을 입력해주세요."); return; }

    const isLoggedIn = localStorage.getItem("is_logged_in");
    let writer = isLoggedIn ? localStorage.getItem("user_nick") : "익명";
    
    if (!isLoggedIn) {
      const anonNick = document.querySelector(".anon-input-group input[type='text']")?.value;
      if(!anonNick) { alert("닉네임을 입력해주세요."); return; }
      writer = anonNick;
    }

    window.currentCommentList.unshift({ 
      writer, content, date: new Date().toISOString(), votes: 0 
    });
    textarea.value = "";
    renderComments(window.currentCommentList);
  });
}

window.deleteComment = function(index) {
  if(confirm("댓글을 삭제하시겠습니까?")) {
    window.currentCommentList.splice(index, 1);
    renderComments(window.currentCommentList);
  }
};

function updateCommentInputState() {
  const isLoggedIn = localStorage.getItem("is_logged_in");
  const myNick = localStorage.getItem("user_nick");
  const anonInputs = document.getElementById("anonInputs");
  const loginProfile = document.getElementById("loginProfile");

  if (isLoggedIn) {
    if(anonInputs) anonInputs.classList.add("d-none");
    if(loginProfile) {
      loginProfile.classList.remove("d-none");
      loginProfile.querySelector("span").textContent = myNick;
    }
  } else {
    if(anonInputs) anonInputs.classList.remove("d-none");
    if(loginProfile) loginProfile.classList.add("d-none");
  }
}

function wireActionButtons() {
  document.getElementById("btnVoteUp")?.addEventListener("click", () => alert("추천!"));
  document.getElementById("btnVoteDown")?.addEventListener("click", () => alert("비추천"));
}

window.sharePost = function() {
  navigator.clipboard.writeText(window.location.href).then(() => alert("링크 복사 완료!"));
};

window.reportPost = function() {
  alert("신고가 접수되었습니다.");
};


// =========================================
// C. 하단 게시글 목록 (검색 + 페이징)
// =========================================

// 1. 드롭다운 초기화
function initBelowSearchDropdown() {
  const options = [
    { val: "all", text: "전체" },
    { val: "title", text: "제목" },
    { val: "writer", text: "글쓴이" }
  ];

  setupBelowCustomSelect("belowSearchType", options, currentSearchType, (val) => {
    currentSearchType = val;
  });
}

function setupBelowCustomSelect(id, options, initialVal, onChange) {
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

// 2. 데이터 로드 및 렌더링
function loadBelowBoardData(currentId) {
  const inputEl = document.getElementById("belowSearchInput");
  const query = inputEl ? inputEl.value.trim() : "";
  
  let targetData = [...MOCK_DB.POSTS];
  targetData.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (query) {
    targetData = targetData.filter(p => {
      const title = p.title || ""; 
      const writer = p.writer || "";
      if (currentSearchType === "title") return title.includes(query);
      if (currentSearchType === "writer") return writer.includes(query);
      return title.includes(query) || writer.includes(query);
    });
  }
  
  renderBelowList(targetData, currentId);
  renderBelowPager(targetData.length, currentId);
}

function renderBelowList(posts, currentId) {
  const tbody = document.getElementById("boardBelowRows");
  if (!tbody) return;
  
  const start = (currentPage - 1) * limit;
  const pageData = posts.slice(start, start + limit);
  
  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px 0;">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = pageData.map(p => `
    <tr class="${p.no === currentId ? 'active-row' : ''}">
      <td class="colNo">${p.no}</td>
      <td class="colTag"><span class="chip">${p.tag}</span></td>
      <td style="text-align:left">
        <a class="postTitle" href="post.html?id=${p.no}&page=${currentPage}" style="color:inherit; text-decoration:none;">
          ${p.title} ${(p.comments) > 0 ? `<span style="color:var(--primary); font-size:12px; font-weight:700;">[${p.comments}]</span>` : ""}
        </a>
      </td>
      <td class="colWriter">${p.writer}</td>
      <td class="colVotes">${p.votes}</td>
      <td class="colViews mobile-hide">${p.views.toLocaleString()}</td>
      <td class="colTime mobile-hide">${formatBoardDate(p.date)}</td>
    </tr>`).join("");
}

// 3. 페이지네이션
function renderBelowPager(totalCount, currentId) {
  const pager = document.getElementById("belowPager");
  if (!pager) return;

  const totalPages = Math.ceil(totalCount / limit);
  if (totalPages === 0) { pager.innerHTML = ""; return; }

  const pageGroup = Math.ceil(currentPage / pageCount); 
  let startPage = (pageGroup - 1) * pageCount + 1; 
  let endPage = startPage + pageCount - 1;
  if (endPage > totalPages) endPage = totalPages;

  let html = "";
  
  if (startPage > 1) {
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(1, ${currentId})">«</a>`;
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${startPage - 1}, ${currentId})">‹</a>`;
  } else if (currentPage > 1) {
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${currentPage - 1}, ${currentId})">‹</a>`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = (i === currentPage) ? 'active' : '';
    html += `<a href="javascript:moveBelowPage(${i}, ${currentId})" class="${activeClass}">${i}</a>`;
  }
  
  if (currentPage < totalPages) {
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${currentPage + 1}, ${currentId})">›</a>`;
  }
  if (endPage < totalPages) {
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${endPage + 1}, ${currentId})">»</a>`;
  }
  
  pager.innerHTML = html;
}

window.moveBelowPage = function(page, currentId) {
  currentPage = page;
  loadBelowBoardData(currentId);
};

function wireBelowSearchActions() {
  const btn = document.getElementById("belowSearchBtn");
  const input = document.getElementById("belowSearchInput");
  const urlParams = new URLSearchParams(window.location.search);
  const currentId = parseInt(urlParams.get("id") || urlParams.get("no"));

  if (!btn || !input) return;

  const doSearch = () => {
    currentPage = 1;
    loadBelowBoardData(currentId);
  };

  btn.onclick = doSearch;
  input.onkeypress = (e) => { if (e.key === "Enter") doSearch(); };
}