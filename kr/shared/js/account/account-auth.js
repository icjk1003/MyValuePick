/* kr/shared/js/account/account-auth.js */

/**
 * [Account Auth Core Module]
 * 계정(로그인, 회원가입, 계정 찾기) 관련 공통 유효성 검사 및 데이터 통신(Mock)을 담당하는 모듈
 */
const AccountAuth = {
    // =========================================
    // 1. 유효성 검사 (Validation)
    // =========================================
    
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePassword: function(pw) {
        if (!pw) return false;
        return pw.length >= 8 && pw.length <= 64;
    },

    validateNickname: function(nick) {
        if (!nick) return false;
        return nick.length >= 2 && nick.length <= 10;
    },

    // =========================================
    // 2. 데이터 조회 및 API 통신 (현재는 Mock DB)
    // =========================================
    
    checkNicknameDuplicate: function(targetNick) {
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
    
    setMsg: function(element, text, type = '') {
        if (!element) return;
        element.textContent = text;
        
        if (text === '') {
            element.className = 'msg-mini';
        } else {
            element.className = `msg-mini ${type}`;
        }
    },

    // =========================================
    // 4. 보안 식별자 생성 (Security Identifier)
    // =========================================

    /**
     * NanoID 스타일의 무작위 고유 ID 생성 (12자)
     * 영문 대소문자와 숫자를 조합하여 외부 노출용으로 안전한 식별자를 만듭니다.
     * @returns {string} 고유 식별자 (UID)
     */
    generateUID: function() {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let id = '';
        for (let i = 0; i < 12; i++) {
            id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return id;
    }
};