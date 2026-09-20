import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import settlement from "../models/Settlement.js";

//create group
export const createGroup = async (req, res) => {
    try {
        console.log("Request body:", req.body); // Debug log
        
        const { name, members } = req.body;
        
        if (!name || !members || members.length < 2) {
            console.log("Validation failed:", { name, members }); // Debug log
            return res.status(400).json({ message: "Invalid/insufficient data" });
        }
        
        const group = await Group.create({ name, members });
        console.log("Group created:", group); // Debug log
        
        res.status(200).json(group);
    } catch (error) {
        console.error("Error creating group:", error); // Debug log
        res.status(500).json({ message: error.message });
    }
}

//get groups
export const getGroups = async(req, res) => {
    try {
        const groups = await Group.find().sort({ createdAt: -1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//delete groups
export const deleteGroup = async(req, res) => {
    try {
        const { id } = req.params;
        await Expense.deleteMany({ groupId: id });
        await settlement.deleteMany({ groupId: id });
        await Group.findByIdAndDelete(id);
        res.json({ message: "Group deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}