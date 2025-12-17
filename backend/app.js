const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middlewares/errorHandler");
const officerRoutes = require("./routes/officer");
const visitorRoutes = require("./routes/visitor");
const app = express();

// Security middleware
app.use(helmet());
app.use(cors("*"));
app.use(express.json({ limit: "100mb" })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/officers", officerRoutes);
app.use("/api/visitors", visitorRoutes);
// Error handling middleware
app.use(errorHandler);

module.exports = app;
