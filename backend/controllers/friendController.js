import db from "../db.js";

// Arkadaşlık isteği gönderme
export const sendFriendRequest = async (req, res) => {
  const requesterId = req.user.id;
  const { receiverId } = req.body;
  const io = req.app.get("socketio");

  try {
    // Aynı istek veya arkadaşlık var mı?
    const [existing] = await db.execute(
      `SELECT * FROM friends WHERE 
       (requester_id = ? AND receiver_id = ?) OR 
       (requester_id = ? AND receiver_id = ?)`,
      [requesterId, receiverId, receiverId, requesterId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Zaten istek gönderilmiş veya arkadaşsınız.",
      });
    }

    await db.execute(
      `INSERT INTO friends (requester_id, receiver_id, status) VALUES (?, ?, 'pending')`,
      [requesterId, receiverId]
    );

    res.status(201).json({ message: "İstek gönderildi." });

    io.to(receiverId).emit("friend_request_received", {
      receiverId,
      requesterId,
      requesterUsername: req.user.username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "İstek gönderilirken hata oluştu." });
  }
};

// Arkadaşlık isteğini kabul etme
export const acceptFriendRequest = async (req, res) => {
  const receiverId = req.user.id;
  const { requesterId } = req.body;
  const io = req.app.get("socketio");

  try {
    const [result] = await db.execute(
      `UPDATE friends SET status = 'accepted' 
       WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'`,
      [requesterId, receiverId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bekleyen istek bulunamadı." });
    }

    res.json({ message: "Arkadaşlık isteği kabul edildi." });

    io.to(receiverId).emit("friend_request_accepted", {
      accepterId: receiverId,
      requesterId: requesterId,
      accepterUsername: req.user.username,
    });

    io.to(requesterId).emit("friend_request_accepted", {
      accepterId: receiverId,
      requesterId: requesterId,
      accepterUsername: req.user.username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "İstek kabul edilirken hata oluştu." });
  }
};

// Arkadaş listesini getirme
export const getFriends = async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.execute(
      `SELECT u.id, u.username
         FROM users u
         JOIN friends f ON (
           (f.requester_id = ? AND f.receiver_id = u.id)
           OR (f.receiver_id = ? AND f.requester_id = u.id)
         )
         WHERE f.status = 'accepted'`,
      [userId, userId]
    );

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Arkadaşlar alınırken hata oluştu." });
  }
};

// Bekleyen arkadaşlık isteklerini getirme
export const getPendingRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.execute(
      `SELECT u.id, u.username
       FROM users u
       JOIN friends f ON f.requester_id = u.id
       WHERE f.receiver_id = ? AND f.status = 'pending'`,
      [userId]
    );

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Bekleyen istekler alınırken hata oluştu." });
  }
};

// Arkadaş çıkarma
export const unfriend = async (req, res) => {
  const userId = req.user.id; // Token'dan gelen mevcut kullanıcının ID'si
  const { friendId } = req.body; // Çıkarılacak arkadaşın ID'si
  const io = req.app.get("socketio");

  try {
    // İki kullanıcı arasındaki arkadaşlık ilişkisini bul
    // Hem requester_id hem de receiver_id'yi kontrol etmeliyiz
    const [result] = await db.execute(
      `DELETE FROM friends
       WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
       AND status = 'accepted'`, // Sadece 'accepted' durumundaki arkadaşlıkları sil
      [userId, friendId, friendId, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Arkadaş bulunamadı veya arkadaş değilsiniz." });
    }

    res.status(200).json({ message: "Arkadaş başarıyla silindi." });

    io.to(userId).emit("unfriend_successful", {
      user1Id: userId,
      user2Id: friendId,
    });

    io.to(friendId).emit("unfriend_successful", {
      user1Id: userId,
      user2Id: friendId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Arkadaş silinirken bir hata oluştu." });
  }
};

export const getOutgoingRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.execute(
      `SELECT u.id, u.username
       FROM users u
       JOIN friends f ON f.receiver_id = u.id
       WHERE f.requester_id = ? AND f.status = 'pending'`,
      [userId]
    );
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Giden istekler alınırken hata oluştu." });
  }
};

export const cancelFriendRequest = async (req, res) => {
  const requesterId = req.user.id;
  const { receiverId } = req.body;
  const io = req.app.get("socketio");
  try {
    const [result] = await db.execute(
      `DELETE FROM friends WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'`,
      [requesterId, receiverId]
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Geri çekilecek bekleyen istek bulunamadı" });
    }
    res
      .status(200)
      .json({ message: "Arkadaşlık isteği başarıyla geri çekildi." });

    io.to(receiverId).emit("friend_request_cancelled", {
      requesterId: requesterId,
      receiverId: receiverId,
      requesterUsername: req.user.username,
    });
    io.to(requesterId).emit("friend_request_cancelled", {
      requesterId: requesterId,
      receiverId: receiverId,
      requesterUsername: req.user.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Arkadaşlık isteği geri çekilirken bir hata oluştu",
    });
  }
};
