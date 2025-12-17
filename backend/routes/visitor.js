const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/visitorController");
const auth = require("../middlewares/auth");

// All visitor routes require authentication
router.use(auth);

// Add new visitor
router.post("/add", visitorController.addVisitor);

// Get all visitors with search
router.get("/all", visitorController.getAllVisitors);

// Check phone number
router.get("/check-phone/:phone", visitorController.checkPhoneNumber);

// Get visitor statistics
router.get("/stats", visitorController.getVisitorStats);

module.exports = router;
