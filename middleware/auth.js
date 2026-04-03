const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication middleware - verifies JWT token
 * Attach to any route that needs protection
 */
const auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Token is valid but user no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired. Please login again.",
      });
    }
    return res.status(500).json({
      success: false,
      error: "Authentication error.",
    });
  }
};

module.exports = auth;
