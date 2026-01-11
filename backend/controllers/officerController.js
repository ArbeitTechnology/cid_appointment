const Officer = require("../models/Officer");
const User = require("../models/User");

// Add new officer
exports.addOfficer = async (req, res) => {
  try {
    const {
      name,
      password,
      phone,
      designation,
      department,
      unit,
      bpNumber,
      status = "inactive", // Default to inactive
      isAlsoAdmin = false,
    } = req.body;

    console.log("=== ADDING OFFICER ===");
    console.log("Phone:", phone);
    console.log("Status:", status);
    console.log("isAlsoAdmin:", isAlsoAdmin);

    // Check if officer with same phone or bpNumber exists
    const existingOfficer = await Officer.findOne({
      $or: [{ phone }, { bpNumber }],
    });

    if (existingOfficer) {
      return res.status(400).json({
        error: "Officer with this phone number or BP number already exists",
      });
    }

    // **FIX: Create officer directly**
    const officer = new Officer({
      name,
      password, // Will be hashed by pre-save middleware
      phone,
      designation,
      department,
      unit: unit,
      bpNumber,
      status: status,
      additionalRoles: isAlsoAdmin ? ["admin"] : [],
      isAlsoAdmin: isAlsoAdmin,
    });

    await officer.save();

    console.log("Officer saved with ID:", officer._id);

    // **OPTIONAL: Only create user account if REALLY needed for admin features**
    // Most admin features should work with officer's isAlsoAdmin flag
    if (isAlsoAdmin) {
      try {
        const userEmail = `${phone}@officer.system`; // Simple email
        let user = await User.findOne({ email: userEmail });

        if (!user) {
          user = new User({
            name: officer.name,
            email: userEmail,
            password: password, // Same password
            phone: officer.phone,
            userType: "admin",
            officerId: officer._id,
            status: officer.status,
            additionalRoles: ["officer"],
          });

          await user.save();
          console.log("Linked user account created:", user._id);
        }

        // Link officer to user
        officer.userId = user._id;
        officer.isAlsoUser = true;
        await officer.save();
      } catch (userError) {
        console.error("Error creating linked user:", userError);
        // Don't fail the officer creation if user creation fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Officer added successfully",
      officer: {
        _id: officer._id,
        name: officer.name,
        phone: officer.phone,
        designation: officer.designation,
        department: officer.department,
        status: officer.status,
        isAlsoAdmin: officer.isAlsoAdmin,
        hasAdminRole: officer.hasAdminRole(),
      },
    });
  } catch (error) {
    console.error("Error adding officer:", error);
    res.status(500).json({ error: "Failed to add officer: " + error.message });
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
      .select("-__v -password");

    // Add hasAdminRole to each officer
    const officersWithRoles = officers.map((officer) => ({
      ...officer.toObject(),
      hasAdminRole: officer.hasAdminRole(),
    }));

    res.json({
      success: true,
      total,
      page: pageNumber,
      pages,
      limit: limitNumber,
      count: officers.length,
      officers: officersWithRoles,
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
    ).select("-__v -password");

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // Also update linked user status if exists
    if (officer.userId) {
      await User.findByIdAndUpdate(officer.userId, { status });
    }

    res.json({
      success: true,
      message: "Officer status updated successfully",
      officer: {
        ...officer.toObject(),
        hasAdminRole: officer.hasAdminRole(),
      },
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

    const officers = await Officer.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { designation: { $regex: query, $options: "i" } },
        { department: { $regex: query, $options: "i" } },
        { bpNumber: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    })
      .select("name designation department phone bpNumber status isAlsoAdmin")
      .limit(10);

    res.json({
      success: true,
      officers: officers.map((officer) => ({
        ...officer.toObject(),
        hasAdminRole: officer.hasAdminRole(),
      })),
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

    const officer = await Officer.findById(officerId).select("-__v -password");

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // Get user info if officer is also admin
    let userInfo = null;
    if (officer.userId) {
      const user = await User.findById(officer.userId).select(
        "userType status lastLogin"
      );
      if (user) {
        userInfo = {
          userType: user.userType,
          status: user.status,
          lastLogin: user.lastLogin,
        };
      }
    }

    res.json({
      success: true,
      officer: {
        ...officer.toObject(),
        hasAdminRole: officer.hasAdminRole(),
        userInfo,
      },
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

    // Include password in destructuring
    const {
      name,
      phone,
      designation,
      department,
      unit,
      bpNumber,
      status,
      password,
    } = req.body;

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

    // Update officer - handle password separately
    let updatedOfficer;

    if (password && password.trim() !== "") {
      // If password is provided, find the officer first to use the pre-save hook
      updatedOfficer = await Officer.findById(officerId);

      if (!updatedOfficer) {
        return res.status(404).json({ error: "Officer not found" });
      }

      // Update all fields including password
      updatedOfficer.name = name;
      updatedOfficer.phone = phone;
      updatedOfficer.designation = designation;
      updatedOfficer.department = department;
      updatedOfficer.unit = unit;
      updatedOfficer.bpNumber = bpNumber;
      updatedOfficer.status = status;
      updatedOfficer.password = password; // This will trigger pre-save hook to hash it
      updatedOfficer.updatedAt = Date.now();

      await updatedOfficer.save();

      // Get the officer without password for response
      updatedOfficer = await Officer.findById(officerId).select(
        "-__v -password"
      );
    } else {
      // If no password change, use findByIdAndUpdate
      updatedOfficer = await Officer.findByIdAndUpdate(
        officerId,
        {
          name,
          phone,
          designation,
          department,
          unit: unit,
          bpNumber,
          status,
          updatedAt: Date.now(),
        },
        { new: true, runValidators: true }
      ).select("-__v -password");
    }

    // Update linked user if exists
    if (updatedOfficer.userId) {
      const userUpdateData = {
        name: updatedOfficer.name,
        phone: updatedOfficer.phone,
        status: updatedOfficer.status,
      };

      // Also update user password if provided - need to use findById + save
      if (password && password.trim() !== "") {
        const linkedUser = await User.findById(updatedOfficer.userId);
        if (linkedUser) {
          linkedUser.password = password; // Will be hashed by User model's pre-save middleware
          await linkedUser.save();
        }
      } else {
        // Only update other fields without password
        await User.findByIdAndUpdate(updatedOfficer.userId, userUpdateData);
      }
    }

    res.json({
      success: true,
      message: "Officer updated successfully",
      officer: {
        ...updatedOfficer.toObject(),
        hasAdminRole: updatedOfficer.hasAdminRole(),
      },
    });
  } catch (error) {
    console.error("Error updating officer:", error);

    // Provide more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      error: "Failed to update officer",
      message: error.message,
    });
  }
};

// Delete officer
exports.deleteOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    const currentUserId = req.user._id;

    const officer = await Officer.findById(officerId);
    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // Prevent officers from deleting themselves
    if (officer._id.toString() === currentUserId.toString()) {
      return res.status(403).json({
        error: "You cannot delete your own account",
      });
    }

    // Prevent super admin from being deleted
    const linkedUser = await User.findOne({ officerId: officer._id });
    if (linkedUser && linkedUser.userType === "super_admin") {
      return res.status(403).json({
        error: "Cannot delete super admin officer",
      });
    }

    // Delete linked user if exists
    if (officer.userId) {
      await User.findByIdAndDelete(officer.userId);
    }

    await Officer.findByIdAndDelete(officerId);

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

    // Filter out empty/null values and sort
    const uniqueDesignations = [...new Set(designations)]
      .filter((d) => d && d.trim())
      .sort();

    res.json({
      success: true,
      designations: uniqueDesignations,
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
      officers: officers.map((officer) => ({
        ...officer.toObject(),
        hasAdminRole: officer.hasAdminRole(),
      })),
    });
  } catch (error) {
    console.error("Error fetching officers by designation:", error);
    res.status(500).json({ error: "Failed to fetch officers" });
  }
};

exports.getUniqueUnits = async (req, res) => {
  try {
    const { designation } = req.query;
    let query = { status: "active" };

    if (designation) {
      // Escape special regex characters in designation
      const escapedDesignation = designation.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      query.designation = { $regex: `^${escapedDesignation}$`, $options: "i" };
    }

    const units = await Officer.distinct("unit", query);
    res.json({
      success: true,
      units: units.filter((u) => u && u.trim()).sort(),
    });
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ error: "Failed to fetch units" });
  }
};

// Get officers by designation and unit
exports.getOfficersByDesignationAndUnit = async (req, res) => {
  try {
    const { designation, unit } = req.query;

    if (!designation || !unit) {
      return res
        .status(400)
        .json({ error: "Designation and unit are required" });
    }

    // Escape special regex characters
    const escapedDesignation = designation.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const officers = await Officer.find({
      designation: { $regex: `^${escapedDesignation}$`, $options: "i" },
      unit: { $regex: `^${escapedUnit}$`, $options: "i" },
      status: "active",
    }).select("name designation department phone bpNumber status");

    res.json({ success: true, officers });
  } catch (error) {
    console.error("Error fetching officers by designation and unit:", error);
    res.status(500).json({ error: "Failed to fetch officers" });
  }
};

// Update officer admin role (grant/remove admin access)
exports.updateOfficerAdminRole = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { isAlsoAdmin } = req.body;

    if (typeof isAlsoAdmin !== "boolean") {
      return res.status(400).json({
        error: "isAlsoAdmin must be a boolean value",
      });
    }

    const officer = await Officer.findById(officerId);
    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // If already has the requested admin status, return
    if (officer.isAlsoAdmin === isAlsoAdmin) {
      return res.json({
        success: true,
        message: `Officer already ${
          isAlsoAdmin ? "has" : "does not have"
        } admin role`,
        officer: {
          _id: officer._id,
          name: officer.name,
          phone: officer.phone,
          isAlsoAdmin: officer.isAlsoAdmin,
          hasAdminRole: officer.hasAdminRole(),
        },
      });
    }

    if (isAlsoAdmin) {
      // Grant admin role

      // Generate email for user account
      const userEmail = `officer_${officer.phone.replace(
        /\D/g,
        ""
      )}@system.com`;

      // Check if user already exists with this generated email
      let user = await User.findOne({
        $or: [{ email: userEmail }, { phone: officer.phone }],
      });

      if (!user) {
        // Create new user account with admin role
        user = new User({
          name: officer.name,
          email: userEmail,
          password: officer.password,
          phone: officer.phone,
          userType: "admin",
          officerId: officer._id,
          status: officer.status,
          additionalRoles: ["officer"],
        });

        await user.save();
      } else {
        // Update existing user to admin
        user.userType = "admin";
        user.officerId = officer._id;
        user.additionalRoles = [
          ...new Set([...user.additionalRoles, "officer"]),
        ];
        await user.save();
      }

      // Update officer
      officer.additionalRoles = ["admin"];
      officer.isAlsoAdmin = true;
      officer.userId = user._id;
      officer.isAlsoUser = true;
    } else {
      // Remove admin role

      // Remove admin from additional roles
      officer.additionalRoles = officer.additionalRoles.filter(
        (role) => role !== "admin"
      );
      officer.isAlsoAdmin = false;

      // Update linked user account if exists
      if (officer.userId) {
        const user = await User.findById(officer.userId);
        if (user) {
          // Downgrade user to regular user role
          user.userType = "user";
          user.additionalRoles = user.additionalRoles.filter(
            (role) => role !== "officer"
          );
          user.officerId = null;
          await user.save();
        }

        // Remove user link
        officer.userId = null;
        officer.isAlsoUser = false;
      }
    }

    officer.updatedAt = Date.now();
    await officer.save();

    res.json({
      success: true,
      message: isAlsoAdmin
        ? "Admin role granted to officer successfully"
        : "Admin role removed from officer successfully",
      officer: {
        _id: officer._id,
        name: officer.name,
        phone: officer.phone,
        additionalRoles: officer.additionalRoles,
        isAlsoAdmin: officer.isAlsoAdmin,
        hasAdminRole: officer.hasAdminRole(),
        userId: officer.userId,
      },
    });
  } catch (error) {
    console.error("Error updating officer admin role:", error);
    res.status(500).json({ error: "Failed to update officer admin role" });
  }
};

// Get officer profile (for officer dashboard)
exports.getOfficerProfile = async (req, res) => {
  try {
    const officerId = req.user.officerId || req.user._id;

    const officer = await Officer.findById(officerId).select("-__v -password");

    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    res.json({
      success: true,
      officer: {
        ...officer.toObject(),
        hasAdminRole: officer.hasAdminRole(),
      },
    });
  } catch (error) {
    console.error("Error fetching officer profile:", error);
    res.status(500).json({ error: "Failed to fetch officer profile" });
  }
};
