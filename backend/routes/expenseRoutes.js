import express from 'express';
import { 
    addExpense, 
    getAllExpenses,
    getExpensesByGroup, 
    deleteExpense,
    addSettlement, 
    getAllSettlements,
    getSettlementsByGroup 
} from '../controllers/expenseController.js';
import { authRequired, requireVerified } from '../middleware/auth.js';

const router = express.Router();
const guard = [authRequired, requireVerified];

// Expense routes
router.post('/expenses', guard, addExpense);
router.get('/expenses', guard, getAllExpenses);
router.get('/expenses/group/:groupId', guard, getExpensesByGroup);
router.delete('/expenses/:id', guard, deleteExpense);

// Settlement routes
router.post('/settlements', guard, addSettlement);
router.get('/settlements', guard, getAllSettlements);
router.get('/settlements/group/:groupId', guard, getSettlementsByGroup);

export default router;