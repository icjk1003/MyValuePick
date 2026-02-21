/* kr/shared/js/blog/blog-core.js */

/**
 * [Blog Core Module]
 * 블로그의 라우팅, 공통 레이아웃 데이터(프로필) 로드 담당
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 블로그 주인/방문자 정보 로드
    initBlogProfile();

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
        let htmlContent = pageCache[sectionName];

        if (!htmlContent) {
            // 캐시에 없으면 파일 요청
            // 주의: 로컬 파일 시스템(file://)에서는 CORS 에러 발생 가능. (Live Server 사용 권장)
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
 * 사이드바 프로필 데이터 로드
 */
function initBlogProfile() {
    // [TODO] 실제로는 URL의 사용자 ID 등을 통해 서버에서 블로그 주인 정보를 가져와야 함
    // 여기서는 로컬 스토리지(본인) 정보를 사용하는 예시
    
    const isLogged = localStorage.getItem("is_logged_in");
    const myNick = localStorage.getItem("user_nick") || "Guest";
    const myImg = localStorage.getItem("user_img");

    // 사이드바 요소 바인딩
    const nickEl = document.getElementById("blogNick");
    const bioEl = document.getElementById("blogBio");
    const imgEl = document.getElementById("blogProfileImg");
    const statPost = document.getElementById("statPost");
    
    // 더미 데이터 세팅
    if (nickEl) nickEl.textContent = myNick;
    if (bioEl) bioEl.textContent = "주식과 경제를 공부하며 기록하는 공간입니다."; // 더미 소개글
    if (imgEl) imgEl.src = myImg || "https://via.placeholder.com/150?text=User";
    if (statPost) statPost.textContent = "124"; // 더미 포스트 수

    // 본인 블로그 여부 확인 (간단 예시)
    // 실제로는 서버에서 isOwner 플래그를 받아 처리
    const isOwner = isLogged; // 지금은 로그인했으면 주인으로 간주 (테스트용)

    if (isOwner) {
        // 주인장용 버튼 표시
        document.getElementById("ownerActions").classList.remove("hidden");
        document.getElementById("visitorActions").classList.add("hidden");
        
        // 주인장용 메뉴 표시 (글쓰기 등)
        document.querySelectorAll(".owner-only").forEach(el => el.classList.remove("hidden"));
    } else {
        // 방문자용
        document.getElementById("ownerActions").classList.add("hidden");
        document.getElementById("visitorActions").classList.remove("hidden");
    }
}