/* shared/js/write.js */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 로그인 상태 확인
  checkLoginState();

  // 2. 기능 연결
  wireEditorToolbar();
  wirePublishButton();
});

function checkLoginState() {
  const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
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

// [변경] 등록 버튼 비동기 API 연동 처리
function wirePublishButton() {
  const btnPublish = document.getElementById("btnPublish");
  if (!btnPublish) return;

  btnPublish.addEventListener("click", async () => {
    const category = document.getElementById("writeCategory");
    const title = document.getElementById("writeTitle");
    const body = document.getElementById("writeBody");
    
    // 익명용 필드
    const nickInput = document.getElementById("writeNick");
    const pwInput = document.getElementById("writePw");

    // 로그인 여부
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";

    // 1. 공통 유효성 검사
    if (!category.value) { alert("게시판을 선택해주세요."); category.focus(); return; }
    if (!title.value.trim()) { alert("제목을 입력해주세요."); title.focus(); return; }
    if (!body.value.trim()) { alert("내용을 입력해주세요."); body.focus(); return; }
    
    // 2. 작성자 정보 구성 및 비로그인 시 유효성 검사
    let postData = {
      tag: category.value,
      title: title.value.trim(),
      body: body.value.trim(),
      content: body.value.trim() // 상세 보기 호환을 위해 content 필드도 함께 저장
    };

    if (isLoggedIn) {
      // 회원 작성
      postData.writer = localStorage.getItem("user_nick") || "회원";
      postData.writerId = localStorage.getItem("user_id");
      postData.isAnonymous = false;
      postData.writerImg = localStorage.getItem("user_profile_img") || null;
    } else {
      // 비회원 작성 (익명)
      if (!nickInput.value.trim()) { alert("닉네임을 입력해주세요."); nickInput.focus(); return; }
      if (!pwInput.value.trim()) { alert("비밀번호를 입력해주세요."); pwInput.focus(); return; }
      
      postData.writer = nickInput.value.trim() || "익명";
      postData.password = pwInput.value.trim();
      postData.writerId = null;
      postData.isAnonymous = true;
    }

    // 3. 서버(DB_API)로 새 게시글 전송
    try {
      btnPublish.disabled = true; // 중복 클릭 방지
      btnPublish.textContent = "등록 중...";

      // API를 통해 데이터베이스에 게시글 삽입
      const newPostId = await DB_API.createPost(postData);

      alert("게시글이 성공적으로 등록되었습니다.");
      
      // 작성 완료 후 해당 게시글 상세 페이지 또는 게시판 목록으로 이동
      // location.href = `/kr/html/post/post.html?id=${newPostId}`; // 상세페이지로 보낼 경우
      location.href = "/kr/html/board.html"; 

    } catch (error) {
      console.error("게시글 작성 중 오류 발생:", error);
      alert("게시글을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.");
      
      btnPublish.disabled = false;
      btnPublish.textContent = "등록";
    }
  });
}