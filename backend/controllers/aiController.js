import { GoogleGenerativeAI } from "@google/generative-ai";
import Group from "../models/Group.js";
import User from "../models/User.js";

export const handleAIChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "AI is not configured (GEMINI_API_KEY missing)" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    //  Fetch Group Context (only the user's groups)
    const groups = await Group.find({ members: { $elemMatch: { user: req.user._id, status: "active" } } })
      .populate("members.user", "name");
    const groupCtx = groups.map(g => `- ${g.name} (Members: ${g.members.map(m => m.user?.name || "…").join(",")})`).join("\n");

    //  Registered users the current user may add to a group (excludes self)
    const registered = await User.find({ _id: { $ne: req.user._id } })
      .select("name email")
      .limit(50);
    const userList = registered.map(u => u.name).join(", ");
    const userCtx = userList ? `Registered users available to add to groups: [${userList}]` : "No other registered users yet.";

    //  Clean History for Gemini (Ensures User -> Model order)
    const cleanHistory = (history || [])
      .filter(h => h.role === "user" || h.role === "model")
      .map(h => ({
        role: h.role,
        parts: [{ text: h.parts[0].text }]
      }));

    // 4. Get a response, with a model fallback chain for transient capacity errors
    let lastErr = null;
    const modelsToTry = [
      process.env.GEMINI_MODEL || "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
    ];

    for (const candidate of new Set(modelsToTry)) {
      try {
        const chat = genAI.getGenerativeModel({ model: candidate }).startChat({
          history: cleanHistory,
          systemInstruction: {
            parts: [{ text: `You are ExpenseBuddy. The current user is ${req.user.name} (email: ${req.user.email}). Context: ${groupCtx}. ${userCtx}.
        If adding expense, return ONLY JSON: {"type": "ACTION", "command": "ADD_EXPENSE", "params": {"amount": 50, "desc": "pizza", "group": "GroupName"}}.
        If creating group, return ONLY JSON: {"type": "ACTION", "command": "CREATE_GROUP", "params": {"name": "GroupName", "members": ["Name1"]}}.
        For CREATE_GROUP, members MUST be names from the Registered users list above (exact names). Do NOT invent or guess member names. The group creator is added automatically, never include the current user's own name. If the user wants to add someone not in the list, respond in plain text that that person must sign up first.
        Do not use markdown backticks for JSON. Otherwise use plain text.` }]
          }
        });
        const result = await chat.sendMessage(message);
        const text = result.response.text();
        if (text) {
          return res.json({ response: text });
        }
      } catch (err) {
        lastErr = err;
        const msg = String(err.message || "");
        console.error(`GEMINI ${candidate} failed:`, msg.slice(0, 150));
        if (!/503|429|Resource has been exhausted|high demand|LOAD\s*/i.test(msg)) {
          break;
        }
      }
    }

    throw lastErr || new Error("No Gemini model responded");

  } catch (error) {
    console.error("GEMINI BACKEND ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
};