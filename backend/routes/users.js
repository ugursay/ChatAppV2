// routes/users.js
import express from "express";
import {
  getAllUsers,
  updateUserProfile,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Kimlik doğrulama middleware'ini ekledik

const router = express.Router();

// Bu rotayı korumak için authMiddleware kullan
router.use(authMiddleware);
router.get("/", getAllUsers);
router.put("/profile", updateUserProfile);

export default router;
