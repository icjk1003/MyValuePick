/* shared/js/data.js */

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

// 통합 데이터베이스 저장소 (RDBMS의 테이블 또는 NoSQL의 컬렉션 역할)
let MOCK_DB = {
  USERS: [],         // 회원 정보 테이블
  POSTS: [],         // 게시글 및 댓글(서브컬렉션) 테이블
  EVENTS: [          // 증시 일정 테이블
    { date: "2026-02-04", title: "메타(META) 실적발표", type: "실적" },
    { date: "2026-02-06", title: "미국 고용보고서", type: "거시" },
    { date: "2026-02-12", title: "옵션 만기일", type: "일정" },
    { date: "2026-02-14", title: "CPI 소비자물가지수", type: "거시" },
    { date: "2026-02-25", title: "엔비디아 실적발표", type: "실적" },
  ],
  SCRAPS: [],        // 스크랩(북마크) 테이블 { userId, postId, date }
  SUBSCRIPTIONS: [], // 구독(팔로우) 테이블 { followerId, targetId, date }
  NOTES: []          // 쪽지 테이블 { id, senderId, receiverId, content, date, isRead }
};

// [초기화] 전체 DB 로드 및 V5 업데이트 
(function initData() {
  const storedDB = localStorage.getItem("MOCK_DB_V5"); 
  
  if (storedDB) {
    try {
      MOCK_DB = JSON.parse(storedDB);
      console.log("MOCK_DB: 데이터 로드 완료 (V5)");
    } catch (e) {
      console.error("데이터 파싱 오류", e);
      generateAndSaveMockData();
    }
  } else {
    // V5 데이터가 없으면 새로 생성
    generateAndSaveMockData();
  }
})();

// [함수] 초기 더미 데이터 생성 (유저, 게시글 등)
function generateAndSaveMockData() {
  // 1. 더미 유저 생성
  MOCK_DB.USERS = [
    { id: "mock_admin", email: "admin@test.com", password: "123", nickname: "관리자", profileImg: null, bio: "관리자 계정입니다." },
    { id: "mock_user_1", email: "user1@test.com", password: "123", nickname: "StockMaster_1", profileImg: null, bio: "가치투자를 지향합니다." }
  ];

  // 2. 더미 게시글 생성
  const tags = ["실적", "거시", "분석", "잡담", "정보", "질문", "유머"];
  const titles = [
    "엔비디아 주가 분석 및 전망", "삼성전자 배당 정책", "오늘 미장 분위기",
    "FOMC 금리 결정 시나리오", "테슬라 옵션 거래량 급증", "배당주 포트폴리오 조언"
  ];
  
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
    }).sort((a, b) => b.isBest - a.isBest);

    tempPosts.push({
      no: 10000 + (601 - i),
      id: 10000 + (601 - i),
      tag: tags[i % tags.length], 
      title: titles[i % titles.length] + ` (${601 - i})`, 
      writer: isAnon ? "익명" : `StockMaster_${i}`, 
      writerId: isAnon ? null : (i === 1 ? "mock_user_1" : `mock_user_${i}`), // 1번 유저는 고정 테스트 유저
      password: isAnon ? "1234" : null,
      writerImg: isAnon ? null : `https://ui-avatars.com/api/?name=User+${i}&background=random&color=fff`,
      writerBio: isAnon ? null : "MOCK 데이터 생성 유저",
      isAnonymous: isAnon,
      body: `이 글은 ${10000 + (601 - i)}번 게시글의 본문입니다.\n\n주식 투자는 본인의 선택이며 책임입니다.`, 
      votes: Math.floor(Math.random() * 300),
      views: Math.floor(Math.random() * 5000),
      comments: commentsCount,
      commentList: commentList,
      date: dateStr 
    });
  }

  tempPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  MOCK_DB.POSTS = tempPosts;
  
  // V5 통째로 로컬스토리지 저장
  localStorage.setItem("MOCK_DB_V5", JSON.stringify(MOCK_DB));
  console.log("MOCK_DB: 데이터 새로 생성 완료 (V5)");
}


// =========================================
// 2. Mock API Layer (비동기 데이터 접근 계층 - 실제 DB 연동 위치)
// =========================================
const DB_API = {
  /** 공통: 로컬스토리지 강제 동기화 (Mock 전용) */
  _commit: function() {
    localStorage.setItem("MOCK_DB_V5", JSON.stringify(MOCK_DB));
  },
  
  /** 공통: 네트워크 지연 시뮬레이션 */
  _delay: (ms = 150) => new Promise(resolve => setTimeout(resolve, ms)),

  // -----------------------------------------
  // [A] 회원/인증 (Auth & Users)
  // -----------------------------------------
  
  /** 로그인 처리 */
  login: async function(email, password) {
    await this._delay();
    const user = MOCK_DB.USERS.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    return { id: user.id, email: user.email, nickname: user.nickname, profileImg: user.profileImg };
  },

  /** 회원가입 처리 */
  register: async function(userData) {
    await this._delay();
    const exists = MOCK_DB.USERS.some(u => u.email === userData.email);
    if (exists) throw new Error("이미 가입된 이메일입니다.");
    
    const newUser = {
      id: "user_" + Date.now(),
      email: userData.email,
      password: userData.password,
      nickname: userData.nickname || "신규유저",
      profileImg: null,
      bio: "",
      createdAt: new Date().toISOString()
    };
    MOCK_DB.USERS.push(newUser);
    this._commit();
    return newUser;
  },

  /** 회원 정보 조회 */
  getUserProfile: async function(userId) {
    await this._delay();
    const user = MOCK_DB.USERS.find(u => u.id === userId);
    if (!user) throw new Error("존재하지 않는 회원입니다.");
    // 비밀번호 제외하고 반환
    const { password, ...safeUser } = user;
    return safeUser;
  },

  /** 회원 정보 수정 */
  updateUserProfile: async function(userId, updateData) {
    await this._delay();
    const index = MOCK_DB.USERS.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("회원 정보를 찾을 수 없습니다.");
    MOCK_DB.USERS[index] = { ...MOCK_DB.USERS[index], ...updateData };
    this._commit();
    return true;
  },

  // -----------------------------------------
  // [B] 게시글 (Posts)
  // -----------------------------------------

  /** 전체 게시글 목록 가져오기 (페이지네이션, 검색어, 태그 필터 적용 가능) */
  getPosts: async function(options = {}) {
    await this._delay();
    let results = [...MOCK_DB.POSTS];
    // TODO: options 파라미터를 통해 검색어, 태그 필터링 로직 구현 가능
    return results; 
  },

  /** 인기 게시글 가져오기 */
  getTrendingPosts: async function(limit = 5) {
    await this._delay();
    return [...MOCK_DB.POSTS]
      .sort((a, b) => (b.views + b.votes * 10) - (a.views + a.votes * 10))
      .slice(0, limit);
  },

  /** 게시글 상세 조회 (조회수 1 증가 포함) */
  getPostById: async function(postId) {
    await this._delay();
    const post = MOCK_DB.POSTS.find(p => p.id === Number(postId) || p.no === Number(postId));
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");
    post.views += 1;
    this._commit();
    return post;
  },

  /** 새 게시글 작성 */
  createPost: async function(postData) {
    await this._delay();
    const newId = MOCK_DB.POSTS.length > 0 ? Math.max(...MOCK_DB.POSTS.map(p => p.id)) + 1 : 10000;
    const newPost = {
      no: newId,
      id: newId,
      views: 0,
      votes: 0,
      comments: 0,
      commentList: [],
      date: new Date().toISOString(),
      ...postData
    };
    MOCK_DB.POSTS.unshift(newPost); // 최신글 맨 앞으로
    this._commit();
    return newId;
  },

  /** 게시글 삭제 */
  deletePost: async function(postId, userIdOrPassword) {
    await this._delay();
    const index = MOCK_DB.POSTS.findIndex(p => p.id === Number(postId));
    if (index === -1) throw new Error("게시글이 존재하지 않습니다.");
    
    // 권한 체크 로직 (익명은 비번 확인, 회원은 userId 확인)
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

  /** 게시글 추천(좋아요) 토글 */
  togglePostVote: async function(postId, userId) {
    await this._delay();
    const post = MOCK_DB.POSTS.find(p => p.id === Number(postId));
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");
    // 실제 DB에선 중복 추천 방지 테이블(VOTES)을 구성하지만 Mock에선 단순히 +1 처리
    post.votes += 1;
    this._commit();
    return post.votes;
  },

  // -----------------------------------------
  // [C] 댓글 (Comments)
  // -----------------------------------------

  /** 새 댓글 작성 */
  addComment: async function(postId, commentData) {
    await this._delay();
    const post = MOCK_DB.POSTS.find(p => p.id === Number(postId));
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");
    
    const nextCommentId = post.commentList.length > 0 ? Math.max(...post.commentList.map(c => c.id)) + 1 : 1;
    const newComment = {
      id: nextCommentId,
      date: new Date().toISOString(),
      votes: 0,
      isBest: false,
      ...commentData
    };

    post.commentList.push(newComment);
    post.comments += 1;
    this._commit();
    return newComment;
  },

  /** 댓글 삭제 */
  deleteComment: async function(postId, commentId, userIdOrPassword) {
    await this._delay();
    const post = MOCK_DB.POSTS.find(p => p.id === Number(postId));
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");

    const cmtIndex = post.commentList.findIndex(c => c.id === Number(commentId));
    if (cmtIndex === -1) throw new Error("댓글을 찾을 수 없습니다.");
    
    // TODO: 권한 체크 로직 추가 필요
    post.commentList.splice(cmtIndex, 1);
    post.comments -= 1;
    this._commit();
    return true;
  },

  // -----------------------------------------
  // [D] 마이페이지 / 소셜 기능 (Scrap, Sub, Notes)
  // -----------------------------------------

  /** 글 스크랩 (북마크) 토글 */
  toggleScrap: async function(userId, postId) {
    await this._delay();
    const index = MOCK_DB.SCRAPS.findIndex(s => s.userId === userId && s.postId === Number(postId));
    let isScrapped = false;
    
    if (index > -1) {
      MOCK_DB.SCRAPS.splice(index, 1); // 스크랩 해제
    } else {
      MOCK_DB.SCRAPS.push({ userId, postId: Number(postId), date: new Date().toISOString() });
      isScrapped = true; // 스크랩 추가
    }
    this._commit();
    return isScrapped;
  },

  /** 특정 유저 구독(팔로우) 토글 */
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

  /** 쪽지 보내기 */
  sendNote: async function(senderId, receiverId, content) {
    await this._delay();
    const newNote = {
      id: Date.now(),
      senderId,
      receiverId,
      content,
      isRead: false,
      date: new Date().toISOString()
    };
    MOCK_DB.NOTES.push(newNote);
    this._commit();
    return newNote;
  },

  // -----------------------------------------
  // [E] 기타 유틸 (Events)
  // -----------------------------------------
  
  /** 캘린더 일정 조회 */
  getEvents: async function() {
    await this._delay(100);
    return [...MOCK_DB.EVENTS];
  }
};