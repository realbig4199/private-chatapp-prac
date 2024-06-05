// 소켓 객체 생성
// 원래라면 소켓 객체 생성 시 내부적으로 Socket.io 서버에 즉시 연결되지만, autoConnect 옵션을 false로 설정하여 연결을 지연시킴
const socket = io("http://localhost:4000", {
  autoConnect: false, // 로그인한 다음에 연결하는 것이기 때문에
});

// onAny 메서드 : Socket.io에서 제공하는 메서드로 모든 이벤트에 대해 반응하는 핸들러
socket.onAny((event, ...args) => {
  console.log(event, args);
});

// 전역 변수들
const chatBody = document.querySelector(".chat-body");
const userTitle = document.querySelector("#user-title");
const loginContainer = document.querySelector(".login-container");
const userTable = document.querySelector(".users");
const userTagline = document.querySelector("#user-tagline");
const title = document.querySelector("#active-user");
const messages = document.querySelector(".messages");
const msgDiv = document.querySelector(".msg-form");

// 로그인 폼 핸들러
const loginForm = document.querySelector(".user-login");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 제출 방지 : 폼 제출 시 새로고침되는 것을 방지
  const username = document.getElementById("username");
  createSession(username.value.toLowerCase()); // 세션 생성 함수 호출
  username.value = ""; // 입력 필드 초기화
});

const createSession = async (username) => {
  // 옵션 객체 설정
  const options = {
    method: "Post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  };
  await fetch("/session", options)
    .then((res) => res.json()) // 서버의 응답을 JSON 형태로 변환
    .then((data) => {
      // JSON 형태로 변환된 데이터 처리
      // 사용자 별로 소켓이 생성되고 서버와 연결
      socketConnect(data.username, data.userID); // 소켓 연결 함수 호출

      // 로컬 스토리지에 사용자 이름과 ID를 저장 (setItem 메서드)
      // 여기서 로컬 스토리지는 브라우저에서 데이터를 영구적으로 저장할 수 있는 공간
      localStorage.setItem("session-username", data.username);
      localStorage.setItem("session-userID", data.userID);

      // UI 업데이트
      loginContainer.classList.add("d-none");
      chatBody.classList.remove("d-none");
      userTitle.innerHTML = data.username;
    })
    .catch((err) => console.error(err));
};

const socketConnect = async (username, userID) => {
  // socket.auth : 사용자 인증 정보를 설정하는 객체로 이를 활용하여 사용자를 인증하거나 식별
  socket.auth = { username, userID };

  // Socket.io 클라이언트를 서버에 연결하는 메서드
  // 사용자 별로 소켓이 생성되고 서버와 연결
  await socket.connect();
};

const setActiveUser = (element, username, userID) => {
  title.innerHTML = username;
  title.setAttribute("userID", userID);

  const lists = document.getElementsByClassName("socket-users");
  for (let i = 0; i < lists.length; i++) {
    lists[i].classList.remove("table-active");
  }

  element.classList.add("table-active");

  // 사용자 선택 후 메시지 영역 표시
  msgDiv.classList.remove("d-none");
  messages.classList.remove("d-none");
  messages.innerHTML = "";
  socket.emit("fetch-messages", { receiver: userID });
  const notify = document.getElementById(userID);
  notify.classList.add("d-none");
};

const appendMessage = ({ message, time, background, position }) => {
  let div = document.createElement("div");
  div.classList.add("message", "bg-opacity-25", "m-2", "px-2", "py-1", background, position);
  div.innerHTML = `<span class="msg-text">${message}</span> <span class="msg-time"> ${time}</span>`;
  messages.append(div); // 기존 메시지에 계속 append
  messages.scrollTo(0, messages.scrollHeight); // 메시지 요소의 스크롤을 가장 아래로 이동하여 새로운 메시지가 보이도록
};

socket.on("users-data", ({ users }) => {
  console.log(users);
  // 리스트에서 자기 자신은 제거
  // 클라이언트로 전달받은 user.userID와 생성되어있던 socket.id가 동일하면 제거
  // 여기서 socket.id는 처음 통신할 때 서버가 생성하여 반환해준것 (/session 라우터에서 생성한 userID)
  const index = users.findIndex((user) => user.userID === socket.id);

  if (index > -1) {
    users.splice(index, 1);
  }

  // 유저 테이블 리스트 생성
  userTable.innerHTML = "";
  let ul = `<table class="table table-hover">`;
  for (const user of users) {
    ul += `<tr class="socket-users" onclick="setActiveUser(this, '${user.username}', '${user.userID}')"><td>${user.username}<span class="text-danger ps-1 d-none" id="${user.userID}">!</span></td></tr>`;
  }
  ul += `</table>`;
  if (users.length > 0) {
    userTable.innerHTML = ul;
    userTagline.innerHTML = "접속 중인 유저";
    userTagline.classList.remove("text-danger");
    userTagline.classList.add("text-success");
  } else {
    userTagline.innerHTML = "접속 중인 유저 없음";
    userTagline.classList.remove("text-success");
    userTagline.classList.add("text-danger");
  }
});

// 페이지 로드 시 세션 정보가 존재하면 자동으로 로그인
// getItem 메서드를 활용하여 로컬 스토리지에 저장된 사용자 이름과 ID를 가져옴
const sessUsername = localStorage.getItem("session-username");
const sessUserID = localStorage.getItem("session-userID");

if (sessUsername && sessUserID) {
  socketConnect(sessUsername, sessUserID);

  loginContainer.classList.add("d-none");
  chatBody.classList.remove("d-none");
  userTitle.innerHTML = sessUsername;
}

// 메시지 전송
const msgForm = document.querySelector(".msgForm");
const message = document.getElementById("message");

msgForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 폼 제출 기본 동작인 페이지 새로고침 방지

  const to = title.getAttribute("userID");
  const time = new Date().toLocaleString("en-US", {
    hour: "numeric", // 시간을 숫자로 표시
    minute: "numeric", // 분을 숫자로 표시
    hour12: true, // 12시간 형식으로 표시
  });

  // 메시지 payload 만들기
  const payload = {
    from: socket.id,
    to,
    message: message.value,
    time,
  };

  // 서버로 message-to-server 이벤트 발생
  socket.emit("message-to-server", payload);

  appendMessage({ ...payload, background: "bg-success", position: "right" });

  message.value = ""; // 메시지 입력 필드 초기화
  message.focus(); // 메시지 입력 필드에 포커스
});

socket.on("message-to-client", ({ from, message, time }) => {
  console.log("Received message from server:", { from, message, time });
  const receiver = title.getAttribute("userID");
  const notify = document.getElementById(from);

  if (receiver === null) {
    notify.classList.remove("d-none");
  } else if (receiver === from) {
    appendMessage({
      message,
      time,
      background: "bg-secondary",
      position: "left",
    });
  } else {
    notify.classList.remove("d-none");
  }
});
