const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  purpose: {
    type: String,
    enum: ["case", "personal"],
    required: true,
  },
  officer: {
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Officer",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  photo: {
    type: String, // base64 encoded image
    default: "",
  },
  visitTime: {
    type: Date,
    default: Date.now,
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

visitorSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Visitor = mongoose.model("Visitor", visitorSchema);
module.exports = Visitor;
