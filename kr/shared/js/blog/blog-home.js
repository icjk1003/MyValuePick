/* kr/shared/js/blog/blog-home.js */

window.BlogHomeManager = {
    async init() {
        console.log("Blog Home Init");
        
        // 대상 블로그 닉네임 파악 (URL 파라미터 우선, 없으면 로그인 유저)
        const urlParams = new URLSearchParams(window.location.search);
        let targetNick = urlParams.get('user');
        if (!targetNick) {
            targetNick = localStorage.getItem("user_nick");
        }
        this.targetNick = targetNick;

        this.loadWelcomeData();
        
        // 비동기 데이터 로딩 실행
        await Promise.all([
            this.loadPostsData(),
            this.loadGuestbookPreview()
        ]);
    },

    // 1. 웰컴 메시지 로드 (사이드바 정보 동기화)
    loadWelcomeData: function() {
        // 사이드바에 있는 닉네임/소개글을 가져와서 홈 화면에 적용
        // (blog-core.js에서 이미 렌더링을 마친 상태이므로 동기식으로 가져옴)
        const sidebarNick = document.getElementById("blogNick");
        const sidebarBio = document.getElementById("blogBio");
        
        const homeNick = document.getElementById("homeNickName");
        const homeBio = document.getElementById("homeBioText");

        if (sidebarNick && homeNick) {
            homeNick.textContent = sidebarNick.textContent;
        }
        if (sidebarBio && homeBio && sidebarBio.textContent !== "소개글 로딩중...") {
            homeBio.textContent = sidebarBio.textContent;
        }
    },

    // 2. 통합 게시글 데이터 로드 (추천 글 & 최신 글)
    loadPostsData: async function() {
        const featContainer = document.getElementById("homeFeaturedPost");
        const latestContainer = document.getElementById("homeLatestPosts");

        if (featContainer) featContainer.innerHTML = `<div class="loading-msg">추천 게시글을 불러오는 중...</div>`;
        if (latestContainer) latestContainer.innerHTML = `<div class="loading-msg">최신 게시글을 불러오는 중...</div>`;

        try {
            // 전체 게시글 로드 후 해당 블로그 주인의 글만 필터링
            const allPosts = await DB_API.getPosts();
            const userPosts = allPosts.filter(p => p.writer === this.targetNick);

            // [추천 게시글 렌더링] (조회수 + 추천수가 가장 높은 글 1개)
            if (featContainer) {
                if (userPosts.length > 0) {
                    const featuredPost = [...userPosts].sort((a, b) => (b.views + b.votes * 10) - (a.views + a.votes * 10))[0];
                    
                    const dateStr = window.formatBoardDate ? window.formatBoardDate(featuredPost.date) : featuredPost.date.substring(0, 10);
                    const tag = featuredPost.tag || "일반";

                    featContainer.innerHTML = `
                        <div class="feat-content clickable" onclick="location.href='/kr/html/post/post.html?id=${featuredPost.id || featuredPost.no}'">
                            <div class="feat-badge-row">
                                <span class="badge-hot">HOT</span>
                                <span class="badge-cat">${this.escapeHtml(tag)}</span>
                            </div>
                            <h3 class="feat-title">${this.escapeHtml(featuredPost.title)}</h3>
                            <p class="feat-desc">${this.escapeHtml(featuredPost.body ? featuredPost.body.substring(0, 100) + '...' : '본문 내용이 없습니다.')}</p>
                            <div class="feat-meta">
                                <span class="feat-date">${dateStr}</span>
                                <span class="feat-read">조회수 ${(featuredPost.views || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                } else {
                    featContainer.innerHTML = `<div class="empty-placeholder">작성된 추천 게시글이 없습니다.</div>`;
                }
            }

            // [최신 게시글 렌더링] (날짜순 정렬 상위 5개)
            if (latestContainer) {
                if (userPosts.length > 0) {
                    const latestPosts = [...userPosts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                    
                    let html = '<ul class="home-post-list">';
                    latestPosts.forEach(post => {
                        const dateStr = window.formatBoardDate ? window.formatBoardDate(post.date) : post.date.substring(0, 10);
                        html += `
                            <li class="clickable" onclick="location.href='/kr/html/post/post.html?id=${post.id || post.no}'"> 
                                <span class="post-title">${this.escapeHtml(post.title)}</span>
                                <span class="post-date">${dateStr}</span>
                            </li>
                        `;
                    });
                    html += '</ul>';
                    latestContainer.innerHTML = html;
                } else {
                    latestContainer.innerHTML = `<div class="empty-placeholder">최근 작성한 글이 없습니다.</div>`;
                }
            }

        } catch (error) {
            console.error("블로그 게시글 로드 실패:", error);
            if (featContainer) featContainer.innerHTML = `<div class="error-msg">추천 게시글을 불러오지 못했습니다.</div>`;
            if (latestContainer) latestContainer.innerHTML = `<div class="error-msg">최신 게시글을 불러오지 못했습니다.</div>`;
        }
    },

    // 3. 방명록 미리보기 로드 (비동기 시뮬레이션 적용)
    loadGuestbookPreview: async function() {
        const container = document.getElementById("homeGuestbookPreview");
        if (!container) return;

        container.innerHTML = `<div class="loading-msg">방명록을 불러오는 중...</div>`;

        try {
            // [Mock] 실제 환경에서는 DB_API.getGuestbooks(this.targetNick) 등으로 호출
            const guests = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        { writer: "지나가던개미", content: "좋은 정보 감사합니다! 잘 보고 가요.", date: "10.08" },
                        { writer: "성투기원", content: "혹시 바이오 관련 글도 써주실 수 있나요?", date: "10.07" },
                        { writer: "User123", content: "블로그 깔끔하네요.", date: "10.05" }
                    ]);
                }, 400); // 네트워크 지연 시뮬레이션
            });

            let html = '<div class="home-guest-list">';
            if (guests.length > 0) {
                guests.forEach(item => {
                    html += `
                        <div class="mini-guest-item">
                            <div class="mini-guest-head">
                                <strong>${this.escapeHtml(item.writer)}</strong>
                                <span class="date">${this.escapeHtml(item.date)}</span>
                            </div>
                            <p class="mini-guest-msg">${this.escapeHtml(item.content)}</p>
                        </div>
                    `;
                });
            } else {
                html += `<div class="empty-msg-mini">최근 방명록이 없습니다.</div>`;
            }
            html += '</div>';

            container.innerHTML = html;

        } catch (error) {
            console.error("방명록 로드 실패:", error);
            container.innerHTML = `<div class="error-msg">방명록을 불러오지 못했습니다.</div>`;
        }
    },

    // HTML XSS 방지 유틸리티
    escapeHtml: function(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};