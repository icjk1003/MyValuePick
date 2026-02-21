/* kr/shared/js/blog/blog-core.js */

/**
 * [Blog Core Module]
 * 블로그의 라우팅, 공통 레이아웃 데이터(프로필) 로드 및 권한 제어 담당 (비동기 DB 연동 완료)
 */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. 블로그 주인/방문자 정보 비동기 로드
    await initBlogProfile();

    // 2. 초기 섹션 로드 (URL 파라미터 기반)
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'home'; // 기본값 home
    
    // 뒤로가기 이벤트 감지
    window.onpopstate = (event) => {
        const stateSec = event.state ? event.state.section : 'home';
        loadBlogSection(stateSec, false);
    };

    loadBlogSection(section, false);
});

// HTML 템플릿 캐시 (네트워크 요청 최소화)
const pageCache = {};

/**
 * 섹션 로드 및 전환 (SPA 방식)
 * @param {string} sectionName - 로드할 모듈명 (home, post, scrap 등)
 * @param {boolean} pushState - URL 히스토리 추가 여부
 */
window.loadBlogSection = async function(sectionName, pushState = true) {
    const mainView = document.getElementById("blog-main-view");
    if (!mainView) return;

    // 1. 네비게이션 활성화 처리
    document.querySelectorAll('.blog-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${sectionName}`);
    if(activeBtn) activeBtn.classList.add('active');

    // 2. URL 업데이트
    if (pushState) {
        const url = new URL(window.location);
        url.searchParams.set('section', sectionName);
        window.history.pushState({ section: sectionName }, '', url);
    }

    // 3. 컨텐츠 로드 (캐시 확인 -> fetch)
    try {
        // 로딩 상태 표시 (인라인 스타일 대신 클래스 활용)
        mainView.innerHTML = `<div class="loading-msg">화면을 불러오는 중입니다...</div>`;

        let htmlContent = pageCache[sectionName];

        if (!htmlContent) {
            // 캐시에 없으면 파일 요청
            const response = await fetch(`/kr/html/blog/blog-${sectionName}.html`);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${sectionName} (Status: ${response.status})`);
            }
            htmlContent = await response.text();
            pageCache[sectionName] = htmlContent; // 캐시 저장
        }

        // 4. 화면 주입 및 스크롤 초기화
        mainView.innerHTML = htmlContent;
        window.scrollTo(0, 0);

        // 5. 모듈별 초기화 스크립트 실행
        initModuleScript(sectionName);

    } catch (error) {
        console.error("Section Load Error:", error);
        mainView.innerHTML = `
            <div class="error-state">
                <h3>페이지를 불러올 수 없습니다.</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn-retry">새로고침</button>
            </div>
        `;
    }
};

/**
 * 각 페이지 로드 후 해당 모듈의 init 함수 호출
 */
function initModuleScript(sectionName) {
    // 각 xxx.js 파일에 정의된 Manager 객체 호출
    switch(sectionName) {
        case 'home':
            if(window.BlogHomeManager) window.BlogHomeManager.init();
            break;
        case 'post':
            if(window.BlogPostManager) window.BlogPostManager.init();
            break;
        case 'scrap':
            if(window.BlogScrapManager) window.BlogScrapManager.init();
            break;
        case 'guestbook':
            if(window.BlogGuestbookManager) window.BlogGuestbookManager.init();
            break;
        case 'subscription':
            if(window.BlogSubscriptionManager) window.BlogSubscriptionManager.init();
            break;
        case 'comments':
            if(window.BlogCommentsManager) window.BlogCommentsManager.init();
            break;
        default:
            console.warn(`No manager found for section: ${sectionName}`);
    }
}

/**
 * [변경] 사이드바 프로필 데이터 비동기 로드 및 권한 제어
 */
async function initBlogProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetNickname = urlParams.get('user'); // URL 파라미터 (방문한 블로그의 주인)
    const loggedInUserId = localStorage.getItem("user_id");
    const loggedInUserNick = localStorage.getItem("user_nick");

    let blogOwner = null;
    let isOwner = false;

    try {
        // [1] 블로그 주인 데이터 판별
        if (!targetNickname || targetNickname === loggedInUserNick) {
            // 내 블로그인 경우
            isOwner = true;
            if (loggedInUserId) {
                blogOwner = await DB_API.getUserProfile(loggedInUserId);
            }
        } else {
            // 타인의 블로그인 경우
            isOwner = false;
            
            // 실제 환경에서는 DB_API.getUserProfileByNickname(targetNickname) 형태의 API를 호출
            // Mock 환경에서는 네트워크 딜레이 시뮬레이션 후 MOCK_DB에서 검색
            await new Promise(res => setTimeout(res, 150));
            if (typeof MOCK_DB !== 'undefined' && MOCK_DB.USERS) {
                blogOwner = MOCK_DB.USERS.find(u => u.nickname === targetNickname);
            }
            
            // MOCK_DB에 유저 정보가 없으면 더미 객체 생성 (테스트 환경 대응)
            if (!blogOwner) {
                blogOwner = {
                    nickname: targetNickname,
                    bio: "주식과 경제를 공부하며 기록하는 공간입니다.",
                    profileImg: null
                };
            }
        }

        if (!blogOwner) {
            alert("존재하지 않거나 삭제된 블로그입니다.");
            location.href = "/kr/html/home.html";
            return;
        }

        // [2] 사이드바 요소 바인딩
        const nickEl = document.getElementById("blogNick");
        const bioEl = document.getElementById("blogBio");
        const imgEl = document.getElementById("blogProfileImg");
        const statPost = document.getElementById("statPost");
        
        if (nickEl) nickEl.textContent = blogOwner.nickname;
        if (bioEl) bioEl.textContent = blogOwner.bio || "주식과 경제를 공부하며 기록하는 공간입니다.";
        if (imgEl) imgEl.src = blogOwner.profileImg || "https://via.placeholder.com/150?text=User";

        // [3] 작성된 전체 포스트 수 집계 (Mock 환경 대응)
        if (statPost) {
            if (typeof MOCK_DB !== 'undefined' && MOCK_DB.POSTS) {
                const postCount = MOCK_DB.POSTS.filter(p => p.writer === blogOwner.nickname).length;
                statPost.textContent = postCount.toLocaleString();
            } else {
                statPost.textContent = "0";
            }
        }

        // [4] 권한(본인 여부)에 따른 UI 제어 (클래스 기반 토글)
        const ownerActions = document.getElementById("ownerActions");
        const visitorActions = document.getElementById("visitorActions");
        const ownerOnlyItems = document.querySelectorAll(".owner-only");

        if (isOwner) {
            if (ownerActions) ownerActions.classList.remove("hidden");
            if (visitorActions) visitorActions.classList.add("hidden");
            ownerOnlyItems.forEach(el => el.classList.remove("hidden"));
        } else {
            if (ownerActions) ownerActions.classList.add("hidden");
            if (visitorActions) visitorActions.classList.remove("hidden");
            ownerOnlyItems.forEach(el => el.classList.add("hidden"));
        }

    } catch (error) {
        console.error("블로그 프로필 로딩 실패:", error);
        alert("블로그 정보를 불러오지 못했습니다.");
    }
}