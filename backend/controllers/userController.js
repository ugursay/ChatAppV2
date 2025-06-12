// controllers/userController.js
import db from "../db.js";

// Tüm kullanıcıları ve profil isimlerini getirme
export const getAllUsers = async (req, res) => {
  try {
    // users ve user_profiles tablolarını JOIN ederek name sütununu da çekiyoruz
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.email, up.name
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id != ?`,
      [req.user.id]
    );
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kullanıcılar alınırken hata oluştu." });
  }
};

// Giriş yapmış kullanıcının profil bilgilerini çekme
export const getUserProfile = async (req, res) => {
  const userId = req.user.id; // Auth middleware'dan gelen kullanıcı ID'si

  try {
    const [userResult] = await db.execute(
      `SELECT u.id, u.username, u.email, up.name, up.bio, up.gender
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [userId]
    );

    const user = userResult[0];

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı profili bulunamadı." });
    }

    res.status(200).json({
      message: "Profil bilgileri başarıyla alındı.",
      user: user,
    });
  } catch (error) {
    console.error("Kullanıcı profili alınırken hata oluştu:", error);
    res
      .status(500)
      .json({ message: "Profil bilgileri alınırken sunucu hatası oluştu." });
  }
};

// Kullanıcı profilini güncelleme
export const updateUserProfile = async (req, res) => {
  const userId = req.user.id; // Token'dan gelen kullanıcı ID'si
  const { username, name, bio, gender } = req.body; // Güncellenecek veriler

  // Kullanıcı adı boş olamaz kontrolü
  if (username === undefined || username.trim() === "") {
    return res.status(400).json({ message: "Kullanıcı adı boş olamaz." });
  }

  try {
    let usernameUpdated = false;
    // 1. Kullanıcı adı değişiyorsa benzersizliğini kontrol et ve users tablosunda güncelle
    const [currentUserCheck] = await db.execute(
      `SELECT username FROM users WHERE id = ?`,
      [userId]
    );
    const currentUsername = currentUserCheck[0]?.username;

    if (username !== currentUsername) {
      // Eğer kullanıcı adı gerçekten değiştiyse
      const [existingUser] = await db.execute(
        `SELECT id FROM users WHERE username = ?`, // Yeni kullanıcı adının başkası tarafından kullanılıp kullanılmadığını kontrol et
        [username]
      );

      if (existingUser.length > 0) {
        return res
          .status(400)
          .json({ message: "Bu kullanıcı adı zaten alınmış." });
      }
      // Kullanıcı adını users tablosunda güncelle
      await db.execute(`UPDATE users SET username = ? WHERE id = ?`, [
        username,
        userId,
      ]);
      usernameUpdated = true;
    }

    // 2. user_profiles tablosundaki alanları güncelle (name, bio, gender)
    const profileUpdateFields = [];
    const profileUpdateValues = [];

    // name alanı için kontrol ve ekleme
    if (name !== undefined) {
      profileUpdateFields.push("name = ?");
      profileUpdateValues.push(name);
    }
    if (bio !== undefined) {
      profileUpdateFields.push("bio = ?");
      profileUpdateValues.push(bio);
    }
    if (gender !== undefined) {
      profileUpdateFields.push("gender = ?");
      profileUpdateValues.push(gender);
    }

    let profileUpdated = false;
    if (profileUpdateFields.length > 0) {
      const profileQuery = `UPDATE user_profiles SET ${profileUpdateFields.join(
        ", "
      )} WHERE user_id = ?`;
      profileUpdateValues.push(userId);
      const [profileResult] = await db.execute(
        profileQuery,
        profileUpdateValues
      );
      if (profileResult.affectedRows > 0) {
        profileUpdated = true;
      } else {
        // Eğer user_profiles tablosunda bu user_id için bir kayıt yoksa (kayıt sırasında oluşturulmalıydı ama güvenlik için), oluştur
        // Bu kısım normalde tetiklenmemeli eğer register düzgün çalışıyorsa
        await db.execute(
          `INSERT INTO user_profiles (user_id, name, bio, gender) VALUES (?, ?, ?, ?)`,
          [userId, name || "", bio || "", gender || ""]
        );
        profileUpdated = true;
      }
    }

    // Eğer ne kullanıcı adı ne de diğer profil bilgileri güncellenmediyse hata döndür
    if (!usernameUpdated && !profileUpdated) {
      return res
        .status(400)
        .json({ message: "Güncellenecek hiçbir bilgi sağlanmadı." });
    }

    // Güncellenmiş tüm kullanıcı bilgilerini (users ve user_profiles'tan JOIN ile) döndür
    const [updatedUserResult] = await db.execute(
      `SELECT u.id, u.username, u.email, up.name, up.bio, up.gender
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`, // <-- BURADAKİ FAZLA VİRGÜL KALDIRILDI!
      [userId]
    );

    res.status(200).json({
      message: "Profil başarıyla güncellendi.",
      user: updatedUserResult[0],
    });
  } catch (error) {
    console.error("Profil güncellenirken hata oluştu: ", error);
    res
      .status(500)
      .json({ message: "Profil güncellenirken sunucu hatası oluştu." });
  }
};
