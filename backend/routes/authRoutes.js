const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middlewares/auth");

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Protected routes - All users
router.get("/profile", auth, authController.getUserProfile);
router.put("/profile", auth, authController.updateUserProfile);
router.put("/change-password", auth, authController.changePassword);

// Admin routes
router.get("/admin/all-users", auth, authController.getAllUsers);
router.put("/admin/update-role/:userId", auth, authController.updateUserRole);
router.put(
  "/admin/update-status/:userId",
  auth,
  authController.updateUserStatus
);

module.exports = router;
