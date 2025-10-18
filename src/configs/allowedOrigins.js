require("dotenv").config();
// Use environment variable for production, fallback to localhost for dev
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

module.exports = allowedOrigins;
