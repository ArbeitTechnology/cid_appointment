const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email address");
      }
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  phone: {
    type: String,
    default: "",
  },

  // User Type
  userType: {
    type: String,
    enum: ["super_admin", "admin", "user", "officer"],
    default: "user",
  },

  // Officer reference if this user is also an officer
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Officer",
    default: null,
  },

  // Additional roles (for users who are also officers)
  additionalRoles: {
    type: [String],
    enum: ["officer"],
    default: [],
  },

  // Status
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
  },

  passwordResetToken: String,
  passwordResetExpires: Date,
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  // Set first user as super_admin
  if (user.isNew) {
    const userCount = await mongoose.models.User.countDocuments();
    if (userCount === 0) {
      user.userType = "super_admin";
    }
  }

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    {
      _id: user._id,
      userType: user.userType,
      additionalRoles: user.additionalRoles,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Find user by credentials (accepts email or phone)
userSchema.statics.findByCredentials = async function (identifier, password) {
  try {
    console.log("findByCredentials called with identifier:", identifier);

    // Determine if identifier is email or phone
    const isEmail = validator.isEmail(identifier);
    const isPhone = validator.isMobilePhone(identifier, "any", {
      strictMode: false,
    });

    console.log("Validation results - isEmail:", isEmail, "isPhone:", isPhone);

    let user = null;

    // First, try to find as regular user
    if (isEmail) {
      user = await this.findOne({
        email: { $regex: new RegExp("^" + identifier + "$", "i") },
      }).select("+password");
      console.log("User found by email:", user ? "Yes" : "No");
    }

    // If not found by email or identifier looks like phone number
    if (!user && (isPhone || !isEmail)) {
      user = await this.findOne({ phone: identifier }).select("+password");
      console.log("User found by phone:", user ? "Yes" : "No");
    }

    // If found as regular user, check password
    if (user) {
      console.log("Regular user found, checking password...");
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Password mismatch for regular user");
        throw new Error("Invalid password");
      }
      console.log("Regular user authentication successful");
      return user;
    }

    // If not found as regular user, try to find as officer
    console.log("Checking for officer...");
    const officer = await Officer.findOne({ phone: identifier });
    console.log("Officer found:", officer ? "Yes" : "No");

    if (officer) {
      console.log("Officer found, checking password...");

      // **FIX: Use officer's comparePassword method**
      const isMatch = await officer.comparePassword(password);
      if (!isMatch) {
        console.log("Password mismatch for officer");
        throw new Error("Invalid password");
      }

      console.log("Officer authentication successful");

      // **FIX: Return proper officer structure**
      return {
        _id: officer._id,
        name: officer.name,
        phone: officer.phone,
        status: officer.status,
        // **FIX: Correct field names**
        hasAdminRole: officer.isAlsoAdmin || officer.hasAdminRole() || false,
        userType: "officer",
        officerId: officer._id,
        createdAt: officer.createdAt,
        // **FIX: Add these fields for consistency**
        isOfficer: true,
        additionalRoles: officer.additionalRoles || [],
        // **FIX: Add user ID if linked**
        userId: officer.userId || null,
        // **FIX: Add method for password comparison**
        comparePassword: officer.comparePassword.bind(officer),
      };
    }

    // If we reach here, no user or officer was found
    console.log("No user or officer found with identifier:", identifier);
    throw new Error("Invalid login credentials");
  } catch (error) {
    console.error("findByCredentials detailed error:", error.message);
    throw new Error("Invalid login credentials: " + error.message);
  }
};

// Method to check if user is also an officer
userSchema.methods.isAlsoOfficer = function () {
  return this.additionalRoles.includes("officer") || this.officerId !== null;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
