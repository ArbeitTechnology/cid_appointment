const express = require("express");
const router = express.Router();
const officerController = require("../controllers/officerController");
const auth = require("../middlewares/auth");

// All officer routes require authentication
router.use(auth);

// Add new officer
router.post("/add", officerController.addOfficer);

// Get all officers with search
router.get("/all", officerController.getAllOfficers);

// Update officer status
router.put("/:officerId/status", officerController.updateOfficerStatus);
router.put("/:officerId", officerController.updateOfficer);

// Delete officer
router.delete("/:officerId", officerController.deleteOfficer);
// Search officers (for visitor form)
router.get("/search", officerController.searchOfficers);

// Get officer by ID
router.get("/:officerId", officerController.getOfficerById);

module.exports = router;
