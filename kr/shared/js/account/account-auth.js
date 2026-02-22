/* kr/shared/js/account/account-auth.js */

/**
 * [Account Auth Core Module]
 * 계정(로그인, 회원가입, 접근 권한) 관련 공통 모듈
 */
const AccountAuth = {
    // [System] 최고 관리자 권한을 부여할 이메일 리스트
    ADMIN_EMAILS: [
        "icjk1003@gmail.com", // 사용자님의 마스터 계정
        "admin@valuepick.com"
    ],

    // [System] 결제 등급별 권한 레벨 (숫자가 클수록 상위 권한)
    TIER_LEVELS: {
        "free": 1,
        "pro": 2,
        "premium": 3
    },

    // =========================================
    // 1. 등급 기반 접근 제어 (Feature Gating)
    // =========================================
    
    /**
     * 특정 등급 이상의 권한이 있는지 확인하는 함수
     * @param {string} requiredTier 요구되는 최소 등급 ('free', 'pro', 'premium')
     * @returns {boolean} 접근 가능 여부
     */
    checkAccess: function(requiredTier) {
        const userRole = localStorage.getItem("user_role");
        const userTier = localStorage.getItem("user_tier") || "free";

        // 1. 관리자(admin)는 모든 결제 등급 제한을 무시하고 접근 가능 (Super Pass)
        if (userRole === "admin") {
            return true;
        }

        // 2. 현재 사용자의 등급과 요구 등급을 숫자로 변환하여 비교
        const currentLevel = this.TIER_LEVELS[userTier] || 1;
        const requiredLevel = this.TIER_LEVELS[requiredTier] || 1;

        return currentLevel >= requiredLevel;
    },

    // =========================================
    // 2. 유효성 검사 (Validation)
    // =========================================
    
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePassword: function(pw) {
        return pw && pw.length >= 8 && pw.length <= 64;
    },

    validateNickname: function(nick) {
        return nick && nick.length >= 2 && nick.length <= 10;
    },

    // =========================================
    // 3. 데이터 조회 및 API 통신 (Mock DB)
    // =========================================
    
    checkNicknameDuplicate: function(targetNick) {
        if (typeof MOCK_DB === 'undefined' || !MOCK_DB.POSTS) return false;
        
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
    // 4. UI 유틸리티
    // =========================================
    
    setMsg: function(element, text, type = '') {
        if (!element) return;
        element.textContent = text;
        element.className = text === '' ? 'msg-mini' : `msg-mini ${type}`;
    },

    // =========================================
    // 5. 보안 식별자 생성
    // =========================================

    generateID: function() {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let id = '';
        for (let i = 0; i < 12; i++) {
            id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return id;
    }
};