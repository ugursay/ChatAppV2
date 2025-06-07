import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getChatHistory,
  sendMessage,
} from "../controllers/messageController.js";
const router = express.Router();

router.post("/send", authMiddleware, sendMessage);

router.get("/history/:friendId", authMiddleware, getChatHistory);

export default router;
