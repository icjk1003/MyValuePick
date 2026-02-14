/* shared/js/post.js - 게시글 상세 + 하단 목록 기능 포함 */

// 전역 변수 (하단 목록 페이징용)
let currentPage = 1;
const limit = 20;     // 한 페이지당 글 개수
const pageCount = 10; // 페이징 단위

document.addEventListener("DOMContentLoaded", () => {
  // 1. URL에서 글 번호(id) 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const postIdParam = urlParams.get("id") || urlParams.get("no");
  const postId = parseInt(postIdParam);
  
  // 페이지 파라미터가 있으면 적용
  if(urlParams.get("page")) currentPage = parseInt(urlParams.get("page"));

  // 2. 데이터베이스 확인
  if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS || MOCK_DB.POSTS.length === 0) {
    console.error("데이터베이스가 로드되지 않았습니다.");
    // data.js가 비동기로 로드될 수 있으므로 잠시 대기 후 리로드하거나 알림
    return;
  }
  
  // 3. 잘못된 접근 체크
  if (!postIdParam || isNaN(postId)) {
    alert("잘못된 접근입니다. 게시판 목록에서 글을 선택해주세요.");
    location.href = "board.html";
    return;
  }

  // 4. 해당 글 찾기
  const post = MOCK_DB.POSTS.find(p => p.no === postId || p.id === postId);

  if (!post) { 
    alert("삭제되었거나 존재하지 않는 게시글입니다."); 
    location.href = "board.html"; 
    return; 
  }

  // 5. [상세] 화면에 데이터 뿌리기
  renderPostContent(post);
  renderAuthorProfile(post);
  
  // 6. [댓글] 댓글 기능 초기화
  window.currentCommentList = post.commentList || [];
  renderComments(window.currentCommentList);
  updateCommentInputState();
  wireCommentSubmit();
  wireActionButtons();

  // 7. [목록] 하단 게시글 목록 렌더링 (추가된 부분)
  renderBelowBoard(currentPage, postId);
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
    const bodyText = post.body || "내용이 없습니다.";
    bodyEl.innerHTML = bodyText.replace(/\n/g, "<br>");
  }

  const cmtCount = post.comments || (post.commentList ? post.commentList.length : 0);
  setContent("postCommentCount", cmtCount);
  setContent("commentCountHeader", cmtCount);
}

function renderAuthorProfile(post) {
  const img = document.getElementById("authorImg");
  const name = document.getElementById("authorName");
  const bio = document.querySelector(".author-bio") || document.querySelector(".author-desc"); 

  // ★ 수정된 부분: getProfileImage 함수 사용
  if(img) img.src = getProfileImage(post.writer);
  
  if(name) name.textContent = post.writer;

  // (자기소개글 로직은 기존 유지)
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
// B. 댓글 기능
// =========================================
function renderComments(list) {
  const el = document.getElementById("commentList");
  if(!el) return;

  if (!list || list.length === 0) {
    el.innerHTML = `<div style="padding:40px; text-align:center; color:var(--muted);">등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</div>`;
    return;
  }

  el.innerHTML = list.map((c, index) => `
    <div class="comment-item">
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
          <button class="cmt-vote-btn" onclick="alert('추천!')">👍 ${c.votes || 0}</button>
        </div>
        <div class="cmt-content">${c.content}</div>
      </div>
    </div>`).join("");
}

function wireCommentSubmit() {
  const btn = document.querySelector(".btn-comment-submit");
  const textarea = document.querySelector(".comment-textarea");
  
  if(!btn || !textarea) return;

  btn.addEventListener("click", () => {
    const content = textarea.value.trim();
    if(!content) { alert("내용을 입력해주세요."); return; }

    const isLoggedIn = localStorage.getItem("is_logged_in");
    let writer = "익명";
    
    if (isLoggedIn) {
      writer = localStorage.getItem("user_nick");
    } else {
      const anonNick = document.querySelector(".anon-input-group input[type='text']")?.value;
      if(!anonNick) { alert("닉네임을 입력해주세요."); return; }
      writer = anonNick;
    }

    const newComment = { 
      writer, 
      content, 
      date: new Date().toISOString(), 
      votes: 0, 
      password: "1234",
      profileImg: null 
    };

    window.currentCommentList.unshift(newComment);
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
      loginProfile.querySelector("span").textContent = myNick || "유저";
    }
  } else {
    if(anonInputs) anonInputs.classList.remove("d-none");
    if(loginProfile) loginProfile.classList.add("d-none");
  }
}

function wireActionButtons() {
  document.getElementById("btnVoteUp")?.addEventListener("click", () => alert("추천되었습니다!"));
  document.getElementById("btnVoteDown")?.addEventListener("click", () => alert("비추천되었습니다."));
}

window.sharePost = function() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => alert("링크가 복사되었습니다!"));
};

window.reportPost = function() {
  prompt("신고 사유를 입력해주세요.");
  alert("신고가 접수되었습니다.");
};


// =========================================
// C. [복구됨] 하단 게시글 목록 (Below Board)
// =========================================
function renderBelowBoard(page, currentId) {
  const tbody = document.getElementById("boardBelowRows");
  if(!tbody) return;

  const allPosts = MOCK_DB.POSTS;
  const start = (page - 1) * limit;
  const pageData = allPosts.slice(start, start + limit);
  
  tbody.innerHTML = pageData.map(p => `
    <tr class="${p.no === currentId ? 'active-row' : ''}">
      <td class="colNo">${p.no}</td>
      <td class="colTag"><span class="chip">${p.tag}</span></td>
      <td class="postTitle">
        <a href="post.html?id=${p.no}&page=${page}" style="color:inherit; text-decoration:none;">
          ${p.title} <span style="color:var(--primary); font-size:12px;">[${p.comments || 0}]</span>
        </a>
      </td>
      <td class="colWriter">${p.writer}</td>
      <td class="colVotes">${p.votes}</td>
      <td class="colViews mobile-hide">${(p.views || 0).toLocaleString()}</td>
      <td class="colTime mobile-hide">${formatBoardDate(p.date)}</td> 
    </tr>`).join("");

  renderBelowPager(allPosts.length, page);
}

function renderBelowPager(totalCount, currPage) {
  const pager = document.getElementById("belowPager"); // HTML ID 확인 필요
  if (!pager) return;

  const totalPages = Math.ceil(totalCount / limit);
  const pageGroup = Math.ceil(currPage / pageCount);
  let startPage = (pageGroup - 1) * pageCount + 1;
  let endPage = Math.min(startPage + pageCount - 1, totalPages);
  
  let html = "";
  
  // 이전 그룹
  if (startPage > 1) {
    html += `<a href="javascript:moveBelowPage(1)">«</a>`;
    html += `<a href="javascript:moveBelowPage(${startPage - 1})">‹</a>`;
  }

  // 페이지 번호
  for (let i = startPage; i <= endPage; i++) {
    html += `<a href="javascript:moveBelowPage(${i})" class="${i === currPage ? 'active' : ''}">${i}</a>`;
  }

  // 다음 그룹
  if (endPage < totalPages) {
    html += `<a href="javascript:moveBelowPage(${endPage + 1})">›</a>`;
    html += `<a href="javascript:moveBelowPage(${totalPages})">»</a>`;
  }
  
  pager.innerHTML = html;
}

// 하단 목록 페이지 이동 함수
window.moveBelowPage = function(page) {
  // 현재 보고 있는 글의 ID를 유지하며 목록만 갱신
  const urlParams = new URLSearchParams(window.location.search);
  const currentId = parseInt(urlParams.get("id") || urlParams.get("no"));
  
  currentPage = page;
  renderBelowBoard(page, currentId);
};