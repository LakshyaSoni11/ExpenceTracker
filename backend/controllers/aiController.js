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
      .select("name")
      .limit(20);
    const userList = registered.map(u => u.name).join(", ");
    const userCtx = userList ? `Registered users available to add to groups: [${userList}]` : "No other registered users yet.";

    //  Clean + trim history so context size stays small (keeps requests fast)
    const cleanHistory = (history || [])
      .filter(h => h.role === "user" || h.role === "model")
      .map(h => ({
        role: h.role,
        parts: [{ text: h.parts[0].text }]
      }))
      .slice(-8);

    const systemInstruction =
      `You are ExpenseBuddy. The current user is ${req.user.name} (email: ${req.user.email}). Context: ${groupCtx}. ${userCtx}.
If adding expense, return ONLY JSON: {"type": "ACTION", "command": "ADD_EXPENSE", "params": {"amount": 50, "desc": "pizza", "group": "GroupName"}}.
If creating group, return ONLY JSON: {"type": "ACTION", "command": "CREATE_GROUP", "params": {"name": "GroupName", "members": ["Name1"]}}.
For CREATE_GROUP, members MUST be names from the Registered users list above (exact names). Do NOT invent or guess member names. The group creator is added automatically, never include the current user's own name. If the user wants to add someone not in the list, respond in plain text that that person must sign up first.
Do not use markdown backticks for JSON. Respond concisely. Otherwise use plain text.`;

    const stream = req.body.stream === true;

    //  Get a response, with a model fallback chain for transient capacity errors
    let lastErr = null;
    const modelsToTry = [
      process.env.GEMINI_MODEL || "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
    ];

    for (const candidate of new Set(modelsToTry)) {
      try {
        const chat = genAI.getGenerativeModel({
          model: candidate,
          generationConfig: { maxOutputTokens: 500, temperature: 0.6 },
        }).startChat({
          history: cleanHistory,
          systemInstruction: { parts: [{ text: systemInstruction }] },
        });

        if (stream) {
          const result = await chat.sendMessageStream(message);
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("X-Accel-Buffering", "no");
          res.flushHeaders?.();
          let sent = false;
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              sent = true;
              res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
            }
          }
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          return;
        }

        const result = await chat.sendMessage(message);
        const text = result.response.text();
        if (text) {
          return res.json({ response: text });
        }
      } catch (err) {
        lastErr = err;
        const msg = String(err.message || "");
        console.error(`GEMINI ${candidate} failed:`, msg.slice(0, 150));
        if (stream && res.headersSent) break;
        if (!/503|429|Resource has been exhausted|high demand|LOAD\s*/i.test(msg)) {
          break;
        }
      }
    }

    if (stream && !res.headersSent) {
      return res.status(503).json({ error: String((lastErr && lastErr.message) || "AI temporarily unavailable") });
    }

    throw lastErr || new Error("No Gemini model responded");

  } catch (error) {
    console.error("GEMINI BACKEND ERROR:", error.message);
    if (res.headersSent) {
      try { res.end(); } catch {}
      return;
    }
    res.status(500).json({ error: error.message });
  }
};