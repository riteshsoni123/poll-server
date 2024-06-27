require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  const { teacherId, userId, username } = socket.handshake.query;
  // console.log(teacherId, userId, username);

  socket.join(userId);

  // users = io.sockets.adapter.rooms.get(teacherId);
  // console.log(users);

  socket.on("join", (data) => {
    // console.log("New user joined", data);
    socket.broadcast.to(data.teacherId).emit("receiveNewUser", data);
  });

  socket.on("updateUserList", (newList) => {
    setTimeout(() => {
      // console.log("New list created", newList);

      newList.forEach((user) => {
        if (user.userId != user.teacherId)
          socket.broadcast.to(user.userId).emit("updateList", newList);
      });
    }, 200);
  });

  socket.on("sendMessage", (data) => {
    const { msgs, users } = data;
    users.forEach((user) => {
      socket.broadcast.to(user.userId).emit("receiveMessage", msgs);
    });
  });

  socket.on("sendPoll", (data) => {
    const { question, options, time, users } = data;
    console.log(question, options);
    users.forEach((user) => {
      socket.broadcast
        .to(user.userId)
        .emit("receivePoll", { question, options, time });
    });
  });

  socket.on("pushPollUpdate", (data) => {
    const { users, index } = data;
    console.log(index);
    users.forEach((user) => {
      socket.broadcast.to(user.userId).emit("pullPollUpdate", { index: index });
    });
  });
});

// console.log(tmp);

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
