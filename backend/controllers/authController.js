import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { sendVerificaitionEmail } from "../utils/sendVerificaitionEmail.js";
import { sendResetPasswordEmail } from "../utils/sendResetPasswordEmail.js";
import crypto from "crypto";

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [existingUser] = await db.execute(
      "SELECT * FROM users WHERE email=? OR username=?",
      [email, username]
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu kullanıcı adı veya email zaten kayıtlı" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (username, email, password) VALUES (?,?,?)",
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    const verificationToken = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // 1 saat oturum süresi
      }
    );

    await sendVerificaitionEmail(email, verificationToken);

    res.status(201).json({
      message:
        "Kullanıcı başarıyla oluşturuldu. Lütfen E-mail'inizi doğrulayın.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "sunucu hatası." });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: "Geçersiz kimlik bilgileri." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz kimlik bilgileri." });
    }

    // Token oluştururken username ve email'i de payload'a ekle
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username }, // username ve email eklendi
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Giriş başarılı",
      token,
      userId: user.id, // Frontend'e doğrudan userId gönderiyoruz
      username: user.username, // Frontend'e doğrudan username gönderiyoruz
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const [rows] = await db.execute(
      "SELECT isVerified FROM users WHERE email=?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Email bulunamadı." });
    }

    if (rows[0].isVerified) {
      return res.status(400).json({ message: "Email zaten doğrulanmış." });
    }

    await db.execute("UPDATE users SET isVerified = TRUE WHERE email=?", [
      email,
    ]);

    res.send(`
      <script>
        alert("Email başarıyla doğrulandı.");
        window.location.href = "http://localhost:3000/login";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      message: "geçersiz veya süresi dolmuş token.",
      error: err.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email=?", [
      email,
    ]);

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date(Date.now() + 5 * 60 * 1000); //5 DAKİKA

    await db.execute(
      "UPDATE users SET resetToken=?, resetTokenExpires=? WHERE email=?",
      [token, expires, email]
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    await sendResetPasswordEmail(email, resetLink);

    res.json({
      message: "şifre sıfırlama bağlantısı e-posta adresinize gönderildi",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "sunucu hatası." });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const [users] = await db.execute(
      "SELECT * FROM users WHERE resetToken=? AND resetTokenExpires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res
        .status(400)
        .json({ message: "Geçersiz veya süresi dolmuş token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      "UPDATE users SET password=?, resetToken=NULL, resetTokenExpires=NULL WHERE id=?",
      [hashedPassword, users[0].id]
    );

    res.json({ message: "şifreniz başarıyla güncellendi." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "sunucu hatası" });
  }
};
