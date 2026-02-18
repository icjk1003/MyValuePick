/* kr/shared/js/post-board.js */

window.PostManager = window.PostManager || {};

window.PostManager.Board = {
    // 설정값
    currentPage: 1,
    limit: 20,
    pageCount: 10,
    currentSearchType: "all",
    searchQuery: "", // [추가] 검색어 상태 관리

    // [초기화]
    init: function() {
        const params = new URLSearchParams(window.location.search);
        // URL에 페이지 번호가 있으면 초기값으로 사용
        if (params.get('page')) {
            this.currentPage = parseInt(params.get('page'));
        }

        this.loadBoardList();
        this.initBelowSearch();
    },

    // 1. 하단 게시글 목록 로드 (검색 필터 적용)
    loadBoardList: function() {
        // A. 전체 데이터 가져오기
        let allPosts = [];
        if (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) {
            allPosts = [...MOCK_DB.POSTS];
        }
        
        const localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
        allPosts = allPosts.concat(localPosts);

        // B. 최신순 정렬
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // C. [수정] 검색어 필터링 적용 (화면 이동 없이 내부 필터링)
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            allPosts = allPosts.filter(p => {
                const title = (p.title || "").toLowerCase();
                const writer = (p.writer || p.nick || "").toLowerCase();
                
                if (this.currentSearchType === "all") {
                    return title.includes(q) || writer.includes(q);
                } else if (this.currentSearchType === "title") {
                    return title.includes(q);
                } else if (this.currentSearchType === "writer") {
                    return writer.includes(q);
                }
                return true;
            });
        }

        // D. 페이징 처리
        const totalCount = allPosts.length;
        const totalPages = Math.ceil(totalCount / this.limit);
        
        // 검색 등으로 데이터가 줄었을 때 현재 페이지 보정
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }
        if (this.currentPage < 1) this.currentPage = 1;

        const start = (this.currentPage - 1) * this.limit;
        const pageData = allPosts.slice(start, start + this.limit);

        this.renderBelowList(pageData);
        this.renderPager(totalCount);
    },

    // [신규] 페이지 이동 핸들러 (스크롤 유지의 핵심)
    goToPage: function(page) {
        this.currentPage = page;
        this.loadBoardList(); 
        // 화면 새로고침(href)이 없으므로 스크롤 위치는 자연스럽게 유지됩니다.
    },

    // 2. 리스트 렌더링
    renderBelowList: function(posts) {
        const tbody = document.getElementById("boardBelowRows");
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px 0;">검색 결과가 없습니다.</td></tr>`;
            return;
        }

        const currentPostId = window.PostManager.postId;

        tbody.innerHTML = posts.map(p => {
            const id = p.no || p.id;
            const isCurrent = (id == currentPostId) ? "background-color:var(--surface-hover);" : "";
            const cmtCnt = p.comments || (p.commentList ? p.commentList.length : 0);
            const cmtHtml = cmtCnt > 0 ? `<span style="color:var(--primary); font-weight:bold; font-size:0.8em;"> [${cmtCnt}]</span>` : "";

            return `
            <tr style="${isCurrent}">
                <td class="colNo">${id}</td>
                <td class="colTag"><span class="chip">${p.tag || p.category || "일반"}</span></td>
                <td style="text-align:left">
                    <a href="post.html?id=${id}">
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

    // 3. 페이지네이션 렌더링
    renderPager: function(totalCount) {
        const pager = document.getElementById("belowPager");
        if (!pager) return;

        const totalPages = Math.ceil(totalCount / this.limit);
        const pageGroup = Math.ceil(this.currentPage / this.pageCount);
        let startPage = (pageGroup - 1) * this.pageCount + 1;
        let endPage = startPage + this.pageCount - 1;
        if (endPage > totalPages) endPage = totalPages;

        let html = "";
        
        // [수정] href="..." 대신 onclick="...goToPage()" 사용
        if (startPage > 1) {
            html += `<a class="pagerBtn" onclick="window.PostManager.Board.goToPage(${startPage - 1})">‹</a>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            const active = (i === this.currentPage) ? "active" : "";
            html += `<a class="${active}" onclick="window.PostManager.Board.goToPage(${i})">${i}</a>`;
        }

        if (endPage < totalPages) {
            html += `<a class="pagerBtn" onclick="window.PostManager.Board.goToPage(${endPage + 1})">›</a>`;
        }

        pager.innerHTML = html;
    },

    // 4. 검색 기능 초기화
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

        // [수정] 검색 실행 함수 (페이지 이동 제거)
        const doSearch = () => {
            const query = input ? input.value.trim() : "";
            
            // 상태 업데이트
            this.searchQuery = query;
            this.currentPage = 1; // 검색 시 1페이지부터 시작
            
            // 리스트 다시 로드 (필터링 적용됨)
            this.loadBoardList();
        };

        if(btn) btn.onclick = doSearch;
        if(input) input.onkeypress = (e) => { 
            if (e.key === "Enter") doSearch(); 
        };
    },

    // [헬퍼] 커스텀 드롭다운
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

    formatDate: function(dateStr) {
        if(!dateStr) return "";
        return dateStr.substring(0, 10).replace(/-/g, '.');
    }
};