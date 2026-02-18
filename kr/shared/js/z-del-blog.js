/**
 * [Blog Module]
 * 사용자 개인 블로그 (게시글, 댓글, 스크랩, 구독, 방명록) + Owner Mode
 */
class BlogManager {
    constructor() {
        const params = new URLSearchParams(window.location.search);
        this.targetUser = params.get('user');

        // 파라미터가 없으면 내 블로그로 이동 시도
        if (!this.targetUser) {
            const myNick = localStorage.getItem('user_nick');
            if (myNick) {
                this.targetUser = myNick;
            } else {
                alert("잘못된 접근입니다.");
                history.back();
                return;
            }
        }

        this.isOwner = false; // 주인장 여부
        this.init();
    }

    init() {
        this.checkOwnerMode(); // [New] 주인장 확인
        this.renderProfile();
        this.bindNav();
        this.loadPosts();
        this.loadComments();
        this.loadScraps();
        this.loadSubs();
        this.loadGuestbook();
        this.bindEvents();
    }

    // 1. [New] 주인장 모드 체크 및 UI 전환
    checkOwnerMode() {
        const myNick = localStorage.getItem('user_nick');
        if (myNick && myNick === this.targetUser) {
            this.isOwner = true;
            
            // 주인장 전용 요소 표시
            document.querySelectorAll('.owner-only').forEach(el => el.classList.remove('hidden'));
            
            // 방문자 전용 요소 숨김
            const visitorGroup = document.getElementById('visitorActions');
            if(visitorGroup) visitorGroup.classList.add('hidden');
            
            // 주인장 전용 액션 표시
            const ownerGroup = document.getElementById('ownerActions');
            if(ownerGroup) ownerGroup.classList.remove('hidden');

            // 방명록 입력창 placeholder 변경
            const guestInput = document.getElementById('guestInput');
            if(guestInput) guestInput.placeholder = "방문자들에게 공지사항이나 인사를 남겨보세요.";
        }
    }

    // 2. 프로필 정보 렌더링
    renderProfile() {
        document.getElementById('blogNick').textContent = this.targetUser;
        document.getElementById('blogProfileImg').src = getProfileImage(this.targetUser);
        
        // 주인장이라면 내 소개글(localStorage) 가져오기
        if (this.isOwner) {
            const myBio = localStorage.getItem('user_bio');
            document.getElementById('blogBio').textContent = myBio || "자기소개를 입력해주세요.";
        } else {
            // 타인이라면 (가상 데이터)
            document.getElementById('blogBio').textContent = `${this.targetUser}님의 투자 기록 공간입니다.`;
        }
    }

    // 3. 네비게이션 바인딩
    bindNav() {
        const navItems = document.querySelectorAll('.nav-item');
        const panes = document.querySelectorAll('.tab-pane');

        navItems.forEach(item => {
            if(item.onclick) return; // onclick 있는 버튼(글쓰기 등)은 제외

            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                const targetId = `tab-${item.dataset.tab}`;
                panes.forEach(p => {
                    if (p.id === targetId) p.classList.add('active');
                    else p.classList.remove('active');
                });
                
                if(window.innerWidth <= 768) {
                   window.scrollTo({top: document.querySelector('.blog-content').offsetTop - 80, behavior:'smooth'});
                }
            });
        });
    }

    // 4. 게시글 목록
    loadPosts() {
        const posts = (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) ? MOCK_DB.POSTS : [];
        const userPosts = posts.filter(p => p.writer === this.targetUser);
        
        document.getElementById('statPost').textContent = userPosts.length;
        
        const tbody = document.getElementById('blogPostList');
        const emptyDiv = document.getElementById('blogPostEmpty');

        if (userPosts.length === 0) {
            emptyDiv.classList.remove('hidden');
            return;
        }

        tbody.innerHTML = userPosts.map((p, idx) => `
            <tr onclick="location.href='post.html?id=${p.no}'" style="cursor:pointer">
                <td>${userPosts.length - idx}</td>
                <td style="text-align:left; font-weight:600;">
                    ${p.title} 
                    ${p.comments > 0 ? `<span style="color:var(--primary); font-size:12px;">[${p.comments}]</span>` : ''}
                </td>
                <td>${formatBoardDate(p.date)}</td>
                <td>${formatNumber(p.views)}</td>
            </tr>
        `).join("");
    }

    // 5. 댓글 목록 (가상)
    loadComments() {
        document.getElementById('blogCommentEmpty').classList.remove('hidden');
    }

    // 6. 스크랩 목록 (가상)
    loadScraps() {
        const tbody = document.getElementById('blogScrapList');
        const emptyDiv = document.getElementById('blogScrapEmpty');
        
        const scrapData = [
            { id: 101, title: '2024년 하반기 반도체 전망', writer: '주식고수', date: '2024-02-15' },
            { id: 102, title: '배당주 포트폴리오 공개', writer: '가치투자자', date: '2024-02-10' }
        ];

        if (scrapData.length === 0) {
            emptyDiv.classList.remove('hidden');
            return;
        }
        emptyDiv.classList.add('hidden');

        tbody.innerHTML = scrapData.map((s, idx) => `
            <tr onclick="location.href='post.html?id=${s.id}'" style="cursor:pointer">
                <td>${idx + 1}</td>
                <td style="text-align:left; font-weight:600;">${s.title}</td>
                <td>${s.writer}</td>
                <td>${s.date}</td>
            </tr>
        `).join("");
    }

    // 7. 구독 작가
    loadSubs() {
        const listDiv = document.getElementById('blogSubList');
        const subs = ['주식고수', '단타왕', '가치투자자']; 
        document.getElementById('statSub').textContent = subs.length; 

        listDiv.innerHTML = subs.map(name => `
            <div class="sub-card">
                <img src="${getProfileImage(name)}" alt="${name}">
                <div class="sub-card-name">${name}</div>
                <button class="btn small" onclick="location.href='blog.html?user=${encodeURIComponent(name)}'">방문</button>
            </div>
        `).join("");
    }

    // 8. 방명록 로드
    loadGuestbook() {
        const listDiv = document.getElementById('guestbookList');
        const emptyDiv = document.getElementById('guestbookEmpty');
        
        const storageKey = `GUESTBOOK_${this.targetUser}`;
        const guestData = JSON.parse(localStorage.getItem(storageKey) || "[]");

        if (guestData.length === 0) {
            emptyDiv.classList.remove('hidden');
            listDiv.innerHTML = "";
            return;
        }

        emptyDiv.classList.add('hidden');
        guestData.sort((a, b) => new Date(b.date) - new Date(a.date));
        const myNick = localStorage.getItem('user_nick');

        listDiv.innerHTML = guestData.map(g => `
            <div class="guest-item">
                <div class="guest-hd">
                    <div class="guest-writer">
                        <img src="${getProfileImage(g.writer)}" style="width:20px; height:20px; border-radius:50%">
                        ${g.writer}
                    </div>
                    <div class="guest-date">
                        ${new Date(g.date).toLocaleDateString()}
                        ${(g.writer === myNick || this.isOwner) ? `<button class="guest-del-btn" onclick="blogManager.deleteGuest('${g.id}')">삭제</button>` : ''}
                    </div>
                </div>
                <div class="guest-bd">${this.escapeHtml(g.content)}</div>
            </div>
        `).join("");
    }

    bindEvents() {
        // 방명록 등록
        document.getElementById('btnSaveGuest').addEventListener('click', () => {
            const input = document.getElementById('guestInput');
            const content = input.value.trim();
            const myNick = localStorage.getItem('user_nick');

            if (!myNick) return alert("로그인이 필요합니다.");
            if (!content) return alert("내용을 입력해주세요.");

            const storageKey = `GUESTBOOK_${this.targetUser}`;
            const guestData = JSON.parse(localStorage.getItem(storageKey) || "[]");

            guestData.push({
                id: Date.now().toString(),
                writer: myNick,
                content: content,
                date: new Date().toISOString()
            });

            localStorage.setItem(storageKey, JSON.stringify(guestData));
            input.value = "";
            this.loadGuestbook();
        });

        // 구독 버튼 (방문자용)
        const subBtn = document.getElementById('btnBlogSubscribe');
        if(subBtn) {
            subBtn.addEventListener('click', () => {
                alert(`${this.targetUser}님을 구독했습니다!`);
            });
        }
        
        // 커버 변경 버튼 (주인장용)
        const editCoverBtn = document.getElementById('btnEditCover');
        if(editCoverBtn) {
            editCoverBtn.addEventListener('click', () => {
                alert("커버 이미지 변경 기능 (준비중)");
            });
        }
    }

    deleteGuest(id) {
        if(!confirm("삭제하시겠습니까?")) return;
        
        const storageKey = `GUESTBOOK_${this.targetUser}`;
        let guestData = JSON.parse(localStorage.getItem(storageKey) || "[]");
        guestData = guestData.filter(g => g.id !== id);
        
        localStorage.setItem(storageKey, JSON.stringify(guestData));
        this.loadGuestbook();
    }

    escapeHtml(text) {
        if (!text) return "";
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

window.blogManager = new BlogManager();