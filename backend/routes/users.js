// routes/users.js
import express from "express";
import { getAllUsers } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Kimlik doğrulama middleware'ini ekledik

const router = express.Router();

// Bu rotayı korumak için authMiddleware kullan
router.use(authMiddleware);
router.get("/", getAllUsers);

export default router;
