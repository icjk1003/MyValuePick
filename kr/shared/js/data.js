/* shared/js/data.js */

// =========================================
// 1. Mock Database (데이터베이스)
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

// 게시글 및 일정 데이터 저장소
const MOCK_DB = {
  POSTS: [], 
  EVENTS: [
    { date: "2026-02-04", title: "메타(META) 실적발표", type: "실적" },
    { date: "2026-02-06", title: "미국 고용보고서", type: "거시" },
    { date: "2026-02-12", title: "옵션 만기일", type: "일정" },
    { date: "2026-02-14", title: "CPI 소비자물가지수", type: "거시" },
    { date: "2026-02-25", title: "엔비디아 실적발표", type: "실적" },
  ]
};

// [초기화] 데이터 로드 (버전 업그레이드: V2)
(function initData() {
  const storedPosts = localStorage.getItem("MOCK_POSTS_V2");

  if (storedPosts) {
    MOCK_DB.POSTS = JSON.parse(storedPosts);
  } else {
    generateAndSavePosts();
  }
})();

// [함수] 게시글 생성 및 저장 (날짜 최신순 정렬 보완)
function generateAndSavePosts() {
  const tags = ["실적", "거시", "분석", "잡담", "정보", "질문", "유머"];
  const titles = [
    "엔비디아 주가 분석 및 전망", "삼성전자 배당 정책", "오늘 미장 분위기",
    "FOMC 금리 결정 시나리오", "테슬라 옵션 거래량 급증", "배당주 포트폴리오 조언",
    "환율 1400원 돌파 가능성", "2차전지 관련주 옥석 가리기", "비트코인 반감기 영향",
    "초보 투자자 질문있습니다", "애플 신제품 루머 정리"
  ];
  
  const tempPosts = []; // 정렬을 위한 임시 배열

  // 600개 생성
  for (let i = 1; i <= 600; i++) {
    const isAnon = Math.random() < 0.3;
    const votes = Math.floor(Math.random() * 300);
    const commentsCount = Math.floor(Math.random() * 30);
    
    // [날짜 생성 로직 수정] 
    // i가 커질수록 더 과거의 시간이 되도록 설정하여 자연스러운 흐름 생성
    const d = new Date();
    // 1번 글은 현재로부터 약 5분 전, 600번 글은 훨씬 과거가 됨
    d.setMinutes(d.getMinutes() - (i * 10) - Math.floor(Math.random() * 10)); 
    const dateStr = d.toISOString(); 

    // 댓글 데이터 생성
    const commentList = Array.from({ length: commentsCount }).map((__, j) => {
      const isBest = Math.random() > 0.9;
      return {
        id: j,
        writer: j % 3 === 0 ? "익명" : `유동닉${j}`,
        content: `정말 좋은 글이네요! 주식 정보 감사합니다. ${j+1}번째 댓글입니다.`,
        date: new Date(new Date(dateStr).getTime() + (j * 60000)).toISOString(), // 게시글 이후 시간에 작성됨
        votes: isBest ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 10),
        isBest: isBest,
        profileImg: j % 3 === 0 ? null : `https://ui-avatars.com/api/?name=User+${j}&background=random&color=fff`
      };
    }).sort((a, b) => b.isBest - a.isBest);

    tempPosts.push({
      no: 10000 + (601 - i), // 번호는 최신순으로 부여
      id: 10000 + (601 - i),
      tag: tags[i % tags.length], 
      title: titles[i % titles.length] + ` (${601 - i})`, 
      writer: isAnon ? "익명" : `StockMaster_${i}`, 
      writerImg: isAnon ? null : `https://ui-avatars.com/api/?name=Stock+Master+${i}&background=random&color=fff`,
      isAnonymous: isAnon,
      body: `이 글은 ${10000 + (601 - i)}번 게시글의 본문입니다.\n\n주식 투자는 본인의 선택이며 책임입니다.`, 
      votes: votes,
      views: Math.floor(Math.random() * 5000),
      comments: commentsCount,
      commentList: commentList,
      date: dateStr 
    });
  }

  // [핵심] 날짜 기준 내림차순 정렬 (최신순이 배열의 0번으로)
  tempPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  MOCK_DB.POSTS = tempPosts;
  localStorage.setItem("MOCK_POSTS_V2", JSON.stringify(MOCK_DB.POSTS));
}