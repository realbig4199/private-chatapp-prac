// mongoose 라이브러리에서 Schema 함수 임포트
const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  userToken: {
    type: String,
    required: true,
  },
  messages: [
    {
      from: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      time: {
        type: String,
        required: true,
      },
    },
  ],
});

const messageModel = mongoose.model("Message", messageSchema);

module.exports = messageModel;
