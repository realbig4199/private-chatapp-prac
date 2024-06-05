const messageModel = require("../models/messages.model");

const getToken = (sender, receiver) => {
  const key = [sender, receiver].sort().join("_");
  return key;
};

const saveMessages = async ({ from, to, message, time }) => {
  const token = getToken(from, to);
  const data = {
    from,
    message,
    time,
  };

  try {
    await messageModel.updateOne(
      { userToken: token },
      {
        $push: { message: data },
      }
    );
    console.log(`메시지가 생성되었습니다. ${message}`);
  } catch (err) {
    console.error(err);
  }
};

module.exports = { saveMessages };
