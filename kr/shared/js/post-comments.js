/* kr/shared/js/post-comments.js */

window.PostManager = window.PostManager || {};

window.PostManager.Comments = {
    // [초기화] Core에서 호출
    init: function() {
        this.checkLoginStatus(); // 작성란 UI 제어
        this.loadComments();
        this.bindEvents();

        // 메인 입력창에 멘션 기능 연결 (Mention 모듈이 로드된 경우)
        const mainInput = document.getElementById("mainCommentInput");
        if (mainInput && window.PostManager.Mention) {
            window.PostManager.Mention.attachEvents(mainInput);
        }
    },

    // 1. 로그인 상태에 따른 작성란 UI 제어
    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        const anonInputs = document.getElementById("anonInputs");
        const loginProfile = document.getElementById("loginProfile");
        const userNickSpan = document.getElementById("currentUserNick");

        if (isLoggedIn) {
            // 로그인: 익명창 숨김, 프로필 표시
            if (anonInputs) anonInputs.classList.add("d-none");
            if (loginProfile) {
                loginProfile.classList.remove("d-none");
                if (userNickSpan) {
                    userNickSpan.textContent = localStorage.getItem("user_nick") || "회원";
                }
            }
        } else {
            // 비로그인: 익명창 표시, 프로필 숨김
            if (anonInputs) anonInputs.classList.remove("d-none");
            if (loginProfile) loginProfile.classList.add("d-none");
        }
    },

    // 2. 댓글 목록 로드
    loadComments: function() {
        const postId = window.PostManager.postId;
        const getPostData = window.PostManager.getPostData; // Core의 헬퍼

        // A. Mock 데이터 가져오기 (초기 데이터)
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

        // B. 로컬 스토리지 데이터 가져오기 (사용자가 쓴 글)
        const localComments = JSON.parse(localStorage.getItem("comments") || "[]");
        const myComments = localComments.filter(c => c.postId == postId);
        
        // 합치기
        const allComments = [...mockComments, ...myComments];

        // [중요] 멘션 시스템에 닉네임 리스트 업데이트 요청
        if (window.PostManager.Mention) {
            window.PostManager.Mention.updateList(allComments);
        }

        // C. 렌더링
        const listEl = document.getElementById("commentList");
        if (!listEl) return;
        listEl.innerHTML = "";
        
        // 카운트 업데이트
        const countEl = document.getElementById("commentCountHeader");
        const viewCountEl = document.getElementById("postCommentCount"); // View 영역에 있는 카운트
        if (countEl) countEl.textContent = allComments.length;
        if (viewCountEl) viewCountEl.textContent = allComments.length;

        if (allComments.length === 0) {
            listEl.innerHTML = '<div style="padding:40px; text-align:center; color:var(--muted);">첫 번째 댓글을 남겨보세요!</div>';
            return;
        }

        // 루트 댓글과 답글 분리
        const rootComments = allComments.filter(c => !c.parentId);
        rootComments.forEach(root => {
            listEl.appendChild(this.createCommentElement(root, false));

            const replies = allComments.filter(c => c.parentId == root.id);
            replies.forEach(reply => {
                listEl.appendChild(this.createCommentElement(reply, true));
            });
        });
    },

    // 3. 댓글 DOM 생성
    createCommentElement: function(comment, isReply) {
        const el = document.createElement("div");
        el.className = isReply ? "comment-reply-item" : "comment-item"; 
        el.id = `comment-${comment.id}`;

        // 멘션 파란색 처리 (@닉네임) - 기존 텍스트 방식 호환
        let contentHtml = comment.content.replace(/@([가-힣a-zA-Z0-9_]+)/g, '<span style="color:var(--primary); font-weight:700;">@$1</span>');

        // 버튼 생성
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

    // 4. 댓글 등록 (Main Input)
    addComment: function() {
        const inputDiv = document.getElementById("mainCommentInput");
        if (!inputDiv) return;

        // div contenteditable은 innerText로 내용 가져옴
        const content = inputDiv.innerText.trim();
        if (!content) return alert("내용을 입력해주세요.");

        const success = this.saveCommentData(content, null); 
        if (success !== false) {
            inputDiv.innerHTML = ""; // 초기화
            this.loadComments();
        }
    },

    // 5. 답글 폼 열기
    openReplyForm: function(parentId, parentWriter) {
        // 기존 열린 폼 모두 닫기
        document.querySelectorAll('.reply-form-wrap').forEach(el => el.remove());

        const area = document.getElementById(`reply-form-area-${parentId}`);
        if (!area) return;

        area.innerHTML = `
            <div class="reply-form-wrap">
                <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">
                    <strong>@${parentWriter}</strong> 님에게 답글 작성
                </div>
                <textarea id="replyInput-${parentId}" class="guest-textarea" 
                    placeholder="답글 입력" style="height:60px;"></textarea>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn-cancel" onclick="this.closest('.reply-form-wrap').remove()">취소</button>
                    <button class="btn-save-guest" onclick="window.PostManager.Comments.addReply('${parentId}')">등록</button>
                </div>
            </div>
        `;
        
        const replyInput = document.getElementById(`replyInput-${parentId}`);
        replyInput.focus();

        // 답글창에도 멘션 기능 연결 (textarea 버전이거나 div 버전이거나 호환)
        if (window.PostManager.Mention) {
             // 답글창은 현재 textarea이므로 keyup/down 이벤트만 연결하면 됨
             // 만약 textarea도 멘션을 완벽 지원하려면 div로 바꿔야 하지만, 일단 텍스트 기반 멘션 지원
             // 여기서는 텍스트 에어리어용 이벤트를 붙이거나, 생략 가능
             // window.PostManager.Mention.attachEvents(replyInput); 
        }
    },

    // 6. 답글 등록
    addReply: function(parentId) {
        const input = document.getElementById(`replyInput-${parentId}`);
        const content = input.value.trim();
        if (!content) return alert("내용을 입력해주세요.");
        
        const success = this.saveCommentData(content, parentId);
        if (success !== false) {
            this.loadComments();
        }
    },

    // 7. 데이터 저장 (공통)
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

    // 8. 댓글 삭제
    deleteComment: function(id) {
        if(!confirm("삭제하시겠습니까?")) return;

        if(String(id).startsWith("mock-")) {
            alert("테스트 데이터는 삭제할 수 없습니다. (새로고침 시 복구됨)");
            return;
        }

        let comments = JSON.parse(localStorage.getItem("comments") || "[]");
        // 삭제하려는 댓글과 그 자식 댓글(대댓글)까지 모두 삭제
        comments = comments.filter(c => String(c.id) !== String(id) && String(c.parentId) !== String(id));
        
        localStorage.setItem("comments", JSON.stringify(comments));
        this.loadComments();
    },

    // 이벤트 바인딩
    bindEvents: function() {
        const btn = document.querySelector(".btn-comment-submit");
        if(btn) btn.onclick = () => this.addComment();
    },

    // [유틸] 날짜 포맷
    formatDate: function(dateStr) {
        if(!dateStr) return "";
        return dateStr.substring(0, 10).replace(/-/g, '.');
    }
};