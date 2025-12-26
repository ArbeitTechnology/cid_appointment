const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const officerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  designation: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    trim: true,
    default: "",
  },
  bpNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  // Officer can have admin role in addition to base officer role
  additionalRoles: {
    type: [String],
    enum: ["admin"],
    default: [],
  },
  isAlsoAdmin: {
    type: Boolean,
    default: false,
  },
  // Track if officer is also a user (has user account for admin access)
  isAlsoUser: {
    type: Boolean,
    default: false,
  },
  // Reference to User account if linked (for admin role)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
officerSchema.pre("save", async function (next) {
  const officer = this;

  if (officer.isModified("password")) {
    officer.password = await bcrypt.hash(officer.password, 8);
  }

  this.updatedAt = Date.now();
  next();
});

// Method to compare password
officerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if officer has admin role
officerSchema.methods.hasAdminRole = function () {
  return this.additionalRoles.includes("admin") || this.isAlsoAdmin;
};

// Update timestamp on update
officerSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Officer = mongoose.model("Officer", officerSchema);
module.exports = Officer;
