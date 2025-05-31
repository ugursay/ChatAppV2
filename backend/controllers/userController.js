// controllers/userController.js
import db from "../db.js";

export const getAllUsers = async (req, res) => {
  try {
    // Kendi kullanıcısını listeden hariç tut
    const [users] = await db.execute(
      "SELECT id, username, email FROM users WHERE id != ?",
      [req.user.id]
    );
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kullanıcılar alınırken hata oluştu." });
  }
};
