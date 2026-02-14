/* shared/js/post-detail.js */

const urlParams = new URLSearchParams(window.location.search);
const postId = parseInt(urlParams.get("id") || urlParams.get("no"));
let currentPage = parseInt(urlParams.get("page")) || 1;
const limit = 20;
const pageCount = 10;
let currentSearchType = "all"; 

window.currentCommentList = [];

document.addEventListener("DOMContentLoaded", () => {
  if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) {
    alert("데이터 로드 실패"); return;
  }
  
  const post = MOCK_DB.POSTS.find(p => (p.id === postId) || (p.no === postId));
  if (!post) { alert("존재하지 않는 글입니다."); location.href = "board.html"; return; }

  const isBlinded = checkBlindState(postId);
  if (isBlinded) {
    renderBlindMessage();
    return;
  }

  renderPostContent(post);
  renderAuthorProfile(post);
  updateCommentInputState();
  renderComments(post.commentList || []);
  renderBelowBoard(currentPage, post.no);
  initSearchDropdown();
  wireSearchActions();
  wireCommentSubmit();
  
  document.getElementById("btnVoteUp")?.addEventListener("click", () => alert("추천되었습니다!"));
  document.getElementById("btnVoteDown")?.addEventListener("click", () => alert("비추천되었습니다."));
});

window.sharePost = function() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert("게시글 링크가 클립보드에 복사되었습니다!");
  });
};

window.reportPost = function() {
  const reason = prompt("신고 사유를 입력해주세요.");
  if (!reason) return;
  const reports = JSON.parse(localStorage.getItem("REPORTED_POSTS") || "[]");
  reports.push({ postId, reason, date: new Date().toISOString() });
  localStorage.setItem("REPORTED_POSTS", JSON.stringify(reports));
  alert("신고가 접수되었습니다.");
  location.reload();
};

function checkBlindState(id) {
  const reports = JSON.parse(localStorage.getItem("REPORTED_POSTS") || "[]");
  const count = reports.filter(r => r.postId === id).length;
  const adminBlinds = JSON.parse(localStorage.getItem("ADMIN_BLINDS") || "[]");
  return count >= 3 || adminBlinds.includes(id);
}

function renderBlindMessage() {
  const titleEl = document.getElementById("postTitle");
  const bodyEl = document.getElementById("postBody");
  if (titleEl) titleEl.textContent = "[블라인드 처리된 게시글입니다]";
  if (bodyEl) {
    bodyEl.innerHTML = `<div style="padding:60px 20px; text-align:center; background:var(--surface-hover); border-radius:12px; border:1px dashed var(--line);"><div style="font-size:40px; margin-bottom:15px;">🚨</div><div style="color:var(--muted); line-height:1.6;">운영정책 위반으로 인해 블라인드 처리되었습니다.</div></div>`;
  }
}

function updateCommentInputState() {
  const isLoggedIn = localStorage.getItem("is_logged_in");
  const myNick = localStorage.getItem("user_nick");
  const anonInputs = document.getElementById("anonInputs");
  const loginProfile = document.getElementById("loginProfile");
  if (isLoggedIn) {
    if(anonInputs) anonInputs.style.display = "none";
    if(loginProfile) {
      loginProfile.style.display = "block";
      loginProfile.querySelector("span").textContent = myNick || "익명";
    }
  } else {
    if(anonInputs) anonInputs.style.display = "flex";
    if(loginProfile) loginProfile.style.display = "none";
  }
}

function renderPostContent(post) {
  document.getElementById("postTag").textContent = post.tag || "일반";
  document.getElementById("postTitle").textContent = post.title;
  document.getElementById("postWriter").textContent = post.writer;
  document.getElementById("postDate").textContent = formatBoardDate(post.date, true);
  document.getElementById("postViews").textContent = (post.views||0).toLocaleString();
  document.getElementById("postVotes").textContent = post.votes||0;
  document.getElementById("voteUpCount").textContent = post.votes||0;
  const bodyContent = post.body || "내용이 없습니다.";
  document.getElementById("postBody").innerHTML = bodyContent.replace(/\n/g, "<br>");
  const cmtCount = post.comments || (post.commentList ? post.commentList.length : 0);
  if(document.getElementById("postCommentCount")) document.getElementById("postCommentCount").textContent = cmtCount;
  if(document.getElementById("commentCountHeader")) document.getElementById("commentCountHeader").textContent = cmtCount;
}

function renderAuthorProfile(post) {
  const img = document.getElementById("authorImg");
  if(img) img.src = post.writerImg || `https://ui-avatars.com/api/?name=${post.writer}&background=random`;
  document.getElementById("authorName").textContent = post.writer;
}

function renderComments(list) {
  const el = document.getElementById("commentList");
  if(!el) return;
  window.currentCommentList = list;
  if (!list || list.length === 0) {
    el.innerHTML = `<div style="padding:40px; text-align:center; color:var(--muted);">등록된 댓글이 없습니다.</div>`;
    return;
  }
  el.innerHTML = list.map((c, index) => `
    <div class="comment-item">
      <div class="cmt-profile">${c.profileImg ? `<img src="${c.profileImg}">` : `<div class="cmt-profile-placeholder">👤</div>`}</div>
      <div class="cmt-body">
        <div class="cmt-top">
          <div class="cmt-info"><span class="cmt-nick">${c.writer}</span><span class="cmt-date">${formatBoardDate(c.date)}</span><button class="btn-delete-cmt" onclick="deleteComment(${index})">삭제</button></div>
          <button class="cmt-vote-btn" onclick="alert('추천!')">👍 ${c.votes || 0}</button>
        </div>
        <div class="cmt-content">${c.content}</div>
      </div>
    </div>`).join("");
}

window.deleteComment = function(index) {
  const inputPw = prompt("댓글 삭제 비밀번호(기본: 1234)");
  if (inputPw === "1234") {
    window.currentCommentList.splice(index, 1);
    renderComments(window.currentCommentList);
  }
};

function wireCommentSubmit() {
  const btn = document.querySelector(".btn-submit-cmt");
  const textarea = document.querySelector(".write-area textarea");
  if(!btn || !textarea) return;
  btn.addEventListener("click", () => {
    const content = textarea.value.trim();
    if(!content) return;
    const isLoggedIn = localStorage.getItem("is_logged_in");
    let writer = isLoggedIn ? localStorage.getItem("user_nick") : (document.querySelector("#anonInputs input")?.value || "익명");
    window.currentCommentList.unshift({ writer, content, date: new Date().toISOString(), votes: 0, password: "1234" });
    textarea.value = "";
    renderComments(window.currentCommentList);
  });
}

function renderBelowBoard(page, currentId) {
  const tbody = document.getElementById("boardBelowRows");
  const allPosts = MOCK_DB.POSTS;
  const start = (page - 1) * limit;
  const pageData = allPosts.slice(start, start + limit);
  if(!tbody) return;
  tbody.innerHTML = pageData.map(p => `
    <tr class="${p.no === currentId ? 'active-row' : ''}">
      <td class="colNo">${p.no}</td>
      <td class="colTag"><span class="chip">${p.tag}</span></td>
      <td style="text-align:left"><a class="postTitle" href="post-detail.html?id=${p.no}&page=${page}">${p.title} [${p.comments}]</a></td>
      <td class="colWriter">${p.writer}</td>
      <td class="colVotes">${p.votes}</td>
      <td class="colViews mobile-hide">${p.views.toLocaleString()}</td>
      <td class="colTime mobile-hide">${formatBoardDate(p.date)}</td> 
    </tr>`).join("");
  renderBelowPager(allPosts.length, page);
}

function renderBelowPager(totalCount, currPage) {
  const pager = document.getElementById("belowPager");
  const totalPages = Math.ceil(totalCount / limit);
  const pageGroup = Math.ceil(currPage / pageCount);
  let startPage = (pageGroup - 1) * pageCount + 1;
  let endPage = Math.min(startPage + pageCount - 1, totalPages);
  let html = "";
  if (startPage > 1) {
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(1)">«</a>`;
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${startPage - 1})">‹</a>`;
  }
  for (let i = startPage; i <= endPage; i++) html += `<a href="javascript:moveBelowPage(${i})" class="${i === currPage ? 'active' : ''}">${i}</a>`;
  if (endPage < totalPages) {
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${endPage + 1})">›</a>`;
    html += `<a class="pagerBtn" href="javascript:moveBelowPage(${totalPages})">»</a>`;
  }
  pager.innerHTML = html;
}

window.moveBelowPage = function(page) { renderBelowBoard(page, postId); }

function initSearchDropdown() {
  const options = [ { val: "all", text: "전체" }, { val: "title", text: "제목" }, { val: "writer", text: "글쓴이" } ];
  const container = document.getElementById("boardSearchType");
  if(!container) return;
  const trigger = document.createElement("div");
  trigger.className = "select-styled";
  trigger.textContent = "전체"; 
  const list = document.createElement("ul");
  list.className = "select-options";
  options.forEach(opt => {
    const li = document.createElement("li");
    li.textContent = opt.text;
    li.onclick = (e) => {
      e.stopPropagation();
      trigger.textContent = opt.text;
      currentSearchType = opt.val;
      list.style.display = "none";
    };
    list.appendChild(li);
  });
  trigger.onclick = (e) => {
    e.stopPropagation();
    list.style.display = list.style.display === "block" ? "none" : "block";
  };
  document.addEventListener("click", () => { list.style.display = "none"; });
  container.innerHTML = "";
  container.appendChild(trigger);
  container.appendChild(list);
}

function wireSearchActions() {
  const btn = document.getElementById("boardSearchBtn");
  const input = document.getElementById("boardSearchInput");
  if(!btn || !input) return;
  btn.onclick = () => {
    const val = input.value.trim();
    if(val) location.href = `board.html?q=${encodeURIComponent(val)}&type=${currentSearchType}&page=1`;
  };
}