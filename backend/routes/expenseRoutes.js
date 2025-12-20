import express from 'express';
import { addExpense } from '../controllers/expenceController.js';

const router = express.Router()
router.post('/', addExpense);

export default router;
