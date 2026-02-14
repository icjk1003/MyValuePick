document.addEventListener("DOMContentLoaded", () => {
  const no = parseInt(new URLSearchParams(window.location.search).get("no"));
  const post = MOCK_DB.POSTS.find(p => p.no === no);
  const container = document.getElementById("postDetailContainer");
  
  if (!post || !container) { container.innerHTML = "글을 찾을 수 없습니다."; return; }

  container.innerHTML = `
    <div class="card"><div class="bd">
      <div class="post-header">
        <h1 class="h2">${post.title}</h1>
        <div class="p">${post.writer} · ${post.date} · 조회 ${post.views}</div>
      </div>
      <div class="post-body">${post.body}</div>
    </div></div>
    <div class="card"><div class="bd">
      <div class="h3">댓글</div>
      <div id="commentList" style="margin-top:10px"></div>
    </div></div>
  `;
  
  renderComments(no);
});

function renderComments(postNo) {
  const list = document.getElementById("commentList");
  const comments = MOCK_DB.COMMENTS.filter(c => c.postNo === postNo);
  list.innerHTML = comments.length ? comments.map(c => 
    `<div class="comment-item"><div class="comment-bubble"><b>${c.writer}</b>: ${c.text}</div></div>`
  ).join("") : "<div class='p'>댓글이 없습니다.</div>";
}