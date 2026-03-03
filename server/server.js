import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let players = {};
let currentTurn = "X";

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (!players.X) {
    players.X = socket.id;
    socket.emit("playerAssignment", "X");
  } else {
    players.O = socket.id;
    socket.emit("playerAssignment", "O");
  }

  socket.on("move", (data) => {
    currentTurn = currentTurn === "X" ? "O" : "X";
    io.emit("move", data);
  });

  socket.on("disconnect", () => {
    if (players.X === socket.id) delete players.X;
    if (players.O === socket.id) delete players.O;
    console.log("User disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});