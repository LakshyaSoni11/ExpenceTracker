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

const router = express.Router();

// Expense routes
router.post('/expenses', addExpense);
router.get('/expenses', getAllExpenses);
router.get('/expenses/group/:groupId', getExpensesByGroup);
router.delete('/expenses/:id', deleteExpense);

// Settlement routes
router.post('/settlements', addSettlement);
router.get('/settlements', getAllSettlements);
router.get('/settlements/group/:groupId', getSettlementsByGroup);

export default router;