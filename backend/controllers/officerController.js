const Officer = require("../models/Officer");

// Add new officer
exports.addOfficer = async (req, res) => {
  try {
    const { name, phone, designation, department, unit, bpNumber, status } =
      req.body;

    // Check if officer with same phone or bpNumber exists
    const existingOfficer = await Officer.findOne({
      $or: [{ phone }, { bpNumber }],
    });

    if (existingOfficer) {
      return res.status(400).json({
        error: "Officer with this phone number or BP number already exists",
      });
    }

    const officer = new Officer({
      name,
      phone,
      designation,
      department,
      unit: unit || "",
      bpNumber,
      status: status || "active",
    });

    await officer.save();

    res.status(201).json({
      success: true,
      message: "Officer added successfully",
      officer,
    });
  } catch (error) {
    console.error("Error adding officer:", error);
    res.status(500).json({ error: "Failed to add officer" });
  }
};

// Get all officers with search and filters
exports.getAllOfficers = async (req, res) => {
  try {
    const {
      search,
      multiSearch,
      status,
      department,
      designation,
      page = 1,
      limit = 5,
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};

    // Handle comma-separated multi-search
    if (multiSearch) {
      const searchTerms = multiSearch
        .split(",")
        .map((term) => term.trim())
        .filter((term) => term);

      if (searchTerms.length > 0) {
        const orConditions = [];

        searchTerms.forEach((term) => {
          // Create case-insensitive regex for each term
          const regex = new RegExp(term, "i");

          orConditions.push(
            { name: regex },
            { phone: regex },
            { designation: regex },
            { department: regex },
            { unit: regex },
            { bpNumber: regex }
          );
        });

        query.$or = orConditions;
      }
    }
    // Handle single search term (backward compatible)
    else if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { name: regex },
        { phone: regex },
        { designation: regex },
        { department: regex },
        { unit: regex },
        { bpNumber: regex },
      ];
    }

    // Individual filters (only apply if we're not using comma-separated multi-search)
    if (!multiSearch) {
      // Status filter
      if (status && ["active", "inactive"].includes(status)) {
        query.status = status;
      }

      // Department filter
      if (department) {
        query.department = { $regex: department, $options: "i" };
      }

      // Designation filter
      if (designation) {
        query.designation = { $regex: designation, $options: "i" };
      }
    }

    // Get total count for pagination
    const total = await Officer.countDocuments(query);

    // Calculate total pages
    const pages = Math.ceil(total / limitNumber);

    // Get officers with pagination
    const officers = await Officer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .select("-__v");

    res.json({
      success: true,
      total,
      page: pageNumber,
      pages,
      limit: limitNumber,
      count: officers.length,
      officers,
    });
  } catch (error) {
    console.error("Error fetching officers:", error);
    res.status(500).json({ error: "Failed to fetch officers" });
  }
};
// Update officer status
exports.updateOfficerStatus = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const officer = await Officer.findByIdAndUpdate(
      officerId,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json({
      success: true,
      message: "Officer status updated successfully",
      officer,
    });
  } catch (error) {
    console.error("Error updating officer status:", error);
    res.status(500).json({ error: "Failed to update officer status" });
  }
};

// Search officers by name (for visitor form)
exports.searchOfficers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        officers: [],
      });
    }

    // Remove the status filter to show all officers
    const officers = await Officer.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { designation: { $regex: query, $options: "i" } },
        { department: { $regex: query, $options: "i" } },
        { bpNumber: { $regex: query, $options: "i" } },
      ],
      // Removed: status: "active"
    })
      .select("name designation department phone bpNumber status") // Added status
      .limit(10);

    res.json({
      success: true,
      officers,
    });
  } catch (error) {
    console.error("Error searching officers:", error);
    res.status(500).json({ error: "Failed to search officers" });
  }
};

// Get officer by ID
exports.getOfficerById = async (req, res) => {
  try {
    const { officerId } = req.params;

    const officer = await Officer.findById(officerId).select("-__v");

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json({
      success: true,
      officer,
    });
  } catch (error) {
    console.error("Error fetching officer:", error);
    res.status(500).json({ error: "Failed to fetch officer" });
  }
};
// Update officer
exports.updateOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { name, phone, designation, department, unit, bpNumber, status } =
      req.body;

    // Check if officer exists
    const existingOfficer = await Officer.findById(officerId);
    if (!existingOfficer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // Check if phone number is being updated and if it conflicts with another officer
    if (phone && phone !== existingOfficer.phone) {
      const phoneExists = await Officer.findOne({
        phone,
        _id: { $ne: officerId },
      });
      if (phoneExists) {
        return res.status(400).json({
          error: "Officer with this phone number already exists",
        });
      }
    }

    // Check if BP number is being updated and if it conflicts with another officer
    if (bpNumber && bpNumber !== existingOfficer.bpNumber) {
      const bpNumberExists = await Officer.findOne({
        bpNumber,
        _id: { $ne: officerId },
      });
      if (bpNumberExists) {
        return res.status(400).json({
          error: "Officer with this BP number already exists",
        });
      }
    }

    // Update officer
    const updatedOfficer = await Officer.findByIdAndUpdate(
      officerId,
      {
        name,
        phone,
        designation,
        department,
        unit: unit || "",
        bpNumber,
        status: status || "active",
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    ).select("-__v");

    res.json({
      success: true,
      message: "Officer updated successfully",
      officer: updatedOfficer,
    });
  } catch (error) {
    console.error("Error updating officer:", error);
    res.status(500).json({ error: "Failed to update officer" });
  }
};

// Delete officer
exports.deleteOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;

    const officer = await Officer.findByIdAndDelete(officerId);

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json({
      success: true,
      message: "Officer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting officer:", error);
    res.status(500).json({ error: "Failed to delete officer" });
  }
};

// Get all unique designations
exports.getUniqueDesignations = async (req, res) => {
  try {
    const designations = await Officer.distinct("designation", {
      status: "active",
    });
    res.json({
      success: true,
      designations: designations.sort(),
    });
  } catch (error) {
    console.error("Error fetching designations:", error);
    res.status(500).json({ error: "Failed to fetch designations" });
  }
};

// Get officers by designation
exports.getOfficersByDesignation = async (req, res) => {
  try {
    const { designation } = req.query;

    if (!designation) {
      return res.status(400).json({ error: "Designation is required" });
    }

    const officers = await Officer.find({
      designation: designation,
      status: "active",
    }).select("name designation department phone");

    res.json({
      success: true,
      officers,
    });
  } catch (error) {
    console.error("Error fetching officers by designation:", error);
    res.status(500).json({ error: "Failed to fetch officers" });
  }
};
