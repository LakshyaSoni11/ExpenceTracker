import User from "../models/User.js";

export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const match = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};
    const users = await User.find({ ...match, _id: { $ne: req.user._id } })
      .select("name email")
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};