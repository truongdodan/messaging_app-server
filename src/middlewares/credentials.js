const allowedOrigins = require("../configs/allowedOrigins");

const credentials = (req, res, next) => {
  const origin = req.headers.origin;

  console.log("Origin: ", origin);
  console.log("Allowed Origin: ", allowedOrigins);

  if (!origin || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Origin", origin);
  }
  next();
};

module.exports = credentials;
