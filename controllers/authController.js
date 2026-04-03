const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide username and password.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Username already taken.",
      });
    }

    // Create user
    const user = await User.create({ username, password });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: { id: user._id, username: user.username },
        token,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(", ") });
    }
    res.status(500).json({ success: false, error: "Server error." });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user & return token
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide username and password.",
      });
    }

    // Find user with password field
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials.",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: { id: user._id, username: user.username },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error." });
  }
};

module.exports = { register, login };
