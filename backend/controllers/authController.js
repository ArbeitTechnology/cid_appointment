const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Officer = require("../models/Officer");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const validator = require("validator");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...mailOptions,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Email could not be sent");
  }
};

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Check if this is the first user (will be super_admin)
    const userCount = await User.countDocuments();
    const userType = userCount === 0 ? "super_admin" : "user";

    // Create user
    const user = new User({
      name,
      email,
      password,
      userType,
    });

    await user.save();

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: "Welcome to Our System!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome ${name}!</h2>
          <p>Your account has been successfully created.</p>
          <p><strong>Account Type:</strong> ${
            userType === "super_admin" ? "Super Admin" : userType
          }</p>
          <p>Thank you for joining!</p>
        </div>
      `,
    });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Login user - SIMPLIFIED VERSION
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log("Login attempt:", { identifier });

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide identifier and password",
      });
    }

    // **FIX: Try officer first (since they login with phone)**
    let officer = await Officer.findOne({ phone: identifier });

    if (officer) {
      console.log("Officer found:", officer.name);

      // Check password using officer's method
      const isPasswordValid = await officer.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid password. Please check your password and try again.",
        });
      }

      // Check if officer is active
      if (officer.status !== "active") {
        return res.status(401).json({
          success: false,
          error: "Account is inactive. Please contact administrator.",
        });
      }

      // Generate token
      const tokenPayload = {
        _id: officer._id,
        userType: "officer",
      };

      // Add admin role if officer has it
      if (officer.isAlsoAdmin || officer.hasAdminRole()) {
        tokenPayload.additionalRoles = ["admin"];
      }

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Update last login
      officer.lastLogin = new Date();
      await officer.save();

      return res.json({
        success: true,
        user: {
          _id: officer._id,
          name: officer.name,
          phone: officer.phone,
          userType: "officer",
          additionalRoles: officer.additionalRoles || [],
          officerId: officer._id,
          status: officer.status,
          createdAt: officer.createdAt,
          lastLogin: officer.lastLogin,
          hasAdminRole: officer.isAlsoAdmin || false,
          isOfficer: true,
        },
        token,
        message: "Login successful",
      });
    }

    // **FIX: If not officer, try user**
    let user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp("^" + identifier + "$", "i") } },
        { phone: identifier },
      ],
    }).select("+password");

    if (user) {
      console.log("User found:", user.name);

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid password. Please check your password and try again.",
        });
      }

      if (user.status !== "active") {
        return res.status(401).json({
          success: false,
          error: "Account is inactive. Please contact administrator.",
        });
      }

      // Generate token for user
      const tokenPayload = {
        _id: user._id,
        userType: user.userType,
      };

      if (user.additionalRoles && user.additionalRoles.length > 0) {
        tokenPayload.additionalRoles = user.additionalRoles;
      }

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Update user
      user.lastLogin = new Date();
      user.tokens = user.tokens ? user.tokens.concat({ token }) : [{ token }];
      await user.save();

      return res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          userType: user.userType,
          additionalRoles: user.additionalRoles || [],
          officerId: user.officerId || null,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          hasAdminRole:
            user.userType === "admin" || user.userType === "super_admin",
          isOfficer: user.officerId ? true : false,
        },
        token,
        message: "Login successful",
      });
    }

    // No user or officer found
    return res.status(401).json({
      success: false,
      error: "No account found with this phone number or email.",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  const userData = {
    _id: req.user._id,
    name: req.user.name,
    userType: req.user.userType,
    status: req.user.status,
    createdAt: req.user.createdAt,
    lastLogin: req.user.lastLogin,
  };

  // Add fields based on user type
  if (req.user.userType === "officer") {
    userData.phone = req.user.phone;
  } else {
    userData.email = req.user.email;
    if (req.user.phone) userData.phone = req.user.phone;
  }

  // Add additional fields if they exist
  if (req.user.additionalRoles) {
    userData.additionalRoles = req.user.additionalRoles;
  }
  if (req.user.officerId) {
    userData.officerId = req.user.officerId;
  }
  if (req.user.hasAdminRole !== undefined) {
    userData.hasAdminRole = req.user.hasAdminRole;
  }
  if (req.user.isOfficer !== undefined) {
    userData.isOfficer = req.user.isOfficer;
  }

  res.json(userData);
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const updates = Object.keys(req.body);

  // Different allowed updates for officers vs regular users
  let allowedUpdates;
  if (req.user.userType === "officer") {
    allowedUpdates = ["name"];
  } else {
    allowedUpdates = ["name", "phone"];
  }

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid updates" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();

    const userData = {
      _id: req.user._id,
      name: req.user.name,
      userType: req.user.userType,
      status: req.user.status,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin,
    };

    if (req.user.userType === "officer") {
      userData.phone = req.user.phone;
    } else {
      userData.email = req.user.email;
      if (req.user.phone) userData.phone = req.user.phone;
    }

    if (req.user.additionalRoles) {
      userData.additionalRoles = req.user.additionalRoles;
    }
    if (req.user.officerId) {
      userData.officerId = req.user.officerId;
    }

    res.json(userData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Forgot password - only for regular users (not officers)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; // Only email for password reset

    if (!email) {
      return res.status(400).json({ error: "Please provide email address" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to reset your password (valid for 30 minutes):</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const user = req.user;

    if (
      user.userType !== "super_admin" &&
      user.userType !== "admin" &&
      !user.hasAdminRole
    ) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await User.find()
      .select(
        "name email userType status phone createdAt lastLogin officerId additionalRoles"
      )
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user role (Super Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;
    const { userType } = req.body;

    // Only super_admin can change roles
    if (currentUser.userType !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Only Super Admin can change user roles" });
    }

    // Check if trying to modify super_admin
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent modifying super_admin
    if (targetUser.userType === "super_admin") {
      return res.status(403).json({ error: "Cannot modify Super Admin role" });
    }

    // Validate userType
    if (!["admin", "user"].includes(userType)) {
      return res.status(400).json({ error: "Invalid user type" });
    }

    targetUser.userType = userType;
    await targetUser.save();

    res.json({
      message: `User role updated to ${userType}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        userType: targetUser.userType,
        status: targetUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user status (Admin/Super Admin)
exports.updateUserStatus = async (req, res) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;
    const { status } = req.body;

    // Only admin/super_admin can change status
    if (
      currentUser.userType !== "super_admin" &&
      currentUser.userType !== "admin" &&
      !currentUser.hasAdminRole
    ) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Check if trying to modify super_admin
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // If target is super_admin, only super_admin can modify
    if (
      targetUser.userType === "super_admin" &&
      currentUser.userType !== "super_admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only Super Admin can modify Super Admin" });
    }

    // Validate status
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Prevent admin from modifying other admins
    if (currentUser.userType === "admin" && targetUser.userType === "admin") {
      return res
        .status(403)
        .json({ error: "Admin cannot modify other admins" });
    }

    targetUser.status = status;
    await targetUser.save();

    res.json({
      message: `User status updated to ${status}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        userType: targetUser.userType,
        status: targetUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
