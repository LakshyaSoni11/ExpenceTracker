import { handleAIChat } from "../controllers/aiController.js"
import express from 'express'
import { authRequired, requireVerified } from "../middleware/auth.js";

const router = express.Router()

router.post('/chat', authRequired, requireVerified, handleAIChat)

export default router;