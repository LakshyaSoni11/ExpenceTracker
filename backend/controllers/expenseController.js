import Settlement from "../models/settlement.js";
import Expense from "../models/Expense.js";

// Add expense
export const addExpense = async(req, res) => {
    try {
        const expense = await Expense.create(req.body);
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get ALL expenses (needed for Dashboard)
export const getAllExpenses = async(req, res) => {
    try {
        const expenses = await Expense.find().sort({ createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get expenses by group
export const getExpensesByGroup = async (req, res) => {
    try {
        const expenses = await Expense.find({ groupId: req.params.groupId });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete expense
export const deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Add settlement
export const addSettlement = async (req, res) => {
    try {
        const newSettlement = await Settlement.create(req.body);
        res.status(201).json(newSettlement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get ALL settlements (needed for Dashboard)
export const getAllSettlements = async (req, res) => {
    try {
        const settlements = await Settlement.find().sort({ createdAt: -1 });
        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get settlements by group
export const getSettlementsByGroup = async (req, res) => {
    try {
        const settlements = await Settlement.find({ groupId: req.params.groupId });
        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}