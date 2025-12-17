const mongoose = require("mongoose");

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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

officerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Officer = mongoose.model("Officer", officerSchema);
module.exports = Officer;
