import Settlement from "../models/Settlement.js";
import Expense from "../models/Expense.js";
import { canAccessGroup, getMyGroupIds, activeMemberIds } from "../utils/access.js";
import { emitToUsers } from "../utils/realtime.js";

const activeMemberIdsOf = (group) => activeMemberIds(group);

// Add expense
export const addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splits, splitType } = req.body;
    if (!groupId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Group and a positive amount are required" });
    }
    const group = await canAccessGroup(req.user._id, groupId);
    if (!group) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }
    const members = activeMemberIdsOf(group);
    if (!paidBy || !members.includes(String(paidBy))) {
      return res.status(400).json({ message: "Payer must be an active member of the group" });
    }
    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ message: "At least one split is required" });
    }
    const splitSet = new Set();
    for (const s of splits) {
      if (!members.includes(String(s.member))) {
        return res.status(400).json({ message: "Split members must be active group members" });
      }
      splitSet.add(String(s.member));
    }
    if (splitSet.size !== splits.length) {
      return res.status(400).json({ message: "Each member can appear only once in splits" });
    }

    const expense = await Expense.create({
      groupId,
      description: description || "",
      amount,
      paidBy,
      splitType: splitType || "equal",
      splits,
    });

    emitToUsers(members, "expense:added", {
      groupId,
      groupName: group.name,
      description: expense.description,
      amount: expense.amount,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expenses for all groups the user belongs to
export const getAllExpenses = async (req, res) => {
  try {
    const ids = await getMyGroupIds(req.user._id);
    const expenses = await Expense.find({ groupId: { $in: ids } }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expenses by group
export const getExpensesByGroup = async (req, res) => {
  try {
    const group = await canAccessGroup(req.user._id, req.params.groupId);
    if (!group) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }
    const expenses = await Expense.find({ groupId: req.params.groupId }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    const group = await canAccessGroup(req.user._id, expense.groupId);
    if (!group) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }
    await expense.deleteOne();
    emitToUsers(activeMemberIdsOf(group), "expense:deleted", {
      groupId: expense.groupId,
      groupName: group.name,
    });
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add settlement
export const addSettlement = async (req, res) => {
  try {
    const { groupId, from, to, amount } = req.body;
    if (!groupId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Group and a positive amount are required" });
    }
    if (!from || !to || String(from) === String(to)) {
      return res.status(400).json({ message: "Settlement must be between two different members" });
    }
    const group = await canAccessGroup(req.user._id, groupId);
    if (!group) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }
    const members = activeMemberIdsOf(group);
    if (!members.includes(String(from)) || !members.includes(String(to))) {
      return res.status(400).json({ message: "Settlement members must be active group members" });
    }
    const newSettlement = await Settlement.create({ groupId, from, to, amount });
    emitToUsers(members, "settlement:added", {
      groupId,
      groupName: group.name,
      amount: newSettlement.amount,
    });
    res.status(201).json(newSettlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get settlements for all groups the user belongs to
export const getAllSettlements = async (req, res) => {
  try {
    const ids = await getMyGroupIds(req.user._id);
    const settlements = await Settlement.find({ groupId: { $in: ids } }).sort({ createdAt: -1 });
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get settlements by group
export const getSettlementsByGroup = async (req, res) => {
  try {
    const group = await canAccessGroup(req.user._id, req.params.groupId);
    if (!group) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }
    const settlements = await Settlement.find({ groupId: req.params.groupId }).sort({ createdAt: -1 });
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};