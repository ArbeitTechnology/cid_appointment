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
router.get("/designations", officerController.getUniqueDesignations);
router.get("/by-designation", officerController.getOfficersByDesignation);
router.get("/units", officerController.getUniqueUnits);
router.get(
  "/by-designation-unit",
  officerController.getOfficersByDesignationAndUnit
);
router.get("/profile/me", officerController.getOfficerProfile);

// Update officer status
router.put("/:officerId/status", officerController.updateOfficerStatus);
router.put("/:officerId", officerController.updateOfficer);
router.put("/:officerId/admin-role", officerController.updateOfficerAdminRole);

// Delete officer
router.delete("/:officerId", officerController.deleteOfficer);

// Search officers (for visitor form)
router.get("/search", officerController.searchOfficers);

// Get officer by ID
router.get("/:officerId", officerController.getOfficerById);

module.exports = router;
