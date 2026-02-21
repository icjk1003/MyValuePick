/* kr/shared/js/blog/blog-scrap.js */

window.BlogScrapManager = {
    currentPage: 1,
    itemsPerPage: 10,
    targetNick: null,

    async init() {
        console.log("Blog Scrap Init");
        
        // 대상 블로그 닉네임 파악 (URL 파라미터 우선, 없으면 로그인 유저)
        const urlParams = new URLSearchParams(window.location.search);
        this.targetNick = urlParams.get('user') || localStorage.getItem("user_nick");

        this.bindEvents();
        await this.loadScraps();
    },

    bindEvents() {
        const searchInput = document.getElementById("scrapSearchInput");
        const btnSearch = document.getElementById("btnScrapSearch");

        if (btnSearch) {
            btnSearch.onclick = () => {
                this.currentPage = 1;
                this.loadScraps();
            };
        }
        if (searchInput) {
            searchInput.addEventListener("keyup", (e) => {
                if (e.key === "Enter") {
                    this.currentPage = 1;
                    this.loadScraps();
                }
            });
        }
    },

    async loadScraps() {
        const listContainer = document.getElementById("blogScrapList");
        const emptyState = document.getElementById("blogScrapEmpty");
        const totalCount = document.getElementById("totalScrapCount");
        const pagination = document.getElementById("blogScrapPagination");
        const searchInput = document.getElementById("scrapSearchInput");

        if (!listContainer) return;

        // 로딩 초기화 (인라인 스타일 제로 규칙 적용)
        listContainer.innerHTML = '<div class="loading-msg">스크랩 목록을 불러오는 중입니다...</div>';
        if (emptyState) emptyState.classList.add("hidden");
        if (pagination) pagination.classList.add("hidden");

        try {
            // 1. 서버에서 스크랩 데이터 및 원본 게시글 데이터 비동기 로드 (Join 시뮬레이션)
            let scraps = await this.apiGetScraps(this.targetNick);

            // 2. 검색어 필터링 적용
            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
            if (keyword) {
                scraps = scraps.filter(s => 
                    (s.originTitle && s.originTitle.toLowerCase().includes(keyword)) ||
                    (s.originWriter && s.originWriter.toLowerCase().includes(keyword)) ||
                    (s.summary && s.summary.toLowerCase().includes(keyword))
                );
            }

            // 3. 최신 스크랩 순으로 정렬
            scraps.sort((a, b) => new Date(b.scrapDate) - new Date(a.scrapDate));

            // 전체 개수 갱신
            if (totalCount) totalCount.textContent = scraps.length;

            if (scraps.length === 0) {
                listContainer.innerHTML = '';
                if (emptyState) emptyState.classList.remove("hidden");
                if (pagination) pagination.innerHTML = "";
                return;
            }

            // 4. 페이지네이션 처리
            const totalPages = Math.ceil(scraps.length / this.itemsPerPage);
            if (this.currentPage > totalPages) this.currentPage = totalPages;
            
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const pageItems = scraps.slice(startIndex, startIndex + this.itemsPerPage);

            // 5. 렌더링
            listContainer.innerHTML = pageItems.map(item => this.createScrapItem(item)).join('');
            
            if (pagination && totalPages > 1) {
                pagination.classList.remove("hidden");
                this.renderPagination(totalPages, pagination);
            } else if (pagination) {
                pagination.innerHTML = "";
            }

        } catch (error) {
            console.error("스크랩 로드 실패:", error);
            listContainer.innerHTML = '<div class="error-msg">스크랩 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
        }
    },

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
                
                this.loadScraps();
                
                const targetView = document.getElementById("blog-main-view");
                if (targetView) targetView.scrollIntoView({ behavior: 'smooth' });
            });
        });
    },

    createScrapItem(item) {
        // 코멘트(summary)가 있으면 표시, 없으면 숨김
        const summaryHtml = item.summary 
            ? `<p class="scrap-comment">"${this.escapeHtml(item.summary)}"</p>` 
            : '';

        // 날짜 포맷팅
        const originDateStr = window.formatBoardDate ? window.formatBoardDate(item.originDate) : item.originDate.substring(0, 10);
        const scrapDateStr = window.formatBoardDate ? window.formatBoardDate(item.scrapDate) : item.scrapDate.substring(0, 10);

        return `
            <div class="scrap-item clickable" onclick="location.href='${item.link}'">
                <div class="scrap-icon-col">
                    <span class="scrap-icon">📂</span>
                </div>
                <div class="scrap-content-col">
                    <h3 class="origin-title">${this.escapeHtml(item.originTitle)}</h3>
                    <div class="origin-meta">
                        <span class="writer">By. ${this.escapeHtml(item.originWriter)}</span>
                        <span class="divider">|</span>
                        <span class="date">작성일 ${originDateStr}</span>
                    </div>
                    ${summaryHtml}
                    <div class="scrap-date">스크랩: ${scrapDateStr}</div>
                </div>
                <div class="scrap-action-col">
                    <button class="btn-goto" title="원본 글로 이동">➔</button>
                </div>
            </div>
        `;
    },

    /* ==========================================
       비동기 API 통신 래퍼 (Scrap 테이블 + Post 테이블 Join 시뮬레이션)
       ========================================== */
    async apiGetScraps(targetNick) {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. 유저 정보 매칭 (Mock 환경 대응)
                let userId = null;
                const mockDB = JSON.parse(localStorage.getItem("MOCK_DB_V5") || "{}");
                
                if (mockDB.USERS) {
                    const user = mockDB.USERS.find(u => u.nickname === targetNick);
                    if (user) userId = user.id;
                }
                
                // fallback for dummy target
                if (!userId) userId = "mock_user_1";

                // 2. 해당 유저의 스크랩 리스트 가져오기
                const rawScraps = (mockDB.SCRAPS || []).filter(s => s.userId === userId);

                // 3. 전체 포스트를 가져와서 조인(Join) 처리
                // DB_API가 정의되어 있다면 활용, 없으면 MOCK_DB 직접 접근
                const allPosts = typeof DB_API !== 'undefined' ? await DB_API.getPosts() : (mockDB.POSTS || []);

                const enrichedScraps = rawScraps.map(scrap => {
                    const originPost = allPosts.find(p => String(p.id) === String(scrap.postId) || String(p.no) === String(scrap.postId));
                    
                    return {
                        id: scrap.postId, // scrap 고유 id가 없으므로 postId 활용
                        originTitle: originPost ? originPost.title : "삭제된 게시글입니다.",
                        originWriter: originPost ? originPost.writer : "알 수 없음",
                        originDate: originPost ? originPost.date : scrap.date,
                        scrapDate: scrap.date,
                        summary: scrap.summary || "", // 사용자가 직접 남긴 메모가 있다면 연결 (현재 Mock엔 없음)
                        link: originPost ? `/kr/html/post/post.html?id=${scrap.postId}` : "javascript:alert('삭제된 게시글입니다.')"
                    };
                });

                // 더미 데이터 추가 (테스트 및 화면 구성을 위함)
                if (enrichedScraps.length === 0 && targetNick === localStorage.getItem("user_nick")) {
                    enrichedScraps.push({
                        id: 101,
                        originTitle: "워렌 버핏의 2024 주주서한 요약 번역 (샘플 데이터)",
                        originWriter: "가치투자연구소",
                        originDate: "2024-09-20T10:00:00.000Z",
                        scrapDate: "2024-10-05T12:00:00.000Z",
                        summary: "현금 비중 확대와 일본 상사 투자에 대한 버핏의 견해가 담겨있다. 필독!",
                        link: "javascript:void(0)" 
                    });
                }

                setTimeout(() => resolve(enrichedScraps), 200); // 네트워크 딜레이
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