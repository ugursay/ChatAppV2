import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import userRoutes from "./routes/users.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// app.use("/api", authRoutes);
app.use("/api", authRoutes);

app.use("/api/friends", friendRoutes);

app.use("/api/users", userRoutes);

io.on("connection", (socket) => {
  console.log("yeni bir kullanıcı bağlandı", socket.id);

  socket.on("register_user_id", (userId) => {
    socket.userId = userId;
    socket.join(userId); // kişiye özel bildirim için aksi takdirde herkes görebilir.
    console.log(
      `kullanıcı ${userId} soket ${socket.id} ile kaydedildi ve odaya katıldı`
    );
  });

  socket.on("disconnect", () => {
    console.log("kullanıcı bağlantısı kesildi:", socket.id);
  });
});

app.set("socketio", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`sunucu ${PORT} portunda çalışıyor`));

// app.listen(5000, () => {
//   console.log("sunucu 5000 portunda çalışıyor...");
// });
