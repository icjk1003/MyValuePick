/**
 * [My Page Social Module]
 * 소셜 계정 연동(Google, Naver, Kakao, Apple)을 관리하는 모듈
 */
class MyPageSocialManager {
    constructor() {
        this.providers = ['google', 'naver', 'kakao', 'apple'];
        
        // DOM 요소 캐싱
        this.container = document.getElementById("section-social");
        
        // 초기화
        if (this.container) {
            this.init();
        }
    }

    init() {
        this.loadInitialState();
        this.bindEvents();
    }

    /**
     * 로컬 스토리지에서 상태를 읽어와 UI 업데이트
     */
    loadInitialState() {
        this.providers.forEach(provider => {
            const isLinked = localStorage.getItem(`social_link_${provider}`) === 'true';
            this.updateUI(provider, isLinked);
        });
    }

    /**
     * 이벤트 리스너 바인딩 (이벤트 위임 사용 권장하지만, 요소가 적으므로 직접 바인딩)
     */
    bindEvents() {
        const toggles = this.container.querySelectorAll('.social-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const provider = e.target.dataset.provider;
                const isChecked = e.target.checked;
                this.handleToggle(provider, isChecked, e.target);
            });
        });
    }

    /**
     * 토글 변경 핸들러
     * @param {string} provider - 제공자 (google, naver...)
     * @param {boolean} isChecked - 변경된 체크 상태
     * @param {HTMLElement} toggleEl - 토글 인풋 엘리먼트 (취소 시 원복용)
     */
    handleToggle(provider, isChecked, toggleEl) {
        if (isChecked) {
            // [Case 1] 연동 시도 (ON)
            // 실제 환경에서는 OAuth 로그인 팝업 등을 띄워야 함
            localStorage.setItem(`social_link_${provider}`, 'true');
            this.updateUI(provider, true);
            // alert(`${provider} 계정이 연동되었습니다.`);
        } else {
            // [Case 2] 연동 해제 시도 (OFF)
            if (confirm(`${provider} 연동을 해제하시겠습니까?`)) {
                localStorage.setItem(`social_link_${provider}`, 'false');
                this.updateUI(provider, false);
            } else {
                // 취소 시 토글 상태 원복
                toggleEl.checked = true;
                // UI는 변경 없음 (이미 켜져 있던 상태)
            }
        }
    }

    /**
     * UI 업데이트 (텍스트 및 스타일)
     */
    updateUI(provider, isLinked) {
        // 토글 스위치 상태 동기화
        const toggleEl = this.container.querySelector(`.social-toggle[data-provider="${provider}"]`);
        if (toggleEl) {
            toggleEl.checked = isLinked;
        }

        // 상태 텍스트 업데이트
        const statusEl = document.getElementById(`status-${provider}`);
        if (statusEl) {
            if (isLinked) {
                statusEl.textContent = "연동 완료";
                statusEl.classList.add("active");
            } else {
                statusEl.textContent = "연동 안됨";
                statusEl.classList.remove("active");
            }
        }
    }
}

// [모듈 실행]
// 전역 인스턴스 할당 (mypage.js에서 탭 전환 시 호출하거나, 자동 초기화됨)
window.MyPageSocialManager = new MyPageSocialManager();