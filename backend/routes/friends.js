import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  unfriend,
  getOutgoingRequests,
  cancelFriendRequest,
} from "../controllers/friendController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // bütün route'lar için

router.post("/request", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.get("/", getFriends);
router.get("/requests", getPendingRequests);
router.delete("/unfriend", unfriend);
router.get("/outgoing-requests", getOutgoingRequests);
router.delete("/request/cancel", cancelFriendRequest);

export default router;
