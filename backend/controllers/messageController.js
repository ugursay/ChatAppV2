import db from "../db.js";

export const sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;

  const io = req.app.get("socketio");

  if (!receiverId || !content) {
    return res
      .status(400)
      .json({ message: "Alıcı ID'si veya mesaj içeriği boş olamaz" });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES(?,?,?)`,
      [senderId, receiverId, content]
    );

    const messageId = result.insertId;

    const [senderResult] = await db.execute(
      `SELECT username FROM users WHERE id=? `,
      [senderId]
    );
    const senderUsername = senderResult[0]?.username;

    const message = {
      id: messageId,
      sender_id: senderId,
      sender_username: senderUsername,
      receiver_id: receiverId,
      content: content,
      timestamp: new Date().toISOString(),
    };

    io.to(receiverId).emit("receive_message", message);

    if (senderId !== receiverId) {
      io.to(senderId).emit("receive_message", message);
    }

    res
      .status(201)
      .json({ message: "Mesaj başarıyla gönderildi", data: message });
  } catch (err) {
    console.error("Mesaj gönderilirken hata oluştu: ", err);
    res.status(500).json({ message: "Sunucu hatası: mesaj gönderilemedi." });
  }
};

export const getChatHistory = async (req, res) => {
  const currentUserId = req.user.id;
  const { friendId } = req.params;

  try {
    const [messages] = await db.execute(
      `SELECT m.id, m.sender_id, u.username as sender_username, m.receiver_id, m.content, m.timestamp
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE (m.sender_id = ? AND m.receiver_id = ?)
                OR (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.timestamp ASC`,
      [currentUserId, friendId, friendId, currentUserId]
    );

    res.status(200).json(messages);
  } catch (err) {
    console.error("Sohbet geçmişi alınırken hata oluştu", err);
    res
      .status(500)
      .json({ message: "Sunucu hatası: sohbet geçmişi alınamadı" });
  }
};
