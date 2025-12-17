const Visitor = require("../models/Visitor");
const Officer = require("../models/Officer");

// Add new visitor
exports.addVisitor = async (req, res) => {
  try {
    const { name, phone, address, purpose, officerId, photo } = req.body;

    // Validate required fields
    if (!name || !phone || !address || !purpose || !officerId) {
      return res.status(400).json({
        error: "Name, phone, address, purpose, and officer are required",
      });
    }

    // Validate purpose
    if (!["case", "personal"].includes(purpose)) {
      return res.status(400).json({
        error: 'Purpose must be either "case" or "personal"',
      });
    }

    // Check if officer exists
    const officer = await Officer.findById(officerId);
    if (!officer) {
      return res.status(404).json({ error: "Officer not found" });
    }

    // Check if officer is active
    if (officer.status !== "active") {
      return res.status(400).json({ error: "Officer is not active" });
    }

    const visitor = new Visitor({
      name,
      phone,
      address,
      purpose,
      officer: {
        officerId: officer._id,
        name: officer.name,
        designation: officer.designation,
        department: officer.department,
      },
      photo: photo || "",
      visitTime: new Date(),
    });

    await visitor.save();

    res.status(201).json({
      success: true,
      message: "Visitor added successfully",
      visitor,
    });
  } catch (error) {
    console.error("Error adding visitor:", error);
    res.status(500).json({ error: "Failed to add visitor" });
  }
};

// Get all visitors with search and filters
// Get all visitors with search and filters
exports.getAllVisitors = async (req, res) => {
  try {
    const {
      search,
      phone,
      name,
      officerName,
      officerDesignation, // Add this
      officerDepartment, // Add this
      startTime,
      endTime,
      purpose,
      multiSearch, // Add this for comma-separated search
    } = req.query;

    let query = {};

    // Phone filter
    if (phone) {
      query.phone = { $regex: phone, $options: "i" };
    }

    // Name filter
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Officer name filter
    if (officerName) {
      query["officer.name"] = { $regex: officerName, $options: "i" };
    }

    // Officer designation filter - ADD THIS
    if (officerDesignation) {
      query["officer.designation"] = {
        $regex: officerDesignation,
        $options: "i",
      };
    }

    // Officer department filter - ADD THIS
    if (officerDepartment) {
      query["officer.department"] = {
        $regex: officerDepartment,
        $options: "i",
      };
    }

    // Purpose filter
    if (purpose && ["case", "personal"].includes(purpose)) {
      query.purpose = purpose;
    }

    // Time range filter
    if (startTime || endTime) {
      query.visitTime = {};
      if (startTime) {
        query.visitTime.$gte = new Date(startTime);
      }
      if (endTime) {
        query.visitTime.$lte = new Date(endTime);
      }
    }

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
            { address: regex },
            { purpose: regex },
            { "officer.name": regex },
            { "officer.designation": regex }, // Add this
            { "officer.department": regex } // Add this
          );
        });

        query.$or = orConditions;
      }
    }
    // General search across multiple fields (backward compatible)
    else if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
        { "officer.name": { $regex: search, $options: "i" } },
        { "officer.designation": { $regex: search, $options: "i" } }, // Add this
        { "officer.department": { $regex: search, $options: "i" } }, // Add this
      ];
    }

    const visitors = await Visitor.find(query)
      .populate("officer.officerId", "name designation department phone")
      .sort({ visitTime: -1 })
      .select("-__v");

    res.json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
};

// Check if phone number exists and get visitor details
exports.checkPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.params;

    // Remove .distinct("name") and get the full documents
    const visitors = await Visitor.find({ phone })
      .sort({ visitTime: -1 })
      .limit(5)
      .select("name address phone visitTime");

    if (visitors.length === 0) {
      return res.json({
        exists: false,
        message: "No previous visits found with this phone number",
      });
    }

    // Optional: Get unique visitors by name to avoid duplicates
    const uniqueVisitors = [];
    const seenNames = new Set();

    visitors.forEach((visitor) => {
      if (!seenNames.has(visitor.name)) {
        seenNames.add(visitor.name);
        uniqueVisitors.push({
          name: visitor.name,
          address: visitor.address,
          phone: visitor.phone,
          lastVisit: visitor.visitTime,
        });
      }
    });

    res.json({
      exists: true,
      visitors: uniqueVisitors,
    });
  } catch (error) {
    console.error("Error checking phone number:", error);
    res.status(500).json({ error: "Failed to check phone number" });
  }
};

// Get visitor statistics
exports.getVisitorStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayVisitors, totalVisitors, pendingVisitors] = await Promise.all([
      Visitor.countDocuments({
        visitTime: { $gte: today, $lt: tomorrow },
      }),
      Visitor.countDocuments(),
      Visitor.countDocuments({ status: "pending" }),
    ]);

    res.json({
      success: true,
      stats: {
        todayVisitors,
        totalVisitors,
        pendingVisitors,
      },
    });
  } catch (error) {
    console.error("Error fetching visitor stats:", error);
    res.status(500).json({ error: "Failed to fetch visitor statistics" });
  }
};
