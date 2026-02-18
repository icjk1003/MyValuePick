/* kr/shared/js/post-board.js */

window.PostManager = window.PostManager || {};

window.PostManager.Board = {
    // 설정값 (20개씩, 10페이지)
    currentPage: 1,
    limit: 20,
    pageCount: 10,
    currentSearchType: "all",

    // [초기화] Core에서 호출
    init: function() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('page')) {
            this.currentPage = parseInt(params.get('page'));
        }

        this.loadBoardList();
        this.initBelowSearch();
    },

    // 1. 하단 게시글 목록 로드
    loadBoardList: function() {
        // 데이터 가져오기 (MOCK + LocalStorage)
        let allPosts = [];
        if (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) {
            allPosts = [...MOCK_DB.POSTS];
        }
        
        const localPosts = JSON.parse(localStorage.getItem("posts") || "[]");
        allPosts = allPosts.concat(localPosts);

        // 최신순 정렬
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalCount = allPosts.length;
        const start = (this.currentPage - 1) * this.limit;
        const pageData = allPosts.slice(start, start + this.limit);

        this.renderBelowList(pageData);
        this.renderPager(totalCount);
    },

    // 2. 리스트 렌더링
    renderBelowList: function(posts) {
        const tbody = document.getElementById("boardBelowRows");
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px 0;">게시글이 없습니다.</td></tr>`;
            return;
        }

        const currentPostId = window.PostManager.postId; // 현재 보고 있는 글 ID

        tbody.innerHTML = posts.map(p => {
            const id = p.no || p.id;
            // 현재 보고 있는 글이면 배경색 강조
            const isCurrent = (id == currentPostId) ? "background-color:var(--surface-hover);" : "";
            
            // 댓글 수 표시
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
        const currentId = window.PostManager.postId;
        
        // 이전 그룹 버튼
        if (startPage > 1) {
            html += `<a class="pagerBtn" href="post.html?id=${currentId}&page=${startPage - 1}">‹</a>`;
        }

        // 페이지 번호
        for (let i = startPage; i <= endPage; i++) {
            const active = (i === this.currentPage) ? "active" : "";
            html += `<a href="post.html?id=${currentId}&page=${i}" class="${active}">${i}</a>`;
        }

        // 다음 그룹 버튼
        if (endPage < totalPages) {
            html += `<a class="pagerBtn" href="post.html?id=${currentId}&page=${endPage + 1}">›</a>`;
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

        // Custom Select 연결
        this.setupCustomSelect("boardSearchType", options, this.currentSearchType, (val) => {
            this.currentSearchType = val;
        });

        // 검색 실행 함수
        const doSearch = () => {
            if (input && !input.value.trim()) { 
                alert("검색어를 입력해주세요."); 
                return; 
            }
            const query = input ? input.value.trim() : "";
            // 검색 시 board.html로 이동
            location.href = `board.html?q=${encodeURIComponent(query)}&type=${this.currentSearchType}&page=1`;
        };

        if(btn) btn.onclick = doSearch;
        if(input) input.onkeypress = (e) => { 
            if (e.key === "Enter") doSearch(); 
        };
    },

    // [헬퍼] Custom Select 드롭다운 생성
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
        
        // 외부 클릭 시 닫기
        document.addEventListener("click", () => list.style.display = "none");
    },

    // [유틸] 날짜 포맷
    formatDate: function(dateStr) {
        if(!dateStr) return "";
        return dateStr.substring(0, 10).replace(/-/g, '.');
    }
};