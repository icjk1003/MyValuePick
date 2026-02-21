/* kr/shared/js/post/post-view.js */

window.PostManager = window.PostManager || {};

window.PostManager.View = {
    postAuthorId: null,
    postPassword: null,

    init: function() {
        this.loadPostDetail();
        this.bindEvents(); // 버튼 이벤트 바인딩 호출
    },

    // [변경] DB_API를 활용한 비동기 데이터 호출 적용
    loadPostDetail: async function() {
        const postId = window.PostManager.postId;

        if (!postId) {
            document.getElementById("postTitle").textContent = "잘못된 접근입니다.";
            return;
        }

        try {
            // 실제 서버(DB)에서 상세 데이터 가져오기 (조회수 증가 포함)
            const post = await DB_API.getPostById(postId);

            // 데이터 바인딩
            this.postAuthorId = post.writerId || null;
            this.postPassword = post.password || null;

            this.setText("postTag", post.tag || post.category || "일반");
            this.setText("postTitle", post.title);

            // 상단 작성자 닉네임 설정 및 드롭다운 예외 처리
            const writerName = post.writer || post.nick || "익명";
            this.setText("postWriter", writerName);
            
            const elWriter = document.getElementById("postWriter");
            if (elWriter) {
                if (writerName === "익명") {
                    elWriter.classList.remove("user-nick-clickable");
                    elWriter.style.cursor = "default";
                } else {
                    elWriter.classList.add("user-nick-clickable");
                    elWriter.style.cursor = "pointer";
                    elWriter.dataset.userName = writerName;
                    elWriter.dataset.blogUrl = `/kr/html/blog/blog.html?user=${encodeURIComponent(writerName)}`;
                }
            }

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

                    if(img) img.src = post.writerImg || "/kr/shared/images/default_profile.png"; 
                    if(name) {
                        name.textContent = post.writer;
                        
                        // 하단 프로필 닉네임 드롭다운 예외 처리
                        if (post.writer === "익명") {
                            name.classList.remove("user-nick-clickable");
                            name.style.cursor = "default";
                        } else {
                            name.classList.add("user-nick-clickable");
                            name.style.cursor = "pointer";
                            name.dataset.userName = post.writer;
                            name.dataset.blogUrl = `/kr/html/blog/blog.html?user=${encodeURIComponent(post.writer)}`;
                        }
                    }
                    if(bio) bio.textContent = post.writerBio || "주식과 경제를 분석하는 개인 투자자입니다.";
                }
            }

        } catch (error) {
            console.error("게시글 상세 로드 중 오류:", error);
            document.getElementById("postTitle").textContent = "존재하지 않거나 삭제된 게시글입니다.";
            const body = document.getElementById("postBody");
            if(body) body.innerHTML = "";
        }
    },

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

        // 블로그 방문하기
        const btnVisit = document.getElementById("btnVisitBlog");
        if (btnVisit) {
            btnVisit.onclick = () => {
                const writer = document.getElementById("postWriter").textContent;
                location.href = `/kr/html/blog/blog.html?user=${encodeURIComponent(writer)}`;
            };
        }

        // [변경] 구독하기 기능 비동기 DB 연동
        const btnSubscribe = document.getElementById("btnSubscribe");
        if (btnSubscribe) {
            btnSubscribe.onclick = async () => {
                const currentUserId = localStorage.getItem("user_id"); // 실제 환경에선 인증 토큰 사용

                if (!currentUserId) {
                    alert("로그인 후 이용 가능합니다.");
                    return;
                }

                if (!this.postAuthorId) {
                    alert("익명 작성자는 구독할 수 없습니다.");
                    return;
                }

                try {
                    // DB API 구독 토글 호출
                    const isSubscribed = await DB_API.toggleSubscription(currentUserId, this.postAuthorId);
                    
                    if (isSubscribed) {
                        alert("구독이 완료되었습니다!");
                        btnSubscribe.classList.add("active");
                        btnSubscribe.textContent = "구독중";
                    } else {
                        alert("구독이 취소되었습니다.");
                        btnSubscribe.classList.remove("active");
                        btnSubscribe.textContent = "+ 구독하기";
                    }
                } catch (error) {
                    console.error(error);
                    alert("구독 처리 중 오류가 발생했습니다.");
                }
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
            // 회원 작성 글인 경우
            if (currentUserId === this.postAuthorId) {
                if (confirm("게시글을 삭제하시겠습니까?")) {
                    this.executeDeletePost(currentUserId);
                }
            } else {
                alert("삭제할 수 없습니다. (작성자만 삭제 가능)");
            }
            return;
        }
        // 익명 작성 글인 경우 비밀번호 입력 모달 호출
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
            if (!input.value.trim()) {
                alert("비밀번호를 입력해주세요.");
                return;
            }
            this.executeDeletePost(input.value);
            modalOverlay.remove();
        };
    },

    // [변경] 비동기 API를 통한 서버(DB) 측 삭제 프로세스 적용
    executeDeletePost: async function(userIdOrPassword) {
        const postId = window.PostManager.postId;
        
        try {
            await DB_API.deletePost(postId, userIdOrPassword);
            alert("게시글이 성공적으로 삭제되었습니다.");
            location.href = "/kr/html/board.html"; // 삭제 성공 시 목록으로 이동
        } catch (error) {
            console.error("삭제 실패:", error);
            alert(error.message || "삭제에 실패했습니다. 권한을 확인해주세요.");
        }
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