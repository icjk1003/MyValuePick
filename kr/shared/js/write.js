/* shared/js/write.js */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 로그인 상태 확인
  checkLoginState();

  // 2. 기능 연결
  wireEditorToolbar();
  wirePublishButton();
});

function checkLoginState() {
  const isLoggedIn = localStorage.getItem("is_logged_in");
  const anonArea = document.getElementById("anonInputArea");

  if (isLoggedIn) {
    // 로그인 상태: 닉네임/비번 입력창 숨김
    if(anonArea) anonArea.style.display = "none";
  } else {
    // 비로그인 상태: 닉네임/비번 입력창 보임
    if(anonArea) {
      anonArea.style.display = "flex";
      anonArea.style.gap = "20px"; // 간격 예쁘게
    }
  }
}

// 툴바 기능 (기존 유지)
function wireEditorToolbar() {
  const textarea = document.getElementById("writeBody");
  const buttons = document.querySelectorAll(".tool-btn");
  if (!textarea) return;
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const command = btn.getAttribute("title") || btn.innerText;
      if (command === "굵게" || command === "B") insertAtCursor(textarea, "**", "**");
      else if (command === "기울임" || command === "I") insertAtCursor(textarea, "*", "*");
      else if (command === "밑줄" || command === "U") insertAtCursor(textarea, "__", "__");
    });
  });
}

function insertAtCursor(field, before, after) {
  const startPos = field.selectionStart;
  const endPos = field.selectionEnd;
  const text = field.value;
  const selectedText = text.substring(startPos, endPos);
  field.value = text.substring(0, startPos) + before + selectedText + after + text.substring(endPos);
  field.focus();
  field.selectionStart = startPos + before.length;
  field.selectionEnd = startPos + before.length + selectedText.length;
}

// [수정] 등록 버튼 로직 (익명/로그인 분기 처리)
function wirePublishButton() {
  const btnPublish = document.getElementById("btnPublish");
  if (!btnPublish) return;

  btnPublish.addEventListener("click", () => {
    const category = document.getElementById("writeCategory");
    const title = document.getElementById("writeTitle");
    const body = document.getElementById("writeBody");
    
    // 익명용 필드
    const nickInput = document.getElementById("writeNick");
    const pwInput = document.getElementById("writePw");

    // 로그인 여부
    const isLoggedIn = localStorage.getItem("is_logged_in");

    // 1. 공통 유효성 검사
    if (!category.value) { alert("게시판을 선택해주세요."); category.focus(); return; }
    
    // 2. 비로그인 시 닉네임/비번 검사
    if (!isLoggedIn) {
      if (!nickInput.value.trim()) { alert("닉네임을 입력해주세요."); nickInput.focus(); return; }
      if (!pwInput.value.trim()) { alert("비밀번호를 입력해주세요."); pwInput.focus(); return; }
    }

    if (!title.value.trim()) { alert("제목을 입력해주세요."); title.focus(); return; }
    if (!body.value.trim()) { alert("내용을 입력해주세요."); body.focus(); return; }

    // 3. 작성자 정보 결정
    let writerName = "";
    if (isLoggedIn) {
      writerName = localStorage.getItem("user_nick") || "개미투자자";
    } else {
      writerName = nickInput.value.trim() + " (익명)";
    }

    // 4. 저장 (MOCK_DB는 새로고침하면 초기화되지만, 동작 흉내)
    if (typeof MOCK_DB !== 'undefined') {
      const newId = MOCK_DB.POSTS.length + 10001;
      MOCK_DB.POSTS.unshift({
        no: newId,
        id: newId,
        tag: category.value,
        title: title.value,
        writer: writerName,
        date: new Date().toISOString().split('T')[0],
        views: 0,
        votes: 0,
        comments: 0
      });
      // 로컬스토리지에도 저장해서 목록에 뜨게 함
      localStorage.setItem("MOCK_POSTS_V2", JSON.stringify(MOCK_DB.POSTS));
    }

    alert("게시글이 등록되었습니다.");
    location.href = "board.html";
  });
}