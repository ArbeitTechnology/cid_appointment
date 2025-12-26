const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Officer = require("../models/Officer");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "Please authenticate. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Please authenticate. Invalid token format." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's an officer token
    if (decoded.userType === "officer") {
      const officer = await Officer.findById(decoded._id);

      if (!officer) {
        return res
          .status(401)
          .json({ error: "Please authenticate. Officer not found." });
      }

      // Check officer status
      if (officer.status === "inactive") {
        return res
          .status(403)
          .json({
            error: "Officer account is inactive. Please contact administrator.",
          });
      }

      // Check if officer has admin role from token
      const hasAdminRole =
        decoded.additionalRoles && decoded.additionalRoles.includes("admin");

      req.token = token;
      req.user = {
        _id: officer._id,
        name: officer.name,
        phone: officer.phone,
        userType: "officer",
        additionalRoles: hasAdminRole ? ["admin"] : [],
        officerId: officer._id,
        status: officer.status,
        hasAdminRole: hasAdminRole || officer.hasAdminRole(),
        isOfficer: true,
      };
      req.userType = "officer";
      req.hasAdminRole = hasAdminRole || officer.hasAdminRole();
    } else {
      // It's a regular user token
      const user = await User.findOne({
        _id: decoded._id,
        "tokens.token": token,
      });

      if (!user) {
        return res
          .status(401)
          .json({ error: "Please authenticate. User not found." });
      }

      // Check user status
      if (user.status === "inactive") {
        return res
          .status(403)
          .json({
            error: "Your account is inactive. Please contact administrator.",
          });
      }

      req.token = token;
      req.user = user;
      req.userType = user.userType;
      req.hasAdminRole =
        user.userType === "admin" || user.userType === "super_admin";
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ error: "Please authenticate. Invalid token." });
    }

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Please authenticate. Token expired." });
    }

    res.status(401).json({ error: "Please authenticate" });
  }
};

module.exports = auth;
