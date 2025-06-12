// backend/routes/users.js
import express from "express";
import {
  getAllUsers,
  updateUserProfile,
  getUserProfile,
} from "../controllers/userController.js"; // <-- getUserProfile import edildi
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // Bu rotadaki tüm işlemler için kimlik doğrulaması gerekli

router.get("/", getAllUsers); // Tüm kullanıcıları listeleme
router.put("/profile", updateUserProfile); // Profil güncelleme için PUT rota
router.get("/profile", getUserProfile); // <-- YENİ ROTA: Giriş yapmış kullanıcının profilini çekme için GET rota

export default router;
