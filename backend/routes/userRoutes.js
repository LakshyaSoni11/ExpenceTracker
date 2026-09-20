import express from "express";
import { searchUsers } from "../controllers/userController.js";
import { authRequired, requireVerified } from "../middleware/auth.js";

const router = express.Router();

router.get("/users/search", authRequired, requireVerified, searchUsers);

export default router;