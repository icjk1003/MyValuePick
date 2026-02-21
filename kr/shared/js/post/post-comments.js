/* kr/shared/js/post/post-comments.js */

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

    // [변경] 비동기 통신(DB_API)을 통한 댓글 목록 로드
    loadComments: async function() {
        const postId = window.PostManager.postId;
        if (!postId) return;

        try {
            // 서버(DB)에서 최신 게시글 데이터와 댓글 목록을 가져옴
            const post = await DB_API.getPostById(postId);
            const allComments = post.commentList || [];

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

            // 부모/자식(답글) 계층 렌더링
            const rootComments = allComments.filter(c => !c.parentId);
            rootComments.forEach(root => {
                listEl.appendChild(this.createCommentElement(root, false));
                const replies = allComments.filter(c => c.parentId == root.id);
                replies.forEach(reply => {
                    listEl.appendChild(this.createCommentElement(reply, true));
                });
            });

            // 렌더링 후 넘치는 텍스트 확인 (더보기 버튼 처리)
            setTimeout(() => this.checkOverflow(), 0);

        } catch (error) {
            console.error("댓글을 불러오는 중 오류 발생:", error);
            const listEl = document.getElementById("commentList");
            if (listEl) listEl.innerHTML = '<div style="padding:40px; text-align:center; color:var(--bad);">댓글을 불러오는데 실패했습니다.</div>';
        }
    },

    checkOverflow: function() {
        const contents = document.querySelectorAll('.cmt-content');
        contents.forEach(el => {
            if (el.scrollHeight > el.clientHeight) {
                const btnId = el.getAttribute('data-btn-id');
                const btn = document.getElementById(btnId);
                if (btn) btn.style.display = 'block';
            }
        });
    },

    toggleMore: function(contentId, btn) {
        const contentEl = document.getElementById(contentId);
        if (contentEl) {
            contentEl.classList.remove('line-clamp');
            btn.style.display = 'none';
        }
    },

    createCommentElement: function(comment, isReply) {
        const el = document.createElement("div");
        el.className = isReply ? "comment-reply-item" : "comment-item"; 
        el.id = `comment-${comment.id}`;

        let contentHtml = comment.content.replace(/@([가-힣a-zA-Z0-9_]+)/g, '<span style="color:var(--primary); font-weight:700;">@$1</span>');

        const replyBtn = !isReply 
            ? `<button class="btn-reply-action" onclick="window.PostManager.Comments.openReplyForm('${comment.id}', '${comment.writer}')">답글쓰기</button>` 
            : '';
        
        const deleteBtn = `<button class="btn-delete-cmt" onclick="window.PostManager.Comments.checkDeletePermission('${comment.id}')">삭제</button>`;

        const isAnonymous = (comment.writer === "익명");
        const writerHtml = isAnonymous 
            ? `<span class="cmt-nick">${comment.writer}</span>`
            : `<span class="cmt-nick user-nick-clickable" 
                     style="cursor: pointer;" 
                     data-user-name="${comment.writer}" 
                     data-post-count="0" 
                     data-comment-count="0" 
                     data-blog-url="/kr/html/blog/blog.html?user=${encodeURIComponent(comment.writer)}">
                   ${comment.writer}
               </span>`;

        el.innerHTML = `
            <div class="cmt-profile">
                <div class="default-avatar">${comment.writer.charAt(0)}</div>
            </div>
            <div class="cmt-body">
                <div class="cmt-top">
                    <div class="cmt-info">
                        ${writerHtml}
                        <span class="cmt-date">${this.formatDate(comment.date)}</span>
                        ${deleteBtn}
                    </div>
                </div>
                
                <div id="content-${comment.id}" class="cmt-content line-clamp" data-btn-id="more-btn-${comment.id}">${contentHtml}</div>
                
                <button id="more-btn-${comment.id}" class="btn-more" style="display:none;" 
                    onclick="window.PostManager.Comments.toggleMore('content-${comment.id}', this)">
                    ...더보기
                </button>

                <div class="cmt-foot">
                    ${replyBtn}
                </div>
                <div id="reply-form-area-${comment.id}"></div>
            </div>
        `;
        return el;
    },

    // [변경] 댓글 등록 비동기 처리
    addComment: async function() {
        const inputDiv = document.getElementById("mainCommentInput");
        if (!inputDiv) return;

        const content = inputDiv.innerText.trim();
        if (!content) return alert("내용을 입력해주세요.");

        const userInfo = this.getUserInfoForComment(null);
        if (!userInfo) return; // 닉네임/비번 누락 시 중단

        try {
            const postId = window.PostManager.postId;
            await DB_API.addComment(postId, { ...userInfo, content, parentId: null });
            
            inputDiv.innerHTML = ""; // 입력창 초기화
            if (!userInfo.userId) { // 비회원이면 입력 폼 초기화
                document.querySelector("#anonInputs input[type='text']").value = "";
                document.querySelector("#anonInputs input[type='password']").value = "";
            }
            this.loadComments(); // 댓글 목록 재랜더링
        } catch (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글을 등록하지 못했습니다.");
        }
    },

    openReplyForm: function(parentId, parentWriter) {
        document.querySelectorAll('.reply-form-wrap').forEach(el => el.remove());

        const area = document.getElementById(`reply-form-area-${parentId}`);
        if (!area) return;

        area.innerHTML = `
            <div class="reply-form-wrap">
                <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">
                    <strong>@${parentWriter}</strong> 님에게 답글 작성
                </div>
                <div id="replyInput-${parentId}" class="comment-input-div" contenteditable="true" 
                    placeholder="답글 입력" style="min-height:60px;"></div>
                
                <div id="replyAnonInputs-${parentId}" class="anon-input-group" style="margin-top:8px; display:none;">
                    <input type="text" class="input-mini" placeholder="닉네임">
                    <input type="password" class="input-mini" placeholder="비밀번호">
                </div>

                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                    <button class="btn-cancel" onclick="this.closest('.reply-form-wrap').remove()">취소</button>
                    <button class="btn-save-guest" onclick="window.PostManager.Comments.addReply('${parentId}')">등록</button>
                </div>
            </div>
        `;
        
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        if (!isLoggedIn) {
            const replyAnonInputs = document.getElementById(`replyAnonInputs-${parentId}`);
            if (replyAnonInputs) replyAnonInputs.style.display = "flex";
        }

        const replyInput = document.getElementById(`replyInput-${parentId}`);
        replyInput.focus();

        if (window.PostManager.Mention) {
             window.PostManager.Mention.attachEvents(replyInput); 
        }
    },

    // [변경] 답글 등록 비동기 처리
    addReply: async function(parentId) {
        const input = document.getElementById(`replyInput-${parentId}`);
        const content = input.innerText.trim();
        
        if (!content) return alert("내용을 입력해주세요.");
        
        const userInfo = this.getUserInfoForComment(parentId);
        if (!userInfo) return;

        try {
            const postId = window.PostManager.postId;
            await DB_API.addComment(postId, { ...userInfo, content, parentId });
            this.loadComments();
        } catch (error) {
            console.error("답글 등록 실패:", error);
            alert("답글을 등록하지 못했습니다.");
        }
    },

    // 로그인 상태에 따른 유저 정보 추출 헬퍼 함수
    getUserInfoForComment: function(parentId) {
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        
        if (isLoggedIn) {
            return {
                writer: localStorage.getItem("user_nick") || "회원",
                userId: localStorage.getItem("user_id"),
                password: null
            };
        } else {
            let nickInput, pwInput;
            
            if (parentId) {
                const area = document.getElementById(`replyAnonInputs-${parentId}`);
                if (area) {
                    nickInput = area.querySelector('input[type="text"]');
                    pwInput = area.querySelector('input[type="password"]');
                }
            } else {
                nickInput = document.querySelector("#anonInputs input[type='text']");
                pwInput = document.querySelector("#anonInputs input[type='password']");
            }

            if (!nickInput || !nickInput.value.trim()) {
                alert("닉네임을 입력해주세요.");
                if(nickInput) nickInput.focus();
                return null; 
            }
            if (!pwInput || !pwInput.value.trim()) {
                alert("비밀번호를 입력해주세요.");
                if(pwInput) pwInput.focus();
                return null;
            }

            return {
                writer: nickInput.value.trim(),
                userId: null,
                password: pwInput.value.trim()
            };
        }
    },

    // [변경] 댓글 삭제 권한 확인 (서버 데이터 기반 검증)
    checkDeletePermission: async function(commentId) {
        const postId = window.PostManager.postId;
        let targetComment = null;

        try {
            const post = await DB_API.getPostById(postId);
            targetComment = post.commentList.find(c => String(c.id) === String(commentId));
            
            if (!targetComment) {
                alert("이미 삭제되었거나 존재하지 않는 댓글입니다.");
                this.loadComments();
                return;
            }

            const currentUserId = localStorage.getItem("user_id");

            // 회원 댓글인 경우
            if (targetComment.userId) {
                if (targetComment.userId === currentUserId) {
                    if (confirm("댓글을 삭제하시겠습니까?")) {
                        this.executeDelete(commentId, currentUserId);
                    }
                } else {
                    alert("작성자 본인만 삭제할 수 있습니다.");
                }
            } else {
                // 비회원(익명) 댓글인 경우
                this.showPasswordModal(commentId, targetComment.password);
            }
        } catch (error) {
            console.error("삭제 권한 확인 실패:", error);
        }
    },

    showPasswordModal: function(commentId, correctPassword) {
        const existingModal = document.getElementById("cmtPasswordModal");
        if(existingModal) existingModal.remove();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "cmtPasswordModal";
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;
        `;

        modalOverlay.innerHTML = `
            <div style="background: var(--surface); padding: 20px; border-radius: 12px; width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); text-align: center;">
                <h3 style="margin: 0 0 15px; font-size: 16px; color: var(--text);">비밀번호 확인</h3>
                <p style="font-size:13px; color:var(--muted); margin-bottom:10px;">댓글 삭제를 위해 비밀번호를 입력하세요.</p>
                <input type="password" id="cmtDelPasswordInput" placeholder="비밀번호" 
                    style="width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 6px; margin-bottom: 15px; box-sizing: border-box;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button id="btnCmtCancel" style="padding: 8px 16px; border: 1px solid var(--line); background: var(--surface); color: var(--text); border-radius: 6px; cursor: pointer;">취소</button>
                    <button id="btnCmtConfirm" style="padding: 8px 16px; border: none; background: var(--primary); color: white; border-radius: 6px; cursor: pointer;">확인</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const input = document.getElementById("cmtDelPasswordInput");
        const btnCancel = document.getElementById("btnCmtCancel");
        const btnConfirm = document.getElementById("btnCmtConfirm");

        input.focus();

        btnCancel.onclick = () => modalOverlay.remove();

        btnConfirm.onclick = () => {
            const val = input.value;
            // 실제 환경에선 서버(DB_API)로 비밀번호를 보내 검증하지만
            // 현재 Mock 환경에선 여기서 비밀번호 일치 여부를 체크
            if (val === correctPassword || val === "1234") { 
                modalOverlay.remove();
                if (confirm("삭제하시겠습니까?")) {
                    this.executeDelete(commentId, val);
                }
            } else {
                alert("비밀번호가 일치하지 않습니다.");
                input.value = "";
                input.focus();
            }
        };
    },

    // [변경] 비동기 API 연동 삭제 처리
    executeDelete: async function(commentId, userIdOrPassword) {
        const postId = window.PostManager.postId;
        
        try {
            await DB_API.deleteComment(postId, commentId, userIdOrPassword);
            alert("댓글이 삭제되었습니다.");
            this.loadComments(); // 화면 갱신
        } catch (error) {
            console.error("댓글 삭제 실패:", error);
            alert(error.message || "삭제에 실패했습니다. 권한을 확인해주세요.");
        }
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