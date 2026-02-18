/* =========================================
   [JS] 게시글 상세 및 댓글 관리 (PostDetailManager)
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    window.PostDetailManager.init();
});

window.PostDetailManager = {
    postId: null,
    postAuthor: null,
    mentionList: [],
    isMentionMode: false,
    mentionStartIndex: -1,

    // 페이징 관련 설정
    currentPage: 1,
    limit: 10,
    pageCount: 5,

    /* -----------------------------------------
       1. 초기화 및 데이터 로드
       ----------------------------------------- */
    init: function() {
        const params = new URLSearchParams(window.location.search);
        this.postId = parseInt(params.get('id') || params.get('no'));
        
        if (params.get('page')) {
            this.currentPage = parseInt(params.get('page'));
        }

        if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) {
            console.error("데이터베이스(MOCK_DB)가 로드되지 않았습니다.");
            return;
        }

        if (!this.postId) {
            alert("잘못된 접근입니다.");
            location.href = 'board.html';
            return;
        }

        this.loadPostDetail();
        this.loadComments();
        this.loadBoardList(); 
        this.bindEvents();
        this.initMentionSystem(); 
        this.checkLoginStatus(); /* [추가] 로그인 상태에 따른 UI 제어 실행 */
    },

    // 로그인 상태 확인 및 UI 노출 제어
    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true"; /* 로그인 상태 확인: 불린 값으로 변환 */
        const anonInputs = document.getElementById("anonInputs"); /* 익명 입력 영역: 닉네임/비밀번호 */
        const loginProfile = document.getElementById("loginProfile"); /* 회원 프로필 영역: 로그인 정보 */

        if (isLoggedIn) {
            // [로그인 상태] 익명 입력란을 숨기고 회원 정보를 표시
            if (anonInputs) anonInputs.classList.add("d-none"); 
            if (loginProfile) {
                loginProfile.classList.remove("d-none");
                const userNick = localStorage.getItem("user_nick") || "회원";
                loginProfile.innerHTML = `작성자: <span class="text-highlight">${userNick}</span>`;
            }
        } else {
            // [비로그인 상태] 익명 입력란을 표시하고 회원 정보를 숨김
            if (anonInputs) anonInputs.classList.remove("d-none");
            if (loginProfile) loginProfile.classList.add("d-none");
        }
    },

    getPostData: function(id) {
        let post = MOCK_DB.POSTS.find(p => p.no === id || p.id === id);
        if (!post) {
            const localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
            post = localPosts.find(p => p.id === id || p.no === id);
        }
        return post;
    },

    loadPostDetail: function() {
        const post = this.getPostData(this.postId);

        if (!post) {
            document.getElementById("postTitle").textContent = "존재하지 않는 게시글입니다.";
            document.getElementById("postBody").innerHTML = "<div style='padding:50px; text-align:center;'>삭제되었거나 존재하지 않는 글입니다.</div>";
            return;
        }

        this.setText("postTag", post.tag || post.category || "일반");
        this.setText("postTitle", post.title);
        this.setText("postWriter", post.writer || post.nick || "익명");
        this.setText("postDate", this.formatDate(post.date));
        this.setText("postViews", (post.views || 0).toLocaleString());
        this.setText("postVotes", post.votes || 0);
        this.setText("voteUpCount", post.votes || 0);
        
        const contentHtml = post.content || post.body || "";
        document.getElementById("postBody").innerHTML = contentHtml.replace(/\n/g, "<br>");

        const img = document.getElementById("authorImg");
        const name = document.getElementById("authorName");
        const bio = document.querySelector(".author-bio");

        if(img) img.src = "../shared/images/default_profile.png"; 
        if(name) name.textContent = post.writer;
        if(bio) bio.textContent = post.writerBio || "주식과 경제를 분석하는 개인 투자자입니다.";

        this.postAuthor = post.writer;

        const btnVisit = document.getElementById("btnVisitBlog");
        if(btnVisit) {
            btnVisit.onclick = () => location.href = `blog.html?user=${encodeURIComponent(post.writer)}`;
        }
    },

    /* -----------------------------------------
       2. 댓글 관련 로직
       ----------------------------------------- */
    loadComments: function() {
        const post = this.getPostData(this.postId);
        if(!post) return;

        let mockComments = (post.commentList || []).map((c, idx) => ({
            id: `mock-${idx}`, 
            postId: this.postId,
            parentId: null,    
            writer: c.writer,
            content: c.content,
            date: c.date,
            isMock: true
        }));

        const localComments = JSON.parse(localStorage.getItem("comments") || "[]");
        const myComments = localComments.filter(c => c.postId == this.postId);
        const allComments = [...mockComments, ...myComments];

        this.updateMentionList(allComments);

        const listEl = document.getElementById("commentList");
        listEl.innerHTML = "";
        
        this.setText("postCommentCount", allComments.length);
        this.setText("commentCountHeader", allComments.length);

        if (allComments.length === 0) {
            listEl.innerHTML = '<div style="padding:40px; text-align:center; color:var(--muted);">첫 번째 댓글을 남겨보세요!</div>';
            return;
        }

        const rootComments = allComments.filter(c => !c.parentId);

        rootComments.forEach(root => {
            listEl.appendChild(this.createCommentElement(root, false));

            const replies = allComments.filter(c => c.parentId == root.id);
            replies.forEach(reply => {
                listEl.appendChild(this.createCommentElement(reply, true));
            });
        });
    },

    createCommentElement: function(comment, isReply) {
        const el = document.createElement("div");
        el.className = isReply ? "comment-reply-item" : "comment-item"; 
        el.id = `comment-${comment.id}`;

        let contentHtml = comment.content.replace(/@([가-힣a-zA-Z0-9_]+)/g, '<span style="color:var(--primary); font-weight:700;">@$1</span>');

        const replyBtn = !isReply 
            ? `<button class="btn-reply-action" onclick="window.PostDetailManager.openReplyForm('${comment.id}', '${comment.writer}')">답글쓰기</button>` 
            : '';

        const deleteBtn = `<button class="btn-delete-cmt" onclick="window.PostDetailManager.deleteComment('${comment.id}')">삭제</button>`;

        el.innerHTML = `
            <div class="cmt-profile">
                <div class="default-avatar" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#eee; color:#888;">${comment.writer.charAt(0)}</div>
            </div>
            <div class="cmt-body">
                <div class="cmt-top">
                    <div class="cmt-info">
                        <span class="cmt-nick">${comment.writer}</span>
                        <span class="cmt-date">${this.formatDate(comment.date)}</span>
                        ${deleteBtn}
                    </div>
                </div>
                <div class="cmt-content">${contentHtml}</div>
                <div class="cmt-foot" style="margin-top:6px;">
                    ${replyBtn}
                </div>
                <div id="reply-form-area-${comment.id}"></div>
            </div>
        `;
        return el;
    },

    addComment: function() {
        const input = document.querySelector(".comment-textarea");
        const content = input.value.trim();
        if (!content) return alert("내용을 입력해주세요.");

        const success = this.saveCommentData(content, null); /* 저장 시도 */
        if (success !== false) {
            input.value = "";
            this.loadComments();
        }
    },

    openReplyForm: function(parentId, parentWriter) {
        document.querySelectorAll('.reply-form-wrap').forEach(el => el.remove());

        const area = document.getElementById(`reply-form-area-${parentId}`);
        if (!area) return;

        area.innerHTML = `
            <div class="reply-form-wrap fade-in" style="margin-top:10px;">
                <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">
                    <strong>@${parentWriter}</strong> 님에게 답글 작성
                </div>
                <textarea id="replyInput-${parentId}" class="guest-textarea" 
                    placeholder="답글 입력 (@로 태그 가능)" style="height:60px;"></textarea>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:5px;">
                    <button class="btn-cancel" onclick="this.closest('.reply-form-wrap').remove()">취소</button>
                    <button class="btn-save-guest" onclick="window.PostDetailManager.addReply('${parentId}')">등록</button>
                </div>
            </div>
        `;
        
        const replyInput = document.getElementById(`replyInput-${parentId}`);
        this.attachMentionEvents(replyInput);
        replyInput.focus();
    },

    addReply: function(parentId) {
        const input = document.getElementById(`replyInput-${parentId}`);
        const content = input.value.trim();
        if (!content) return alert("내용을 입력해주세요.");
        
        const success = this.saveCommentData(content, parentId);
        if (success !== false) {
            this.loadComments();
        }
    },

    saveCommentData: function(content, parentId) {
        const comments = JSON.parse(localStorage.getItem("comments") || "[]");
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        
        let writer = "익명";
        if (isLoggedIn) {
            writer = localStorage.getItem("user_nick") || "회원";
        } else {
            // [수정] 비로그인 시 닉네임 입력란 값 확인
            const anonNickInput = document.querySelector("#anonInputs .input-mini:first-child");
            if (!anonNickInput || !anonNickInput.value.trim()) {
                alert("닉네임을 입력해주세요.");
                if(anonNickInput) anonNickInput.focus();
                return false; /* 등록 중단 */
            }
            writer = anonNickInput.value.trim();
        }

        const newComment = {
            id: Date.now(),
            postId: this.postId,
            parentId: parentId,
            writer: writer,
            content: content,
            date: new Date().toISOString(),
            votes: 0
        };

        comments.push(newComment);
        localStorage.setItem("comments", JSON.stringify(comments));
        return true;
    },

    deleteComment: function(id) {
        if(!confirm("삭제하시겠습니까?")) return;

        if(String(id).startsWith("mock-")) {
            alert("테스트 데이터는 삭제할 수 없습니다. (새로고침 시 복구됨)");
            return;
        }

        let comments = JSON.parse(localStorage.getItem("comments") || "[]");
        comments = comments.filter(c => String(c.id) !== String(id) && String(c.parentId) !== String(id));
        
        localStorage.setItem("comments", JSON.stringify(comments));
        this.loadComments();
    },

    /* -----------------------------------------
       3. 하단 게시판 목록 및 유틸
       ----------------------------------------- */
    loadBoardList: function() {
        let allPosts = [...MOCK_DB.POSTS];
        const localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
        allPosts = allPosts.concat(localPosts);

        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalCount = allPosts.length;
        const start = (this.currentPage - 1) * this.limit;
        const pageData = allPosts.slice(start, start + this.limit);

        this.renderBelowList(pageData);
        this.renderPager(totalCount);
        this.initBelowSearch();
    },

    renderBelowList: function(posts) {
        const tbody = document.getElementById("boardBelowRows");
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px 0;">게시글이 없습니다.</td></tr>`;
            return;
        }

        tbody.innerHTML = posts.map(p => {
            const isCurrent = (p.no == this.postId || p.id == this.postId) ? "background-color:var(--surface-hover);" : "";
            const id = p.no || p.id;
            const cmtCnt = p.comments || (p.commentList ? p.commentList.length : 0);
            const cmtHtml = cmtCnt > 0 ? `<span style="color:var(--primary); font-weight:bold; font-size:0.8em;"> [${cmtCnt}]</span>` : "";

            return `
            <tr style="${isCurrent}">
                <td class="colNo">${id}</td>
                <td class="colTag"><span class="chip">${p.tag || p.category || "일반"}</span></td>
                <td style="text-align:left">
                    <a href="post.html?id=${id}" style="color:inherit; text-decoration:none;">
                        ${p.title} ${cmtHtml}
                    </a>
                </td>
                <td class="colWriter">${p.writer || p.nick}</td>
                <td class="colVotes">${p.votes || 0}</td>
                <td class="colViews mobile-hide">${(p.views || 0).toLocaleString()}</td>
                <td class="colTime mobile-hide">${this.formatDate(p.date)}</td>
            </tr>
            `;
        }).join("");
    },

    renderPager: function(totalCount) {
        const pager = document.getElementById("belowPager");
        if (!pager) return;

        const totalPages = Math.ceil(totalCount / this.limit);
        const pageGroup = Math.ceil(this.currentPage / this.pageCount);
        let startPage = (pageGroup - 1) * this.pageCount + 1;
        let endPage = startPage + this.pageCount - 1;
        if (endPage > totalPages) endPage = totalPages;

        let html = "";
        
        if (startPage > 1) {
            html += `<a class="pagerBtn" href="post.html?id=${this.postId}&page=${startPage - 1}">‹</a>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            const active = (i === this.currentPage) ? "active" : "";
            html += `<a href="post.html?id=${this.postId}&page=${i}" class="${active}">${i}</a>`;
        }

        if (endPage < totalPages) {
            html += `<a class="pagerBtn" href="post.html?id=${this.postId}&page=${endPage + 1}">›</a>`;
        }

        pager.innerHTML = html;
    },

    initBelowSearch: function() {
        const btn = document.getElementById("belowSearchBtn");
        const typeSelect = document.getElementById("belowSearchType");
        
        if(typeSelect && typeSelect.innerHTML === "") {
             typeSelect.innerHTML = `<select id="searchTypeSelect" style="border:none; outline:none; font-size:14px; color:#555;">
                <option value="all">전체</option>
                <option value="title">제목</option>
                <option value="writer">작성자</option>
             </select>`;
        }

        if(btn) {
            btn.onclick = () => {
                alert("검색 기능은 준비중입니다.");
            };
        }
    },

    /* -----------------------------------------
       4. @멘션 시스템
       ----------------------------------------- */
    updateMentionList: function(comments) {
        const nicknames = new Set();
        if (this.postAuthor) nicknames.add(this.postAuthor);
        comments.forEach(c => nicknames.add(c.writer));
        this.mentionList = Array.from(nicknames);
    },

    initMentionSystem: function() {
        if (!document.getElementById("mentionDropdown")) {
            const dd = document.createElement("div");
            dd.id = "mentionDropdown";
            document.body.appendChild(dd);
        }
    },

    attachMentionEvents: function(inputEl) {
        inputEl.addEventListener("keyup", (e) => this.handleMentionKeyup(e, inputEl));
        inputEl.addEventListener("keydown", (e) => this.handleMentionKeydown(e, inputEl));
    },

    handleMentionKeyup: function(e, input) {
        if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) return;
        const cursor = input.selectionStart;
        const text = input.value;
        const leftText = text.substring(0, cursor);
        const lastAt = leftText.lastIndexOf("@");
        
        if (lastAt === -1) { this.closeMentionDropdown(); return; }
        if (lastAt > 0 && text[lastAt - 1] !== ' ' && text[lastAt - 1] !== '\n') { this.closeMentionDropdown(); return; }

        const query = leftText.substring(lastAt + 1);
        if (query.includes(' ')) { this.closeMentionDropdown(); return; }

        this.isMentionMode = true;
        this.mentionStartIndex = lastAt;
        
        const matches = this.mentionList.filter(nick => nick.toLowerCase().includes(query.toLowerCase()));
        this.showMentionDropdown(matches, input, lastAt);
    },

    handleMentionKeydown: function(e, input) {
        if (!this.isMentionMode) return;
        const dropdown = document.getElementById("mentionDropdown");
        if (dropdown.style.display === "none") return;

        const items = dropdown.querySelectorAll(".mention-item");
        let activeIndex = -1;
        items.forEach((item, idx) => { if (item.classList.contains("active")) activeIndex = idx; });

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = (activeIndex + 1) % items.length;
            this.updateActiveItem(items, next);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = (activeIndex - 1 + items.length) % items.length;
            this.updateActiveItem(items, prev);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex > -1) items[activeIndex].click();
            else if (items.length > 0) items[0].click();
        } else if (e.key === "Escape") {
            this.closeMentionDropdown();
        }
    },

    updateActiveItem: function(items, idx) {
        items.forEach(i => i.classList.remove("active"));
        if (items[idx]) {
            items[idx].classList.add("active");
            items[idx].scrollIntoView({ block: "nearest" });
        }
    },

    showMentionDropdown: function(list, input, atIndex) {
        const dropdown = document.getElementById("mentionDropdown");
        if (list.length === 0) { dropdown.style.display = "none"; return; }

        dropdown.innerHTML = "";
        list.forEach((nick, idx) => {
            const div = document.createElement("div");
            div.className = "mention-item" + (idx === 0 ? " active" : "");
            div.innerHTML = `<span class="mention-avatar">${nick.charAt(0)}</span> ${nick}`;
            div.onclick = () => this.insertMention(nick, input);
            dropdown.appendChild(div);
        });

        const coords = this.getCaretCoordinates(input, atIndex);
        const rect = input.getBoundingClientRect();
        dropdown.style.top = (rect.top + window.scrollY + coords.top + 25) + "px";
        dropdown.style.left = (rect.left + window.scrollX + coords.left) + "px";
        dropdown.style.display = "block";
    },

    insertMention: function(nick, input) {
        const text = input.value;
        const before = text.substring(0, this.mentionStartIndex);
        const after = text.substring(input.selectionStart);
        const newText = before + "@" + nick + " " + after;
        input.value = newText;
        input.focus();
        const newCursorPos = this.mentionStartIndex + 1 + nick.length + 1;
        input.setSelectionRange(newCursorPos, newCursorPos);
        this.closeMentionDropdown();
    },

    closeMentionDropdown: function() {
        const dropdown = document.getElementById("mentionDropdown");
        if(dropdown) dropdown.style.display = "none";
        this.isMentionMode = false;
    },

    getCaretCoordinates: function(element, position) {
        const div = document.createElement('div');
        document.body.appendChild(div);
        const style = div.style;
        const computed = window.getComputedStyle(element);
        style.whiteSpace = 'pre-wrap';
        style.wordWrap = 'break-word';
        style.position = 'absolute';
        style.visibility = 'hidden';
        const properties = ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'];
        properties.forEach(prop => style[prop] = computed[prop]);
        div.textContent = element.value.substring(0, position);
        const span = document.createElement('span');
        span.textContent = element.value.substring(position) || '.';
        div.appendChild(span);
        const coordinates = { top: span.offsetTop + parseInt(computed['borderTopWidth']), left: span.offsetLeft + parseInt(computed['borderLeftWidth']) };
        document.body.removeChild(div);
        return coordinates;
    },

    /* -----------------------------------------
       5. 공통 이벤트 및 헬퍼
       ----------------------------------------- */
    bindEvents: function() {
        const btn = document.querySelector(".btn-comment-submit");
        if(btn) btn.onclick = () => this.addComment();
        const mainInput = document.querySelector(".comment-textarea");
        if(mainInput) this.attachMentionEvents(mainInput);

        document.addEventListener("click", (e) => {
            if (!e.target.closest("#mentionDropdown")) this.closeMentionDropdown();
        });
    },

    setText: function(id, val) {
        const el = document.getElementById(id);
        if(el) el.textContent = val;
    },

    formatDate: function(dateStr) {
        if(!dateStr) return "";
        return dateStr.substring(0, 10).replace(/-/g, '.');
    }
};