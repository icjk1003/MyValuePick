/* kr/shared/js/data.js */

/**
 * [Expert Web Developer & Architect Guidelines] 적용
 * 분석 결과: DB_API가 선언되기 전에 initData가 실행되어 발생하는 참조 오류(ReferenceError) 확인.
 * 조치 사항: 1. STOCK_DB 및 MOCK_DB 선언 -> 2. DB_API 정의 및 전역 등록 -> 3. 초기화(initData) 실행 순으로 구조 재배치.
 * 로직 보존: 사용자 제공 600개 게시글 생성 로직 및 모든 테이블 스키마 100% 유지.
 */

// =========================================
// 1. Mock Database (로컬 데이터베이스 테이블 구조)
// =========================================

// [검색용] 주식 종목 데이터
const STOCK_DB = [
    { name: "삼성전자", enName: "Samsung Electronics", ticker: "005930", exch: "KOSPI" },
    { name: "SK하이닉스", enName: "SK Hynix", ticker: "000660", exch: "KOSPI" },
    { name: "LG에너지솔루션", enName: "LG Energy Solution", ticker: "373220", exch: "KOSPI" },
    { name: "NAVER", enName: "NAVER", ticker: "035420", exch: "KOSPI" },
    { name: "카카오", enName: "Kakao", ticker: "035720", exch: "KOSPI" },
    { name: "애플", enName: "Apple Inc.", ticker: "AAPL", exch: "NASDAQ" },
    { name: "테슬라", enName: "Tesla Inc.", ticker: "TSLA", exch: "NASDAQ" },
    { name: "엔비디아", enName: "NVIDIA Corp.", ticker: "NVDA", exch: "NASDAQ" },
    { name: "TQQQ", enName: "ProShares UltraPro QQQ", ticker: "TQQQ", exch: "NASDAQ" },
    { name: "QQQ", enName: "Invesco QQQ", ticker: "QQQ", exch: "NASDAQ" },
    { name: "SPY", enName: "SPDR S&P 500", ticker: "SPY", exch: "AMEX" },
];

// 통합 데이터베이스 저장소
let MOCK_DB = {
    USERS: [],         // 회원 정보 테이블
    POSTS: [],         // 게시글 및 댓글 테이블
    EVENTS: [          // 증시 일정 테이블
        { date: "2026-02-04", title: "메타(META) 실적발표", type: "실적" },
        { date: "2026-02-06", title: "미국 고용보고서", type: "거시" },
        { date: "2026-02-12", title: "옵션 만기일", type: "일정" },
        { date: "2026-02-14", title: "CPI 소비자물가지수", type: "거시" },
        { date: "2026-02-25", title: "엔비디아 실적발표", type: "실적" },
    ],
    SCRAPS: [],        // 스크랩 테이블
    SUBSCRIPTIONS: [], // 구독 테이블
    NOTES: []          // 쪽지 테이블
};

// =========================================
// 2. Mock API Layer (비동기 데이터 접근 계층)
// =========================================

// 다른 파일에서 접근 가능하도록 window 객체에 할당
window.DB_API = {
    /** 공통: 로컬스토리지 강제 동기화 (버전을 V6로 올려 새 데이터 강제 적용) */
    _commit: function() {
        localStorage.setItem("MOCK_DB_V6", JSON.stringify(MOCK_DB));
    },
    
    /** 공통: 네트워크 지연 시뮬레이션 */
    _delay: (ms = 150) => new Promise(resolve => setTimeout(resolve, ms)),

    // [A] 회원/인증 (Auth & Users)
    login: async function(email, password) {
        console.log("Login Start!!!!"); 
        await this._delay();
        const user = MOCK_DB.USERS.find(u => u.email === email && u.password === password);
        if (!user) throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
        // 로그인 성공 시 권한(role)도 함께 반환
        return { id: user.id, email: user.email, nickname: user.nickname, profileImg: user.profileImg, role: user.role };
    },

    register: async function(userData) {
        await this._delay();
        const exists = MOCK_DB.USERS.some(u => u.email === userData.email);
        if (exists) throw new Error("이미 가입된 이메일입니다.");
        
        const newUser = {
            id: "user_" + Math.random().toString(36).substring(2, 10), // 난수 아이디 발급
            email: userData.email,
            password: userData.password,
            nickname: userData.nickname || "신규유저",
            profileImg: null,
            bio: "",
            role: "user", // 기본 가입은 일반 유저
            createdAt: new Date().toISOString()
        };
        MOCK_DB.USERS.push(newUser);
        this._commit();
        return newUser;
    },

    getUserProfile: async function(userId) {
        await this._delay();
        const user = MOCK_DB.USERS.find(u => u.id === userId);
        if (!user) throw new Error("존재하지 않는 회원입니다.");
        const { password, ...safeUser } = user;
        return safeUser;
    },

    updateUserProfile: async function(userId, updateData) {
        await this._delay();
        const index = MOCK_DB.USERS.findIndex(u => u.id === userId);
        if (index === -1) throw new Error("회원 정보를 찾을 수 없습니다.");
        MOCK_DB.USERS[index] = { ...MOCK_DB.USERS[index], ...updateData };
        this._commit();
        return true;
    },

    // [B] 게시글 (Posts)
    getPosts: async function(options = {}) {
        await this._delay();
        return [...MOCK_DB.POSTS]; 
    },

    getTrendingPosts: async function(limit = 5) {
        await this._delay();
        return [...MOCK_DB.POSTS]
            .sort((a, b) => (b.views + b.votes * 10) - (a.views + a.votes * 10))
            .slice(0, limit);
    },

    getPostById: async function(postId) {
        await this._delay();
        const post = MOCK_DB.POSTS.find(p => p.id === Number(postId) || p.no === Number(postId));
        if (!post) throw new Error("게시글을 찾을 수 없습니다.");
        post.views += 1;
        this._commit();
        return post;
    },

    createPost: async function(postData) {
        await this._delay();
        const newId = MOCK_DB.POSTS.length > 0 ? Math.max(...MOCK_DB.POSTS.map(p => p.id)) + 1 : 10000;
        const newPost = {
            no: newId, id: newId, views: 0, votes: 0, comments: 0, commentList: [],
            date: new Date().toISOString(), ...postData
        };
        MOCK_DB.POSTS.unshift(newPost);
        this._commit();
        return newId;
    },

    deletePost: async function(postId, userIdOrPassword) {
        await this._delay();
        const index = MOCK_DB.POSTS.findIndex(p => p.id === Number(postId));
        if (index === -1) throw new Error("게시글이 존재하지 않습니다.");
        
        const post = MOCK_DB.POSTS[index];
        if (post.isAnonymous && post.password !== userIdOrPassword) {
            throw new Error("비밀번호가 일치하지 않습니다.");
        } else if (!post.isAnonymous && post.writerId !== userIdOrPassword) {
            throw new Error("삭제 권한이 없습니다.");
        }

        MOCK_DB.POSTS.splice(index, 1);
        this._commit();
        return true;
    },

    togglePostVote: async function(postId, userId) {
        await this._delay();
        const post = MOCK_DB.POSTS.find(p => p.id === Number(postId));
        if (!post) throw new Error("게시글을 찾을 수 없습니다.");
        post.votes += 1;
        this._commit();
        return post.votes;
    },

    // [C] 댓글 (Comments)
    addComment: async function(postId, commentData) {
        await this._delay();
        const post = MOCK_DB.POSTS.find(p => p.id === Number(postId));
        if (!post) throw new Error("게시글을 찾을 수 없습니다.");
        
        const nextCommentId = post.commentList.length > 0 ? Math.max(...post.commentList.map(c => c.id)) + 1 : 1;
        const newComment = {
            id: nextCommentId, date: new Date().toISOString(),
            votes: 0, isBest: false, ...commentData
        };

        post.commentList.push(newComment);
        post.comments += 1;
        this._commit();
        return newComment;
    },

    deleteComment: async function(postId, commentId, userIdOrPassword) {
        await this._delay();
        const post = MOCK_DB.POSTS.find(p => p.id === Number(postId));
        if (!post) throw new Error("게시글을 찾을 수 없습니다.");

        const cmtIndex = post.commentList.findIndex(c => c.id === Number(commentId));
        if (cmtIndex === -1) throw new Error("댓글을 찾을 수 없습니다.");
        
        post.commentList.splice(cmtIndex, 1);
        post.comments -= 1;
        this._commit();
        return true;
    },

    // [D] 마이페이지 / 소셜 기능 (Scrap, Sub, Notes)
    toggleScrap: async function(userId, postId) {
        await this._delay();
        const index = MOCK_DB.SCRAPS.findIndex(s => s.userId === userId && s.postId === Number(postId));
        let isScrapped = false;
        
        if (index > -1) {
            MOCK_DB.SCRAPS.splice(index, 1);
        } else {
            MOCK_DB.SCRAPS.push({ userId, postId: Number(postId), date: new Date().toISOString() });
            isScrapped = true;
        }
        this._commit();
        return isScrapped;
    },

    toggleSubscription: async function(followerId, targetId) {
        await this._delay();
        const index = MOCK_DB.SUBSCRIPTIONS.findIndex(s => s.followerId === followerId && s.targetId === targetId);
        let isSubscribed = false;

        if (index > -1) {
            MOCK_DB.SUBSCRIPTIONS.splice(index, 1);
        } else {
            MOCK_DB.SUBSCRIPTIONS.push({ followerId, targetId, date: new Date().toISOString() });
            isSubscribed = true;
        }
        this._commit();
        return isSubscribed;
    },

    sendNote: async function(senderId, receiverId, content) {
        await this._delay();
        const newNote = {
            id: Date.now(), senderId, receiverId, content,
            isRead: false, date: new Date().toISOString()
        };
        MOCK_DB.NOTES.push(newNote);
        this._commit();
        return newNote;
    },

    getEvents: async function() {
        await this._delay(100);
        return [...MOCK_DB.EVENTS];
    }
};

// =========================================
// 3. Helper Functions (내부 동작 함수)
// =========================================

function generateAndSaveMockData() {
    // 1. 최고 관리자 및 더미 유저 생성
    const masterAdminId = "admin_" + Math.random().toString(36).substring(2, 10); // 난수 생성
    
    MOCK_DB.USERS = [
        // 🔥 사용자가 요청한 최고 관리자 계정 하드코딩 (이메일, 비번, 권한 부여)
        { 
            id: masterAdminId, 
            email: "icjk1003@gmail.com", 
            password: "123123123", 
            nickname: "마스터", 
            profileImg: null, 
            bio: "최고 관리자 계정입니다.", 
            role: "admin",
            createdAt: new Date().toISOString()
        },
        { 
            id: "mock_admin", 
            email: "admin@test.com", 
            password: "123", 
            nickname: "관리자", 
            profileImg: null, 
            bio: "일반 관리자 계정입니다.", 
            role: "admin",
            createdAt: new Date().toISOString()
        },
        { 
            id: "mock_user_1", 
            email: "user1@test.com", 
            password: "123", 
            nickname: "StockMaster_1", 
            profileImg: null, 
            bio: "가치투자를 지향합니다.", 
            role: "user",
            createdAt: new Date().toISOString()
        }
    ];

    // 2. 더미 게시글 생성 (600개)
    const tags = ["실적", "거시", "분석", "잡담", "정보", "질문", "유머"];
    const titles = ["엔비디아 주가 분석", "삼성전자 배당 정책", "오늘 미장 분위기", "FOMC 시나리오", "테슬라 옵션", "배당주 포트폴리오"];
    
    const tempPosts = [];
    for (let i = 1; i <= 600; i++) {
        const isAnon = Math.random() < 0.3; 
        const commentsCount = Math.floor(Math.random() * 10);
        const d = new Date();
        d.setMinutes(d.getMinutes() - (i * 10) - Math.floor(Math.random() * 10)); 
        const dateStr = d.toISOString(); 

        const commentList = Array.from({ length: commentsCount }).map((__, j) => {
            const isCmtAnon = j % 3 === 0;
            return {
                id: j,
                writer: isCmtAnon ? "익명" : `유동닉${j}`,
                userId: isCmtAnon ? null : `user_comment_${j}`, 
                content: `정말 좋은 글이네요! ${j+1}번째 댓글입니다.`,
                date: new Date(new Date(dateStr).getTime() + (j * 60000)).toISOString(),
                votes: Math.floor(Math.random() * 10),
                isBest: Math.random() > 0.9,
            };
        });

        tempPosts.push({
            no: 10000 + (601 - i),
            id: 10000 + (601 - i),
            tag: tags[i % tags.length], 
            title: titles[i % titles.length] + ` (${601 - i})`, 
            writer: isAnon ? "익명" : `StockMaster_${i}`, 
            writerId: isAnon ? null : (i === 1 ? "mock_user_1" : `mock_user_${i}`),
            password: isAnon ? "1234" : null,
            writerImg: isAnon ? null : `https://ui-avatars.com/api/?name=User+${i}&background=random&color=fff`,
            writerBio: isAnon ? null : "MOCK 데이터 생성 유저",
            isAnonymous: isAnon,
            body: `이 글은 ${10000 + (601 - i)}번 게시글의 본문입니다.`, 
            votes: Math.floor(Math.random() * 300),
            views: Math.floor(Math.random() * 5000),
            comments: commentsCount,
            commentList: commentList,
            date: dateStr 
        });
    }

    tempPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    MOCK_DB.POSTS = tempPosts;
    
    DB_API._commit();
    console.log("MOCK_DB: 데이터 새로 생성 완료 (V6 - 관리자 계정 추가됨)");
}

// =========================================
// 4. Initialization (초기화 실행부)
// =========================================

// 중요: 모든 객체와 함수가 선언된 후 마지막에 실행하여 ReferenceError 방지
(function initData() {
    // V6로 버전을 올려 기존 잔여 데이터를 덮어씌움
    const storedDB = localStorage.getItem("MOCK_DB_V6"); 
    
    if (storedDB) {
        try {
            MOCK_DB = JSON.parse(storedDB);
            console.log("MOCK_DB: 데이터 로드 완료 (V6)");
        } catch (e) {
            console.error("데이터 파싱 오류", e);
            generateAndSaveMockData();
        }
    } else {
        generateAndSaveMockData();
    }
})();