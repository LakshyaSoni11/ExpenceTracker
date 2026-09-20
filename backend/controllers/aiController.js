import { GoogleGenerativeAI } from "@google/generative-ai";
import Group from "../models/Group.js";

export const handleAIChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    // 1. Initialize with the latest stable model string
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash" 
    });

    //  Fetch Group Context
    const groups = await Group.find();
    const groupCtx = groups.map(g => `- ${g.name} (Members: ${g.members.join(",")})`).join("\n");

    //  Clean History for Gemini (Ensures User -> Model order)
    const cleanHistory = (history || [])
      .filter(h => h.role === "user" || h.role === "model")
      .map(h => ({
        role: h.role,
        parts: [{ text: h.parts[0].text }]
      }));

    const chat = model.startChat({
      history: cleanHistory,
      systemInstruction: {
        parts: [{ text: `You are ExpenseBuddy. Context: ${groupCtx}. 
        If adding expense, return ONLY JSON: {"type": "ACTION", "command": "ADD_EXPENSE", "params": {"amount": 50, "desc": "pizza", "group": "GroupName"}}.
        If creating group, return ONLY JSON: {"type": "ACTION", "command": "CREATE_GROUP", "params": {"name": "GroupName", "members": ["Name1"]}}.
        Do not use markdown backticks for JSON. Otherwise use plain text.` }]
      }
    });

    const result = await chat.sendMessage(message);
    res.json({ response: result.response.text() });

  } catch (error) {
    console.error("GEMINI BACKEND ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
};