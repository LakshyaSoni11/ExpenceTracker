import { handleAIChat } from "../controllers/aiController.js"
import express from 'express'

const router = express.Router()

router.post('/chat', handleAIChat)

export default router;