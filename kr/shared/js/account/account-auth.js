/* kr/shared/js/account/account-auth.js */

/**
 * [Account Auth Core Module]
 * 계정(로그인, 회원가입, 계정 찾기) 관련 공통 유효성 검사 및 데이터 통신(Mock)을 담당하는 모듈
 */
const AccountAuth = {
    // =========================================
    // 1. 유효성 검사 (Validation)
    // =========================================
    
    /**
     * 이메일 형식 정규식 검사
     * @param {string} email 
     * @returns {boolean} 유효 여부
     */
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * 비밀번호 보안 규격 검사 (8자 이상, 64자 이하)
     * @param {string} pw 
     * @returns {boolean} 유효 여부
     */
    validatePassword: function(pw) {
        if (!pw) return false;
        return pw.length >= 8 && pw.length <= 64;
    },

    /**
     * 닉네임 길이 검사 (2자 이상, 10자 이하)
     * @param {string} nick 
     * @returns {boolean} 유효 여부
     */
    validateNickname: function(nick) {
        if (!nick) return false;
        return nick.length >= 2 && nick.length <= 10;
    },

    // =========================================
    // 2. 데이터 조회 및 API 통신 (현재는 Mock DB)
    // =========================================
    
    /**
     * 닉네임 중복 검사 (Mock DB 기반)
     * @param {string} targetNick 
     * @returns {boolean} 중복 여부 (true: 중복됨, false: 사용 가능)
     */
    checkNicknameDuplicate: function(targetNick) {
        // 데이터 파일(data.js)의 MOCK_DB가 로드되어 있는지 확인
        if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) {
            console.warn("MOCK_DB가 로드되지 않았습니다. 중복 검사를 통과 처리합니다.");
            return false;
        }
        
        const allWriters = new Set();
        MOCK_DB.POSTS.forEach(p => {
            allWriters.add(p.writer);
            if (p.commentList) {
                p.commentList.forEach(c => allWriters.add(c.writer));
            }
        });
        
        return allWriters.has(targetNick);
    },

    // =========================================
    // 3. UI 유틸리티 (메시지 표시 공통화)
    // =========================================
    
    /**
     * 입력 폼 하단의 안내 메시지 UI 상태 변경 (에러/성공 색상 처리)
     * @param {HTMLElement} element 메시지를 표시할 DOM 요소
     * @param {string} text 표시할 텍스트
     * @param {string} type 'success' | 'error' | 'info' | ''
     */
    setMsg: function(element, text, type = '') {
        if (!element) return;
        element.textContent = text;
        
        if (text === '') {
            element.className = 'msg-mini';
        } else {
            element.className = `msg-mini ${type}`;
        }
    }
};