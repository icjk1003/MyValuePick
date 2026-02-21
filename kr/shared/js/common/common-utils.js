/* =========================================
   [공통] 데이터 가공 및 포맷팅 유틸리티
   ========================================= */

/**
 * 1. 게시판 날짜 포맷팅 함수
 * @param {string} dateString - 날짜 문자열 (ISO 형식 등)
 * @param {boolean} full - true일 경우 '년-월-일 시:분' 포맷, false일 경우 상대 시간 또는 '년-월-일' 포맷 반환
 * @returns {string} 포맷팅된 날짜 문자열
 */
function formatBoardDate(dateString, full = false) {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000; // 초 단위 차이 계산

    // 상세 포맷이 아닐 경우 상대 시간(방금 전, n분 전, n시간 전) 반환
    if (!full) {
        if (diff < 60) return "방금 전";
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    }
    
    // 절대 시간 포맷팅 변수 준비
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, "0");
    
    // 시간/분까지 포함하는 전체 포맷 (예: 2023-10-01 14:30)
    if (full) {
        const hour = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${min}`;
    }
    
    // 기본 날짜 포맷 (예: 2023-10-01)
    return `${year}-${month}-${day}`;
}

/**
 * 2. 숫자 콤마 포맷팅 함수
 * @param {number|string} num - 포맷팅할 숫자
 * @returns {string} 천 단위 콤마가 추가된 문자열 (예: 1,234,567)
 */
function formatNumber(num) {
    // 숫자가 없을 경우 0으로 처리 후 locale 기준 문자열 변환
    return (num || 0).toLocaleString();
}

/**
 * 3. 유저 프로필 이미지 URL 생성기
 * @param {string} nickname - 유저 닉네임
 * @returns {string} 로컬 스토리지에 저장된 이미지 URL 또는 기본 아바타 생성 API URL
 */
function getProfileImage(nickname) {
    const myNick = localStorage.getItem("user_nick");
    const myCustomImg = localStorage.getItem("user_img");
    
    // 현재 로그인한 본인의 닉네임이고, 커스텀 이미지가 등록되어 있다면 해당 이미지 반환
    if (nickname === myNick && myCustomImg) {
        return myCustomImg;
    }
    
    // 커스텀 이미지가 없다면 닉네임을 기반으로 ui-avatars API를 사용해 기본 이미지 생성
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&length=2`;
}

// 외부 파일이나 인라인 이벤트 속성(onclick 등)에서 호출 가능하도록 전역 window 객체에 할당
window.getProfileImage = getProfileImage;