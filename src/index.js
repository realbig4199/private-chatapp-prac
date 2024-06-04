// express 라이브러리에서 express 함수 임포트
const express = require("express");
// path 라이브러리에서 path 함수 임포트
const path = require("path");

require("dotenv").config();

// express 함수를 호출하여 app 객체 생성
const app = express();

// socket.io를 Express 서버에 연결
const http = require("http"); // http 서버 생성을 위한 http 모듈 임포트
const { Server } = require("socket.io"); // Socket.io의 Server 클래스 임포트
const server = http.createServer(app); // http 서버 생성 및 Express 앱 연동
const io = new Server(server); // Socket.io 서버를 생성하고 HTTP 서버에 연결 후 io 객체 생성

// 정적 파일 제공
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// json 데이터 파싱
app.use(express.json());

// DB 연결
// 몽구스 라이브러리에서 mongoose 함수 임포트
const mongoose = require("mongoose");

const mongoURI = process.env.mongoURI;

// 몽구스 라이브러리의 connect 메서드를 사용하여 MongoDB 서버에 연결
mongoose
  .connect(mongoURI)
  .then(() => console.log("DB 연결 성공"))
  .catch((err) => console.log(err));

const crypto = require("crypto");

const randomId = () => crypto.randomBytes(8).toString("hex");

app.post("/session", (req, res) => {
  const data = {
    username: req.body.username,
    userId: randomId(),
  };
  res.send(data);
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  const userID = socket.handshake.auth.userID;

  if (!username) {
    return next(new Error("Invalid username"));
  }

  socket.username = username;
  socket.id = userID;

  next();
});

let users = [];

// Socket.io 이벤트 리스너 설정
io.on("connection", async (socket) => {
  let uesrData = {
    username: socket.username,
    userID: socket.id,
  };
  users.push(uesrData);
  // 모든 클라이언트에게 이벤트 전달 - 사용자 데이터 전송
  io.emit("users-data", { users });

  // 클라이언트에서 온 메시지
  socket.on("message-to-server", () => {});

  // DB에서 메시지 가져오기
  socket.on("fetch-messages", () => {});

  // 유저가 방에서 나갔을 때
  socket.on("disconnect", () => {});
});

// 지정된 포트 번호에 서버를 실행
const port = 4000;
app.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행중`);
});
