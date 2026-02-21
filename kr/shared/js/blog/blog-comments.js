/* kr/shared/js/blog/blog-comments.js */

window.BlogCommentsManager = {
    currentPage: 1,
    itemsPerPage: 10,
    targetNick: null,

    /**
     * 초기화 함수 (페이지 로드 시 호출)
     */
    async init() {
        console.log("Blog Comments Manager Init");
        
        // 대상 블로그 닉네임 파악 (URL 파라미터 우선, 없으면 로그인 유저)
        const urlParams = new URLSearchParams(window.location.search);
        this.targetNick = urlParams.get('user') || localStorage.getItem("user_nick");

        await this.loadComments();
    },

    /**
     * 댓글 데이터 비동기 로드
     */
    async loadComments() {
        const listContainer = document.getElementById("blogCommentList");
        const emptyState = document.getElementById("blogCommentEmpty");
        const countEl = document.getElementById("totalCommentCount");
        const pagination = document.getElementById("blogCommentPagination");

        if (!listContainer) return;

        // UI 초기화 (로딩 상태)
        listContainer.innerHTML = '<div class="loading-msg">댓글 목록을 불러오는 중입니다...</div>';
        if (emptyState) emptyState.classList.add('hidden');
        if (pagination) pagination.classList.add('hidden');

        try {
            // 서버에서 해당 블로그 게시글의 댓글 데이터를 비동기로 추출 (Join 시뮬레이션)
            const comments = await this.apiGetBlogComments(this.targetNick);

            if (countEl) countEl.textContent = comments.length;

            if (comments.length === 0) {
                listContainer.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                if (pagination) pagination.innerHTML = '';
                return;
            }

            // 페이지네이션 처리
            const totalPages = Math.ceil(comments.length / this.itemsPerPage);
            if (this.currentPage > totalPages) this.currentPage = totalPages;
            
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const pageItems = comments.slice(startIndex, startIndex + this.itemsPerPage);

            // 데이터 렌더링
            listContainer.innerHTML = pageItems.map(item => this.createCommentItem(item)).join('');
            
            // 하단 페이지네이션 렌더링
            if (pagination && totalPages > 1) {
                pagination.classList.remove("hidden");
                this.renderPagination(totalPages, pagination);
            } else if (pagination) {
                pagination.innerHTML = "";
            }

        } catch (error) {
            console.error("블로그 댓글 로딩 실패:", error);
            listContainer.innerHTML = '<div class="error-msg">댓글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
        }
    },

    /**
     * 페이지네이션 렌더링 및 이벤트 바인딩
     */
    renderPagination(totalPages, container) {
        let html = "";
        html += `<button class="page-btn prev" ${this.currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn num ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button class="page-btn next" ${this.currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;
        
        container.innerHTML = html;

        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('prev')) this.currentPage--;
                else if (btn.classList.contains('next')) this.currentPage++;
                else this.currentPage = parseInt(btn.dataset.page);
                
                this.loadComments();
                
                // 페이지 이동 시 상단 탭쪽으로 부드럽게 스크롤
                const targetView = document.getElementById("blog-main-view");
                if (targetView) targetView.scrollIntoView({ behavior: 'smooth' });
            });
        });
    },

    /**
     * 개별 댓글 HTML 생성
     */
    createCommentItem(item) {
        // 날짜 포맷팅 (YYYY.MM.DD HH:mm)
        const dateStr = window.formatBoardDate ? window.formatBoardDate(item.date) : item.date.substring(0, 16).replace('T', ' ');

        return `
            <div class="blog-comment-item clickable" onclick="location.href='${item.postUrl}'">
                <div class="comment-head">
                    <span class="target-post">📄 ${this.escapeHtml(item.postTitle)}</span>
                    <span class="meta-date">${dateStr}</span>
                </div>
                <div class="comment-body">
                    <strong class="comment-writer-name">${this.escapeHtml(item.writer)}</strong>
                    ${this.escapeHtml(item.content)}
                </div>
                <div class="comment-foot">
                    <span class="reply-badge ${item.replyCount > 0 ? 'active' : ''}">
                        답글 ${item.replyCount}
                    </span>
                </div>
            </div>
        `;
    },

    /* ==========================================
       비동기 API 통신 래퍼 (게시글의 댓글 추출 시뮬레이션)
       ========================================== */
    async apiGetBlogComments(targetNick) {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. 전체 게시글을 가져옵니다.
                const mockDB = JSON.parse(localStorage.getItem("MOCK_DB_V5") || "{}");
                const allPosts = typeof DB_API !== 'undefined' ? await DB_API.getPosts() : (mockDB.POSTS || []);

                // 2. 현재 블로그 주인의 게시글만 필터링합니다.
                const userPosts = allPosts.filter(p => p.writer === targetNick);

                let allComments = [];

                // 3. 해당 게시글들에 달린 댓글들을 하나의 배열로 모읍니다.
                userPosts.forEach(post => {
                    if (post.commentList && Array.isArray(post.commentList)) {
                        post.commentList.forEach(cmt => {
                            // 대댓글 수 계산 (Mock 데이터 구조 기준 parentId 일치 갯수)
                            const replyCount = post.commentList.filter(c => c.parentId === cmt.id).length;

                            // 부모 댓글만 표시 (대댓글 자체는 목록에서 제외)
                            if (!cmt.parentId) {
                                allComments.push({
                                    id: cmt.id,
                                    postId: post.id || post.no,
                                    postTitle: post.title,
                                    postUrl: `/kr/html/post/post.html?id=${post.id || post.no}`,
                                    writer: cmt.writer || "익명",
                                    content: cmt.content,
                                    date: cmt.date,
                                    replyCount: replyCount
                                });
                            }
                        });
                    }
                });

                // (테스트용) 내 블로그인데 댓글이 전혀 없을 경우 더미 데이터를 추가합니다.
                if (allComments.length === 0 && targetNick === localStorage.getItem("user_nick")) {
                    allComments = [
                        { id: 101, postTitle: "2024년 하반기 반도체 섹터 전망 분석글", postUrl: "javascript:void(0)", writer: "가치투자연구소", content: "좋은 분석 감사합니다! 특히 HBM 관련 내용이 인상 깊네요.", date: "2024-10-05T14:30:00.000Z", replyCount: 2 },
                        { id: 102, postTitle: "미국 금리 인하 시점 예측과 투자 전략", postUrl: "javascript:void(0)", writer: "차트의신", content: "저도 동의합니다. 11월 전에는 움직임이 있을 것 같네요.", date: "2024-10-01T09:15:00.000Z", replyCount: 0 },
                        { id: 103, postTitle: "초보자를 위한 재무제표 보는 법", postUrl: "javascript:void(0)", writer: "주린이성장기", content: "스크랩해갑니다. 유익한 정보 감사합니다.", date: "2024-09-28T18:20:00.000Z", replyCount: 1 }
                    ];
                }

                // 4. 최신순으로 정렬합니다.
                allComments.sort((a, b) => new Date(b.date) - new Date(a.date));

                // 네트워크 딜레이 시뮬레이션
                setTimeout(() => resolve(allComments), 200); 
            } catch (err) {
                reject(err);
            }
        });
    },

    // HTML XSS 방지 유틸리티
    escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};