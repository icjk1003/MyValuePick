/* =========================================
   [JS] 게시글 상세 및 댓글 관리 (PostDetailManager)
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    window.PostDetailManager.init();
});

window.PostDetailManager = {
    postId: null,
    postAuthor: null,
    postAuthorId: null, // 게시글 작성자 ID 보관
    postPassword: null, // 익명 게시글 비밀번호 보관
    mentionList: [],
    isMentionMode: false,
    mentionStartIndex: -1,

    // [설정] 게시판 목록 20개씩, 페이지 버튼 10개씩 표시
    currentPage: 1,
    limit: 20,      
    pageCount: 10,  
    
    // 검색 관련 상태
    currentSearchType: "all", 

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
        this.checkLoginStatus(); 
    },

    // 로그인 상태 확인 및 UI 노출 제어
    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true"; 
        const anonInputs = document.getElementById("anonInputs"); 
        const loginProfile = document.getElementById("loginProfile"); 

        if (isLoggedIn) {
            if (anonInputs) anonInputs.classList.add("d-none"); 
            if (loginProfile) {
                loginProfile.classList.remove("d-none");
                const userNick = localStorage.getItem("user_nick") || "회원";
                loginProfile.innerHTML = `작성자: <span class="text-highlight">${userNick}</span>`;
            }
        } else {
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

        // [데이터 바인딩]
        this.postAuthor = post.writer;
        this.postAuthorId = post.writerId || null; 
        this.postPassword = post.password || null;

        this.setText("postTag", post.tag || post.category || "일반");
        this.setText("postTitle", post.title);
        this.setText("postWriter", post.writer || post.nick || "익명");
        this.setText("postDate", this.formatDate(post.date));
        this.setText("postViews", (post.views || 0).toLocaleString());
        this.setText("postVotes", post.votes || 0);
        this.setText("voteUpCount", post.votes || 0);
        
        const contentHtml = post.content || post.body || "";
        document.getElementById("postBody").innerHTML = contentHtml.replace(/\n/g, "<br>");

        // [삭제 버튼 추가]
        this.renderDeleteButton();

        // [익명 글 프로필 숨김 처리]
        const authorCard = document.querySelector(".author-card");
        if (authorCard) {
            if (!this.postAuthorId) {
                authorCard.style.display = "none";
            } else {
                authorCard.style.display = "flex"; 
                
                const img = document.getElementById("authorImg");
                const name = document.getElementById("authorName");
                const bio = document.querySelector(".author-bio");
                const btnVisit = document.getElementById("btnVisitBlog");

                if(img) img.src = "/kr/shared/images/default_profile.png"; 
                if(name) name.textContent = post.writer;
                if(bio) bio.textContent = post.writerBio || "주식과 경제를 분석하는 개인 투자자입니다.";
                if(btnVisit) {
                    btnVisit.onclick = () => location.href = `blog.html?user=${encodeURIComponent(post.writer)}`;
                }
            }
        }
    },

    // 삭제 버튼 렌더링
    renderDeleteButton: function() {
        const utilsGroup = document.querySelector(".utils-group");
        if (!utilsGroup) return;

        if (utilsGroup.querySelector(".btn-delete-post")) return;

        const delBtn = document.createElement("button");
        delBtn.className = "util-btn report btn-delete-post"; 
        delBtn.style.marginLeft = "8px";
        delBtn.innerHTML = "🗑 삭제하기";
        delBtn.onclick = () => this.handleDeletePost();

        utilsGroup.appendChild(delBtn);
    },

    // 게시글 삭제 핸들러
    handleDeletePost: function() {
        const currentUserId = localStorage.getItem("user_id");
        
        // 1. 회원 게시글인 경우
        if (this.postAuthorId) {
            if (currentUserId === this.postAuthorId) {
                if (confirm("게시글을 삭제하시겠습니까?")) {
                    this.executeDeletePost();
                }
            } else {
                alert("삭제할 수 없습니다. (작성자만 삭제 가능)");
            }
            return;
        }

        // 2. 익명 게시글인 경우
        if (!this.postAuthorId) {
            this.showPasswordModal();
        }
    },

    // 익명 삭제용 비밀번호 모달
    showPasswordModal: function() {
        const existingModal = document.getElementById("passwordModal");
        if(existingModal) existingModal.remove();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "passwordModal";
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;
        `;

        modalOverlay.innerHTML = `
            <div style="background: var(--surface); padding: 20px; border-radius: 12px; width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); text-align: center;">
                <h3 style="margin: 0 0 15px; font-size: 16px; color: var(--text);">비밀번호 확인</h3>
                <input type="password" id="delPasswordInput" placeholder="비밀번호를 입력하세요" 
                    style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 6px; margin-bottom: 15px; box-sizing: border-box;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button id="btnCancelDel" style="padding: 8px 16px; border: 1px solid var(--line); background: var(--surface); color: var(--text); border-radius: 6px; cursor: pointer;">취소</button>
                    <button id="btnConfirmDel" style="padding: 8px 16px; border: none; background: var(--primary); color: white; border-radius: 6px; cursor: pointer;">삭제</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const input = document.getElementById("delPasswordInput");
        const btnCancel = document.getElementById("btnCancelDel");
        const btnConfirm = document.getElementById("btnConfirmDel");

        input.focus();

        btnCancel.onclick = () => {
            modalOverlay.remove();
        };

        btnConfirm.onclick = () => {
            const val = input.value;
            // 비번 확인 (기본 1234)
            if (val === this.postPassword || val === "1234") {
                this.executeDeletePost();
                modalOverlay.remove();
            } else {
                alert("비밀번호가 틀립니다.");
                input.value = "";
                input.focus();
            }
        };
    },

    executeDeletePost: function() {
        let localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
        const initialLen = localPosts.length;
        localPosts = localPosts.filter(p => String(p.id) !== String(this.postId));
        
        if (localPosts.length !== initialLen) {
            localStorage.setItem("posts", JSON.stringify(localPosts));
            alert("삭제되었습니다.");
            location.href = "board.html";
            return;
        }

        alert("테스트 데이터(Mock DB)는 실제로 삭제되지 않습니다.\n(새로고침 시 복구됨)");
        location.href = "board.html";
    },

    /* -----------------------------------------
       2. 댓글 관련 로직 (수정됨)
       ----------------------------------------- */
    loadComments: function() {
        const post = this.getPostData(this.postId);
        if(!post) return;

        let mockComments = (post.commentList || []).map((c, idx) => ({
            id: `mock-${idx}`, 
            postId: this.postId,
            parentId: null,    
            writer: c.writer,
            userId: c.userId || null,
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

    // [수정] 댓글 등록: contenteditable div에서 텍스트 추출
    addComment: function() {
        const inputDiv = document.querySelector(".comment-input-div");
        if (!inputDiv) return;

        const content = inputDiv.innerText.trim();
        if (!content) return alert("내용을 입력해주세요.");

        const success = this.saveCommentData(content, null); 
        if (success !== false) {
            inputDiv.innerHTML = ""; // 초기화
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
        // 답글창은 textarea 유지 (필요시 div로 변경 가능)
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
        let userId = null;

        if (isLoggedIn) {
            writer = localStorage.getItem("user_nick") || "회원";
            userId = localStorage.getItem("user_id");
        } else {
            const anonNickInput = document.querySelector("#anonInputs .input-mini:first-child");
            
            if (!anonNickInput || !anonNickInput.value.trim()) {
                alert("닉네임을 입력해주세요.");
                if(anonNickInput) anonNickInput.focus();
                return false; 
            }
            writer = anonNickInput.value.trim();
        }

        const newComment = {
            id: Date.now(),
            postId: this.postId,
            parentId: parentId,
            writer: writer,
            userId: userId,
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
                    <a href="/kr/html/post/post.html?id=${id}" style="color:inherit; text-decoration:none;">
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
            html += `<a class="pagerBtn" href="/kr/html/post/post.html?id=${this.postId}&page=${startPage - 1}">‹</a>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            const active = (i === this.currentPage) ? "active" : "";
            html += `<a href="/kr/html/post/post.html?id=${this.postId}&page=${i}" class="${active}">${i}</a>`;
        }

        if (endPage < totalPages) {
            html += `<a class="pagerBtn" href="/kr/html/post/post.html?id=${this.postId}&page=${endPage + 1}">›</a>`;
        }

        pager.innerHTML = html;
    },

    // 검색 UI 초기화 (Custom Dropdown)
    initBelowSearch: function() {
        const btn = document.getElementById("boardSearchBtn");
        const input = document.getElementById("belowSearchInput");
        
        const options = [
            { val: "all", text: "전체" },
            { val: "title", text: "제목" },
            { val: "writer", text: "글쓴이" }
        ];

        this.setupCustomSelect("boardSearchType", options, this.currentSearchType, (val) => {
            this.currentSearchType = val;
        });

        const doSearch = () => {
            if (input && !input.value.trim()) { alert("검색어를 입력해주세요."); return; }
            const query = input ? input.value.trim() : "";
            location.href = `board.html?q=${encodeURIComponent(query)}&type=${this.currentSearchType}&page=1`;
        };

        if(btn) btn.onclick = doSearch;
        if(input) input.onkeypress = (e) => { if (e.key === "Enter") doSearch(); };
    },

    setupCustomSelect: function(id, options, initialVal, onChange) {
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
    },

    /* -----------------------------------------
       4. @멘션 시스템 (ContentEditable 적용 완료)
       ----------------------------------------- */
    updateMentionList: function(comments) {
        const nicknames = new Set();
        if (this.postAuthor && this.postAuthorId) {
            nicknames.add(this.postAuthor);
        }
        comments.forEach(c => {
            if (c.userId && c.writer) { 
                nicknames.add(c.writer);
            }
        });
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
        // div contenteditable은 keyup/keydown 사용
        inputEl.addEventListener("keyup", (e) => this.handleMentionKeyup(e, inputEl));
        inputEl.addEventListener("keydown", (e) => this.handleMentionKeydown(e, inputEl));
    },

    // [수정] 키 입력 감지 로직 (Selection API 사용)
    handleMentionKeyup: function(e, input) {
        if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = selection.anchorNode;

        // 텍스트 노드인 경우에만 처리
        if (node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const cursor = selection.anchorOffset;
        
        const leftText = text.substring(0, cursor);
        const lastAt = leftText.lastIndexOf("@");

        if (lastAt === -1) { this.closeMentionDropdown(); return; }
        
        // @ 앞에 공백이나 줄바꿈이 있어야 함
        if (lastAt > 0 && text[lastAt - 1] !== ' ' && text[lastAt - 1] !== '\u00A0' && text[lastAt - 1] !== '\n') {
            this.closeMentionDropdown();
            return;
        }

        const query = leftText.substring(lastAt + 1);
        if (query.includes(' ')) { this.closeMentionDropdown(); return; }

        this.isMentionMode = true;
        this.mentionStartIndex = lastAt; 
        
        const matches = this.mentionList.filter(nick => nick.toLowerCase().includes(query.toLowerCase()));
        
        // 드롭다운 위치 계산 (Range 활용)
        const rect = range.getBoundingClientRect();
        this.showMentionDropdown(matches, rect);
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

    // [수정] 드롭다운 표시 (화면 좌표 기준)
    showMentionDropdown: function(list, rect) {
        const dropdown = document.getElementById("mentionDropdown");
        if (list.length === 0) { dropdown.style.display = "none"; return; }

        dropdown.innerHTML = "";
        list.forEach((nick, idx) => {
            const div = document.createElement("div");
            div.className = "mention-item" + (idx === 0 ? " active" : "");
            div.innerHTML = `<span class="mention-avatar">${nick.charAt(0)}</span> ${nick}`;
            div.onclick = (e) => {
                e.preventDefault(); 
                this.insertMention(nick);
            };
            dropdown.appendChild(div);
        });

        dropdown.style.top = (rect.bottom + window.scrollY + 5) + "px";
        dropdown.style.left = (rect.left + window.scrollX) + "px";
        dropdown.style.display = "block";
    },

    // [핵심] 멘션 삽입 (파란색 태그 생성)
    insertMention: function(nick) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = selection.anchorNode;
        const text = node.textContent;
        
        const cursor = selection.anchorOffset;
        const start = text.lastIndexOf("@", cursor - 1);
        
        if (start !== -1) {
            // 1. 기존 텍스트(@query) 삭제
            const deleteRange = document.createRange();
            deleteRange.setStart(node, start);
            deleteRange.setEnd(node, cursor);
            deleteRange.deleteContents();

            // 2. 파란색 멘션 태그 생성
            const span = document.createElement("span");
            span.className = "mention-tag";
            span.contentEditable = "false"; // 지울 때 한 번에 지워짐
            span.innerText = "@" + nick;
            
            // 3. 멘션 뒤 공백
            const space = document.createTextNode("\u00A0"); 

            // 4. 삽입
            deleteRange.insertNode(space);
            deleteRange.insertNode(span);

            // 5. 커서 이동
            const newRange = document.createRange();
            newRange.setStartAfter(space);
            newRange.setEndAfter(space);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }

        this.closeMentionDropdown();
        
        const inputDiv = document.querySelector(".comment-input-div");
        if(inputDiv) inputDiv.focus();
    },

    closeMentionDropdown: function() {
        const dropdown = document.getElementById("mentionDropdown");
        if(dropdown) dropdown.style.display = "none";
        this.isMentionMode = false;
    },

    /* -----------------------------------------
       5. 공통 이벤트 및 헬퍼
       ----------------------------------------- */
    bindEvents: function() {
        const btn = document.querySelector(".btn-comment-submit");
        if(btn) btn.onclick = () => this.addComment();
        
        // [수정] .comment-input-div에 이벤트 연결
        const mainInput = document.querySelector(".comment-input-div");
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