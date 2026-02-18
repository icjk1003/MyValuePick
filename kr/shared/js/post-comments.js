/* kr/shared/js/post-comments.js */

window.PostManager = window.PostManager || {};

window.PostManager.Comments = {
    init: function() {
        this.checkLoginStatus();
        this.loadComments();
        this.bindEvents();

        const mainInput = document.getElementById("mainCommentInput");
        if (mainInput && window.PostManager.Mention) {
            window.PostManager.Mention.attachEvents(mainInput);
        }
    },

    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        const anonInputs = document.getElementById("anonInputs");
        const loginProfile = document.getElementById("loginProfile");
        const userNickSpan = document.getElementById("currentUserNick");

        if (isLoggedIn) {
            if (anonInputs) anonInputs.classList.add("d-none");
            if (loginProfile) {
                loginProfile.classList.remove("d-none");
                if (userNickSpan) userNickSpan.textContent = localStorage.getItem("user_nick") || "회원";
            }
        } else {
            if (anonInputs) anonInputs.classList.remove("d-none");
            if (loginProfile) loginProfile.classList.add("d-none");
        }
    },

    loadComments: function() {
        const postId = window.PostManager.postId;
        const getPostData = window.PostManager.getPostData;

        let mockComments = [];
        if (typeof getPostData === 'function') {
            const post = getPostData(postId);
            if (post && post.commentList) {
                mockComments = post.commentList.map((c, idx) => ({
                    id: `mock-${idx}`, 
                    postId: postId,
                    parentId: null,    
                    writer: c.writer,
                    userId: c.userId || null,
                    content: c.content,
                    date: c.date,
                    isMock: true
                }));
            }
        }

        const localComments = JSON.parse(localStorage.getItem("comments") || "[]");
        const myComments = localComments.filter(c => c.postId == postId);
        const allComments = [...mockComments, ...myComments];

        if (window.PostManager.Mention) {
            window.PostManager.Mention.updateList(allComments);
        }

        const listEl = document.getElementById("commentList");
        if (!listEl) return;
        listEl.innerHTML = "";
        
        const countEl = document.getElementById("commentCountHeader");
        const viewCountEl = document.getElementById("postCommentCount");
        if (countEl) countEl.textContent = allComments.length;
        if (viewCountEl) viewCountEl.textContent = allComments.length;

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
            ? `<button class="btn-reply-action" onclick="window.PostManager.Comments.openReplyForm('${comment.id}', '${comment.writer}')">답글쓰기</button>` 
            : '';
        const deleteBtn = `<button class="btn-delete-cmt" onclick="window.PostManager.Comments.deleteComment('${comment.id}')">삭제</button>`;

        el.innerHTML = `
            <div class="cmt-profile">
                <div class="default-avatar">${comment.writer.charAt(0)}</div>
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
                <div class="cmt-foot">
                    ${replyBtn}
                </div>
                <div id="reply-form-area-${comment.id}"></div>
            </div>
        `;
        return el;
    },

    addComment: function() {
        const inputDiv = document.getElementById("mainCommentInput");
        if (!inputDiv) return;

        const content = inputDiv.innerText.trim();
        if (!content) return alert("내용을 입력해주세요.");

        const success = this.saveCommentData(content, null); 
        if (success !== false) {
            inputDiv.innerHTML = "";
            this.loadComments();
        }
    },

    openReplyForm: function(parentId, parentWriter) {
        document.querySelectorAll('.reply-form-wrap').forEach(el => el.remove());

        const area = document.getElementById(`reply-form-area-${parentId}`);
        if (!area) return;

        // [수정 5] 대댓글 입력창을 div contenteditable로 변경 (댓글과 동일한 구조)
        // class="comment-input-div" 재사용 (post-comments.css 스타일 적용됨)
        area.innerHTML = `
            <div class="reply-form-wrap">
                <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">
                    <strong>@${parentWriter}</strong> 님에게 답글 작성
                </div>
                <div id="replyInput-${parentId}" class="comment-input-div" contenteditable="true" 
                    placeholder="답글 입력" style="min-height:60px;"></div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                    <button class="btn-cancel" onclick="this.closest('.reply-form-wrap').remove()">취소</button>
                    <button class="btn-save-guest" onclick="window.PostManager.Comments.addReply('${parentId}')">등록</button>
                </div>
            </div>
        `;
        
        const replyInput = document.getElementById(`replyInput-${parentId}`);
        replyInput.focus();

        // [수정 5] 대댓글 입력창에도 멘션 이벤트 연결
        if (window.PostManager.Mention) {
             window.PostManager.Mention.attachEvents(replyInput); 
        }
    },

    addReply: function(parentId) {
        const input = document.getElementById(`replyInput-${parentId}`);
        // div contenteditable이므로 innerText 사용
        const content = input.innerText.trim();
        
        if (!content) return alert("내용을 입력해주세요.");
        
        const success = this.saveCommentData(content, parentId);
        if (success !== false) {
            this.loadComments();
        }
    },

    saveCommentData: function(content, parentId) {
        const comments = JSON.parse(localStorage.getItem("comments") || "[]");
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        const postId = window.PostManager.postId;
        
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
            postId: postId,
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

    bindEvents: function() {
        const btn = document.querySelector(".btn-comment-submit");
        if(btn) btn.onclick = () => this.addComment();
    },

    formatDate: function(dateStr) {
        if(!dateStr) return "";
        return dateStr.substring(0, 10).replace(/-/g, '.');
    }
};