/* kr/shared/js/mypage/mypage-social.js */

/**
 * [My Page Social Module]
 * 소셜 계정 연동(Google, Naver, Kakao, Apple)을 관리하는 모듈 (비동기 DB_API 연동 완료)
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

    async init() {
        await this.loadInitialState();
        this.bindEvents();
    }

    /**
     * [변경] 비동기 API 통신을 통해 최신 소셜 연동 상태 불러오기
     */
    async loadInitialState() {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        try {
            // DB에서 최신 사용자 정보 호출
            const user = await DB_API.getUserProfile(userId);
            
            // 서버에 저장된 상태 확인 (없으면 로컬스토리지 값으로 폴백)
            this.providers.forEach(provider => {
                let isLinked = user[`social_${provider}`]; 
                
                if (isLinked === undefined) {
                    isLinked = localStorage.getItem(`social_link_${provider}`) === 'true';
                }
                
                this.updateUI(provider, isLinked);
            });
        } catch (error) {
            console.error("소셜 연동 상태 로드 실패:", error);
            
            // 네트워크 오류 시 기존 로컬 스토리지 기반으로 렌더링
            this.providers.forEach(provider => {
                const isLinked = localStorage.getItem(`social_link_${provider}`) === 'true';
                this.updateUI(provider, isLinked);
            });
        }
    }

    /**
     * 이벤트 리스너 바인딩
     */
    bindEvents() {
        const toggles = this.container.querySelectorAll('.social-toggle');
        
        toggles.forEach(toggle => {
            // [변경] 콜백 함수에 async 적용
            toggle.addEventListener('change', async (e) => {
                const provider = e.target.dataset.provider;
                const isChecked = e.target.checked;
                await this.handleToggle(provider, isChecked, e.target);
            });
        });
    }

    /**
     * [변경] 비동기 DB 업데이트를 포함한 토글 변경 핸들러
     * @param {string} provider - 제공자 (google, naver...)
     * @param {boolean} isChecked - 변경된 체크 상태
     * @param {HTMLElement} toggleEl - 토글 인풋 엘리먼트 (제어 및 원복용)
     */
    async handleToggle(provider, isChecked, toggleEl) {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        // 통신 중 중복 클릭 방지 (비활성화)
        toggleEl.disabled = true;

        try {
            if (isChecked) {
                // [Case 1] 연동 시도 (ON)
                // 실제 환경에서는 OAuth 팝업을 띄우고 성공 시 백엔드 콜백을 통해 DB가 갱신됩니다.
                
                // DB 연동 상태 업데이트 
                await DB_API.updateUserProfile(userId, { 
                    [`social_${provider}`]: true 
                });

                localStorage.setItem(`social_link_${provider}`, 'true');
                this.updateUI(provider, true);
                
                // alert(`${provider.toUpperCase()} 계정이 성공적으로 연동되었습니다.`);
            } else {
                // [Case 2] 연동 해제 시도 (OFF)
                if (confirm(`${provider.toUpperCase()} 연동을 정말 해제하시겠습니까?`)) {
                    
                    // DB 연동 상태 해제 업데이트
                    await DB_API.updateUserProfile(userId, { 
                        [`social_${provider}`]: false 
                    });

                    localStorage.setItem(`social_link_${provider}`, 'false');
                    this.updateUI(provider, false);
                } else {
                    // 취소 시 토글 상태 원복 (UI 변경 없음)
                    toggleEl.checked = true;
                }
            }
        } catch (error) {
            console.error(`소셜 연동(${provider}) 처리 중 오류:`, error);
            alert("요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
            
            // 에러 발생 시 토글 상태 강제 원복
            toggleEl.checked = !isChecked;
        } finally {
            // 처리가 끝나면 다시 버튼 활성화
            toggleEl.disabled = false;
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
// 전역 인스턴스 할당 
window.MyPageSocialManager = new MyPageSocialManager();