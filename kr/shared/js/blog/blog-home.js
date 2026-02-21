/* kr/shared/js/blog/blog-home.js */

window.BlogHomeManager = {
    init: function() {
        console.log("Blog Home Init");
        this.loadWelcomeData();
        this.loadFeaturedPost();
        this.loadLatestPosts();
        this.loadGuestbookPreview();
    },

    // 1. 웰컴 메시지 로드 (사이드바 정보 동기화)
    loadWelcomeData: function() {
        // 사이드바에 있는 닉네임/소개글을 가져와서 홈 화면에 적용
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

    // 2. 추천(고정) 게시글 로드
    loadFeaturedPost: function() {
        const container = document.getElementById("homeFeaturedPost");
        
        // [더미 데이터] 실제로는 'is_featured: true'인 게시글 조회
        const featuredData = {
            id: 1,
            title: "🚀 2024년 하반기 유망 섹터 및 투자 전략 총정리",
            desc: "금리 인하 시점이 다가옴에 따라 주목해야 할 섹터(바이오, 금융)와 기술주(AI, 반도체)의 흐름을 분석해보았습니다. 포트폴리오 재구성이 필요한 시점입니다.",
            date: "2024.10.01",
            tags: ["투자전략", "하반기", "주식"],
            img: "" // 썸네일 이미지 URL (없으면 텍스트 모드)
        };

        // 렌더링
        setTimeout(() => {
            if (featuredData) {
                container.innerHTML = `
                    <div class="feat-content clickable" onclick="location.href='javascript:void(0)'">
                        <div class="feat-badge-row">
                            <span class="badge-hot">HOT</span>
                            <span class="badge-cat">투자전략</span>
                        </div>
                        <h3 class="feat-title">${featuredData.title}</h3>
                        <p class="feat-desc">${featuredData.desc}</p>
                        <div class="feat-meta">
                            <span class="feat-date">${featuredData.date}</span>
                            <span class="feat-read">조회수 1.2k</span>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `<div class="empty-placeholder">추천 게시글이 없습니다.</div>`;
            }
        }, 200);
    },

    // 3. 최신 글 리스트 로드 (최대 5개)
    loadLatestPosts: function() {
        const listContainer = document.getElementById("homeLatestPosts");
        
        // [더미 데이터]
        const posts = [
            { id: 10, title: "삼성전자 3분기 실적 발표 코멘트", date: "2024.10.08" },
            { id: 9, title: "엔비디아 주가 흐름 분석과 전망", date: "2024.10.06" },
            { id: 8, title: "배당주 포트폴리오 점검 (리츠, 은행)", date: "2024.10.03" },
            { id: 7, title: "미국 국채 금리 상승이 시장에 미치는 영향", date: "2024.09.29" },
            { id: 6, title: "초보자를 위한 주식 용어 정리 (PER, PBR, ROE)", date: "2024.09.25" }
        ];

        let html = '<ul class="home-post-list">';
        posts.forEach(post => {
            html += `
                <li onclick="location.href='javascript:void(0)'"> <span class="post-title">${post.title}</span>
                    <span class="post-date">${post.date}</span>
                </li>
            `;
        });
        html += '</ul>';

        setTimeout(() => {
            listContainer.innerHTML = html;
        }, 300);
    },

    // 4. 방명록 미리보기 로드 (최대 3개)
    loadGuestbookPreview: function() {
        const container = document.getElementById("homeGuestbookPreview");

        // [더미 데이터]
        const guests = [
            { writer: "지나가던개미", content: "좋은 정보 감사합니다! 잘 보고 가요.", date: "10.08" },
            { writer: "성투기원", content: "혹시 바이오 관련 글도 써주실 수 있나요?", date: "10.07" },
            { writer: "User123", content: "블로그 깔끔하네요.", date: "10.05" }
        ];

        let html = '<div class="home-guest-list">';
        if (guests.length > 0) {
            guests.forEach(item => {
                html += `
                    <div class="mini-guest-item">
                        <div class="mini-guest-head">
                            <strong>${item.writer}</strong>
                            <span class="date">${item.date}</span>
                        </div>
                        <p class="mini-guest-msg">${item.content}</p>
                    </div>
                `;
            });
        } else {
            html += `<div class="empty-msg-mini">최근 방명록이 없습니다.</div>`;
        }
        html += '</div>';

        setTimeout(() => {
            container.innerHTML = html;
        }, 400);
    }
};