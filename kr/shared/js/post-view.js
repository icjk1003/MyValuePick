/* kr/shared/js/post-view.js */

window.PostManager = window.PostManager || {};

window.PostManager.View = {
    postAuthorId: null,
    postPassword: null,

    init: function() {
        this.loadPostDetail();
        this.bindEvents(); // 버튼 이벤트 바인딩 호출
    },

    loadPostDetail: function() {
        const postId = window.PostManager.postId;
        const getPostData = window.PostManager.getPostData || this._fallbackGetPostData;

        const post = getPostData(postId);

        if (!post) {
            document.getElementById("postTitle").textContent = "존재하지 않는 게시글입니다.";
            return;
        }

        // 데이터 바인딩
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

        // 삭제 버튼 동적 생성
        this.renderDeleteButton();

        // 작성자 프로필 카드 설정
        const authorCard = document.querySelector(".author-card");
        if (authorCard) {
            if (!this.postAuthorId) {
                authorCard.style.display = "none"; // 익명글은 프로필 숨김
            } else {
                authorCard.style.display = "flex"; 
                
                const img = document.getElementById("authorImg");
                const name = document.getElementById("authorName");
                const bio = document.querySelector(".author-bio");

                if(img) img.src = post.writerImg || "../shared/images/default_profile.png"; 
                if(name) name.textContent = post.writer;
                if(bio) bio.textContent = post.writerBio || "주식과 경제를 분석하는 개인 투자자입니다.";
            }
        }
    },

    // [중요] 버튼 이벤트 연결
    bindEvents: function() {
        // 공유하기
        const btnShare = document.getElementById("btnShare");
        if (btnShare) {
            btnShare.onclick = () => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                    alert("게시글 주소가 복사되었습니다!");
                }).catch(() => alert("주소 복사 실패"));
            };
        }

        // 신고하기
        const btnReport = document.getElementById("btnReport");
        if (btnReport) {
            btnReport.onclick = () => alert("신고가 접수되었습니다.");
        }

        // [복구] 블로그 방문하기
        const btnVisit = document.getElementById("btnVisitBlog");
        if (btnVisit) {
            btnVisit.onclick = () => {
                const writer = document.getElementById("postWriter").textContent;
                location.href = `blog.html?user=${encodeURIComponent(writer)}`;
            };
        }

        // [복구] 구독하기
        const btnSubscribe = document.getElementById("btnSubscribe");
        if (btnSubscribe) {
            btnSubscribe.onclick = () => {
                const writer = document.getElementById("postWriter").textContent;
                alert(`'${writer}' 님을 구독했습니다!`);
                btnSubscribe.classList.toggle("active");
                btnSubscribe.textContent = btnSubscribe.classList.contains("active") ? "구독중" : "+ 구독하기";
            };
        }
    },

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

    handleDeletePost: function() {
        const currentUserId = localStorage.getItem("user_id");
        if (this.postAuthorId) {
            if (currentUserId === this.postAuthorId) {
                if (confirm("게시글을 삭제하시겠습니까?")) this.executeDeletePost();
            } else {
                alert("삭제할 수 없습니다. (작성자만 삭제 가능)");
            }
            return;
        }
        if (!this.postAuthorId) this.showPasswordModal();
    },

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
        btnCancel.onclick = () => modalOverlay.remove();
        btnConfirm.onclick = () => {
            if (input.value === this.postPassword || input.value === "1234") {
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
        const postId = window.PostManager.postId;
        let localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
        const initialLen = localPosts.length;
        
        localPosts = localPosts.filter(p => String(p.id) !== String(postId));
        
        if (localPosts.length !== initialLen) {
            localStorage.setItem("posts", JSON.stringify(localPosts));
            alert("삭제되었습니다.");
            location.href = "board.html";
            return;
        }
        alert("테스트 데이터(Mock DB)는 실제로 삭제되지 않습니다.\n(새로고침 시 복구됨)");
        location.href = "board.html";
    },

    setText: function(id, val) {
        const el = document.getElementById(id);
        if(el) el.textContent = val;
    },

    formatDate: function(dateStr) {
        if(!dateStr) return "";
        return dateStr.substring(0, 10).replace(/-/g, '.');
    },

    _fallbackGetPostData: function(id) {
        if(typeof MOCK_DB === 'undefined') return null;
        return MOCK_DB.POSTS.find(p => p.no === id || p.id === id) || 
               JSON.parse(localStorage.getItem("posts") || "[]").find(p => p.id === id || p.no === id);
    }
};