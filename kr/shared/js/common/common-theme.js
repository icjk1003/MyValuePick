/* =========================================
   [공통] 다크모드/라이트모드 테마 관리
   ========================================= */

/**
 * 1. 초기 테마 적용 (즉시 실행 함수)
 * - 로컬 스토리지에 저장된 테마를 우선적으로 확인합니다.
 * - 저장된 테마가 없다면 사용자의 시스템 환경 설정(prefers-color-scheme)을 따릅니다.
 * - 이 함수는 DOM이 완전히 로드되기 전에 실행되어 화면 깜빡임을 방지합니다.
 */
(function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
    }
})();

/**
 * 2. 테마 토글 버튼 이벤트 바인딩
 * - 헤더가 렌더링된 이후에 호출되어 버튼 클릭 이벤트를 연결합니다.
 * - 전역에서 호출할 수 있도록 window 객체에 할당할 수도 있으나, 
 * 기존 구조를 유지하여 일반 함수로 선언합니다.
 */
function wireThemeToggle() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    
    // 중복 바인딩 방지를 위해 기존 이벤트 초기화
    btn.onclick = null;
    
    // 클릭 이벤트 할당
    btn.onclick = () => {
        const root = document.documentElement;
        const isDark = root.getAttribute("data-theme") === "dark";
        const newTheme = isDark ? "light" : "dark";
        
        // HTML 루트 요소에 data-theme 속성 변경
        root.setAttribute("data-theme", newTheme);
        
        // 버튼 아이콘 텍스트 변경
        btn.textContent = newTheme === "dark" ? '🌙' : '☀️';
        
        // 변경된 테마를 로컬 스토리지에 저장하여 다음 방문 시 유지
        localStorage.setItem("theme", newTheme);
    };
}