/* kr/shared/js/blog/blog-post.js */

window.BlogPostManager = {
    currentPage: 1,
    itemsPerPage: 10,
    targetNick: null,

    async init() {
        console.log("Blog Post Init");
        
        // 대상 블로그 닉네임 설정 (URL 파라미터 우선, 없으면 본인)
        const urlParams = new URLSearchParams(window.location.search);
        this.targetNick = urlParams.get('user') || localStorage.getItem("user_nick");

        this.bindEvents();
        await this.loadPosts();
    },

    bindEvents() {
        // 검색 버튼 및 엔터키
        const searchInput = document.getElementById("postSearchInput");
        const btnSearch = document.getElementById("btnPostSearch");
        const sortFilter = document.getElementById("postSortFilter");

        if (btnSearch) {
            btnSearch.onclick = () => {
                this.currentPage = 1;
                this.loadPosts();
            };
        }
        if (searchInput) {
            searchInput.addEventListener("keyup", (e) => {
                if (e.key === "Enter") {
                    this.currentPage = 1;
                    this.loadPosts();
                }
            });
        }
        // 정렬 변경 시 자동 재조회
        if (sortFilter) {
            sortFilter.onchange = () => {
                this.currentPage = 1;
                this.loadPosts();
            };
        }
    },

    async loadPosts() {
        const listContainer = document.getElementById("blogPostList");
        const emptyState = document.getElementById("blogPostEmpty");
        const totalCountEl = document.getElementById("totalPostCount");
        const pagination = document.getElementById("blogPostPagination");
        const searchInput = document.getElementById("postSearchInput");
        const sortFilter = document.getElementById("postSortFilter");

        if (!listContainer) return;

        // 로딩 상태 표시
        listContainer.innerHTML = '<div class="loading-msg">게시글을 불러오는 중입니다...</div>';
        if (emptyState) emptyState.classList.add("hidden");
        if (pagination) pagination.classList.add("hidden");

        try {
            // 1. 전체 게시글 비동기 로드
            const allPosts = await DB_API.getPosts();
            
            // 2. 현재 블로그 주인이 작성한 글로 필터링
            let filtered = allPosts.filter(p => p.writer === this.targetNick);

            // 3. 검색어 필터링 적용
            const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
            if (keyword) {
                filtered = filtered.filter(p => 
                    (p.title && p.title.toLowerCase().includes(keyword)) || 
                    (p.body && p.body.toLowerCase().includes(keyword)) ||
                    (p.content && p.content.toLowerCase().includes(keyword))
                );
            }

            // 4. 정렬 (최신순 vs 인기순)
            const sortBy = sortFilter ? sortFilter.value : "latest";
            if (sortBy === "popular") {
                filtered.sort((a, b) => (b.views + b.votes * 10) - (a.views + a.votes * 10));
            } else {
                // 기본값: 최신순 정렬
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            // 전체 개수 갱신
            if (totalCountEl) totalCountEl.textContent = filtered.length;

            // 5. 결과가 없을 경우 빈 화면 처리
            if (filtered.length === 0) {
                listContainer.innerHTML = '';
                if (emptyState) emptyState.classList.remove("hidden");
                if (pagination) pagination.innerHTML = "";
                return;
            }

            // 6. 페이지네이션 처리
            const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
            if (this.currentPage > totalPages) this.currentPage = totalPages;
            
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const pageItems = filtered.slice(startIndex, startIndex + this.itemsPerPage);

            // 7. 목록 렌더링
            listContainer.innerHTML = pageItems.map(post => this.createPostItem(post)).join('');
            
            // 하단 페이지네이션 렌더링
            if (pagination && totalPages > 1) {
                pagination.classList.remove("hidden");
                this.renderPagination(totalPages, pagination);
            } else if (pagination) {
                pagination.innerHTML = "";
            }

        } catch (error) {
            console.error("블로그 게시글 로드 실패:", error);
            listContainer.innerHTML = '<div class="error-msg">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
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
                
                this.loadPosts();
                
                // 페이지 이동 시 상단 탭쪽으로 부드럽게 스크롤
                const targetView = document.getElementById("blog-main-view");
                if (targetView) targetView.scrollIntoView({ behavior: 'smooth' });
            });
        });
    },

    createPostItem(post) {
        const thumb = post.thumb || post.thumbnail || "";
        const hasThumb = thumb ? 'has-thumb' : '';
        const thumbHtml = thumb 
            ? `<div class="post-thumb"><img src="${this.escapeHtml(thumb)}" alt="thumb"></div>` 
            : '';

        const dateStr = window.formatBoardDate ? window.formatBoardDate(post.date) : post.date.substring(0, 10);
        const tag = post.tag || post.category || "일반";
        
        // 본문 내용 미리보기 (HTML 태그 제거 및 길이 제한)
        let desc = post.desc || post.body || post.content || "본문 내용이 없습니다.";
        desc = desc.replace(/<[^>]*>?/gm, ''); // 태그 제거
        if (desc.length > 100) desc = desc.substring(0, 100) + '...';

        return `
            <div class="blog-post-item ${hasThumb} clickable" onclick="location.href='/kr/html/post/post.html?id=${post.id || post.no}'"> 
                ${thumbHtml}
                <div class="post-info">
                    <div class="post-meta-top">
                        <span class="category-badge">${this.escapeHtml(tag)}</span>
                        <span class="post-date">${dateStr}</span>
                    </div>
                    <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                    <p class="post-desc">${this.escapeHtml(desc)}</p>
                    <div class="post-meta-bottom">
                        <span class="stat">조회 ${(post.views || 0).toLocaleString()}</span>
                        <span class="stat">추천 ${post.votes || 0}</span>
                        <span class="stat">댓글 ${post.comments || 0}</span>
                    </div>
                </div>
            </div>
        `;
    },

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