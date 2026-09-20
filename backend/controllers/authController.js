import crypto from "crypto";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { buildVerificationLink, sendVerificationEmail } from "../utils/mailer.js";

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isVerified: user.isVerified,
});

const generateVerificationToken = () => crypto.randomBytes(24).toString("hex");

const issueVerification = async (user) => {
  const token = generateVerificationToken();
  user.verificationToken = token;
  user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      link: buildVerificationLink(token),
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isVerified: false,
    });
    await issueVerification(user);
    const token = signToken(user._id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Verification token is missing" });
    }
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    }).select("+verificationToken");
    if (!user) {
      return res.status(400).json({ message: "This verification link is invalid or has expired. Request a new one." });
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();
    const jwtToken = signToken(user._id);
    res.json({ token: jwtToken, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "This email is already verified" });
    }
    await issueVerification(user);
    res.json({ message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password isVerified");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};