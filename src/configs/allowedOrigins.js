// Use environment variable for production, fallback to localhost for dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS
  : ["http://localhost:5173", "http://localhost:3000"];

module.exports = allowedOrigins;
