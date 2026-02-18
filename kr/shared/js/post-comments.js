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
                    password: c.password || "1234", // Mock 데이터 기본 비번
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
        
        // 삭제 버튼에 ID 전달
        const deleteBtn = `<button class="btn-delete-cmt" onclick="window.PostManager.Comments.checkDeletePermission('${comment.id}')">삭제</button>`;

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
        
        // 로그인 여부에 따라 답글창의 익명 입력란 노출 제어
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

    addReply: function(parentId) {
        const input = document.getElementById(`replyInput-${parentId}`);
        const content = input.innerText.trim();
        
        if (!content) return alert("내용을 입력해주세요.");
        
        // 답글 저장 시 parentId 기준의 입력란에서 정보를 가져와야 함을 saveCommentData에 알려야 함
        // 여기서는 간단히 saveCommentData 함수를 수정하여 컨텍스트(답글인지)를 처리하거나,
        // 아래처럼 답글용 정보를 별도로 추출해서 넘겨줄 수도 있음.
        // 편의상 saveCommentData를 공용으로 쓰되, 비로그인 시 값을 어디서 가져올지 분기 처리함.
        
        const success = this.saveCommentData(content, parentId);
        if (success !== false) {
            this.loadComments();
        }
    },

    // [수정] 댓글 데이터 저장 (비밀번호 저장 로직 추가)
    saveCommentData: function(content, parentId) {
        const comments = JSON.parse(localStorage.getItem("comments") || "[]");
        const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
        const postId = window.PostManager.postId;
        
        let writer = "익명";
        let userId = null;
        let password = null; // 비밀번호

        if (isLoggedIn) {
            writer = localStorage.getItem("user_nick") || "회원";
            userId = localStorage.getItem("user_id");
        } else {
            // 메인 댓글인지 답글인지에 따라 입력 필드 선택
            let nickInput, pwInput;
            
            if (parentId) {
                // 답글인 경우 해당 폼 내부의 input 찾기
                const area = document.getElementById(`replyAnonInputs-${parentId}`);
                if (area) {
                    nickInput = area.querySelector('input[type="text"]');
                    pwInput = area.querySelector('input[type="password"]');
                }
            } else {
                // 메인 댓글인 경우
                nickInput = document.querySelector("#anonInputs input[type='text']");
                pwInput = document.querySelector("#anonInputs input[type='password']");
            }

            if (!nickInput || !nickInput.value.trim()) {
                alert("닉네임을 입력해주세요.");
                if(nickInput) nickInput.focus();
                return false; 
            }
            if (!pwInput || !pwInput.value.trim()) {
                alert("비밀번호를 입력해주세요.");
                if(pwInput) pwInput.focus();
                return false;
            }

            writer = nickInput.value.trim();
            password = pwInput.value.trim(); // 비밀번호 저장
        }

        const newComment = {
            id: Date.now(),
            postId: postId,
            parentId: parentId,
            writer: writer,
            userId: userId,
            password: password, // 저장
            content: content,
            date: new Date().toISOString(),
            votes: 0
        };

        comments.push(newComment);
        localStorage.setItem("comments", JSON.stringify(comments));
        return true;
    },

    // [신규] 삭제 권한 확인 및 처리
    checkDeletePermission: function(commentId) {
        // 1. 전체 댓글 목록에서 해당 댓글 찾기 (Mock 포함)
        const postId = window.PostManager.postId;
        const getPostData = window.PostManager.getPostData;
        
        let targetComment = null;

        // A. LocalStorage 검색
        const localComments = JSON.parse(localStorage.getItem("comments") || "[]");
        targetComment = localComments.find(c => String(c.id) === String(commentId));

        // B. Mock DB 검색 (LocalStorage에 없으면)
        if (!targetComment && typeof getPostData === 'function') {
            const post = getPostData(postId);
            if (post && post.commentList) {
                // Mock 댓글은 id가 'mock-0' 형태이므로 그대로 비교
                targetComment = post.commentList.map((c, idx) => ({
                    ...c, id: `mock-${idx}`, isMock: true, password: c.password || "1234"
                })).find(c => String(c.id) === String(commentId));
            }
        }

        if (!targetComment) {
            alert("이미 삭제되었거나 존재하지 않는 댓글입니다.");
            this.loadComments();
            return;
        }

        // 2. 권한 체크
        const currentUserId = localStorage.getItem("user_id");

        if (targetComment.userId) {
            // [회원 댓글]
            if (targetComment.userId === currentUserId) {
                // ID 일치 -> 삭제 확인
                if (confirm("댓글을 삭제하시겠습니까?")) {
                    this.executeDelete(commentId);
                }
            } else {
                // ID 불일치
                alert("작성자 본인만 삭제할 수 있습니다.");
            }
        } else {
            // [익명 댓글] -> 비밀번호 확인 모달
            this.showPasswordModal(commentId, targetComment.password);
        }
    },

    // [신규] 익명 댓글 삭제용 비밀번호 모달
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
            if (val === correctPassword) {
                // 비밀번호 일치 -> 최종 확인
                modalOverlay.remove();
                if (confirm("삭제하시겠습니까?")) {
                    this.executeDelete(commentId);
                }
            } else {
                alert("비밀번호가 틀립니다.");
                input.value = "";
                input.focus();
            }
        };
    },

    // [신규] 실제 삭제 실행
    executeDelete: function(commentId) {
        // Mock 데이터 여부 확인
        if (String(commentId).startsWith("mock-")) {
            alert("테스트 데이터(Mock)는 실제로 삭제되지 않습니다.\n(새로고침 시 복구됨)");
            return;
        }

        let comments = JSON.parse(localStorage.getItem("comments") || "[]");
        const initialLen = comments.length;
        
        // 삭제하려는 댓글과 그 자식 댓글(대댓글)까지 모두 삭제
        comments = comments.filter(c => String(c.id) !== String(commentId) && String(c.parentId) !== String(commentId));
        
        if (comments.length !== initialLen) {
            localStorage.setItem("comments", JSON.stringify(comments));
            this.loadComments();
            alert("삭제되었습니다.");
        } else {
            alert("삭제할 댓글을 찾을 수 없습니다.");
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